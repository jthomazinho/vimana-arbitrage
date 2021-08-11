import WebSocket from 'ws';

import { subscribeBook } from './bitstamp';
import factories from '../../spec/factories';
import MockedWebSocket from '../../spec/mocks/mocked-web-socket';
import bitstampOrderBook from '../../spec/fixtures/bitstamp-order-book-btcusd.json';

jest.mock('ws');

const MockWebSocket = WebSocket as jest.MockedClass<typeof WebSocket>;

function getWsMock(): MockedWebSocket {
  return new MockedWebSocket(MockWebSocket.mock.instances[0]);
}

describe('subscribeBook', () => {
  it('connects to Bitstamp`s websocket server', () => {
    subscribeBook(factories.instrument.build(), factories.subscriber.build());

    expect(MockWebSocket).toHaveBeenCalledWith(process.env.BITSTAMP_WS_URL);
  });

  describe('on open', () => {
    it('sends a subscription message', () => {
      const symbol = 'btctest';
      const instrument = factories.instrument.build({ symbol });
      subscribeBook(instrument, factories.subscriber.build());

      const mockWs = getWsMock();
      const subscription = {
        event: 'bts:subscribe',
        data: {
          channel: `order_book_${symbol}`,
        },
      };
      mockWs.triggerListener('open');

      expect(mockWs.mock.send).toHaveBeenCalledWith(JSON.stringify(subscription));
    });

    it('notifies subscriber when it is available', () => {
      const callback = jest.fn();
      const subscriber = factories.subscriber.build({
        onStatus: callback,
      });
      subscribeBook(factories.instrument.build(), subscriber);

      const mockWs = getWsMock();
      mockWs.triggerListener('open');

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ available: true }),
      );
    });
  });

  describe('on message', () => {
    it('notifies subscriber', () => {
      const callback = jest.fn();
      const subscriber = factories.subscriber.build({
        onDepth: callback,
      });
      subscribeBook(factories.instrument.build(), subscriber);

      const mockWs = getWsMock();
      mockWs.triggerListener('message', JSON.stringify(bitstampOrderBook));

      expect(callback).toHaveBeenCalled();
    });

    it('converts the Bitstamp event to the right format', () => {
      const callback = jest.fn();
      const subscriber = factories.subscriber.build({
        onDepth: callback,
      });
      subscribeBook(factories.instrument.build(), subscriber);

      const mockWs = getWsMock();
      const book = {
        ...bitstampOrderBook,
        data: {
          bids: [['5000', '0.1']], // (price, qty) as strings
          asks: [['6000', '0.5']],
        },
      };
      mockWs.triggerListener('message', JSON.stringify(book));

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          bids: expect.arrayContaining([[0.1, 5000]]), // (qty, price) as numbers
          asks: expect.arrayContaining([[0.5, 6000]]),
        }),
      );
    });

    it('accepts an empty book', () => {
      const callback = jest.fn();
      const subscriber = factories.subscriber.build({
        onDepth: callback,
      });
      subscribeBook(factories.instrument.build(), subscriber);

      const mockWs = getWsMock();
      const book = {
        ...bitstampOrderBook,
        data: {
          bids: [],
          asks: [],
        },
      };
      mockWs.triggerListener('message', JSON.stringify(book));

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          bids: [],
          asks: [],
        }),
      );
    });

    describe('event bts:request_reconnect', () => {
      it('reinitializes the connection', () => {
        subscribeBook(factories.instrument.build(), factories.subscriber.build());

        const mockWs = getWsMock();
        const reconnect = {
          event: 'bts:request_reconnect',
        };
        mockWs.triggerListener('message', JSON.stringify(reconnect));

        expect(MockWebSocket.mock.instances).toHaveLength(2);
      });

      it('notifies suscriber it is unavailable', () => {
        const callback = jest.fn();
        const subscriber = factories.subscriber.build({
          onStatus: callback,
        });
        subscribeBook(factories.instrument.build(), subscriber);

        const mockWs = getWsMock();
        const reconnect = {
          event: 'bts:request_reconnect',
        };
        mockWs.triggerListener('message', JSON.stringify(reconnect));

        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({ available: false }),
        );
      });
    });

    describe('unknown event', () => {
      it('ignores the event', () => {
        const callback = jest.fn();
        const subscriber = factories.subscriber.build({
          onStatus: callback,
          onDepth: callback,
        });
        subscribeBook(factories.instrument.build(), subscriber);

        const mockWs = getWsMock();
        const unknown = {
          event: 'unknown',
        };
        mockWs.triggerListener('message', JSON.stringify(unknown));

        expect(callback).not.toHaveBeenCalled();
      });
    });
  });

  describe('on close', () => {
    it('reinitializes the connection', () => {
      jest.useFakeTimers();
      subscribeBook(factories.instrument.build(), factories.subscriber.build());

      const mockWs = getWsMock();
      mockWs.triggerListener('close');
      jest.runAllTimers();

      expect(MockWebSocket.mock.instances).toHaveLength(2);
    });

    it('notifies subscriber it is unavailable', () => {
      const callback = jest.fn();
      const subscriber = factories.subscriber.build({
        onStatus: callback,
      });
      subscribeBook(factories.instrument.build(), subscriber);

      const mockWs = getWsMock();
      mockWs.triggerListener('close');

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ available: false }),
      );
    });
  });

  describe('on error', () => {
    it('notifies subscriber it is unavailable', () => {
      const callback = jest.fn();
      const subscriber = factories.subscriber.build({
        onStatus: callback,
      });
      subscribeBook(factories.instrument.build(), subscriber);

      const mockWs = getWsMock();
      mockWs.triggerListener('error', new Error('Error'));

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ available: false }),
      );
    });
  });
});
