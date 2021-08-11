import { ServiceStatus } from './status';

type Quantity = number;
type Price = number;
/**
 * Instrument identifies a trading asset.
 */
export interface Instrument {
  /**
   * symbol is a normalized name for an asset, the same underlying asset must have
   * the same symbol among all exchanges.
   */
  readonly symbol: string;
  /**
   * exchange is the exchange in which the asset is traded.
   */
  readonly exchange: string;
}

/**
 * DepthLevel is an aggregation of all offers at some price level
 * It is a tuple of (Quantity, Price).
 */
export type DepthLevel = readonly [Quantity, Price];

/**
 * Depth is the book aggregated by price for given Instrument.
 * bids and asks are arrays of tuples (Quantity, Price) ordered by 'best offer first',
 * but the meaning of best varies by side.
 */
export interface Depth extends Instrument {
  /**
   * bids are the aggregated buy offers by price level, ordered by price descending.
   */
  readonly bids: Array<DepthLevel>;
  /**
   * asks are the aggregated sell offers by price level, ordered by price ascending.
   */
  readonly asks: Array<DepthLevel>;
}

/**
 * Quote is a reference price for an Instrument.
 */
export interface Quote extends Instrument {
  readonly price: number;
}

/**
 * Subscriber defines the callbacks a client must implement to receive events from a adapter.
 */
export interface Subscriber {
  /**
   * Callback to handle a Depth event.
   * @param depth
   */
  onDepth(depth: Depth): void;
  /**
   * Callback to handle a Status update event.
   * @param status
   */
  onStatus(status: ServiceStatus): void;
  /**
   * Callback to handle a Quote event.
   * @param quote
   */
  onQuote(quote: Quote): void;
}

/**
 * formatInstrument generates a standardized string for an Instrument.
 * @param instrument The instrument to be formatted.
 */
export function formatInstrument(instrument: Maybe<Instrument>): string {
  if (!instrument) {
    return '<empty>';
  }

  return `${instrument.symbol} @ ${instrument.exchange}`;
}

/**
 * formatDepthLevel generates a standardized string for a DepthLevel.
 * @param level The DepthLevel to be formatted.
 */
export function formatDepthLevel(level: Maybe<DepthLevel>): string {
  if (!level) {
    return '<empty>';
  }

  return `${level[0]}@${level[1]}`;
}

/**
 * formatPrice generates a standardized string for a price.
 * @param price The price to be formatted.
 * @param fixed (optional) The number of digits after the decimal point.
 */
export function formatPrice(price: Maybe<number>, fixed = 4): string {
  if (!price) {
    return '<empty>';
  }

  return price.toFixed(fixed);
}
