import { Quote } from '../market-data';
import { UpdateValue } from './exchange';

export default class UpdateQuote implements UpdateValue<Quote> {
  quote = 0;

  value(): object {
    return {
      quote: this.quote.toFixed(4),
    };
  }

  update(quote: Quote): void {
    this.quote = quote.price;
  }
}
