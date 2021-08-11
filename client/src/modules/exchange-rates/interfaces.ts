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

export interface DataItem {
  id: number;
  prefix: string;
  type: string;
  value: string;
}

export interface Data {
  [key: string]: DataItem;
}
