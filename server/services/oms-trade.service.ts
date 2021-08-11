import { Service, ServiceBroker, Context } from 'moleculer';

import { Break } from '../lib';
import * as oms from '../lib/oms';
import { Trade as TradeModel } from '../app/models/trade';
import { Order } from '../app/models/order';

export default class extends Service {
  constructor(broker: ServiceBroker) {
    super(broker);

    this.parseServiceSchema({
      name: 'oms-trade',
      events: {
        'oms.raw_trade': this.onRawTrade,
      },
    });
  }

  async onRawTrade(ctx: Context<oms.RawExchangeTradeParams>): Promise<void> {
    const { params: exchangeTradeParams } = ctx;
    Order.findOne({
      where: {
        exchange: exchangeTradeParams.exchange,
        exchangeOrderId: exchangeTradeParams.exchangeOrderId,
      },
    })
      .then((order): Order => {
        if (!order) {
          const { exchangeOrderId, exchangeTradeId } = exchangeTradeParams;
          this.logger.error('Received trade for unknown order.'
            + ` exchangeTradeId=${exchangeTradeId}|exchangeOrderId=${exchangeOrderId}`);

          throw new Break();
        }

        return order;
      })
      .then((order) => {
        TradeModel.create({ ...exchangeTradeParams, orderId: order.id })
          .then((trade) => {
            this.broker.broadcast<TradeModel>(
              `oms.trade.${exchangeTradeParams.exchange}.${order.algoInstanceId}`,
              trade,
            );
          });
      })
      .catch((err) => {
        if (!(err instanceof Break)) {
          throw err;
        }
      });
  }
}
