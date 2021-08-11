import * as oms from '../oms';
import { Logger, BroadcastFn } from '..';
import FoxbitWebsocket from './foxbit-websocket';

const accountId = process.env.FOXBIT_ACCOUNT_ID || '';

export interface OrderParams {
  OMSId: number;
  AccountId: string;
  Quantity: number;
  OrderType: string;
  InstrumentId: number;
  ClientOrderId: number;
  Side: string;
  TimeInForce: string;
}

export interface SendOrderResponse {
  status: string;
  errormsg: string;
  OrderId: number;
}

export enum OrderState {
  unknown = 'Unknown',
  working = 'Working',
  rejected = 'Rejected',
  canceled = 'Canceled',
  expired = 'Expired',
  fullyExecuted = 'FullyExecuted',
}

export default class Foxbit {
  private logger: Logger;

  private ws: FoxbitWebsocket;

  constructor(logger: Logger, broadcast: BroadcastFn) {
    this.logger = logger;
    this.ws = new FoxbitWebsocket(this.logger, broadcast);
  }

  init(): void {
    // FoxbitWebsocket handles its initialization internally
    this.initializeWs();
  }

  static setupOrderParams(orderParams: oms.OrderParams, internalId: number): OrderParams {
    return {
      OMSId: 1,
      AccountId: accountId,
      ClientOrderId: internalId,
      Quantity: Number(orderParams.quantity.toFixed(8)),
      OrderType: String(orderParams.type).charAt(0).toUpperCase() + String(orderParams.type).slice(1),
      InstrumentId: 1, // BTC fixed, need a translation map
      Side: orderParams.side === 'B' ? 'Buy' : 'Sell',
      TimeInForce: 'GTC',
    };
  }

  static async handleMarketOrderResponse(
    orderId: string,
    orderParams: oms.OrderParams,
    internalId: number,
  ): Promise<oms.AcceptedOrder> {
    return {
      id: internalId,
      ...orderParams,
      exchangeOrderId: orderId,
    };
  }

  async sendOrder(orderParams: oms.OrderParams, internalId: number): Promise<oms.AcceptedOrder> {
    const path = 'SendOrder';
    const params = Foxbit.setupOrderParams(orderParams, internalId);

    return this.ws.sendWs(path, params)
      .then((response: any) => Foxbit.handleMarketOrderResponse(response.OrderId, orderParams, internalId));
  }

  static setupOrderStatusParams(exchangeOrderId: string) {
    return {
      OmsId: 1, AccountId: accountId, OrderId: exchangeOrderId,
    };
  }

  async handleOrderStatusResponse(response: any, order: oms.AcceptedOrder): Promise<oms.OrderStatus> {
    if (response.result === false) {
      if (response.errorcode >= 100 && response.errorcode <= 104) {
        this.logger.error(`[getOrderStatus] Error ${response.errorcode}, try again`);
        return { order, status: 'open' };
      }

      this.logger.error(`[rest] Error response: ${JSON.stringify(response)}`);
      return Promise.reject(response.errormsg);
    }

    if (response.OrderState === OrderState.fullyExecuted) {
      return {
        order,
        status: 'filled',
        quantityExecuted: response.QuantityExecuted,
        avgPrice: response.AvgPrice,
      };
    }

    if (response.OrderState === OrderState.working
      && response.QuantityExecuted > 0) {
      return {
        order,
        status: 'partial',
        quantityExecuted: response.QuantityExecuted,
        avgPrice: response.AvgPrice,
      };
    }

    return { order, status: 'open' };
  }

  async getOrderStatus(order: oms.AcceptedOrder): Promise<oms.OrderStatus> {
    const path = 'GetOrderStatus';
    const params = Foxbit.setupOrderStatusParams(order.exchangeOrderId);
    return this.ws.sendWs(path, params)
      .then((response: any) => this.handleOrderStatusResponse(response, order));
  }

  static setupOrderHistoryParams() {
    return {
      OMSId: 1, AccountId: Number(accountId), Depth: 10,
    };
  }

  async getOrderHistory(): Promise<oms.OrderStatus> {
    const path = 'GetOrderHistory';
    const params = Foxbit.setupOrderHistoryParams();
    return this.ws.sendWs(path, params)
      .then((response: any) => this.handleOrderHistoryResponse(response));
  }

  async handleOrderHistoryResponse(response: any): Promise<any> {
    if (response.result === false) {
      this.logger.error(`[getOrderHistory] Error ${response}`);
      return Promise.reject(response.errormsg);
    }
    return response;
  }

  static setupBRLBalanceParams() {
    return { OMSId: 1, AccountId: accountId };
  }

  static async handleBrlBalanceResponse(response: any) {
    return response.find((el: { [k: string]: something }) => el.ProductSymbol === 'BRL')?.Amount || 0;
  }

  async getBrlBalance(): Promise<number> {
    const path = 'GetAccountPositions';
    const payload = Foxbit.setupBRLBalanceParams();
    return this.ws.sendWs(path, payload)
      .then((response: any) => Foxbit.handleBrlBalanceResponse(response));
  }

  private async initializeWs(): Promise<void> {
    this.ws.init();
  }
}
