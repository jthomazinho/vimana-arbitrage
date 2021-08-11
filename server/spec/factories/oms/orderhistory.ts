import { Factory } from 'fishery';
import { OrderHistory } from '../../../lib/oms';

export default Factory.define<OrderHistory>(() => ({
  Side: 'Sell',
  OrderId: 30595785,
  Price: 0,
  Quantity: 0,
  DisplayQuantity: 0,
  Instrument: 1,
  Account: 300812,
  AccountName: 'user@provider.com',
  OrderType: 'Market',
  ClientOrderId: 123,
  OrderState: 'FullyExecuted',
  ReceiveTime: 1603197989457,
  ReceiveTimeTicks: 637387947894567300,
  LastUpdatedTime: 1603197989612,
  LastUpdatedTimeTicks: 637387947896119300,
  OrigQuantity: 0.0065,
  QuantityExecuted: 0.0065,
  GrossValueExecuted: 434.200585,
  ExecutableValue: 0,
  AvgPrice: 66800.09,
  CounterPartyId: 0,
  ChangeReason: 'Trade',
  OrigOrderId: 30595785,
  OrigClOrdId: 143,
  EnteredBy: 299855,
  UserName: 'user@provider.com',
  IsQuote: false,
  InsideAsk: 66800.1,
  InsideAskSize: 0.06,
  InsideBid: 66800.09,
  InsideBidSize: 0.0506,
  LastTradePrice: 66800.09,
  RejectReason: '',
  IsLockedIn: false,
  CancelReason: '',
  OrderFlag: 0,
  UseMargin: false,
  StopPrice: 0,
  PegPriceType: 'Unknown',
  PegOffset: 0,
  PegLimitOffset: 0,
  OMSId: 1,
}));
