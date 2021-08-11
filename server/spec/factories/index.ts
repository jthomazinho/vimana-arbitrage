import btcUsdInput from './btc-usd-arbitrage/input';
import foxbitOtcInput from './foxbit-otc/input';
import depth from './md/depth';
import bigDepth from './md/big-depth';
import fee from './fee';
import instrument from './md/instrument';
import order from './oms/order';
import orderHistory from './oms/orderhistory';
import quote from './md/quote';
import subscriber from './md/subscriber';
import context from './btc-usd-arbitrage/context';
import longleg from './btc-usd-arbitrage/longleg';
import shorteg from './btc-usd-arbitrage/shortleg';
import summary from './btc-usd-arbitrage/summary';
import transaction from './oms/transaction';
import rawtrade from './oms/rawtrade';
import orderparams from './oms/orderparams';

export default ({
  btcUsdInput,
  foxbitOtcInput,
  depth,
  bigDepth,
  fee,
  instrument,
  order,
  orderHistory,
  quote,
  subscriber,
  context,
  longleg,
  shorteg,
  summary,
  transaction,
  rawtrade,
  orderparams,
});
