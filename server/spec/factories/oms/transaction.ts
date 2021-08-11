import { Factory } from 'fishery';
import { Transaction } from '../../../lib/oms/bitstamp';

export default Factory.define<Transaction>(() => ({
  fee: '0.08',
  price: '0.19550000',
  datetime: '2020-04-27 19:59:10.968000',
  usd: '29.32500000',
  tid: 1598533567691,
  type: 2,
  btc: '0.01500000',
}));
