import { Factory } from 'fishery';
import { ExecutionContext } from '../../../app/algos/btc-usd-arbitrage';
import instrument from '../md/instrument';

export default Factory.define<ExecutionContext>(() => ({
  ...instrument.build(),
  quantityLong: 0.03136437,
  quantityShort: 0.03136437,
  shortBestOffer: [0.01015847, 49220.01],
  longBestOffer: [0.00773589, 9500.38],
  pegPrice: 5.7603,
  marketSpread: -19.0,
  fees: {
    short: {
      'trade-taker': {
        id: 4,
        serviceProvider: 'foxbit',
        service: 'trade-taker',
        fixed: 0,
        rate: 0.001,
        createdAt: '2020-07-22T16: 35: 54.000Z',
        updatedAt: '2020-07-22T16: 37: 56.000Z',
      },
      'withdraw-brl': {
        id: 2,
        serviceProvider: 'foxbit',
        service: 'withdraw-brl',
        fixed: 0.1,
        rate: 0.001,
        createdAt: '2020-07-22T16: 35: 54.000Z',
        updatedAt: '2020-07-22T16: 37: 56.000Z',
      },
    },
    long: {
      'trade-taker': {
        id: 7,
        serviceProvider: 'bitstamp',
        service: 'trade-taker',
        fixed: 0,
        rate: 0.001,
        createdAt: '2020-07-22T16: 35: 54.000Z',
        updatedAt: '2020-07-22T16: 37: 56.000Z',
      },
      'withdraw-btc': {
        id: 6,
        serviceProvider: 'bitstamp',
        service: 'withdraw-btc',
        fixed: 0.1,
        rate: 0.001,
        createdAt: '2020-07-22T16: 35: 54.000Z',
        updatedAt: '2020-07-22T16: 37: 56.000Z',
      },
    },
    peg: {
      exchange: {
        id: 8,
        serviceProvider: 'plural',
        service: 'exchange',
        fixed: 0,
        rate: 0.001,
        createdAt: '2020-07-22T16: 35: 54.000Z',
        updatedAt: '2020-07-22T16: 38: 02.000Z',
      },
      iof: {
        id: 9,
        serviceProvider: 'plural',
        service: 'iof',
        fixed: 0,
        rate: 0.001,
        createdAt: '2020-07-22T16: 35: 54.000Z',
        updatedAt: '2020-07-22T16: 38: 02.000Z',
      },
    },
  },
  parameters: {
    totalQuantity: 1,
    maxOrderQuantity: 0.1,
    targetSpread: -0.19,
    crowdFactor: 1,
    manualPegQuote: 0,
  },
  shortBook: {
    exchange: 'foxbit',
    symbol: 'btcbrl',
    bids: [[0.01015847, 49220.01], [0.01422186, 49220], [0.04202966, 49215], [0.1016, 49210], [1, 49200]],
    asks: [[0.4035919, 49560], [0.00508989, 49600], [0.23991835, 49653], [0.4943101, 49655], [0.02004177, 49690]],
  },
  longBook: {
    exchange: 'bitstamp',
    symbol: 'btcusd',
    bids: [[4.4399, 9497.94], [1.873568, 9497.93], [1.52705243, 9496.92], [0.54962191, 9496.89], [0.499424, 9496.88]],
    asks: [[0.00773589, 9500.38], [0.77039897, 9501.62], [3.65, 9501.63], [3.65, 9502.8], [0.01590989, 9504.71]],
  },
}));
