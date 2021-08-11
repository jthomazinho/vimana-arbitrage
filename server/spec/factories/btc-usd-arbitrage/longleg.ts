import { Factory } from 'fishery';
import { LongLeg } from '../../../services/templates/btc-usd-arbitrage-execution';
import instrument from '../md/instrument';

export default Factory.define<LongLeg>(() => ({
  ...instrument.build(),
  order: {
    id: 1907,
    algoInstanceId: 1702,
    exchange: 'bitstamp',
    symbol: 'btcusd',
    quantity: 0.00011111,
    side: 'B',
    type: 'market',
    arbitrageExecutionId: '2726',
    price: 5000,
    exchangeOrderId: '1596122484309',
  },
  orderStatus: {
    order: {
      id: 1907,
      algoInstanceId: 1702,
      exchange: 'bitstamp',
      symbol: 'btcusd',
      quantity: 0.00011111,
      side: 'B',
      type: 'market',
      arbitrageExecutionId: '2726',
      price: 5000,
      exchangeOrderId: '1596122484309',
    },
    status: 'filled',
  },
}));
