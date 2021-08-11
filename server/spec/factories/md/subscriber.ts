import { Factory } from 'fishery';
import { Subscriber } from '../../../lib/market-data';

export default Factory.define<Subscriber>(() => ({
  onDepth: (): void => { /* empty */ },
  onQuote: (): void => { /* empty */ },
  onStatus: (): void => { /* empty */ },
}));
