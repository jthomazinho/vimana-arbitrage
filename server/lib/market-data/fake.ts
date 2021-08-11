import * as md from '../market-data';

export default class {
  symbol: string;

  exchangeId: string;

  priceMean: number;

  priceJitter: number;

  private lastBid: number;

  private lastAsk: number;

  constructor(symbol: string, exchangeId: string, priceMean: number, priceJitter: number) {
    this.symbol = symbol;
    this.exchangeId = exchangeId;
    this.priceMean = priceMean;
    this.priceJitter = priceJitter;

    this.lastBid = priceMean - priceJitter * 0.5;
    this.lastAsk = priceMean + priceJitter * 0.5;
  }

  generateDepth(): md.Depth {
    this.jitterPrices();
    return {
      symbol: this.symbol,
      exchange: this.exchangeId,
      bids: [[10, this.lastBid]],
      asks: [[20, this.lastAsk]],
    };
  }

  private jitterPrices(): void {
    const [bidJitter, askJitter] = [
      Math.round((Math.random() - 0.5) * this.priceJitter),
      Math.round((Math.random() - 0.5) * this.priceJitter),
    ];

    const newBid = this.lastBid - bidJitter;
    const newAsk = this.lastAsk + askJitter;

    if (newBid < newAsk) {
      this.lastBid = newBid;
      this.lastAsk = newAsk;
    }
  }
}
