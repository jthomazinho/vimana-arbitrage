import { Service } from 'moleculer';
import DbService from 'moleculer-db';
import SqlAdapter from 'moleculer-db-adapter-sequelize';

import { AlgoInstance } from '../app/models/algo-instance';
import { sequelize } from '../app/models';

export default class extends Service {
  constructor(broker) {
    super(broker);

    this.parseServiceSchema({
      name: 'algo-instance',
      mixins: [DbService],
      adapter: new SqlAdapter(sequelize),
      model: AlgoInstance,
    });
  }
}
