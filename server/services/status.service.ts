/* eslint-disable max-classes-per-file */
import { Context, Service, ServiceBroker } from 'moleculer';

import { Depth, Quote } from '../lib/market-data';
import { ServiceStatus } from '../lib/status';
import AlwaysAvailable from '../lib/status/always-available';
import Exchange from '../lib/status/exchange';
import UpdateDepth from '../lib/status/update-depth';
import UpdateQuote from '../lib/status/update-quote';
import UpdateStatus from '../lib/status/update-status';

export default class extends Service {
  foxbit: Exchange<Depth>;

  bitstamp: Exchange<Depth>;

  plural: Exchange<Quote>;

  constructor(broker: ServiceBroker) {
    super(broker);

    this.parseServiceSchema({
      name: 'status',
      events: {
        'md.depth.bitstamp.*': this.onBitstampDepth,
        'md.depth.foxbit.*': this.onFoxbitDepth,
        'md.status.bitstamp': this.onBitstampMdStatus,
        'md.status.foxbit': this.onFoxbitMdStatus,
        'md.status.plural': this.onPluralMdStatus,
        'md.quote.plural.*': this.onPluralQuote,
        'oms.status.foxbit': this.onFoxbitOmsStatus,
      },
      actions: {
        getStatus: this.handleGetStatus,
      },
    });

    this.foxbit = new Exchange(new UpdateDepth(), new UpdateStatus(), new UpdateStatus());
    this.bitstamp = new Exchange(new UpdateDepth(), new UpdateStatus(), new AlwaysAvailable());
    this.plural = new Exchange(new UpdateQuote(), new UpdateStatus(), new AlwaysAvailable());
  }

  handleGetStatus(): object {
    return {
      foxbit: this.foxbit.status(),
      bitstamp: this.bitstamp.status(),
      plural: this.plural.status(),
    };
  }

  onBitstampDepth(ctx: Context<Depth>): void {
    this.bitstamp.updateMdPrice(ctx.params);
  }

  onFoxbitDepth(ctx: Context<Depth>): void {
    this.foxbit.updateMdPrice(ctx.params);
  }

  onBitstampMdStatus(ctx: Context<ServiceStatus>): void {
    this.bitstamp.updateMdStatus(ctx.params);
  }

  onFoxbitMdStatus(ctx: Context<ServiceStatus>): void {
    this.foxbit.updateMdStatus(ctx.params);
  }

  onPluralMdStatus(ctx: Context<ServiceStatus>): void {
    this.plural.updateMdStatus(ctx.params);
  }

  onPluralQuote(ctx: Context<Quote>): void {
    this.plural.updateMdPrice(ctx.params);
  }

  onFoxbitOmsStatus(ctx: Context<ServiceStatus>): void {
    this.foxbit.updateOmsStatus(ctx.params);
  }
}
