import { Service } from 'moleculer';
import DbService from 'moleculer-db';
import SqlAdapter from 'moleculer-db-adapter-sequelize';

import { BtcUsdArbitrageExecution } from '../app/models/btc-usd-arbitrage-execution';
import { sequelize } from '../app/models';

export default class extends Service {
  constructor(broker) {
    super(broker);

    this.parseServiceSchema({
      name: 'btc_usd_arbitrage_execution',
      mixins: [DbService],
      adapter: new SqlAdapter(sequelize),
      model: BtcUsdArbitrageExecution,
    });
  }
}
