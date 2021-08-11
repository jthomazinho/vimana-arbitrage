import { Factory } from 'fishery';
import { InputParameters } from '../../../app/algos/foxbit-otc';

export default Factory.define<InputParameters>(() => ({
  quoteSpread: 2.1,
  manualPegQuote: 0,
}));
