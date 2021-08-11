import { RBTree } from 'bintrees';
import WebSocket from 'ws';

import {
  subscribeBook,
  handleBookSnapshot,
  setGetL2SnapshotParams,
  handleDepth,
  Book,
} from './foxbit';

import factories from '../../spec/factories';
import MockedWebSocket from '../../spec/mocks/mocked-web-socket';
import foxbitOrderBook from '../../spec/fixtures/foxbit-order-book-btcbrl.json';
import foxbitOrderBookSnapshot from '../../spec/fixtures/foxbit-order-book-snapshot-btcbrl.json';

jest.mock('ws');

const MockWebSocket = WebSocket as jest.MockedClass<typeof WebSocket>;

function getWsMock(): MockedWebSocket {
  return new MockedWebSocket(MockWebSocket.mock.instances[0]);
}

describe('subscribeBook', () => {
  it('connects to Foxbit`s websocket server', () => {
    jest.useFakeTimers();
    subscribeBook(factories.instrument.build(), factories.subscriber.build());
    expect(MockWebSocket).toHaveBeenCalledWith(process.env.FOXBIT_WS_URL);
    jest.clearAllTimers();
  });

  describe('on open', () => {
    it('sends a subscription message', () => {
      const symbol = 'btctest';
      const instrument = factories.instrument.build({ symbol });

      jest.useFakeTimers();
      subscribeBook(instrument, factories.subscriber.build());

      const mockWs = getWsMock();
      const subscription = {
        m: 0,
        i: 0,
        n: 'SubscribeLevel2',
        o: JSON.stringify({
          OMSId: 1,
          InstrumentId: 1,
          Depth: 5,
        }),
      };
      mockWs.triggerListener('open');

      expect(mockWs.mock.send).toHaveBeenCalledWith(JSON.stringify(subscription));
      jest.clearAllTimers();
    });

    it('notifies subscriber when it is available', () => {
      const callback = jest.fn();
      const subscriber = factories.subscriber.build({
        onStatus: callback,
      });
      jest.useFakeTimers();
      subscribeBook(factories.instrument.build(), subscriber);

      const mockWs = getWsMock();
      mockWs.triggerListener('open');

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ available: true }),
      );
      jest.clearAllTimers();
    });
  });

  describe('on message', () => {
    it('notifies subscriber', () => {
      const callback = jest.fn();
      const subscriber = factories.subscriber.build({
        onDepth: callback,
      });
      jest.useFakeTimers();
      subscribeBook(factories.instrument.build(), subscriber);

      const mockWs = getWsMock();
      mockWs.triggerListener('message', JSON.stringify(foxbitOrderBook));

      expect(callback).toHaveBeenCalled();
      jest.clearAllTimers();
    });

    it('converts the Foxbit event to the right format', () => {
      const callback = jest.fn();
      const subscriber = factories.subscriber.build({
        onDepth: callback,
      });
      jest.useFakeTimers();
      subscribeBook(factories.instrument.build(), subscriber);

      const mockWs = getWsMock();
      const book = foxbitOrderBook;
      mockWs.triggerListener('message', JSON.stringify(book));

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          bids: expect.arrayContaining([[0.17758915, 34900]]), // (qty, price) as numbers
          asks: expect.arrayContaining([[0.91188469, 35000]]),
        }),
      );
      jest.clearAllTimers();
    });

    it('accepts an empty book', () => {
      const callback = jest.fn();
      const subscriber = factories.subscriber.build({
        onDepth: callback,
      });
      jest.useFakeTimers();
      subscribeBook(factories.instrument.build(), subscriber);

      const mockWs = getWsMock();
      const book = {
        ...foxbitOrderBook,
        o: '[]',
      };
      mockWs.triggerListener('message', JSON.stringify(book));

      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          bids: [],
          asks: [],
        }),
      );
      jest.clearAllTimers();
    });

    it('on receive book snapshot different from incremental 3 times', () => {
      const callback = jest.fn();
      const subscriber = factories.subscriber.build({
        onDepth: callback,
      });

      jest.useFakeTimers();
      subscribeBook(factories.instrument.build(), subscriber);

      const mockWs = getWsMock();
      const bookSnapshot = {
        ...foxbitOrderBookSnapshot,
        o: JSON.parse(foxbitOrderBookSnapshot.o),
      };
      handleBookSnapshot(mockWs.mock, bookSnapshot, factories.instrument.build());
      handleBookSnapshot(mockWs.mock, bookSnapshot, factories.instrument.build());
      expect(handleBookSnapshot(mockWs.mock, bookSnapshot, factories.instrument.build())).toEqual(
        expect.objectContaining({ message: 'Foxbit MD found difference between book snapshot and subscribed channel' }),
      );
      jest.clearAllTimers();
    });

    describe('unknown event', () => {
      it('ignores the event', () => {
        const callback = jest.fn();
        const subscriber = factories.subscriber.build({
          onStatus: callback,
          onDepth: callback,
        });
        jest.useFakeTimers();
        subscribeBook(factories.instrument.build(), subscriber);

        const mockWs = getWsMock();
        const unknown = {
          m: 1,
          i: 64,
          n: 'unknown',
          o: '{}',
        };
        mockWs.triggerListener('message', JSON.stringify(unknown));

        expect(callback).not.toHaveBeenCalled();
        jest.clearAllTimers();
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
        jest.clearAllTimers();
      });

      it('notifies subscriber it is unavailable', () => {
        const callback = jest.fn();
        const subscriber = factories.subscriber.build({
          onStatus: callback,
        });
        jest.useFakeTimers();
        subscribeBook(factories.instrument.build(), subscriber);

        const mockWs = getWsMock();
        mockWs.triggerListener('close');

        setTimeout(() => {
          expect(callback).toHaveBeenCalledWith(
            expect.objectContaining({ available: false }),
          );
        }, 5000);
        jest.clearAllTimers();
      });
    });

    describe('on error', () => {
      it('notifies subscriber it is unavailable', () => {
        const callback = jest.fn();
        const subscriber = factories.subscriber.build({
          onStatus: callback,
        });
        jest.useFakeTimers();
        subscribeBook(factories.instrument.build(), subscriber);

        const mockWs = getWsMock();
        mockWs.triggerListener('error', new Error('Error'));

        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({ available: false }),
        );
        jest.clearAllTimers();
      });
    });
  });

  describe('book update', () => {
    // all specs begin with this book!
    // Buy       Ask
    // Qty Price | Price Qty
    // --- ----- + ----- ---
    // 0.1 10.20 | 11.10 0.1
    // 0.2 10.10 | 11.20 0.2
    const bookSetup = {
      m: 1,
      i: 0,
      n: 'SubscribeLevel2',
      o: '[[1,1,1,0,10,1,10.20,1,0.1,0],'
        + '[2,1,1,0,10,1,10.10,1,0.2,0],'
        + '[3,1,1,0,10,1,11.10,1,0.1,1],'
        + '[4,1,1,0,10,1,11.20,1,0.2,1]]',
    };

    function subscribe(): jest.Mock {
      const callback = jest.fn();
      const subscriber = factories.subscriber.build({
        onDepth: callback,
      });
      jest.useFakeTimers();
      subscribeBook(factories.instrument.build(), subscriber);

      jest.clearAllTimers();
      return callback;
    }

    it('initializes the book from the subscription response', () => {
      const callback = subscribe();

      const mockWs = getWsMock();
      mockWs.triggerListener('message', JSON.stringify(bookSetup));

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        asks: [
          [0.1, 11.1],
          [0.2, 11.2],
        ],
        bids: [
          [0.1, 10.2],
          [0.2, 10.1],
        ],
      }));
    });

    it('adds an entry to the books (sell side)', () => {
      const callback = subscribe();
      const mockWs = getWsMock();
      mockWs.triggerListener('message', JSON.stringify(bookSetup));
      callback.mockClear();

      const update = {
        o: '[[5,1,2,0,10,1,11.25,1,0.25,1]]', m: 3, i: 2, n: 'Level2UpdateEvent',
      };
      mockWs.triggerListener('message', JSON.stringify(update));

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        asks: [
          [0.1, 11.1],
          [0.2, 11.2],
          [0.25, 11.25],
        ],
        bids: [
          [0.1, 10.2],
          [0.2, 10.1],
        ],
      }));
    });

    it('adds an entry to the books (buy side)', () => {
      const callback = subscribe();
      const mockWs = getWsMock();
      mockWs.triggerListener('message', JSON.stringify(bookSetup));
      callback.mockClear();

      const update = {
        o: '[[5,1,2,0,10,1,10.15,1,0.15,0]]', m: 3, i: 2, n: 'Level2UpdateEvent',
      };
      mockWs.triggerListener('message', JSON.stringify(update));

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        asks: [
          [0.1, 11.1],
          [0.2, 11.2],
        ],
        bids: [
          [0.1, 10.2],
          [0.15, 10.15],
          [0.2, 10.1],
        ],
      }));
    });

    it('updates an entry with ActionType add (sell side)', () => {
      const callback = subscribe();
      const mockWs = getWsMock();
      mockWs.triggerListener('message', JSON.stringify(bookSetup));
      callback.mockClear();

      const update = {
        o: '[[5,1,2,0,10,1,11.1,1,0.15,1]]', m: 3, i: 2, n: 'Level2UpdateEvent',
      };
      mockWs.triggerListener('message', JSON.stringify(update));

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        asks: [
          [0.15, 11.1],
          [0.2, 11.2],
        ],
        bids: [
          [0.1, 10.2],
          [0.2, 10.1],
        ],
      }));
    });

    it('updates an entry with ActionType add (buy side)', () => {
      const callback = subscribe();
      const mockWs = getWsMock();
      mockWs.triggerListener('message', JSON.stringify(bookSetup));
      callback.mockClear();

      const update = {
        o: '[[5,1,2,0,10,1,10.1,1,0.15,0]]', m: 3, i: 2, n: 'Level2UpdateEvent',
      };
      mockWs.triggerListener('message', JSON.stringify(update));

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        asks: [
          [0.1, 11.1],
          [0.2, 11.2],
        ],
        bids: [
          [0.1, 10.2],
          [0.15, 10.1],
        ],
      }));
    });

    it('updates an entry (sell side)', () => {
      const callback = subscribe();
      const mockWs = getWsMock();
      mockWs.triggerListener('message', JSON.stringify(bookSetup));
      callback.mockClear();

      const update = {
        o: '[[5,1,2,1,10,1,11.1,1,0.15,1]]', m: 3, i: 2, n: 'Level2UpdateEvent',
      };
      mockWs.triggerListener('message', JSON.stringify(update));

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        asks: [
          [0.15, 11.1],
          [0.2, 11.2],
        ],
        bids: [
          [0.1, 10.2],
          [0.2, 10.1],
        ],
      }));
    });

    it('updates an entry (buy side)', () => {
      const callback = subscribe();
      const mockWs = getWsMock();
      mockWs.triggerListener('message', JSON.stringify(bookSetup));
      callback.mockClear();

      const update = {
        o: '[[5,1,2,1,10,1,10.1,1,0.15,0]]', m: 3, i: 2, n: 'Level2UpdateEvent',
      };
      mockWs.triggerListener('message', JSON.stringify(update));

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        asks: [
          [0.1, 11.1],
          [0.2, 11.2],
        ],
        bids: [
          [0.1, 10.2],
          [0.15, 10.1],
        ],
      }));
    });

    it('removes an entry (sell side)', () => {
      const callback = subscribe();
      const mockWs = getWsMock();
      mockWs.triggerListener('message', JSON.stringify(bookSetup));
      callback.mockClear();

      const update = {
        o: '[[5,1,2,2,10,1,11.2,1,0,1]]', m: 3, i: 2, n: 'Level2UpdateEvent',
      };
      mockWs.triggerListener('message', JSON.stringify(update));

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        asks: [
          [0.1, 11.1],
        ],
        bids: [
          [0.1, 10.2],
          [0.2, 10.1],
        ],
      }));
    });

    it('removes an entry (buy side)', () => {
      const callback = subscribe();
      const mockWs = getWsMock();
      mockWs.triggerListener('message', JSON.stringify(bookSetup));
      callback.mockClear();

      const update = {
        o: '[[5,1,2,2,10,1,10.2,1,0,0]]', m: 3, i: 2, n: 'Level2UpdateEvent',
      };
      mockWs.triggerListener('message', JSON.stringify(update));

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        asks: [
          [0.1, 11.1],
          [0.2, 11.2],
        ],
        bids: [
          [0.2, 10.1],
        ],
      }));
    });

    it('handles many updates atomically', () => {
      const callback = subscribe();
      const mockWs = getWsMock();
      mockWs.triggerListener('message', JSON.stringify(bookSetup));
      callback.mockClear();

      const update = {
        m: 3,
        i: 2,
        n: 'Level2UpdateEvent',
        o: '[[5,1,2,2,10,1,10.2,1,0,0],' // remove 10.2
          + '[6,1,2,0,10,1,10.15,1,0.15,0],' // add 10.15
          + '[7,1,2,1,10,1,11.1,1,0.15,1],' // update 11.1
          + '[8,1,2,1,10,1,11.2,1,0.25,1]]', // update 11.2
      };
      mockWs.triggerListener('message', JSON.stringify(update));

      expect(callback).toHaveBeenCalledWith(expect.objectContaining({
        asks: [
          [0.15, 11.1],
          [0.25, 11.2],
        ],
        bids: [
          [0.15, 10.15],
          [0.2, 10.1],
        ],
      }));
    });
  });

  describe('.setGetL2SnapshotParams', () => {
    it('Should return GetL2SnapshotParams', () => {
      expect(setGetL2SnapshotParams()).toEqual(
        JSON.stringify(
          {
            m: 0,
            i: 0,
            n: 'GetL2Snapshot',
            o: JSON.stringify(
              {
                OMSId: 1,
                InstrumentId: 1,
                Depth: 5,
              },
            ),
          },
        ),
      );
    });
  });

  describe('.handleDepth', () => {
    it('Should return md.Depth object', () => {
      const foxbitBook: Book = {
        bids: new RBTree<[number, number]>((a, b) => b[1] - a[1]),
        asks: new RBTree<[number, number]>((a, b) => a[1] - b[1]),
      };

      expect(
        handleDepth(
          { o: [[7091, 0, 1603977494769, 0, 76699.9189, 0, 76250.0399, 1, 0.30840167, 0]] },
          factories.instrument.build(),
          foxbitBook,
        ),
      ).toEqual(
        {
          asks: [],
          bids: [[0.30840167, 76250.0399]],
          exchange: 'Fakexbit',
          symbol: 'btcbrl',
        },
      );
    });
  });
});
