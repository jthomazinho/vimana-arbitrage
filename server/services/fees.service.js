/* eslint-disable no-param-reassign */
import { Service } from 'moleculer';
import DbService from 'moleculer-db';
import SqlAdapter from 'moleculer-db-adapter-sequelize';

import { Fee } from '../app/models/fee';
import { sequelize } from '../app/models';

function parseValues(model) {
  model.fixed = parseFloat(model.fixed);
  model.rate = parseFloat(model.rate);
}

export default class extends Service {
  constructor(broker) {
    super(broker);

    this.parseServiceSchema({
      name: 'fees',
      mixins: [DbService],
      adapter: new SqlAdapter(sequelize),
      fields: ['id'],
      model: Fee,
      hooks: {
        after: {
          find: [
            (_ctx, res) => {
              res.forEach(parseValues);
              return res;
            },
          ],
          update: [
            (_ctx, res) => {
              parseValues(res);
              this.broker.broadcast(`fees.${res.serviceProvider}.${res.service}.update`, res);
              return res;
            },
          ],
        },
      },
    });
  }
}
