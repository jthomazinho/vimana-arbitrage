import assert from 'assert';
import { createMachine, interpret } from '@xstate/fsm';

import datadog from '../../lib/report-datadog';

import { Fee, formatFeeService, formatFeeNumbers } from '../../lib/fee';
import * as md from '../../lib/market-data';
import { PartialObject, InputValidationError } from '../../lib/algos';

type Fsm = ReturnType<typeof interpret>;

export enum State {
  Initializing = 'initializing',
  Quote = 'quote',
  Pausing = 'pausing',
  Paused = 'paused',
  Error = 'error',
  Finalized = 'finalized',
  Finalizing = 'finalizing',
}

enum Event {
  InitializingOk = 'initializeOk',
  PauseOk = 'pauseOk',
  PausePlease = 'pausePlease',
  ResumePlease = 'resumePlease',
  ErrorDetected = 'errorDetected',
  FinalizePlease = 'finalizePlease',
  FinalizeOk = 'finalizeOk',
  QuoteOK = 'QuoteOk',
}

const legs: {
  readonly long: md.Instrument & { minOrderValue: number };
  readonly peg: md.Instrument;
} = {
  long: {
    exchange: 'bitstamp',
    symbol: 'btcusd',
    minOrderValue: 25,
  },
  peg: {
    exchange: 'plural',
    symbol: 'usdbrl',
  },
};

export interface InputParameters {
  quoteSpread: number;
  manualPegQuote: number;
}

export interface RequiredFees {
  long: {
    'trade-taker': Maybe<Fee>;
    'withdraw-btc': Maybe<Fee>;
  };
  peg: {
    exchange: Maybe<Fee>;
    iof: Maybe<Fee>;
  };
}

const mininumManualQuoteValue = 4.50;

function validateInputParameters(input: InputParameters): boolean {
  return input.quoteSpread > 0;
}

function validateMininumManualQuoteValue(input: InputParameters): boolean {
  if (input.manualPegQuote > 0 && input.manualPegQuote < mininumManualQuoteValue) {
    return false;
  }
  return true;
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
  setQuote: (quote: number) => void;
  onFinalized: () => void;
}

export class Algo {
  id: string;

  serviceExecutor: ServiceExecutor;

  state: State;

  quoteValue: number;

  averageDepthPrice: number;

  totalDepthQtd: number;

  dryRun = false;

  usingManualQuote = false;

  private errorMsg: Maybe<string>;

  constructor(id: string, executor: ServiceExecutor) {
    datadog.init();
    this.id = id;
    this.serviceExecutor = executor;
    this.fsm = this.buildFsm();
    this.state = State.Initializing;

    this.quoteValue = 0;
    this.averageDepthPrice = 0;
    this.totalDepthQtd = 5; // FIXED 5BTC AS MININUM DEPTH

    this.parameters = {
      quoteSpread: 0,
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
      case State.Initializing:
      case State.Error:
      case State.Finalized: {
        // The instance is either in an intermediate state or already finalizing
        break;
      }
      default: {
        break;
      }
    }
  }

  setQuote(quote: number): void {
    this.quoteValue = quote;
  }

  finalize(): void {
    this.fsm.send(Event.FinalizePlease);
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
      longLeg: md.formatInstrument(legs.long),
      pegLeg: md.formatInstrument(legs.peg),
      pegPrice: md.formatPrice(this.pegPrice),
      [formatFeeService(this.fees.long['trade-taker'])]: formatFeeNumbers(this.fees.long['trade-taker']),
      [formatFeeService(this.fees.long['withdraw-btc'])]: formatFeeNumbers(this.fees.long['withdraw-btc']),
      [formatFeeService(this.fees.peg.iof)]: formatFeeNumbers(this.fees.peg.iof),
      [formatFeeService(this.fees.peg.exchange)]: formatFeeNumbers(this.fees.peg.exchange),
    };
  }

  async getWeitghtedAveragePrice(book: md.Depth): Promise<number> {
    if (book.asks.length === 0) { return 0; }
    let priceSum = 0;
    let qtdSum = 0;
    let sumQtdLayers = 0;
    await book.asks.forEach((asks) => {
      sumQtdLayers += asks[0];
      if (sumQtdLayers <= this.totalDepthQtd) {
        priceSum += (asks[0] * asks[1]);
        qtdSum += asks[0];
      }
    });
    const result = priceSum / qtdSum;
    return result;
  }

  async trimDepth(book: md.Depth): Promise<md.Depth> {
    const priceDepth: md.Depth = {
      exchange: '',
      symbol: '',
      bids: [],
      asks: [],
    };
    let sumQtdLayers = 0;
    await book.asks.forEach((asks) => {
      sumQtdLayers += asks[0];
      if (sumQtdLayers <= this.totalDepthQtd) {
        priceDepth.asks.push(asks);
      }
    });
    return priceDepth;
  }

  async calculatePrice(): Promise<number> {
    const feeExchange = this.fees.peg.exchange?.rate || 0;
    const feeIof = this.fees.peg.iof?.rate || 0;
    const feeTaker = this.longFee || 0;

    const priceDepth: md.Depth = await this.trimDepth(this.longBook);
    const weitghtedAveragePrice = await this.getWeitghtedAveragePrice(priceDepth);

    const totalPegPrice = this.pegPrice * (feeExchange + feeIof);
    const brlPrice = weitghtedAveragePrice * totalPegPrice;

    return brlPrice * (feeTaker + this.parameters.quoteSpread);
  }

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

  async quote() {
    const quotePrice = await this.calculatePrice();
    if (quotePrice > 0) {
      // CALL SERVICE EXECUTOR TO SETUP NEW QUOTE ON TRADEBLOCKS
    }
  }

  private initializationOk(): boolean {
    const mdOk = !!this.longBestOffer
      && !!this.pegPrice;

    const feesOk = !!this.fees.peg.iof
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
  private longBestOffer!: md.DepthLevel;

  private longBook!: md.Depth;

  private pegPrice!: number;

  onLongDepth(book: md.Depth): void {
    this.longBook = book;

    this.quote();
  }

  onPegQuote(quote: md.Quote): void {
    this.usingManualQuote = false;

    this.pegPrice = quote.price;
  }

  onMdError(errorMsg?: string): void {
    datadog.increment('md.error', 1, ['onMdError']);

    this.handleError(errorMsg);
  }
  // #endregion

  // #region Fees listeners
  private longFee!: number;

  private fees: RequiredFees = {
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
    this.longFee = 0;
    if (this.fees.peg.exchange
      && this.fees.peg.iof
      && this.fees.long['trade-taker']) {
      this.longFee = (1 - this.fees.long['trade-taker'].rate || 0);
    }
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

  // #region State hooks
  private wait: () => void = () => { /* make no actions */ }

  private disableResponses(): void {
    this.parametersUpdated = this.wait;
    this.feeUpdated = this.wait;
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
    this.feeUpdated = this.checkInitialization;

    this.checkInitialization();
  }

  private onEnterQuote(): void {
    this.state = State.Quote;

    datadog.increment('instance.quote', 1, ['status:quote']);

    this.parametersUpdated = this.quote;
    this.feeUpdated = this.quote;
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
            [Event.InitializingOk]: State.Quote,
            [Event.PausePlease]: State.Pausing,
            [Event.FinalizePlease]: State.Finalizing,
            [Event.ErrorDetected]: State.Error,
          },
        },
        [State.Quote]: {
          entry: this.onEnterQuote.bind(this),
          on: {
            [Event.QuoteOK]: State.Quote,
            [Event.PausePlease]: State.Pausing,
            [Event.FinalizePlease]: State.Finalizing,
            [Event.ErrorDetected]: State.Error,
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
            [Event.ResumePlease]: State.Quote,
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
