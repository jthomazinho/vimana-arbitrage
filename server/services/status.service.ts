require('dotenv');
/* eslint-disable max-classes-per-file */
import { Context, Service, ServiceBroker } from 'moleculer';

const { MongoClient} = require('mongodb');

import { Depth, Quote } from '../lib/market-data';
import { ServiceStatus } from '../lib/status';
import AlwaysAvailable from '../lib/status/always-available';
import Exchange from '../lib/status/exchange';
import UpdateDepth from '../lib/status/update-depth';
import UpdateQuote from '../lib/status/update-quote';
import UpdateStatus from '../lib/status/update-status';

const mongoClient = new MongoClient(process.env.DB_CONNECTION_URI as string);
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

    this.startUp();
  }

  async startUp(): Promise<boolean> {
    await mongoClient.connect();
    return true;
  }

  async createBookDocument(collection: string, book: Depth): Promise<boolean> {
    const result = await mongoClient.db("arbitrage").collection(collection).insertOne(book);
    return true;
  }

  handleGetStatus(): object {
    return {
      foxbit: this.foxbit.status(),
      bitstamp: this.bitstamp.status(),
      plural: this.plural.status(),
    };
  }

  async onBitstampDepth(ctx: Context<Depth>): Promise<void> {
    console.log(`onBitstampDepth: ${JSON.stringify(ctx.params)}`);
    const result = await this.createBookDocument('exchange-book', ctx.params);
    this.bitstamp.updateMdPrice(ctx.params);
  }

  async onFoxbitDepth(ctx: Context<Depth>): Promise<void> {
    console.log(`onFoxbitDepth: ${JSON.stringify(ctx.params)}`);
    const result = await this.createBookDocument('exchange-book', ctx.params);
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
