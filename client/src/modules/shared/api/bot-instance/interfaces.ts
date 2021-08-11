export interface Data {
  [key: string]: any;
}

export enum State {
  finalized = 'FINALIZED',
  paused = 'PAUSED',
  error = 'ERROR',
  waitingOrders = 'WAITINGORDERS',
  waitingOrderResponse = 'WAITINGORDERRESPONSE',
  monitoring = 'MONITORING',
  initializing = 'INITIALIZING',
}
