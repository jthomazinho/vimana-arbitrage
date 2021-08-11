import formatter from '../shared/formatter';
import {
  Data,
  PostFields,
} from './interfaces';

function get(origin: Data, data: PostFields): Data {
  const output: Data = { ...origin };

  Object.entries(data).sort().forEach(([key, value]) => {
    const percentage: boolean = ['targetSpread'].includes(key);
    const currency: boolean = ['manualPegQuote'].includes(key);

    let formattedValue = value;

    if (percentage) {
      formattedValue = formatter.percentage(Number(value) * 100);
    } else if (currency) {
      formattedValue = formatter.currency(value);
    }

    Object.assign(output, { [key]: { value: formattedValue, percentage, currency } });
  });

  Object.assign(output, { crowdFactor: { value: '100', percentage: true, currency: false } });

  return output;
}

function post(data: Data): PostFields {
  const output = {};

  Object.entries(data).forEach(([key, item]) => {
    const percentage: boolean = ['targetSpread', 'crowdFactor'].includes(key);
    const value = percentage ? (Number(item.value) / 100).toFixed(4) : item.value;

    Object.assign(output, { [key]: value });
  });

  return output as PostFields;
}

export default {
  get,
  post,
};
