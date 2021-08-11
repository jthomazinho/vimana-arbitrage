import { v4 as uuidv4 } from 'uuid';
import { AxiosResponse } from 'axios';
import * as oms from '../oms';
import factories from '../../spec/factories';
import Bitstamp, { Transaction } from './bitstamp';

jest.mock('uuid');
const mockUUID = uuidv4 as jest.MockedFunction<typeof uuidv4>;

const bitstamp: Bitstamp = new Bitstamp();

describe('bitstamp oms', () => {
  let order: oms.AcceptedOrder = {
    id: 11,
    algoInstanceId: 14,
    exchange: 'bitstamp',
    symbol: 'btcusd',
    quantity: 0.02351574,
    side: 'B',
    type: 'market',
    arbitrageExecutionId: '6',
    price: 5000,
    exchangeOrderId: '1598533567633',
  };
  const transaction: Array<Transaction> = [factories.transaction.build()];
  const rawtrade: Array<oms.RawExchangeTradeParams> = [factories.rawtrade.build()];

  describe('Extracting trades from transactions', () => {
    afterEach(() => {
      mockUUID.mockReset();
    });

    describe('Extracting trades with valid transaction array', () => {
      it('Should extract valid trade params object', () => {
        transaction[0].fee = '0';
        transaction[0].price = '0.1955';
        transaction[0].btc = '0.015';
        expect(Bitstamp.extractTrades(order, transaction)).toEqual(rawtrade);
      });
    });

    describe('Extracting trades with invalid transactions', () => {
      it('Should not extract a valid trade params object', () => {
        transaction[0].fee = '0';
        transaction[0].price = '0';
        transaction[0].btc = '0';
        expect(Bitstamp.extractTrades(order, transaction)).not.toEqual(rawtrade);
      });
    });

    describe('Extracting trades with invalid order params', () => {
      it('Should not extract a valid trade params object', () => {
        order = {
          ...factories.order.build(),
          exchangeOrderId: '',
        };
        expect(Bitstamp.extractTrades(order, transaction)).not.toEqual(rawtrade);
      });
    });
  });

  describe('Handle marketorder response', () => {
    const orderParams: oms.OrderParams = factories.orderparams.build();

    describe('Handling response with successfull market order placed', () => {
      it('Should return valid fullfilled order', async () => {
        const response: AxiosResponse = {
          data: { price: 5000, id: 0 },
          status: 0,
          statusText: 'open',
          headers: {},
          config: {},
        };
        const randomValue = 'random-value';
        mockUUID.mockReturnValue(randomValue);
        const receivingOrder = factories.order.build();
        receivingOrder.algoInstanceId = 15;
        receivingOrder.arbitrageExecutionId = '7';
        receivingOrder.id = 0;
        receivingOrder.price = 5000;
        receivingOrder.quantity = 0.0073;

        expect(await Bitstamp.handleMarketOrderResponse(response, orderParams, 0)).toEqual(
          expect.objectContaining({
            algoInstanceId: receivingOrder.algoInstanceId,
            arbitrageExecutionId: receivingOrder.arbitrageExecutionId,
            exchange: receivingOrder.exchange,
            price: receivingOrder.price,
            quantity: receivingOrder.quantity,
          }),
        );
      });
    });

    describe('Handling response with error', () => {
      it('Should throw an error', async () => {
        const response: AxiosResponse = {
          data: { status: 'error', reason: 'unknown' },
          status: 0,
          statusText: 'open',
          headers: {},
          config: {},
        };

        await Bitstamp.handleMarketOrderResponse(response, orderParams, 0).catch((err) => {
          expect(err).toEqual(
            expect.objectContaining({
              name: 'Error',
              message: response.data.reason,
            }),
          );
        });
      });
    });
  });

  describe('Handle statusorder response', () => {
    const broadcast = jest.fn();

    bitstamp.init(broadcast);

    describe('Handling response with open order status', () => {
      it('Should return OrderStatus with status open', async () => {
        const response: AxiosResponse = {
          data: { data: { price: 5000, id: 0 } },
          status: 0,
          statusText: 'open',
          headers: {},
          config: {},
        };
        expect(await bitstamp.handleOrderStatusResponse(response, order)).toEqual(
          expect.objectContaining({
            status: 'open',
          }),
        );
      });
    });

    describe('Handling response with finished order status', () => {
      it('Should return OrderStatus with status filled', async () => {
        const response = {
          data: {
            status: 'Finished',
            transactions: [factories.transaction.build()],
          },
          status: 0,
          statusText: '',
          headers: {},
          config: {},
        };

        expect(await bitstamp.handleOrderStatusResponse(response, order)).toEqual(
          expect.objectContaining({
            status: 'filled',
          }),
        );
      });
    });

    describe('Handling response with order error', () => {
      it('Should throw an error', async () => {
        const response: AxiosResponse = {
          data: { data: { status: 'error', reason: 'unknown' } },
          status: 0,
          statusText: 'open',
          headers: {},
          config: {},
        };

        await bitstamp.handleOrderStatusResponse(response, order).catch((err) => {
          expect(err).toEqual(response.data.reason);
        });
      });
    });
  });
});
