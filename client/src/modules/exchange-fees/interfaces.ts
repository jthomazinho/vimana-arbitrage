export interface DataItem {
  id: number;
  value: string;
  prefix: string;
  type: string;
  percentage?: boolean;
}

export interface DataRow {
  [key: string]: DataItem;
}

export interface Data {
  [key: string]: DataRow;
}

export interface Field {
  name: string;
  prefix: string;
  value: string;
}

export interface PostField {
  id: number;
  serviceProvider: string;
  service: string;
  fixed?: string;
  rate?: string;
}

export interface PostFields {
  [key: string]: PostField;
}
