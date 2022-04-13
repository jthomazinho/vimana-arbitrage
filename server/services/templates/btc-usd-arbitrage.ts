import { Context, Service, ServiceBroker } from 'moleculer';
import { QueryOptions } from 'moleculer-db';

import {
  Algo, ExecutionContext, InputParameters, RequiredFees, ServiceExecutor, State,
} from '../../app/algos/btc-usd-arbitrage';
import {
  BtcUsdArbitrageExecution as Model,
} from '../../app/models/btc-usd-arbitrage-execution';

import { summary } from '../../app/algos/btc-usd-arbitrage/summary';
import { checkOrderPlaced, isRetryNeeded } from './btc-usd-arbitrage-retry';
import { AlgoData, Id, PartialObject } from '../../lib/algos';
import { Fee } from '../../lib/fee';
import { Depth, Quote } from '../../lib/market-data';
import * as oms from '../../lib/oms';
import { ServiceStatus } from '../../lib/status';
import { setLongLeg, setShortLeg } from './btc-usd-arbitrage-execution';
import { AccumulatedExecutions } from './btc-usd-arbitrage-conciliation';

import datadog from '../../lib/report-datadog';

export const algoKind = 'btc-usd-arbitrage-taker' as const;

function shortFeeKind(service: string): keyof RequiredFees['short'] | null {
  if (service === 'withdraw-brl' || service === 'trade-taker') {
    return service;
  }

  return null;
}

function longFeeKind(service: string): keyof RequiredFees['long'] | null {
  if (service === 'withdraw-btc' || service === 'trade-taker') {
    return service;
  }

  return null;
}

function exchangeFeeKind(service: string): keyof RequiredFees['peg'] | null {
  if (service === 'exchange' || service === 'iof') {
    return service;
  }

  return null;
}

function parseInput(input: PartialObject): InputParameters {
  return {
    totalQuantity: parseFloat(input.totalQuantity || '0'),
    maxOrderQuantity: parseFloat(input.maxOrderQuantity || '0'),
    targetSpread: parseFloat(input.targetSpread || '0'),
    crowdFactor: parseFloat(input.crowdFactor || '0'),
    manualPegQuote: parseFloat(input.manualPegQuote || '0'),
  };
}

export class Template extends Service implements ServiceExecutor {
  algo: Algo;

  id!: number;

  constructor(broker: ServiceBroker, id: number, name: string) {
    super(broker);
    datadog.init();
    console.log(`\r\nBTC-USD-ARBITRAGE\r\n`);
    this.parseServiceSchema({
      name,
      dependencies: ['btc-usd-arbitrage-controller', 'fees'],
      actions: {
        finalize: this.handleFinalize,
        getData: this.handleGetData,
        setInput: this.handleSetInput,
        togglePause: this.handleTogglePause,
      },
      events: {
        'md.depth.foxbit.btcbrl': this.onShortDepth,
        'md.status.foxbit': this.onStatus,
        'md.depth.bitstamp.btcusd': this.onLongDepth,
        'md.status.bitstamp': this.onStatus,
        'md.quote.plural.USD/BRL': this.onPegQuote,
        'md.status.plural': this.onPluralStatus,
        'fees.foxbit.*.update': this.onShortFeeUpdate,
        'fees.bitstamp.*.update': this.onLongFeeUpdate,
        'fees.plural.*.update': this.onPegFeeUpdate,
        [`oms.order_filled.bitstamp.${id}`]: this.onLongOrderFilled,
        [`oms.order_filled.foxbit.${id}`]: this.onShortOrderFilled,
        [`oms.order_history.foxbit.${id}`]: this.onOrderHistory,
      },
      created: this.onCreated.bind(this),
    });

    this.algo = new Algo(name, this);
    this.id = id;
  }

  // #region ServiceExecutor interface
  async getOrderHistory(algoInstanceId: number, arbitrageExecutionId: number):
    ReturnType<ServiceExecutor['getOrderHistory']> {
    await Promise.all([
      this.broker.call<Array<oms.OrderHistory>, any>(
        'oms-foxbit.getOrderHistory', { algoInstanceId, arbitrageExecutionId },
      ),
    ]);
  }

  async sendOrders(ctx: ExecutionContext): ReturnType<ServiceExecutor['sendOrders']> {
    let arbitrageExecutionId: string;
    return this.broker.call('btc_usd_arbitrage_execution.create', {
      algoInstanceId: this.id,
      summary: summary(ctx),
      context: ctx,
      needsConciliation: false,
    })
      .then(async (result: any) => {
        arbitrageExecutionId = result.id;
        await Promise.all([
          this.broker.call<oms.Order, oms.OrderParams>(
            'oms-bitstamp.sendMarketOrder', { ...this.buildLongOrderParams(ctx.quantityLong), arbitrageExecutionId },
          ),
          this.broker.call<oms.Order, oms.OrderParams>(
            'oms-foxbit.sendOrder', {
              ...this.buildShortOrderParams(ctx.quantityShort),
              arbitrageExecutionId,
              type: 'market',
            },
          ),
        ]);
      }).catch((err) => {
        datadog.increment('oms.error', 1, [`errorcode:${err.code || 0}`]);
        this.logger.error('oms.sendorder', err, ctx, { arbitrageExecutionId });
        const error = err;
        error.data = { ...error.data, arbitrageExecutionId };
        return Promise.reject(error);
      });
  }

  async sendShortOrder(ctx: ExecutionContext): ReturnType<ServiceExecutor['sendShortOrder']> {
    return this.broker.call('btc_usd_arbitrage_execution.create', {
      algoInstanceId: this.id,
      summary: summary(ctx),
      context: ctx,
      needsConciliation: true,
    })
      .then(async (result: any) => {
        const arbitrageExecutionId: string = result.id;
        await Promise.all([
          this.broker.call<oms.Order, oms.OrderParams>(
            'oms-foxbit.sendOrder', {
              ...this.buildShortOrderParams(ctx.quantityShort),
              arbitrageExecutionId,
              type: 'market',
            },
          ),
        ]);
      });
  }

  async sendConciliationOrder(accumulatedExecutions: AccumulatedExecutions):
    ReturnType<ServiceExecutor['sendConciliationOrder']> {
    return this.broker.call('btc_usd_arbitrage_conciliation.create', {
      algoInstanceId: accumulatedExecutions.algoInstanceId,
      conciliation: accumulatedExecutions,
    })
      .then(async (result: any) => {
        const conciliationExecutionId: string = result.id;
        await Promise.all([
          this.broker.call<oms.Order, oms.OrderParams>(
            'oms-bitstamp.sendMarketOrder',
            {
              ...this.buildLongOrderParams(accumulatedExecutions.totalAccumulated),
              arbitrageExecutionId: conciliationExecutionId,
            },
          ),
        ]);
        accumulatedExecutions.executions.forEach(async (executions) => {
          await Model.update(
            {
              conciliationId: conciliationExecutionId,
              needsConciliation: false,
            },
            { where: { id: executions.id } },
          );
        });
      });
  }

  onFinalized(): void {
    this.broker.emit<Id>(`algos.${algoKind}.finalized`, { id: this.id });
  }
  // #endregion

  buildLongOrderParams(quantity: number): oms.OrderParams {
    return {
      algoInstanceId: this.id,
      exchange: 'bitstamp',
      symbol: 'btcusd',
      quantity,
      side: oms.sides.buy,
      type: 'market',
    };
  }

  buildShortOrderParams(quantity: number): oms.OrderParams {
    return {
      algoInstanceId: this.id,
      exchange: 'foxbit',
      symbol: 'btcbrl',
      quantity,
      side: oms.sides.sell,
      type: 'market',
    };
  }

  async onCreated(): Promise<void> {
    this.loadFees('foxbit', ['trade-taker', 'withdraw-brl'])
      .then((shortFees) => {
        this.algo.onShortFee('trade-taker', shortFees['trade-taker']);
        this.algo.onShortFee('withdraw-brl', shortFees['withdraw-brl']);
      });

    this.loadFees('bitstamp', ['trade-taker', 'withdraw-btc'])
      .then((longFees) => {
        this.algo.onLongFee('trade-taker', longFees['trade-taker']);
        this.algo.onLongFee('withdraw-btc', longFees['withdraw-btc']);
      });

    this.loadFees('plural', ['exchange', 'iof'])
      .then((pegFees) => {
        this.algo.onPegFee('exchange', pegFees.exchange);
        this.algo.onPegFee('iof', pegFees.iof);
      });
  }

  async handleFinalize(): Promise<void> {
    this.algo.finalize();
  }

  handleGetData(): AlgoData {
    return {
      state: this.algo.state.toUpperCase(),
      output: this.algo.getOutput(),
      input: this.algo.getInput(),
    };
  }

  async handleSetInput(ctx: Context<Context<PartialObject>>): Promise<AlgoData> {
    return this.algo.setInput(parseInput(ctx.params.params))
      .then(() => this.handleGetData());
  }

  handleTogglePause(): void {
    this.algo.togglePause();
  }

  // #region MD handlers
  onShortDepth(ctx: Context<Depth>): void {
    console.log('\r\n\r\n--------------------------\r\n\r\n\r\n\r\n')
    this.algo.onShortDepth(ctx.params);
  }

  onLongDepth(ctx: Context<Depth>): void {
    console.log('\r\n\r\n++++++++++++++++++++++++++r\n\r\n\r\n\r\n')
    this.algo.onLongDepth(ctx.params);
  }

  onPegQuote(ctx: Context<Quote>): void {
    this.algo.onPegQuote(ctx.params);
  }

  onStatus(ctx: Context<ServiceStatus>): void {
    const status = ctx.params;
    if (!status.available) {
      this.algo.onMdError(status.message);
    }
  }

  /**
   * If the Market Data Plural is not avaiable
   * and the algo is not in Initializing state
   * and Plural was not working before
   * the algo State will be Error
   */
  onPluralStatus(ctx: Context<ServiceStatus>): void {
    const status = ctx.params;
    if (!status.available) {
      if (this.algo.state.toString() !== State.Initializing && !this.algo.usingManualQuote) {
        this.algo.onMdError(status.message);
      }
    }
  }
  // #endregion

  // #region Fees handlers
  onShortFeeUpdate(ctx: Context<Fee>): void {
    const kind = shortFeeKind(ctx.params.service);
    if (!kind) {
      return;
    }

    this.algo.onShortFee(kind, ctx.params);
  }

  onLongFeeUpdate(ctx: Context<Fee>): void {
    const kind = longFeeKind(ctx.params.service);
    if (!kind) {
      return;
    }

    this.algo.onLongFee(kind, ctx.params);
  }

  onPegFeeUpdate(ctx: Context<Fee>): void {
    const kind = exchangeFeeKind(ctx.params.service);
    if (!kind) {
      return;
    }

    this.algo.onPegFee(kind, ctx.params);
  }

  async loadFees(serviceProvider: string, services: Array<string>): Promise<{ [key: string]: Maybe<Fee> }> {
    const models = await this.broker.call<Array<Fee>, QueryOptions>(
      'fees.find', { query: { serviceProvider, service: services } },
    );

    const fees: { [key: string]: Maybe<Fee> } = {};
    services.forEach((service) => {
      fees[service] = models.find((model) => model.service === service);
    });
    return fees;
  }

  async retryCheck(arbitrageExecutionId: string, algoInstanceId: number) {
    if (isRetryNeeded(Number(arbitrageExecutionId))) {
      const arbitrageExecution = await Model.findOne({ where: { id: arbitrageExecutionId } });
      if (arbitrageExecution) {
        Promise.all([
          this.broker.call<oms.Order, oms.OrderParams>(
            'oms-foxbit.sendOrder', {
              ...this.buildShortOrderParams(arbitrageExecution.summary.shortLeg.quantity),
              arbitrageExecutionId,
              type: 'market',
            },
          ),
        ]);
      }
    } else {
      setTimeout(() => {
        this.getOrderHistory(algoInstanceId, Number(arbitrageExecutionId));
      }, 3000);
    }
  }
  // #endregion

  onLongOrderFilled(result: any): void {
    setLongLeg(result);
    this.algo.onLongOrderFilled();
  }

  onShortOrderFilled(result: any): void {
    setShortLeg(result);
    this.algo.onShortOrderFilled();
  }

  onOrderHistory(result: any): void {
    const arbitrageExecutionId = result.arbitrageExecutionId;
    const algoInstanceId = result.algoInstanceId;
    checkOrderPlaced(arbitrageExecutionId, result.orderHistory)
      .then((order: any) => {
        if (order) {
          this.onShortOrderFilled({
            order: {
              ...order,
              arbitrageExecutionId,
            },
            status: {
              order: {
                quantityExecuted: order.QuantityExecuted,
                avgPrice: order.AvgPrice,
              },
            },
          });
        } else {
          this.retryCheck(algoInstanceId, arbitrageExecutionId);
        }
      });
  }
}
