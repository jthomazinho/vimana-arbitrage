import * as oms from '../../lib/oms';
import {
  BtcUsdArbitrageExecution as Model,
} from '../../app/models/btc-usd-arbitrage-execution';
import { summary } from '../../app/algos/btc-usd-arbitrage/summary';

const executionLong = new Map();
const executionShort = new Map();

export interface LongLeg {
  order: oms.OrderParams;
  orderStatus: {
    order: oms.OrderParams;
    status: string;
  };
}

export interface ShortLeg {
  order: oms.OrderParams;
  status: {
    order: oms.OrderParams;
    status: string;
    quantityExecuted: number;
    avgPrice: number;
  };
}

async function getArbitrageExecutions(arbitrageExecutionId: string): Promise<any> {
  return Model.findOne({ where: { id: arbitrageExecutionId } });
}

async function checkExecution(arbitrageExecutionId: string) {
  const longExecution = executionLong.get(arbitrageExecutionId);
  const shortExecution = executionShort.get(arbitrageExecutionId);
  const arbitrageExecution = await getArbitrageExecutions(arbitrageExecutionId);
  let longPrice = 0;
  let longQty = 0;
  if (!longExecution) {
    if (!arbitrageExecution.needsConciliation) {
      return;
    }
  } else {
    longPrice = longExecution.orderStatus.order.price;
    longQty = longExecution.orderStatus.order.quantity;
  }
  if (!shortExecution) {
    return;
  }
  const editedContext = {
    ...arbitrageExecution.context,
    quantityShort: shortExecution.status.quantityExecuted,
    quantityLong: longQty,
    shortBestOffer: [0, Number(shortExecution.status.avgPrice)],
    longBestOffer: [0, Number(longPrice)],
  };
  await Model.update(
    { summary: summary(editedContext) },
    { where: { id: arbitrageExecutionId } },
  );
}

export async function setLongLeg(leg: LongLeg) {
  if (!leg.order.arbitrageExecutionId) { return; }
  executionLong.set(leg.order.arbitrageExecutionId, leg);
  await checkExecution(leg.order.arbitrageExecutionId);
}

export async function setShortLeg(leg: ShortLeg) {
  if (!leg.order.arbitrageExecutionId) { return; }
  executionShort.set(leg.order.arbitrageExecutionId, leg);
  await checkExecution(leg.order.arbitrageExecutionId);
}
