import * as oms from '../../lib/oms';

const arbitrageExecutionRetry = new Map();

export async function checkOrderPlaced(arbitrageExecutionId: number, orderHistory: Array<oms.OrderHistory>):
  Promise<any> {
  let orderPlaced: any = false;
  orderHistory.forEach((order: oms.OrderHistory) => {
    if (order.ClientOrderId === arbitrageExecutionId) {
      orderPlaced = order;
    }
  });
  return orderPlaced;
}

function setArbitrageExecutionRetry(arbitrageExecutionId: number): number {
  const retryCounter = arbitrageExecutionRetry.get(arbitrageExecutionId);
  if (retryCounter) {
    const trials = retryCounter + 1;
    arbitrageExecutionRetry.set(arbitrageExecutionId, trials);
    return trials;
  }
  arbitrageExecutionRetry.set(arbitrageExecutionId, 1);
  return 1;
}

export async function isRetryNeeded(arbitrageExecutionId: number) {
  if (setArbitrageExecutionRetry(arbitrageExecutionId) > 1) {
    return true;
  }
  return false;
}
