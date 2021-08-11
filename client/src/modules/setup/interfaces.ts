export interface PostFields {
  totalQuantity: string;
  maxOrderQuantity: string;
  targetSpread: string;
  crowdFactor: string;
  manualPegQuote: string;
}

export interface Data {
  [key: string]: {
    value: string;
    percentage?: boolean;
    currency?: boolean;
  };
}
