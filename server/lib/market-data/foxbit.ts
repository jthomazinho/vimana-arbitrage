import { RBTree } from 'bintrees';
import WebSocket from 'ws';

import { isEqual } from 'lodash';

import datadog from '../report-datadog';

import rollbar from '../report-rollbar';

import * as md from '../market-data';

const MARKET_DEPTH = 5;
const WS_URL = process.env.FOXBIT_WS_URL || 'wss://apifoxbitprodlb.alphapoint.com/WSGateway/';
const wsSessionTTL = 15000;

let lastTS: number;

type Qty = number;
type Price = number;
type BookSide = RBTree<[Qty, Price]>;
export type Book = {
  bids: BookSide;
  asks: BookSide;
}

let bookSnapshotInterval: NodeJS.Timeout;
let bookMissmatches = 0;
let lastDepth: {
  asks: Array<md.DepthLevel>;
  bids: Array<md.DepthLevel>;
};

enum Action {
  Add = 0,
  Update = 1,
  Remove = 2,
}

enum Side {
  Buy = 0,
  Sell = 1,
}

datadog.init();

type UpdatePayload = [
  number, // MDUpdateId
  number, // noAccounts
  number, // Timestamp
  Action,
  number, // LastTradePrice
  number, // noOrders
  Price,
  number, // ProductPairCode
  Qty,
  Side,
];

let interval: NodeJS.Timeout;

function collect(tree: BookSide): Array<readonly [number, number]> {
  const out = [];
  const iter = tree.iterator();
  let i = 0;
  while (i < MARKET_DEPTH) {
    const item = iter.next();
    if (!item) {
      break;
    }

    out.push(item);
    i += 1;
  }

  return out;
}

function updatePriceLevel(book: BookSide, price: number, quantity: number): void {
  const level = book.find([0, price]);
  if (level) {
    level[0] = quantity;
  }
}

function update(payload: UpdatePayload, book: BookSide): void {
  const price = payload[6];
  const quantity = payload[8];
  const actionType = payload[3];
  switch (actionType) {
    case Action.Add: {
      const ok = book.insert([quantity, price]);
      if (!ok) {
        updatePriceLevel(book, price, quantity);
      }
      break;
    }
    case Action.Update: {
      updatePriceLevel(book, price, quantity);
      break;
    }
    case Action.Remove: {
      book.remove([0, price]);
      break;
    }
    default:
      break;
  }
}

function setGetL2SnapshotParams() {
  return JSON.stringify({
    m: 0,
    i: 0,
    n: 'GetL2Snapshot',
    o: JSON.stringify({
      OMSId: 1,
      InstrumentId: 1,
      Depth: MARKET_DEPTH,
    }),
  });
}

function getL2Snapshot(ws: WebSocket) {
  bookSnapshotInterval = setInterval(() => {
    ws.send(setGetL2SnapshotParams());
  }, 15000);
}

function handleDepth(payload: { o: UpdatePayload[] }, instrument: md.Instrument, book: Book): md.Depth {
  payload.o.forEach((updateBook) => {
    const side = updateBook[9];
    switch (side) {
      case Side.Buy: {
        update(updateBook, book.bids);
        break;
      }
      case Side.Sell: {
        update(updateBook, book.asks);
        break;
      }
      default:
        break;
    }
  });

  return {
    ...instrument,
    bids: collect(book.bids),
    asks: collect(book.asks),
  };
}

function handleBookSnapshot(ws: WebSocket, response: any, instrument: md.Instrument) {
  const foxbitBook: Book = {
    bids: new RBTree<[Qty, Price]>((a, b) => b[1] - a[1]),
    asks: new RBTree<[Qty, Price]>((a, b) => a[1] - b[1]),
  };
  if (response.n === 'GetL2Snapshot') {
    if (!response.o.errorcode) {
      const depth = handleDepth(response, instrument, foxbitBook);
      if (!isEqual(depth.asks, lastDepth.asks) || !isEqual(depth.bids, lastDepth.bids)) {
        bookMissmatches += 1;
      }
      if (bookMissmatches === 3) {
        bookMissmatches = 0;
        clearInterval(bookSnapshotInterval);
        const bookMissmatchMessage = 'Foxbit MD found difference between book snapshot and subscribed channel';
        datadog.increment('md.foxbit', 1, ['bookDesync']);
        ws.close();
        return { message: bookMissmatchMessage };
      }
    }
  }
  return {};
}

function keepSessionAlive(ws: WebSocket) {
  lastTS = Date.now();
  interval = setInterval(() => {
    if (Date.now() > (lastTS + (wsSessionTTL * 2))) {
      datadog.increment('md.foxbit', 1, ['sessionTimeout']);
      ws.close();
      clearInterval(interval);
    } else {
      ws.send(JSON.stringify({
        m: 0,
        i: 0,
        n: 'ping',
        o: '{}',
      }));
    }
  }, wsSessionTTL);
}

function subscribeBook(instrument: md.Instrument, subscriber: md.Subscriber): void {
  const foxbitBook: Book = {
    bids: new RBTree<[Qty, Price]>((a, b) => b[1] - a[1]),
    asks: new RBTree<[Qty, Price]>((a, b) => a[1] - b[1]),
  };

  const ws = new WebSocket(WS_URL);

  const subscribeMsg = {
    m: 0,
    i: 0,
    n: 'SubscribeLevel2',
    o: JSON.stringify({
      OMSId: 1,
      InstrumentId: 1,
      Depth: MARKET_DEPTH,
    }),
  };

  ws.on('open', () => {
    datadog.increment('md.foxbit', 1, ['websocket.open']);
    ws.send(JSON.stringify(subscribeMsg));
    subscriber.onStatus({ available: true });
    keepSessionAlive(ws);
  });

  ws.on('message', (evt) => {
    const response = JSON.parse(evt.toString());
    response.o = JSON.parse(response.o);
    if (response.n === 'SubscribeLevel2' || response.n === 'Level2UpdateEvent') {
      if (!response.o.errorcode) {
        const depth = handleDepth(response, instrument, foxbitBook);
        //console.log(`message: ${JSON.stringify(depth)}`);
        lastDepth = {
          asks: depth.asks,
          bids: depth.bids,
        };
        if (response.n === 'SubscribeLevel2') {
          getL2Snapshot(ws);
        }
        subscriber.onDepth(depth);
      }
    }

    handleBookSnapshot(ws, response, instrument);

    if (response.n === 'ping') {
      lastTS = Date.now();
    }
  });

  // When error happens, try reconnecting
  ws.on('error', (err) => {
    const message = `Foxbit MD websocket error: "${err.message}"`;
    subscriber.onStatus({
      available: false,
      message,
    });
    datadog.increment('md.foxbit', 1, ['websocket.error']);
    // Reconnect only on the close event!
    rollbar.error(message, err);
  });

  // When disconnected, reconnect
  ws.on('close', () => {
    datadog.increment('md.foxbit', 1, ['websocket.close']);
    setTimeout(() => {
      subscribeBook(instrument, subscriber);
    }, 5000);
  });

  setTimeout(() => {
    if (ws.readyState > 1) {
      subscriber.onStatus({
        available: false,
        message: 'Foxbit MD websocket failed to open',
      });
    }
  }, 5000);
}

export {
  // eslint-disable-next-line import/prefer-default-export
  subscribeBook,
  handleBookSnapshot,
  setGetL2SnapshotParams,
  handleDepth,
};
