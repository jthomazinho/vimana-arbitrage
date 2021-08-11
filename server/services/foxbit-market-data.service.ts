import { Service, ServiceBroker } from 'moleculer';

import { subscribeBook } from '../lib/market-data/foxbit';
import * as md from '../lib/market-data';
import { ServiceStatus } from '../lib/status';

export default class extends Service {
  constructor(broker: ServiceBroker) {
    super(broker);

    this.parseServiceSchema({
      name: 'md-foxbit',
      dependencies: [
        'status',
      ],
      started: this.started,
    });
  }

  async started(): Promise<void> {
    const instrument = { exchange: 'foxbit', symbol: 'btcbrl' };
    const client: md.Subscriber = {
      onDepth: (depth) => {
        this.broker.broadcast<md.Depth>(`md.depth.${instrument.exchange}.${instrument.symbol}`, depth);
      },
      onQuote: () => { /* this is empty cause this md does not implement onQuote event */ },
      onStatus: (status) => {
        this.broker.broadcast<ServiceStatus>(`md.status.${instrument.exchange}`, status);
      },
    };
    subscribeBook(instrument, client);
  }
}
