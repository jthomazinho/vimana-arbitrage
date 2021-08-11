export interface DataItem {
  id: number;
  date: string;
  price: string;
  quantity: string;
  grossTotal: string;
  feeWithdraw: string;
  feeTrade: string;
  netTotal: string;
}

export interface DataSell {
  rows: DataItem[];
}
