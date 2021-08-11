import assert from 'assert';
import { createMachine, interpret } from '@xstate/fsm';

import datadog from '../../lib/report-datadog';

import { Fee, formatFeeService, formatFeeNumbers } from '../../lib/fee';
import * as md from '../../lib/market-data';
import { PartialObject, InputValidationError } from '../../lib/algos';
import { Conciliation, AccumulatedExecutions } from '../../services/templates/btc-usd-arbitrage-conciliation';

type Fsm = ReturnType<typeof interpret>;

const conciliation = new Conciliation();

function assertNever(_: never): void { /* unreachable */ }

export enum State {
  Initializing = 'initializing',
  Monitoring = 'monitoring',
  WaitingOrders = 'waitingOrders',
  WaitingOrderResponse = 'waitingOrderResponse',
  Pausing = 'pausing',
  Paused = 'paused',
  Error = 'error',
  Finalizing = 'finalizing',
  Finalized = 'finalized',
}

enum Event {
  InitializingOk = 'initializeOk',
  WaitOrdersPlease = 'waitOrdersPlease',
  WaitOrderResponse = 'waitOrderResponse',
  WaitOrdersOk = 'waitOrdersOk',
  PausePlease = 'pausePlease',
  PauseOk = 'pauseOk',
  ResumePlease = 'resumePlease',
  ErrorDetected = 'errorDetected',
  FinalizePlease = 'finalizePlease',
  FinalizeOk = 'finalizeOk',
}

const legs: {
  readonly short: md.Instrument;
  readonly long: md.Instrument & { minOrderValue: number };
  readonly peg: md.Instrument;
} = {
  short: {
    exchange: 'foxbit',
    symbol: 'btcbrl',
  },
  long: {
    exchange: 'bitstamp',
    symbol: 'btcusd',
    minOrderValue: 25, // Bitstamp doesn't accept orders less than USD 25 for any market
  },
  peg: {
    exchange: 'plural',
    symbol: 'usdbrl',
  },
};

export interface RequiredFees {
  short: {
    'trade-taker': Maybe<Fee>;
    'withdraw-brl': Maybe<Fee>;
  };
  long: {
    'trade-taker': Maybe<Fee>;
    'withdraw-btc': Maybe<Fee>;
  };
  peg: {
    exchange: Maybe<Fee>;
    iof: Maybe<Fee>;
  };
}

export interface InputParameters {
  /**
   * totalQuantity is the total amount of cypto that will be traded in each leg.
   */
  totalQuantity: number;
  /**
   * maxOrderQuantity is the size of the single largest order to be sent.
   * It is a risk control parameter.
   */
  maxOrderQuantity: number;
  /**
   * targetSpread is the value for the market spred the algo will expect to send orders.
   */
  targetSpread: number;
  /**
   * crowdFactor is a parameter that reduces risk of a crowded market, when a single event triggers
   * orders from many participants that competes in the market.
   * It's a percentage value, when 1 the algo will consider all quantities in the book available
   * when set to 0.5 it will consider only 50% of the quantities at each step and so on.
   */
  crowdFactor: number;
  /**
   * When the Quote is not avaiable from the market data,
   * the manual Quote will be used to initialize a new algo instancie
   */
  manualPegQuote: number;
}

function validateInputParameters(input: InputParameters): boolean {
  return input.totalQuantity > 0
    && input.maxOrderQuantity > 0
    && input.crowdFactor > 0
    && input.crowdFactor <= 1
    && input.manualPegQuote >= 0;
}

const mininumManualQuoteValue = 4.50;

function validateMininumManualQuoteValue(input: InputParameters): boolean {
  if (input.manualPegQuote > 0 && input.manualPegQuote < mininumManualQuoteValue) {
    return false;
  }
  return true;
}

export interface ExecutionContext {
  quantityShort: number;
  quantityLong: number;
  shortBestOffer: md.DepthLevel;
  longBestOffer: md.DepthLevel;
  pegPrice: number;
  marketSpread: number;
  fees: RequiredFees;
  parameters: InputParameters;
  shortBook: md.Depth;
  longBook: md.Depth;
}
export interface ArbitrageExecution {
  shortLeg?: {
    quantity: number;
    price: number;
  };
  longLeg?: {
    quantity: number;
    price: number;
  };
}

export interface ServiceExecutor {
  /** Function to send orders */
  sendOrders: (ctx: ExecutionContext) => Promise<void>;
  sendShortOrder: (ctx: ExecutionContext) => Promise<void>;
  sendConciliationOrder: (accumulatedExecutions: AccumulatedExecutions) => Promise<void>;
  getOrderHistory: (algoInstanceId: number, arbitrageExecutionId: number) => Promise<void>;
  /** Callback to notify the instance is done */
  onFinalized: () => void;
}

function formatOrderToSend(quantity: Maybe<number>): string {
  if (quantity) {
    return `${quantity.toFixed(6)} @ market`;
  }

  return 'Out of market';
}

export class Algo {
  id: string;

  serviceExecutor: ServiceExecutor;

  state: State;

  dryRun = false;

  usingManualQuote = false;

  private marketSpread: number;

  private orderQty: Maybe<number>;

  private errorMsg: Maybe<string>;

  constructor(id: string, executor: ServiceExecutor) {
    datadog.init();
    this.id = id;
    this.serviceExecutor = executor;
    this.fsm = this.buildFsm();
    this.state = State.Initializing;

    this.marketSpread = 1;
    this.orderQty = undefined;

    this.longQtyExecuted = 0;
    this.shortQtyExecuted = 0;

    this.parameters = {
      totalQuantity: 0,
      maxOrderQuantity: 0,
      targetSpread: 0,
      crowdFactor: 1,
      manualPegQuote: 0,
    };
    assert(!validateInputParameters(this.parameters),
      'Initial params must be invalid');

    this.fsm.start();
  }

  togglePause(): void {
    const state = this.state;
    switch (state) {
      case State.Paused: {
        this.fsm.send(Event.ResumePlease);
        break;
      }
      case State.Monitoring:
      case State.WaitingOrders: {
        this.fsm.send(Event.PausePlease);
        break;
      }
      case State.WaitingOrderResponse: {
        this.fsm.send(Event.PausePlease);
        break;
      }
      case State.Initializing:
      case State.Pausing:
      case State.Error:
      case State.Finalizing:
      case State.Finalized: {
        // The instance is either in an intermediate state or already finalizing
        break;
      }
      default: {
        assertNever(state);
      }
    }

    conciliation.stop();
  }

  finalize(): void {
    this.fsm.send(Event.FinalizePlease);

    conciliation.stop();
  }

  getInput(): PartialObject {
    const input: PartialObject = {};
    Object.entries(this.parameters).forEach(([key, value]) => {
      input[key] = value.toString();
    });

    return input;
  }

  getOutput(): PartialObject {
    return {
      state: this.state,
      errorMsg: this.errorMsg || '',
      longQtyExecuted: this.longQtyExecuted.toFixed(6),
      shortQtyExecuted: this.shortQtyExecuted.toFixed(6),
      shortLeg: md.formatInstrument(legs.short),
      shortBestOffer: md.formatDepthLevel(this.shortBestOffer),
      longLeg: md.formatInstrument(legs.long),
      longBestOffer: md.formatDepthLevel(this.longBestOffer),
      pegLeg: md.formatInstrument(legs.peg),
      pegPrice: md.formatPrice(this.pegPrice),
      [formatFeeService(this.fees.short['trade-taker'])]: formatFeeNumbers(this.fees.short['trade-taker']),
      [formatFeeService(this.fees.short['withdraw-brl'])]: formatFeeNumbers(this.fees.short['withdraw-brl']),
      [formatFeeService(this.fees.long['trade-taker'])]: formatFeeNumbers(this.fees.long['trade-taker']),
      [formatFeeService(this.fees.long['withdraw-btc'])]: formatFeeNumbers(this.fees.long['withdraw-btc']),
      [formatFeeService(this.fees.peg.iof)]: formatFeeNumbers(this.fees.peg.iof),
      [formatFeeService(this.fees.peg.exchange)]: formatFeeNumbers(this.fees.peg.exchange),
      marketSpread: `${(this.marketSpread * 100).toFixed(2)}%`,
      orderToSend: formatOrderToSend(this.orderQty),
    };
  }

  /**
   * If the Market Data don't provide the PegPrice and
   * the manualPegQuote have value we set the manualPegQuote to the pegPrice
   * This will be called to initialize the Algo and when the algo try to recalculate the inputs
   */
  definePegPriceManual(): void {
    if (!this.pegPrice && !!this.parameters.manualPegQuote) {
      this.usingManualQuote = true;
      this.pegPrice = this.parameters.manualPegQuote;
      datadog.gauge('md.quote', Number(this.pegPrice), ['definePegPriceManual']);
    }
  }

  getPegPrice(): number {
    return this.pegPrice;
  }

  setPegPrice(quote: number): void {
    this.pegPrice = quote;
  }

  private recalculate(): void {
    this.definePegPriceManual();
    /**
     * MUST call update price to update long price at accumulator
     */
    conciliation.updateLongPrice(this.longBestOffer[1]);

    this.marketSpread = this.pegFee
      - (this.longFee * this.longBestOffer[1] * this.pegPrice)
      / (this.shortFee * this.shortBestOffer[1]);

    datadog.gauge('market.spread', this.marketSpread, ['marketSpread']);

    if (this.marketSpread > this.parameters.targetSpread) {
      const shortQty = this.shortBestOffer[0];
      const longQty = this.longBestOffer[0];
      let mktQty = Math.min(shortQty, longQty);
      const legsQty = {
        quantityLong: 0,
        quantityShort: 0,
      };
      if (mktQty > this.parameters.maxOrderQuantity * 1.45) {
        mktQty *= this.parameters.crowdFactor;
      }

      const remaining = this.parameters.totalQuantity - this.longQtyExecuted;
      this.orderQty = Math.min(mktQty, this.parameters.maxOrderQuantity, remaining);

      legsQty.quantityShort = this.orderQty;
      legsQty.quantityLong = this.orderQty;
      if (this.orderQty * this.longBestOffer[1] < legs.long.minOrderValue) {
        legsQty.quantityLong = 0;
      }

      if (this.dryRun) {
        return;
      }

      this.startExecution(legsQty.quantityShort, legsQty.quantityLong);
    } else {
      this.orderQty = undefined;
    }
  }

  private async startExecution(quantityShort: number, quantityLong: number): Promise<void> {
    const context: ExecutionContext = {
      quantityShort,
      quantityLong,
      marketSpread: this.marketSpread,
      fees: this.fees,
      shortBestOffer: this.shortBestOffer,
      longBestOffer: this.longBestOffer,
      pegPrice: this.pegPrice,
      parameters: this.parameters,
      shortBook: this.shortBook,
      longBook: this.longBook,
    };

    // This assumes that sending the orders will succeed, because waiting the
    // promise to resolve is too pessimistic, meaning that the algo may receive
    // a fill of an order it doesn't know it exists yet. It causes the internal
    // state to become very inconsistent and the algo can't recover.
    // Failing to send an order will also create an irrecoverable state, but
    // the algo should err and stop.
    this.waitingQty = quantityShort;
    this.fsm.send(Event.WaitOrdersPlease);

    // If below minimum allowed at long side, send just short
    if (this.hasMinimunLongOrderQuantity(this.waitingQty)) {
      this.noWaitingOrders = 2;
      await this.serviceExecutor.sendOrders(context)
        .catch((err) => this.handleSendOrderException(err));
    } else {
      this.noWaitingOrders = 1;
      await this.serviceExecutor.sendShortOrder(context)
        .catch((err) => this.handleSendOrderException(err));
    }
  }

  private async startRetryFlow(arbitrageExecutionId: number) {
    await this.serviceExecutor.getOrderHistory(Number(this.id.replace('btc-usd-arbitrage-', '')), arbitrageExecutionId)
      .catch((err) => this.handleError(err.message));
  }

  private hasMinimunLongOrderQuantity(quantity: number): boolean {
    return !(quantity * this.longBestOffer[1] < legs.long.minOrderValue);
  }

  private initializationOk(): boolean {
    this.definePegPriceManual();

    const mdOk = !!this.shortBestOffer
      && !!this.longBestOffer
      && !!this.pegPrice;

    const feesOk = !!this.fees.short['trade-taker']
      && !!this.fees.short['withdraw-brl']
      && !!this.fees.long['trade-taker']
      && !!this.fees.long['withdraw-btc']
      && !!this.fees.peg.iof
      && !!this.fees.peg.exchange;

    const inputOk = validateInputParameters(this.parameters);

    return mdOk && feesOk && inputOk;
  }

  private checkInitialization(): void {
    if (this.initializationOk()) {
      datadog.increment('instance.initialized', 1, ['status:initializeOk']);
      this.fsm.send(Event.InitializingOk);
    }
  }

  // #region Parameters listeners
  private parameters!: InputParameters;

  private parametersUpdated!: () => void;

  async setInput(input: InputParameters): Promise<void> {
    if (!validateInputParameters(input)) {
      return Promise.reject(new InputValidationError('Invalid input'));
    }

    if (!validateMininumManualQuoteValue(input)) {
      return Promise.reject(new InputValidationError(
        `Manual Quote must be greater or equal than ${mininumManualQuoteValue}`,
      ));
    }

    this.parameters = input;

    this.parametersUpdated();

    return Promise.resolve();
  }
  // #endregion

  // #region MD listeners
  private shortBestOffer!: md.DepthLevel;

  private shortBook!: md.Depth;

  private longBestOffer!: md.DepthLevel;

  private longBook!: md.Depth;

  private pegPrice!: number;

  private mdUpdated!: () => void;

  onShortDepth(book: md.Depth): void {
    this.shortBestOffer = book.bids[0];
    this.shortBook = book;

    datadog.gauge('md.short', Number(this.shortBestOffer[1]), ['onShortDepth']);
    this.mdUpdated();
  }

  onLongDepth(book: md.Depth): void {
    this.longBestOffer = book.asks[0];
    this.longBook = book;

    datadog.gauge('md.long', Number(this.longBestOffer[1]), ['onLongDepth']);

    this.mdUpdated();
  }

  onPegQuote(quote: md.Quote): void {
    this.usingManualQuote = false;

    this.pegPrice = quote.price;

    datadog.gauge('md.quote', Number(this.pegPrice), ['onPegQuote']);

    this.mdUpdated();
  }

  onMdError(errorMsg?: string): void {
    datadog.increment('md.error', 1, ['onMdError']);

    this.handleError(errorMsg);
  }
  // #endregion

  // #region Fees listeners
  private shortFee!: number;

  private longFee!: number;

  private pegFee!: number;

  private fees: RequiredFees = {
    short: {
      'trade-taker': undefined,
      'withdraw-brl': undefined,
    },
    long: {
      'trade-taker': undefined,
      'withdraw-btc': undefined,
    },
    peg: {
      exchange: undefined,
      iof: undefined,
    },
  };

  private feeUpdated!: () => void;

  private feeRecalculate: () => void = () => {
    if (this.fees.peg.exchange
      && this.fees.peg.iof
      && this.fees.long['trade-taker']
      && this.fees.long['withdraw-btc']
      && this.fees.short['trade-taker']
      && this.fees.short['withdraw-brl']) {
      // The exchange rate is included in the peg price so it is not considered
      // in the calculation, but is later used for display detailed execution
      // information.
      this.pegFee = 1 - this.fees.peg.iof.rate;
      this.longFee = 1 + this.fees.long['trade-taker'].rate;
      this.shortFee = (1 - this.fees.short['trade-taker'].rate) * (1 - this.fees.short['withdraw-brl'].rate);
    }
  }

  onShortFee(kind: keyof RequiredFees['short'], fee: Maybe<Fee>): void {
    this.fees.short[kind] = fee;

    this.feeRecalculate();
    this.feeUpdated();
  }

  onLongFee(kind: keyof RequiredFees['long'], fee: Maybe<Fee>): void {
    this.fees.long[kind] = fee;

    this.feeRecalculate();
    this.feeUpdated();
  }

  onPegFee(kind: keyof RequiredFees['peg'], fee: Maybe<Fee>): void {
    this.fees.peg[kind] = fee;

    this.feeRecalculate();
    this.feeUpdated();
  }
  // #endregion

  // #region OMS listeners
  private longQtyExecuted: number;

  private shortQtyExecuted: number;

  private waitingQty = 0;

  private noWaitingOrders = 0;

  onLongOrderFilled(): void {
    this.longQtyExecuted += this.waitingQty;
    this.noWaitingOrders -= 1;

    datadog.gauge('oms.longOrderFilled', Number(this.longQtyExecuted), ['longQtyExecuted']);

    this.fsm.send(Event.WaitOrdersOk);
  }

  onShortOrderFilled(): void {
    this.shortQtyExecuted += this.waitingQty;
    this.noWaitingOrders -= 1;

    datadog.gauge('oms.shortOrderFilled', Number(this.shortQtyExecuted), ['shortQtyExecuted']);

    this.fsm.send(Event.WaitOrdersOk);
  }

  ordersDone(): boolean {
    const done = this.noWaitingOrders === 0;
    if (done) {
      this.waitingQty = 0;
    }

    datadog.increment('oms.ordersDone', 1, ['ordersDone']);

    return done;
  }

  operationDone(): boolean {
    return this.longQtyExecuted >= this.parameters.totalQuantity
      && this.shortQtyExecuted >= this.parameters.totalQuantity;
  }
  // #endregion

  // #region State hooks
  private wait: () => void = () => { /* make no actions */ }

  private disableResponses(): void {
    this.parametersUpdated = this.wait;
    this.mdUpdated = this.wait;
    this.feeUpdated = this.wait;

    this.orderQty = undefined;
  }

  private handleSendOrderException(error?: any) {
    if (error.code === 504) {
      this.errorMsg = error.message;

      datadog.increment('instance.waitingorderresponse', 1, ['handleSendOrderException']);

      this.startRetryFlow(error.data.arbitrageExecutionId);

      this.fsm.send(Event.WaitOrderResponse);
    }

    return this.handleError(error.message);
  }

  private handleError(errorMsg?: string): void {
    this.errorMsg = errorMsg;

    datadog.increment('instance.error', 1, ['handleError']);
    this.fsm.send(Event.ErrorDetected);
  }

  private onEnterInitializing(): void {
    this.state = State.Initializing;

    datadog.increment('instance.initialized', 1, ['status:initializing']);

    this.parametersUpdated = this.checkInitialization;
    this.mdUpdated = this.checkInitialization;
    this.feeUpdated = this.checkInitialization;

    this.checkInitialization();
  }

  private onEnterMonitoring(): void {
    this.state = State.Monitoring;

    datadog.increment('instance.monitoring', 1, ['status:monitoring']);

    if (this.noWaitingOrders !== 0) {
      this.fsm.send(Event.WaitOrdersPlease);
      return;
    }

    if (this.operationDone()) {
      this.fsm.send(Event.FinalizePlease);
      return;
    }

    this.parametersUpdated = this.recalculate;
    this.mdUpdated = this.recalculate;
    this.feeUpdated = this.recalculate;

    conciliation.start(
      Number(this.id.replace('btc-usd-arbitrage-', '')),
      (accumulatedExecutions: AccumulatedExecutions) => {
        this.serviceExecutor.sendConciliationOrder(accumulatedExecutions);
      },
    );

    this.recalculate();
  }

  private onEnterWaitingOrderResponse(): void {
    this.state = State.Error;

    this.fsm.send(Event.ErrorDetected);
  }

  private onEnterWaitingOrders(): void {
    this.state = State.WaitingOrders;

    datadog.increment('instance.waitingorders', 1, ['status:waitingorders']);

    this.disableResponses();
  }

  private onEnterPausing(): void {
    this.state = State.Pausing;

    datadog.increment('instance.pausing', 1, ['status:pausing']);

    this.disableResponses();
    this.fsm.send(Event.PauseOk);
  }

  private onEnterPaused(): void {
    this.state = State.Paused;
  }

  private onEnterError(): void {
    this.state = State.Error;

    datadog.increment('instance.error', 1, ['onEnterError']);

    this.disableResponses();
  }

  private onEnterFinalizing(): void {
    this.state = State.Finalizing;

    datadog.increment('instance.finalizing', 1, ['status:finalizing']);

    this.disableResponses();
    this.fsm.send(Event.FinalizeOk);
  }

  private onEnterFinalized(): void {
    this.state = State.Finalized;

    datadog.increment('instance.finalized', 1, ['status:finalized']);

    this.serviceExecutor.onFinalized();
  }
  // #endregion

  // #region State machine configuration
  private buildFsm(): Fsm {
    return interpret(createMachine({
      id: 'algo-fsm',
      initial: State.Initializing,
      states: {
        [State.Initializing]: {
          entry: this.onEnterInitializing.bind(this),
          on: {
            [Event.InitializingOk]: State.Monitoring,
            [Event.PausePlease]: State.Pausing,
            [Event.FinalizePlease]: State.Finalizing,
            [Event.ErrorDetected]: State.Error,
          },
        },
        [State.Monitoring]: {
          entry: this.onEnterMonitoring.bind(this),
          on: {
            [Event.WaitOrdersPlease]: State.WaitingOrders,
            [Event.PausePlease]: State.Pausing,
            [Event.FinalizePlease]: State.Finalizing,
            [Event.ErrorDetected]: State.Error,
          },
        },
        [State.WaitingOrders]: {
          entry: this.onEnterWaitingOrders.bind(this),
          on: {
            [Event.WaitOrdersOk]: {
              target: State.Monitoring,
              cond: this.ordersDone.bind(this),
            },
            [Event.PausePlease]: State.Pausing,
            [Event.FinalizePlease]: State.Finalizing,
            [Event.ErrorDetected]: State.Error,
          },
        },
        [State.WaitingOrderResponse]: {
          entry: this.onEnterWaitingOrderResponse.bind(this),
          on: {
            [Event.FinalizePlease]: State.Finalizing,
          },
        },
        [State.Pausing]: {
          entry: this.onEnterPausing.bind(this),
          on: {
            [Event.PauseOk]: State.Paused,
          },
        },
        [State.Paused]: {
          entry: this.onEnterPaused.bind(this),
          on: {
            [Event.ResumePlease]: State.Monitoring,
            [Event.FinalizePlease]: State.Finalizing,
            [Event.ErrorDetected]: State.Error,
          },
        },
        [State.Error]: {
          entry: this.onEnterError.bind(this),
          on: {
            [Event.FinalizePlease]: State.Finalizing,
          },
        },
        [State.Finalizing]: {
          entry: this.onEnterFinalizing.bind(this),
          on: {
            [Event.FinalizeOk]: State.Finalized,
          },
        },
        [State.Finalized]: {
          entry: this.onEnterFinalized.bind(this),
          on: {},
        },
      },
    }));
  }
  // #endregion

  private fsm: ReturnType<typeof interpret>;
}
