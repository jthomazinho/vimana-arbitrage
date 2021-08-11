/* eslint-disable max-classes-per-file */
export const sides = {
  buy: 'B',
  sell: 'S',
} as const;
/**
 * Side of the order.
 */
export type Side = typeof sides[keyof typeof sides];

export const exchanges = ['bitstamp', 'foxbit'] as const;
/**
 * Exchange to which the order is sent.
 */
export type Exchange = typeof exchanges[number];

export const types = ['market', 'limit'] as const;
/**
 * Type of the order.
 */
export type Type = typeof types[number];

/**
 * OrderParams contains the required information to create an Order.
 */
export interface OrderParams {
  /**
   * algoInstanceId is the id of the AlgoInstance that is managing the Order.
   */
  algoInstanceId: number;
  exchange: Exchange;
  symbol: string;
  side: Side;
  type: Type;
  /**
   * quantity is the amount of asset being traded.
   */
  quantity: number;
  /**
   * price is the unitary value of the crypto in the denominated currency.
   * This value is optional depending on the order type.
   */
  price?: number;

  arbitrageExecutionId?: string;
}

/**
 * Order the order sent to an exchange.
 */
export interface Order extends OrderParams {
  /**
   * id is the database id of the order.
   */
  id: number;
  /**
   * exchangeOrderId is the exchange assigned id of the order.
   */
  exchangeOrderId: Maybe<string>;
}

export interface ReplaceOrder {
  replacedOrderId: number;
  orderId: number;
}

/**
 * Order history.
 */
export interface OrderHistory {
  Side: string;
  OrderId: number;
  Price: number;
  Quantity: number;
  DisplayQuantity: number;
  Instrument: number;
  Account: number;
  AccountName: string;
  OrderType: string;
  ClientOrderId: number;
  OrderState: string;
  ReceiveTime: number;
  ReceiveTimeTicks: number;
  LastUpdatedTime: number;
  LastUpdatedTimeTicks: number;
  OrigQuantity: number;
  QuantityExecuted: number;
  GrossValueExecuted: number;
  ExecutableValue: number;
  AvgPrice: number;
  CounterPartyId: number;
  ChangeReason: string;
  OrigOrderId: number;
  OrigClOrdId: number;
  EnteredBy: number;
  UserName: string;
  IsQuote: false;
  InsideAsk: number;
  InsideAskSize: number;
  InsideBid: number;
  InsideBidSize: number;
  LastTradePrice: number;
  RejectReason: '';
  IsLockedIn: false;
  CancelReason: '';
  OrderFlag: number;
  UseMargin: false;
  StopPrice: number;
  PegPriceType: string;
  PegOffset: number;
  PegLimitOffset: number;
  OMSId: number;
}

/**
 * AcceptedOrder is an Order that has been accepted by the exchange.
 */
export interface AcceptedOrder extends Order {
  exchangeOrderId: string;
  quantityExecuted?: number;
}

/**
 * OrderStatus holds the exchange status of an Order.
 */
export interface OrderStatus {
  order: AcceptedOrder;
  status: 'open' | 'filled' | 'partial';
  quantityExecuted?: number;
  avgPrice?: number;
}

export interface TradeParams {
  exchange: Exchange;
  /**
   * exchangeTradeId is the exchange assigned id of the trade.
   */
  exchangeTradeId: string;
  tradeTime: Date;
  symbol: string;
  side: Side;
  quantity: number;
  price: number;
  /**
   * orderId is the database id of the order that generated the trade.
   */
  orderId: number;
}

/**
 * RawExchangeTradeParams is a trade as it is received from the exchange,
 * so it doesn't have the internal orderId associated, instead it has the
 * exchangeOrderId.
 */
export interface RawExchangeTradeParams extends Omit<TradeParams, 'orderId'> {
  /**
   * exchangeOrderId is the exchange assigned id of the order that generated the trade.
   */
  exchangeOrderId: string;
}

/**
 * OrderRejectedError is the error for when the exchanges rejects an Order.
 */
export class OrderRejectedError extends Error { }
