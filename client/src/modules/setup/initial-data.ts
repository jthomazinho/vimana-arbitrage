import { Data } from './interfaces';

const initialData: Data = {
  totalQuantity: {
    value: '',
  },
  maxOrderQuantity: {
    value: '',
  },
  targetSpread: {
    value: '',
    percentage: true,
  },
  crowdFactor: {
    value: '1',
    percentage: true,
  },
  manualPegQuote: {
    value: '',
    currency: true,
  },
};

export default initialData;
