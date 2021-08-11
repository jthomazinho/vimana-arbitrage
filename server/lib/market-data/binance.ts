import WebSocket from 'ws';

import * as md from '../market-data';

import rollbar from '../report-rollbar';

const MARKET_DEPTH = 50;
const WS_URL = process.env.BITSTAMP_WS_URL || 'wss://ws.bistamp.net';

type Qty = number;
type Price = number;

interface BitstampBookData {
  data: {
    bids: Array<[string /* Price */, string /* Qty */]>;
    asks: Array<[string /* Price */, string /* Qty */]>;
  };
}

// Bitstamp sends tuples (Price, Quantity), but Depth uses (Quantity, Price)
function swapPriceQty(listOfTuples: Array<[string, string]>): Array<[Qty, Price]> {
  return listOfTuples.map((tuple) => [parseFloat(tuple[1]), parseFloat(tuple[0])]);
}

function parse(payload: BitstampBookData, instrument: md.Instrument): md.Depth {
  const { bids, asks } = payload.data;

  return {
    ...instrument,
    bids: swapPriceQty(bids.slice(0, MARKET_DEPTH)),
    asks: swapPriceQty(asks.slice(0, MARKET_DEPTH)),
  };
}

function subscribeBook(instrument: md.Instrument, subscriber: md.Subscriber): void {
  const subscribeMsg = {
    event: 'bts:subscribe',
    data: {
      channel: `order_book_${instrument.symbol}`,
    },
  };

  const ws = new WebSocket(WS_URL);

  ws.on('open', () => {
    ws.send(JSON.stringify(subscribeMsg));
    subscriber.onStatus({ available: true });
  });

  ws.on('message', (evt) => {
    const response = JSON.parse(evt.toString());
    switch (response.event) {
      case 'data': {
        const depth = parse(response, instrument);
        subscriber.onDepth(depth);
        break;
      }
      case 'bts:request_reconnect': {
        subscriber.onStatus({
          available: false,
          message: 'Bitstamp request_reconnect event',
        });
        subscribeBook(instrument, subscriber);
        break;
      }
      default: {
        // The specification only declares 'data' and 'bts:request_reconnect'
        // it is safe to ignore other events.
        break;
      }
    }
  });

  // When error happens, try reconnecting
  ws.on('error', (err) => {
    const message = `Bitstamp MD websocket error: "${err.message}"`;
    subscriber.onStatus({
      available: false,
      message,
    });
    // Reconnect only on the close event!
    rollbar.error(message, err);
  });

  // When disconnected, reconnect
  ws.on('close', () => {
    subscriber.onStatus({
      available: false,
      message: 'Bitstamp MD websocket closed',
    });
    setTimeout(() => {
      subscribeBook(instrument, subscriber);
    }, 5000);
  });
}

export {
  // eslint-disable-next-line import/prefer-default-export
  subscribeBook,
};
