import { Service } from 'moleculer';
import DbService from 'moleculer-db';
import SqlAdapter from 'moleculer-db-adapter-sequelize';

import { Trade } from '../app/models/trade';
import { sequelize } from '../app/models';

export default class extends Service {
  constructor(broker) {
    super(broker);

    this.parseServiceSchema({
      name: 'db-trade',
      mixins: [DbService],
      adapter: new SqlAdapter(sequelize),
      model: Trade,
    });
  }
}
