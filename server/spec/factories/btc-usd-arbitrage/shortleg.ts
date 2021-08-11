import { Factory } from 'fishery';
import { ShortLeg } from '../../../services/templates/btc-usd-arbitrage-execution';
import instrument from '../md/instrument';

export default Factory.define<ShortLeg>(() => ({
  ...instrument.build(),
  order: {
    id: 1906,
    algoInstanceId: 1702,
    exchange: 'foxbit',
    symbol: 'btcbrl',
    quantity: 0.00011100,
    side: 'S',
    type: 'market',
    arbitrageExecutionId: '2726',
    exchangeOrderId: 22515674,
    response: {
      status: 'Accepted',
      errormsg: '',
      OrderId: 22515674,
    },
  },
  status: {
    order: {
      id: 1906,
      algoInstanceId: 1702,
      exchange: 'foxbit',
      symbol: 'btcbrl',
      quantity: 0.00011111,
      side: 'S',
      type: 'market',
      arbitrageExecutionId: '2726',
      exchangeOrderId: 22515674,
      response: {
        status: 'Accepted',
        errormsg: '',
        OrderId: 22515674,
      },
    },
    status: 'filled',
    quantityExecuted: 0.00011111,
    avgPrice: 56519.58,
  },
}));
