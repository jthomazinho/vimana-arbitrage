import { Service, ServiceBroker, Context } from 'moleculer';

import { Order as Model } from '../app/models/order';
import * as oms from '../lib/oms';
import Foxbit from '../lib/oms/foxbit';

enum ResponseStatus {
  open = 'open',
  partial = 'partial',
  filled = 'filled',
}

export default class extends Service {
  private oms: Foxbit;

  constructor(broker: ServiceBroker) {
    super(broker);

    this.parseServiceSchema({
      name: 'oms-foxbit',
      dependencies: [
        'status',
      ],
      started: this.started,
      actions: {
        getBrlBalance: this.handleGetBrlBalance,
        sendOrder: this.handleSendOrder,
        getOrderHistory: this.handleOrderHistory,
        monitorOrder: this.handleMonitorOrder,
      },
    });

    this.oms = new Foxbit(this.logger, this.broker.broadcast);
  }

  async started(): Promise<void> {
    this.oms.init();
  }

  async handleOrderHistory(ctx: Context<any>): Promise<any> {
    this.oms.getOrderHistory().then(async (orderHistory) => {
      this.broker.broadcast(
        `oms.order_history.foxbit.${ctx.params.algoInstanceId}`,
        {
          arbitrageExecutionId: ctx.params.arbitrageExecutionId,
          orderHistory,
          algoInstanceId: ctx.params.algoInstanceId,
        },
      );
    });
  }

  async handleSendOrder(ctx: Context<oms.OrderParams>): Promise<oms.Order> {
    return Model.create(ctx.params)
      .then((order) => this.oms.sendOrder(ctx.params, order.id))
      .then(async (order) => {
        this.logger.info(`[orderId=${order.id}][event=order_created]`);
        await Model.update(
          { exchangeOrderId: order.exchangeOrderId },
          { where: { id: order.id } },
        );
        this.monitorOrder(order);
        return order;
      })
      .catch((err) => {
        this.logger.error(`[rest] Error sending order: ${JSON.stringify(err)}`);
        return Promise.reject(err);
      });
  }

  async handleMonitorOrder(ctx: Context<oms.AcceptedOrder>): Promise<void> {
    this.monitorOrder(ctx.params);
  }

  monitorOrder(order: oms.AcceptedOrder): void {
    this.oms.getOrderStatus(order)
      .then((status) => {
        if (status.status !== ResponseStatus.open) {
          this.logger.info(`[orderId=${order.id}][event=order_execution][quantity=${order.quantity}]`);
          this.broker.broadcast(`oms.order_execution.foxbit.${order.algoInstanceId}`, { order, status });
          return;
        }

        setTimeout(() => this.monitorOrder(order), 5000);
      })
      .catch((err) => {
        this.logger.error(`[rest] Failed to get order status: ${err.message}`);
      });
  }

  async handleGetBrlBalance(): Promise<number> {
    return this.oms.getBrlBalance();
  }
}
