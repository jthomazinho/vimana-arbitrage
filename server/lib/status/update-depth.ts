import { Depth } from '../market-data';
import { UpdateValue } from './exchange';

export default class UpdateDepth implements UpdateValue<Depth> {
  price = {
    bid: 0,
    ask: 0,
  };

  value(): object {
    return {
      price: {
        ask: this.price.ask.toFixed(2),
        bid: this.price.bid.toFixed(2),
      },
    };
  }

  update(depth: Depth): void {
    this.price = {
      ask: depth.asks[0][1],
      bid: depth.bids[0][1],
    };
  }
}
