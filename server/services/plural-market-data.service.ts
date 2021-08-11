import { Service, ServiceBroker } from 'moleculer';

import * as md from '../lib/market-data';
import { getLastPrice } from '../lib/market-data/plural';
import { ServiceStatus } from '../lib/status';

export default class extends Service {
  private interval!: NodeJS.Timeout;

  constructor(broker: ServiceBroker) {
    super(broker);

    this.parseServiceSchema({
      name: 'md-plural',
      dependencies: [
        'status',
      ],
      started: this.started,
      actions: {
        __disable: this.handleDisable,
        __enable: this.handleEnable,
      },
    });
  }

  async started(): Promise<void> {
    const quoteRefreshRate = Number(process.env.PLURAL_REFRESH_RATE);
    const instrument = { exchange: 'plural', symbol: 'USD/BRL' };
    const client: md.Subscriber = {
      onDepth: () => { /* this is empty cause this md does not implement onDepth event */ },
      onQuote: (quote) => {
        this.broker.broadcast<md.Quote>(`md.quote.${instrument.exchange}.${instrument.symbol}`, quote);
      },
      onStatus: (status) => {
        this.broker.broadcast<ServiceStatus>(`md.status.${instrument.exchange}`, status);
      },
    };

    getLastPrice(instrument, client, this.logger);
    this.interval = setInterval(() => {
      getLastPrice(instrument, client, this.logger);
    }, quoteRefreshRate);
  }

  async handleDisable(): Promise<{ enabled: boolean }> {
    clearInterval(this.interval);

    return { enabled: false };
  }

  async handleEnable(): Promise<{ enabled: boolean }> {
    await this.started();

    return { enabled: true };
  }
}
