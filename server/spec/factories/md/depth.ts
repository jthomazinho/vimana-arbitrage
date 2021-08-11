import { Factory } from 'fishery';
import { Depth } from '../../../lib/market-data';
import instrument from './instrument';

export default Factory.define<Depth>(() => ({
  ...instrument.build(),
  asks: [[10, 40000]],
  bids: [[20, 39900]],
}));
