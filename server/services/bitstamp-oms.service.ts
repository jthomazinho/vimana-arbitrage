import { Service, ServiceBroker, Context } from 'moleculer';

import { Order as Model } from '../app/models/order';
import * as oms from '../lib/oms';
import Bitstamp from '../lib/oms/bitstamp';

export default class extends Service {
  private oms: Bitstamp;

  constructor(broker: ServiceBroker) {
    super(broker);

    this.parseServiceSchema({
      name: 'oms-bitstamp',
      started: this.started,
      actions: {
        sendMarketOrder: this.handleSendMarketOrder,
        monitorOrder: this.handleMonitorOrder,
      },
    });

    this.oms = new Bitstamp();
  }

  async started(): Promise<void> {
    this.oms.init(this.broker.broadcast);
  }

  async handleSendMarketOrder(ctx: Context<oms.OrderParams>): Promise<oms.Order> {
    return Model.create(ctx.params)
      .then((order) => this.oms.sendMarketOrder(ctx.params, order.id))
      .then(async (order) => {
        this.logger.info(`[orderId=${order.id}][event=order_created]`);
        await Model.update(
          { exchangeOrderId: order.exchangeOrderId },
          { where: { id: order.id } },
        );
        this.monitorOrder(order);
        return order;
      });
  }

  async handleMonitorOrder(ctx: Context<oms.AcceptedOrder>): Promise<void> {
    this.monitorOrder(ctx.params);
  }

  monitorOrder(order: oms.AcceptedOrder): void {
    this.oms.getOrderStatus(order)
      .then((orderStatus) => {
        if (orderStatus.status === 'filled') {
          this.logger.info(`[orderId=${order.id}][event=order_filled][quantity=${order.quantity}]`);
          this.broker.broadcast(`oms.order_filled.bitstamp.${order.algoInstanceId}`, { order, orderStatus });
          return;
        }
        setTimeout(() => this.monitorOrder(order), 5000);
      })
      .catch((err) => {
        this.logger.error(err.message);
      });
  }
}
