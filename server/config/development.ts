/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
import Umzug from 'umzug';
import path from 'path';

import { sequelize } from '../app/models';

const umzug = new Umzug({
  migrations: {
    path: path.join(__dirname, '../db/migrate'),
    params: [
      sequelize.getQueryInterface(),
    ],
  },
  storage: 'sequelize',
  storageOptions: {
    sequelize,
  },
});

umzug.pending()
  .then((list) => list.map((m) => m.file))
  .then((pending) => {
    if (pending.length > 0) {
      console.error('\n\nPending migrations:');
      console.error(pending.join('\n'));
      console.log('\n');
      process.exit(1);
    }
  });
