import { Context, Service, ServiceBroker } from 'moleculer';
import { QueryOptions } from 'moleculer-db';

import {
  Algo, InputParameters, RequiredFees, ServiceExecutor, State,
} from '../../app/algos/foxbit-otc';

import { AlgoData, Id, PartialObject } from '../../lib/algos';
import { Fee } from '../../lib/fee';
import { Depth, Quote } from '../../lib/market-data';
import { ServiceStatus } from '../../lib/status';

import datadog from '../../lib/report-datadog';

export const algoKind = 'foxbit-otc' as const;

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
    quoteSpread: parseFloat(input.targetSpread || '0'),
    manualPegQuote: parseFloat(input.manualPegQuote || '0'),
  };
}

export class Template extends Service implements ServiceExecutor {
  algo: Algo;

  id!: number;

  constructor(broker: ServiceBroker, id: number, name: string) {
    super(broker);
    datadog.init();

    this.parseServiceSchema({
      name,
      dependencies: ['foxbit-otc-controller', 'fees'],
      actions: {
        finalize: this.handleFinalize,
        setInput: this.handleSetInput,
        togglePause: this.handleTogglePause,
      },
      events: {
        'md.status.foxbit': this.onStatus,
        'md.depth.bitstamp.btcusd': this.onLongDepth,
        'md.status.bitstamp': this.onStatus,
        'md.quote.plural.USD/BRL': this.onPegQuote,
        'md.status.plural': this.onPluralStatus,
        'fees.bitstamp.*.update': this.onLongFeeUpdate,
        'fees.plural.*.update': this.onPegFeeUpdate,
      },
      created: this.onCreated.bind(this),
    });

    this.algo = new Algo(name, this);
    this.id = id;

    this.onCreated.bind(this);
  }

  // #region ServiceExecutor interface
  onFinalized(): void {
    this.broker.emit<Id>(`algos.${algoKind}.finalized`, { id: this.id });
  }

  setQuote(): void {
    this.algo.setQuote(0);
  }
  // #endregion

  async onCreated(): Promise<void> {
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
  onLongDepth(ctx: Context<Depth>): void {
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
  // #endregion
}
