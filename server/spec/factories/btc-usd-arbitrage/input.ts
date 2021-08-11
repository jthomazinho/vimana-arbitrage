import { Factory } from 'fishery';
import { InputParameters } from '../../../app/algos/btc-usd-arbitrage';

export default Factory.define<InputParameters>(() => ({
  totalQuantity: 1,
  maxOrderQuantity: 0.5,
  targetSpread: 0.012,
  crowdFactor: 0.9,
  manualPegQuote: 0,
}));
