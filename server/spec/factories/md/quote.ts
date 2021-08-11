import { Factory } from 'fishery';
import { Quote } from '../../../lib/market-data';
import instrument from './instrument';

export default Factory.define<Quote>(() => ({
  ...instrument.build(),
  price: 3.27121780,
}));
