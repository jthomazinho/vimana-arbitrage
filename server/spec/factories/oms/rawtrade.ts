import { Factory } from 'fishery';
import { RawExchangeTradeParams } from '../../../lib/oms';

export default Factory.define<RawExchangeTradeParams>(() => ({
  exchange: 'bitstamp',
  exchangeTradeId: '1598533567691',
  exchangeOrderId: '1598533567633',
  price: 0.1955,
  quantity: 0.015,
  side: 'B',
  symbol: 'btcusd',
  tradeTime: new Date('2020-04-27 19:59:10.968000'),
}));
