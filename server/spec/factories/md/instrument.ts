import { Factory } from 'fishery';
import { Instrument } from '../../../lib/market-data';

export default Factory.define<Instrument>(() => ({
  exchange: 'Fakexbit',
  symbol: 'btcbrl',
}));
