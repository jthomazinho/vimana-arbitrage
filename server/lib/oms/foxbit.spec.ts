import { ServiceBroker } from 'moleculer';
import factories from '../../spec/factories';

import Foxbit from './foxbit';

const foxbit: Foxbit = new Foxbit(
  (new ServiceBroker({ logger: false }).logger),
  jest.fn(),
);

describe('oms/foxbit', () => {
  const acceptedOrder = {
    ...factories.orderparams.build(),
    exchangeOrderId: '1',
    id: 1,
  };
  const openOrderStatus = {
    order: acceptedOrder,
    status: 'open',
  };
  describe('.setupOrderParams', () => {
    describe('Setup market order params with valid params', () => {
      it('Should return valid OrderParams', () => {
        expect(Foxbit.setupOrderParams(factories.orderparams.build(), 99)).toEqual({
          AccountId: process.env.FOXBIT_ACCOUNT_ID,
          InstrumentId: 1,
          OMSId: 1,
          ClientOrderId: 99,
          OrderType: 'Market',
          Quantity: 0.0073,
          Side: 'Buy',
          TimeInForce: 'GTC',
        });
      });
    });
  });

  describe('.handleMarketOrderResponse', () => {
    describe('Response with successfull market order placed', () => {
      it('Should return valid accepted order', async () => {
        const orderParams = factories.orderparams.build();
        expect(await Foxbit.handleMarketOrderResponse('1', orderParams, 1)).toEqual({
          ...orderParams,
          exchangeOrderId: '1',
          id: 1,
        });
      });
    });
  });

  describe('.setupOrderStatusParams', () => {
    describe('Setup orderStatus params from valid acceptedOrder', () => {
      it('Should return valid orderStatus params', () => {
        expect(Foxbit.setupOrderStatusParams(acceptedOrder.exchangeOrderId)).toEqual({
          OmsId: 1,
          AccountId: process.env.FOXBIT_ACCOUNT_ID,
          OrderId: acceptedOrder.exchangeOrderId,
        });
      });
    });
  });

  describe('.handleOrderStatusResponse', () => {
    describe('Response with status FullyExecuted', () => {
      it('Should return OrderStatus status filled', async () => {
        expect(await foxbit.handleOrderStatusResponse({
          OrderState: 'FullyExecuted',
          QuantityExecuted: 0.1,
          AvgPrice: 11000,
        }, acceptedOrder)).toEqual({
          order: acceptedOrder,
          avgPrice: 11000,
          quantityExecuted: 0.1,
          status: 'filled',
        });
      });
    });

    describe('Response with status Working and QuantityExecuted > 0', () => {
      it('Should return OrderStatus status partial', async () => {
        expect(await foxbit.handleOrderStatusResponse({
          OrderState: 'Working',
          QuantityExecuted: 0.1,
          AvgPrice: 11000,
        }, acceptedOrder)).toEqual({
          order: acceptedOrder,
          avgPrice: 11000,
          quantityExecuted: 0.1,
          status: 'partial',
        });
      });
    });

    describe('Response with status Working and QuantityExecuted = 0', () => {
      it('Should return OrderStatus status open', async () => {
        const test = await foxbit.handleOrderStatusResponse({
          OrderState: 'Working',
          QuantityExecuted: 0,
          AvgPrice: 11000,
        }, acceptedOrder);
        expect(test).toEqual({
          order: acceptedOrder,
          status: 'open',
        });
      });
    });

    describe('Response of placed order', () => {
      it('Should return orderStatus object with status open', async () => {
        expect(await foxbit.handleOrderStatusResponse({
          OrderState: 'open',
          QuantityExecuted: 0,
          AvgPrice: 0,
        }, acceptedOrder)).toEqual(
          expect.objectContaining({
            order: acceptedOrder,
            status: 'open',
          }),
        );
      });
    });

    describe('Response with error code 100', () => {
      it('Should return orderStatus open', async () => {
        expect(await foxbit.handleOrderStatusResponse({
          result: false,
          errorcode: 100,
        }, acceptedOrder)).toEqual(openOrderStatus);
      });
    });

    describe('Response with error code 101', () => {
      it('Should return orderStatus open', async () => {
        expect(await foxbit.handleOrderStatusResponse({
          result: false,
          errorcode: 101,
        }, acceptedOrder)).toEqual(openOrderStatus);
      });
    });

    describe('Response with error code 102', () => {
      it('Should return orderStatus open', async () => {
        expect(await foxbit.handleOrderStatusResponse({
          result: false,
          errorcode: 102,
        }, acceptedOrder)).toEqual(openOrderStatus);
      });
    });

    describe('Response with error code 103', () => {
      it('Should return orderStatus open', async () => {
        expect(await foxbit.handleOrderStatusResponse({
          result: false,
          errorcode: 103,
        }, acceptedOrder)).toEqual(openOrderStatus);
      });
    });

    describe('Response with error code 104', () => {
      it('Should return orderStatus open', async () => {
        expect(await foxbit.handleOrderStatusResponse({
          result: false,
          errorcode: 104,
        }, acceptedOrder)).toEqual(openOrderStatus);
      });
    });

    describe('Response with other errorcode', () => {
      it('Should throw an error message', async () => {
        const response = {
          result: false,
          errorcode: 99,
          errormsg: 'unknown',
        };
        await foxbit.handleOrderStatusResponse(response, acceptedOrder).catch((err) => {
          expect(err).toEqual(response.errormsg);
        });
      });
    });
  });

  describe('.setupBRLBalanceParams', () => {
    describe('Setup getaccountpositions params', () => {
      it('Should return valid getaccountpositions params', async () => {
        expect(Foxbit.setupBRLBalanceParams()).toEqual({
          OMSId: 1,
          AccountId: process.env.FOXBIT_ACCOUNT_ID,
        });
      });
    });
  });

  describe('.handleBrlBalanceResponse', () => {
    describe('Response with valid product', () => {
      it('Should return valid getaccount position Amount', async () => {
        expect(await Foxbit.handleBrlBalanceResponse([{
          ProductSymbol: 'BRL',
          Amount: '10000',
        }])).toEqual('10000');
      });
    });

    describe('Response with invalid product', () => {
      it('Should return Amount = 0', async () => {
        expect(await Foxbit.handleBrlBalanceResponse([{
          ProductSymbol: 'BRLL',
          Amount: '10000',
        }])).toEqual(0);
      });
    });
  });

  describe('.setupOrderHistoryParams', () => {
    describe('with no no parameters', () => {
      it('Should return valid order history params', async () => {
        expect(await Foxbit.setupOrderHistoryParams()).toEqual({
          AccountId: Number(process.env.FOXBIT_ACCOUNT_ID),
          Depth: 10,
          OMSId: 1,
        });
      });
    });
  });

  describe('.handleOrderHistoryResponse', () => {
    describe('with failed response', () => {
      it('Should throw an error', async () => {
        await foxbit.handleOrderHistoryResponse({
          result: false,
          errormsg: 'error message',
        })
          .catch((error) => {
            expect(error).toEqual('error message');
          });
      });
    });

    describe('with valid request', () => {
      it('Should return valid request', async () => {
        expect(await foxbit.handleOrderHistoryResponse({
          orderHistory: {},
        })).toEqual({
          orderHistory: {},
        });
      });
    });
  });
});
