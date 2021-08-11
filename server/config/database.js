/* eslint-disable @typescript-eslint/camelcase */
require('./dotenv');

module.exports = {
  development: {
    use_env_variable: 'DB_CONNECTION_STRING',
  },
  test: {
    use_env_variable: 'DB_CONNECTION_STRING',
    logging: false,
  },
  production: {
    use_env_variable: 'DB_CONNECTION_STRING',
  },
};
