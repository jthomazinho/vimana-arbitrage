import { Factory } from 'fishery';
import { Order } from '../../../lib/oms';

export default Factory.define<Order>(({ sequence }) => ({
  id: sequence,
  exchangeOrderId: undefined,
  algoInstanceId: 1,
  exchange: 'bitstamp',
  symbol: 'btcusd',
  quantity: 1,
  side: 'B',
  type: 'market',
}));
