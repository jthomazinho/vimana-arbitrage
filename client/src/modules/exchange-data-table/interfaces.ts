import { DataSell } from './sell/interfaces';
import { DataBuy } from './buy/interfaces';
import { DataUSD } from './usd/interfaces';
import { DataTotal } from './total/interfaces';

export enum Enum { sell, buy, usd, total }

export interface DataTable {
  [Enum.sell]: DataSell;
  [Enum.buy]: DataBuy;
  [Enum.usd]: DataUSD;
  [Enum.total]: DataTotal;
}

export interface PayloadItem {
  id: number;
  algoInstanceId: number;
  date: string;
  summary: { [x: string]: any };
}

export interface Payload {
  rows: PayloadItem[];
}
