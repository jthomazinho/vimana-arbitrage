import { Factory } from 'fishery';
import { Summary } from '../../../app/algos/btc-usd-arbitrage/summary';

export default Factory.define<Summary>(() => ({
  longLeg: {
    feeTrade: '0.2980',
    feeWithdraw: '0.2980',
    grossTotal: '297.9734',
    netTotal: '298.2714',
    price: '9500.3800',
    quantity: '0.03136437',
  },
  pAndL: {
    brl: '-179.0064',
    spread: '-11.6188%',
    targetReached: true,
    usd: '-31.0759',
  },
  pegLeg: {
    buyUsd: '267.9990',
    longTotal: '1542.2109',
    price: '5.7661',
    unitFeeExchange: '0.01',
    unitFeeIof: '0.01',
  },
  shortLeg: {
    feeTrade: '1.54',
    feeWithdraw: '1.54',
    grossTotal: '1543.75',
    netTotal: '1540.67',
    price: '49220.01',
    quantity: '0.03136437',
  },
  version: 2,
}));
