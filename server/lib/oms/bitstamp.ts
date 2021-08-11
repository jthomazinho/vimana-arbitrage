import axios, { AxiosResponse, AxiosInstance } from 'axios';
import querystring from 'querystring';
import { getAuthHeaders, Request } from './bitstamp-auth-v2';
import { BroadcastFn } from '..';
import * as oms from '../oms';

const baseURL = process.env.BITSTAMP_REST_URL || '';

export interface Transaction {
  fee: string;
  price: string;
  datetime: string;
  usd: string;
  tid: number;
  type: number;
  btc: string;
}

export default class Bitstamp {
  private broadcast!: BroadcastFn;

  private balancePath = '/api/v2/balance/';

  private http: AxiosInstance = axios.create({
    baseURL,
    method: 'POST',
    transformRequest: [(data, reqHeaders): unknown => {
      // Bitstamp doesn't accept the Content-Type header when the request
      // doesn't have a body
      if (!data) {
        // eslint-disable-next-line no-param-reassign
        delete reqHeaders.post['Content-Type'];
      }
      return data;
    }],
  });

  init(broadcastFn: BroadcastFn): void {
    this.broadcast = broadcastFn;
  }

  static extractTrades(
    order: oms.AcceptedOrder,
    transactions: Array<Transaction>,
  ): Array<oms.RawExchangeTradeParams> {
    return transactions.map((t) => ({
      exchange: 'bitstamp',
      exchangeTradeId: t.tid.toString(),
      exchangeOrderId: order.exchangeOrderId,
      price: Number(t.price),
      quantity: Number(t.btc),
      side: order.side,
      symbol: order.symbol,
      tradeTime: new Date(t.datetime),
    }));
  }

  getUsdBalance(): Promise<number> {
    const request: Request = { path: this.balancePath };

    const headers = getAuthHeaders(request);

    return this.http.request({ url: this.balancePath, headers })
      .then((response) => response.data.usd_balance);
  }

  static async handleMarketOrderResponse(
    response: AxiosResponse,
    orderParams: oms.OrderParams,
    internalId: number,
  ) {
    if (response.data.status === 'error') {
      return Promise.reject(new oms.OrderRejectedError(response.data.reason));
    }
    return {
      id: internalId,
      ...orderParams,
      price: response.data.price,
      exchangeOrderId: response.data.id,
    };
  }

  sendMarketOrder(orderParams: oms.OrderParams, internalId: number): Promise<oms.AcceptedOrder> {
    const sideFragment = orderParams.side === 'B' ? 'buy' : 'sell';
    const path = `/api/v2/${sideFragment}/market/${orderParams.symbol}/`;
    const payload = { amount: Number(orderParams.quantity.toFixed(8)) };
    const request: Request = { path, payload };
    const headers = getAuthHeaders(request);

    return this.http.request({ url: path, headers, data: querystring.stringify(payload) })
      .then((response) => Bitstamp.handleMarketOrderResponse(response, orderParams, internalId));
  }

  async handleOrderStatusResponse(
    response: AxiosResponse,
    order: oms.AcceptedOrder,
  ): Promise<oms.OrderStatus> {
    if (response.data.status === 'error') {
      return (response.data.reason);
    }
    if (response.data.status === 'Finished') {
      Bitstamp.extractTrades(order, response.data.transactions).forEach((rawTrade) => {
        this.broadcast<oms.RawExchangeTradeParams>('oms.raw_trade', rawTrade);
      });
      return ({ order, status: 'filled' });
    }
    return ({ order, status: 'open' });
  }

  getOrderStatus(order: oms.AcceptedOrder): Promise<oms.OrderStatus> {
    const path = '/api/v2/order_status/';
    const payload = { id: order.exchangeOrderId };
    const request: Request = { path, payload };
    const headers = getAuthHeaders(request);
    return this.http.request({ url: path, headers, data: querystring.stringify(payload) })
      .then((response) => this.handleOrderStatusResponse(response, order));
  }
}
