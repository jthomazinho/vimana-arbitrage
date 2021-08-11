import { checkOrderPlaced, isRetryNeeded } from './btc-usd-arbitrage-retry';
import { OrderHistory } from '../../lib/oms';
import factories from '../../spec/factories';

describe('templates/btc-usd-arbitrage-retry', () => {
  describe('.checkOrderPlaced', () => {
    const orderHistory: Array<OrderHistory> = [factories.orderHistory.build()];
    describe('with valid arbitrageExecutionId and orderhistory', () => {
      it('should return valid order referent of checkOrderPlaced', async () => {
        expect(await checkOrderPlaced(123, orderHistory)).toEqual(orderHistory[0]);
      });
    });

    describe('with invalid arbitrageExecutionId', () => {
      it('should return false', async () => {
        expect(await checkOrderPlaced(0, orderHistory)).toEqual(false);
      });
    });

    describe('with invalid orderhistory', () => {
      it('should return false', async () => {
        expect(await checkOrderPlaced(123, [])).toEqual(false);
      });
    });
  });

  describe('.isRetryNeeded', () => {
    describe('with valid arbitrageExecutionId and one trial', () => {
      it('should return false', async () => {
        expect(await isRetryNeeded(1)).toEqual(false);
      });
    });

    describe('with valid arbitrageExecutionId and two trial', () => {
      it('should return true', async () => {
        expect(await isRetryNeeded(1)).toEqual(true);
      });
    });

    describe('with invalid arbitrageExecutionId', () => {
      it('should return false', async () => {
        expect(await isRetryNeeded(0)).toEqual(false);
      });
    });
  });
});
