interface ExchangeData {
  status: boolean;
  date: string;
  price: {
    ask: string;
    bid: string;
  };
}

export interface Data {
  foxbit: ExchangeData;
  bitstamp: ExchangeData;

  plural: {
    status: boolean;
    date: string;
    quote: string;
  };
}
