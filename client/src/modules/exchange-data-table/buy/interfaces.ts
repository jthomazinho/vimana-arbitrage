export interface DataItem {
  id: number;
  date: string;
  price: string;
  quantity: string;
  grossTotal: string;
  feeTrade: string;
  feeWithdraw: string;
  netTotal: string;
}

export interface DataBuy {
  rows: DataItem[];
}
