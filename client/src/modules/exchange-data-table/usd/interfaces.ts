export interface DataItem {
  id: number;
  date: string;
  price: string;
  unitFeeExchange: string;
  unitFeeIof: string;
  longTotal: string;
  buyUsd: string;
}

export interface DataUSD {
  rows: DataItem[];
}
