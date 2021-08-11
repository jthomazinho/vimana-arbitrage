import axios from 'axios';

import * as md from '../market-data';
import { Logger } from '..';

const baseURL = process.env.PLURAL_REST_URL || '';
const pluralPath = process.env.PLURAL_REST_PATH || '/api/FXTrading/GetLastPrice';

interface Quote {
  Currency: string;
  LastPrice: number;
}

function buildBody(): object {
  return {
    User: process.env.PLURAL_USER,
    Password: process.env.PLURAL_PASS,
  };
}

function handleGetLastPrice(response: any, instrument: md.Instrument) {
  const { data } = response;
  const usdQuote = data.find((quote: Quote) => quote.Currency === instrument.symbol);
  if (usdQuote) {
    return usdQuote.LastPrice;
  }
  return 0;
}

function getLastPrice(instrument: md.Instrument, subscriber: md.Subscriber, logger: Logger): void {
  axios
    .post<Quote[]>(pluralPath, buildBody(), { baseURL })
    .then((response) => {
      const quoteLastPrice = handleGetLastPrice(response, instrument);
      if (quoteLastPrice > 0) {
        subscriber.onStatus({ available: true });
        subscriber.onQuote({ ...instrument, price: quoteLastPrice });
      }
    })
    .catch((err) => {
      subscriber.onStatus({
        available: false,
        message: `Plural MD error: ${err?.message}`,
      });

      if (err.response) {
        logger.error(err.response.data);
      }
    });
}

export {
  // eslint-disable-next-line import/prefer-default-export
  getLastPrice,
  handleGetLastPrice,
};
