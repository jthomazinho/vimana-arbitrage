/* eslint-disable import/prefer-default-export */
import { Sequelize } from 'sequelize';
import { initInputSharedInstance } from './input-shared-instance';
import { initAlgoInstance } from './algo-instance';
import { initAlgoOTCInstance } from './algo-otc-instance';

import { initFee } from './fee';
import { initBtcUsdArbitrageExecution } from './btc-usd-arbitrage-execution';
import { initBtcUsdArbitrageConciliation } from './btc-usd-arbitrage-conciliation';

import { initOrder } from './order';
import { initTrade } from './trade';

const env = process.env.NODE_ENV || 'development';
const config = require('../../config/database')[env];

const sequelize = new Sequelize(process.env[config.use_env_variable] as string, config);

initInputSharedInstance(sequelize);
initAlgoInstance(sequelize);
initAlgoOTCInstance(sequelize);

initFee(sequelize);

initBtcUsdArbitrageExecution(sequelize);
initBtcUsdArbitrageConciliation(sequelize);
initOrder(sequelize);
initTrade(sequelize);

export {
  sequelize,
};
