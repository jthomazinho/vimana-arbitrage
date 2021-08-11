import formatter from '../shared/formatter';

import {
  Data,
  DataItem,
  PostField,
  PostFields,
} from './interfaces';

function get(origin: Data, data: { rows: PostField[] }, currencyQuote: string): Data {
  const result = data.rows.map((item: PostField) => {
    const prefixRate = `${item.service}-rate`;
    const prefixFixed = `${item.service}-fixed`;

    const fields = {
      [prefixFixed]: {
        id: item.id,
        prefix: item.serviceProvider,
        type: 'input',
        value: 0,
      },
      [prefixRate]: {
        id: item.id,
        prefix: item.serviceProvider,
        type: 'input',
        value: formatter.percentage(Number(item.rate) * 100),
      },
    };

    return fields;
  });

  const flatten = {};

  result.forEach((item: any) => {
    Object.entries(item).forEach(([key, value]) => {
      if (origin[key]) {
        Object.assign(flatten, { [key]: value });
      }
    });
  });

  return { ...origin, ...flatten };
}

function post(data: Data): PostFields {
  const dataFields = Object.entries({ ...data }).filter(([k, i]) => i.type === 'input');
  const postFields: PostFields = {};

  dataFields.forEach(([key, item]: [string, DataItem]) => {
    const service = key.replace(/(-\w+)$/g, '');
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
};
