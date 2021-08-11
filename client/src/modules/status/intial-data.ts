import { Data } from './interfaces';

const initialData: Data = {
  foxbit: {
    status: true,
    date: '2020-03-26T17:19:25.000Z',
    price: {
      ask: '11.5623',
      bid: '421.5623',
    },
  },

  bitstamp: {
    status: false,
    date: '2020-03-26T17:19:25.000Z',
    price: {
      ask: '74.5623',
      bid: '41.5623',
    },
  },

  plural: {
    status: true,
    date: '2020-03-26T17:19:25.000Z',
    quote: '64.5623',
  },
};

export default initialData;
