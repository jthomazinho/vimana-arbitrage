/* eslint-disable @typescript-eslint/no-var-requires */
const dotenv = require('dotenv');

const env = process.env.NODE_ENV || 'development';

dotenv.config({ path: `.env.${env}.local` });
dotenv.config({ path: `.env.${env}` });
dotenv.config();

const requiredEnvVars = [
  'BITSTAMP_WS_URL',
  'BITSTAMP_REST_URL',
  'BITSTAMP_REST_API_KEY',
  'BITSTAMP_REST_API_SECRET',
  'DB_CONNECTION_STRING',
  'FOXBIT_WS_URL',
  'FOXBIT_REST_URL',
  'FOXBIT_REST_AUTH',
  'FOXBIT_ACCOUNT_ID',
  'FOXBIT_OTP_SECRET',
  'FOXBIT_API_KEY',
  'FOXBIT_API_SECRET',
  'FOXBIT_USER_ID',
  'PLURAL_REST_URL',
  'TRADEBLOCK_URL',
  'TRADEBLOCK_APIKEY',
  'TRADEBLOCK_APISECRET',
];

const missing = [];
requiredEnvVars.forEach((envvar) => {
  if (!process.env[envvar]) {
    missing.push(envvar);
  }
});

if (missing.length > 0) {
  throw new Error(`Missing environment variables: ${missing.join(',')}`);
}
