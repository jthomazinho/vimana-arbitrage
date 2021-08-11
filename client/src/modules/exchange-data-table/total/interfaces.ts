export interface DataItem {
  id: number;
  date: string;
  usd: string;
  brl: string;
  spread: string;
  targetReached: boolean;
}

export interface DataTotal {
  rows: DataItem[];
}
