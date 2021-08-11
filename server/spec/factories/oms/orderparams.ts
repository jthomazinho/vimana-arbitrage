import { Factory } from 'fishery';
import { OrderParams } from '../../../lib/oms';

export default Factory.define<OrderParams>(() => ({
  algoInstanceId: 15,
  exchange: 'bitstamp',
  symbol: 'btcusd',
  quantity: 0.0073,
  side: 'B',
  type: 'market',
  arbitrageExecutionId: '7',
}));
