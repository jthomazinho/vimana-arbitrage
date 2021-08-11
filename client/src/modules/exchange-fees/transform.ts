import formatter from '../shared/formatter';
import {
  PostFields,
  Data,
  DataRow,
  DataItem,
  PostField,
} from './interfaces';

function format(inputName: string, value: string | number) {
  if (inputName.includes('rate')) {
    return formatter.percentage(value);
  }

  if (inputName.includes('brl-fixed')) {
    return formatter.currencyBRL(value);
  }

  return formatter.currency(value);
}

function get(origin: DataRow, data: { rows: PostField[] }) {
  const result = data.rows.map((item: PostField) => {
    const prefixRate = `${item.serviceProvider}-${item.service}-rate`;
    const prefixFixed = `${item.serviceProvider}-${item.service}-fixed`;

    const fields = {
      [prefixFixed]: {
        prefix: item.serviceProvider,
        id: item.id,
        type: 'input',
        value: format(prefixFixed, item.fixed || 0),
      },
      [prefixRate]: {
        prefix: item.serviceProvider,
        id: item.id,
        type: 'input',
        value: formatter.percentage(Number(item.rate) * 100),
        percentage: true,
      },
    };

    return fields;
  });

  const flatten = {};

  result.forEach((item: DataRow) => {
    Object.entries(item).forEach(([key, value]) => {
      if (origin[key]) {
        Object.assign(flatten, { [key]: value });
      }
    });
  });

  return { ...origin, ...flatten };
}

function post(data: Data): PostFields {
  const dataFields = Object.entries({ ...data.foxbit, ...data.bitstamp }).filter(([k, i]) => i.type === 'input');
  const postFields: PostFields = {};

  dataFields.forEach(([key, item]: [string, DataItem]) => {
    const service = key.replace(/^(\w+-)|(-\w+)$/g, '');
    const isFixed = key.includes('fixed');
    const isRate = key.includes('rate');
    const id: string = item.id.toString();
    const value = isRate ? (Number(item.value) / 100).toString() : item.value;

    if (Number(id)) {
      if (postFields[id]) {
        Object.assign(postFields[id], {
          ...postFields[id],
          [isRate ? 'rate' : 'fixed']: value,
        });
      } else {
        Object.assign(postFields, {
          [id]: {
            id: Number(id),
            serviceProvider: item.prefix,
            service,
            [isFixed ? 'fixed' : 'rate']: value,
          },
        });
      }
    }
  });

  return postFields;
}

function queryParams(params: { serviceProvider: string; service: string[] }) {
  const fields = params.service.map((service: string) => `query[service]=${service}`);

  return `query[serviceProvider]=${params.serviceProvider}&${fields.toString().split(',').join('&')}`;
}

export default {
  get,
  post,
  queryParams,
  format,
};
