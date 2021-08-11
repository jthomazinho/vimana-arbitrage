import crypto from 'crypto';
import WebSocket from 'ws';

import rollbar from '../report-rollbar';
import datadog from '../report-datadog';

import { BroadcastFn, Logger } from '..';
import * as oms from '../oms';
import { ServiceStatus } from '../status';

const wsURL = process.env.FOXBIT_WS_URL || '';
const accountId = process.env.FOXBIT_ACCOUNT_ID || '';
const userId = process.env.FOXBIT_USER_ID || '';
const apiKey = process.env.FOXBIT_API_KEY || '';
const apiSecret = process.env.FOXBIT_API_SECRET || '';
const wsSessionTTL = Number(process.env.FOXBIT_WS_TTL) || 15000;

const waitTimeout = 30 * 1000;

type Message = {
  m: number;
  i: number;
  n: string;
  o: string;
}

interface OrderTrade {
  InstrumentId: string;
  OrderId: number;
  Price: number;
  Quantity: number;
  Side: string;
  TradeId: number;
  TradeTimeMS: number;
}

function extractTrade(payload: OrderTrade): oms.RawExchangeTradeParams {
  return {
    exchange: 'foxbit',
    exchangeTradeId: payload.TradeId.toString(),
    exchangeOrderId: payload.OrderId.toString(),
    price: payload.Price,
    quantity: payload.Quantity,
    side: payload.Side === 'Buy' ? 'B' : 'S',
    symbol: 'btcbrl', // TODO: translate InstrumentId
    tradeTime: new Date(payload.TradeTimeMS),
  };
}

type Callback<T> = (err?: string, res?: T) => void;

export default class FoxbitWebsocket {
  private interval!: NodeJS.Timeout;

  private logger: Logger;

  private broadcast: BroadcastFn;

  private ws!: WebSocket;

  private msgCounter = 0;

  private waiters: Map<number, Function> = new Map();

  constructor(logger: Logger, eventPublisher: BroadcastFn) {
    this.logger = logger;
    this.broadcast = eventPublisher;
  }

  keepSessionAlive(): void {
    let lastTS = Date.now();
    this.interval = setInterval(() => {
      if (Date.now() > (lastTS + (wsSessionTTL * 2))) {
        rollbar.error('Foxbit OMS session timeout', { lastTS, now: Date.now() });
        clearInterval(this.interval);
      } else {
        this.send('ping', {}, () => {
          lastTS = Date.now();
        });
      }
    }, wsSessionTTL);
  }

  sendWs(path: string, orderParams: any) {
    return new Promise((resolve) => {
      this.send(path, orderParams, (err?: string, res?: any) => {
        if (err) {
          throw new Error(err);
        }
        resolve(res);
      });
    });
  }

  init(): void {
    datadog.init();

    this.ws = new WebSocket(wsURL);

    this.ws.on('error', (err) => {
      this.logger.error('[websocket] error event', err);
      // Reconnect only on the close event!
      datadog.increment('oms.foxbit', 1, ['websocket.error']);
      rollbar.error(`Foxbit OMS websocket error: "${err.message}"`, err);
    });

    this.ws.on('open', () => {
      datadog.increment('oms.foxbit', 1, ['websocket.open']);
      this.logger.info('[websocket] connected');
      this.broadcast<ServiceStatus>('oms.status.foxbit', { available: true });
      this.authenticate(() => {
        this.keepSessionAlive();
        this.subscribeAccountEvents();
      });
    });

    this.ws.on('close', () => {
      this.logger.error('[websocket] connection closed');
      this.broadcast<ServiceStatus>('oms.status.foxbit', { available: false });
      datadog.increment('oms.foxbit', 1, ['websocket.close']);
      clearInterval(this.interval);
      setTimeout(() => {
        this.init();
      }, 5000);
    });

    this.ws.on('message', (data) => {
      let message;
      try {
        message = JSON.parse(data.toString()) as Message;
      } catch (err) {
        this.logger.error('[websocket] failed to parse message', err);
        return;
      }
      this.triggerWaiters(message);
      this.publishEvents(message);
    });
  }

  private authenticate(callback: () => void): void {
    const nonce = Date.now().toString();
    const data = `${nonce}${userId}${apiKey}`;
    const authPayload = {
      APIKey: apiKey,
      Signature: crypto.createHmac('sha256', apiSecret).update(data).digest('hex'),
      UserId: userId,
      Nonce: nonce,
    };
    this.send('AuthenticateUser', authPayload,
      (err?: string, res?: { Authenticated: boolean; errormsg: string }) => {
        if (err) {
          this.logger.error('[websocket] authentication failed', err);
          throw new Error(err);
        }

        // TODO - tratar o erro aqui porque quando nao autentica, nao vem errormsg no res
        if (res && !res.Authenticated) {
          this.logger.error('[websocket] authentication failed', res.errormsg);
          throw new Error(err);
        }

        this.logger.info('[websocket] authentication successful');

        callback();
      });
  }

  private subscribeAccountEvents(): void {
    this.send('SubscribeAccountEvents', { OMSId: 1, AccountId: accountId },
      (err?: string) => {
        if (err) {
          this.logger.error('[websocket] subscribe account events failed', err);
          return;
        }
        this.logger.info('[websocket] subscribe account events successful');
      });
  }

  /**
   * send prepares, then sends a message to the websocket.
   * For synchronous calls provide a callback that will be called when the
   * response arrives in the websocket.
   *
   * @param functionName the 'n' of the message
   * @param payload the 'o' of the message
   * @param callback for synchronous calls, the callback is called when the
   *   response arrives in the websocket.
   *   The first argument is an optional error message, the second is the
   *   payload ('o') in the message received. There is a timeout. so if the
   *   reponse doesn't arrive in time the callback is called with an error
   *   message.
   */
  private send<T>(functionName: string, payload: object, callback?: Callback<T>): Message {
    this.msgCounter += 1;
    const message = {
      m: 0,
      i: this.msgCounter,
      n: functionName,
      o: JSON.stringify(payload),
    };
    if (callback) {
      this.waitResponse(message, callback);
    }

    this.ws.send(JSON.stringify(message));

    return message;
  }

  private waitResponse<T>(message: Message, callback: Callback<T>): void {
    this.waiters.set(message.i, callback);
    setTimeout(() => {
      if (!this.waiters.get(message.i)) {
        // Response already received, just ignore it
        return;
      }
      this.waiters.delete(message.i);

      callback('[websocket] timeout waiting for response');
    }, waitTimeout);
  }

  private triggerWaiters(message: Message): void {
    const callback = this.waiters.get(message.i);
    if (callback) {
      this.waiters.delete(message.i);

      const payload = JSON.parse(message.o);
      callback(null, payload);
    }
  }

  private publishEvents(message: Message): void {
    let payload;
    try {
      payload = JSON.parse(message.o);
    } catch (err) {
      this.logger.error(`[websocket] Failed to parse message payload: ${message.n}`, err);
      return;
    }

    switch (message.n) {
      case 'OrderTradeEvent': {
        this.broadcast<oms.RawExchangeTradeParams>('oms.raw_trade', extractTrade(payload));
        break;
      }
      default: {
        break;
      }
    }
  }
}
