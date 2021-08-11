import axios from 'axios';
import transform from './transform';
import { Data, PostField, PostFields } from './interfaces';
import ErrorHandler from '../shared/error-handler';

interface ServiceInterface {
  fetch: () => Promise<Data>;
  save: (data: Data) => Promise<Data>;
}

export default class Service implements ServiceInterface {
  private data: Data;

  private endpoint = '/api/fees/';

  private endpointOtcUpdate = '/algos/foxbit-otc/update/';

  constructor(data: Data) {
    this.data = data;
  }

  async getData(serviceProvider: string, service: string[]) {
    const result = await axios.get(`${this.endpoint}?${transform.queryParams({
      serviceProvider,
      service,
    })}`)
      .catch((error) => {
        throw ErrorHandler(error);
      });

    return result;
  }

  async fetch(): Promise<Data> {
    const foxbit = await this.getData('foxbit', ['withdraw-brl', 'withdraw-btc', 'trade-taker']);
    const bitstamp = await this.getData('bitstamp', ['withdraw-usd', 'withdraw-btc', 'trade-taker']);

    this.data = {
      foxbit: {
        ...transform.get(this.data.foxbit, foxbit.data),
      },
      bitstamp: {
        ...transform.get(this.data.bitstamp, bitstamp.data),
      },
    };

    return this.data;
  }

  async save(data: Data): Promise<Data> {
    const fields: PostFields = transform.post(data);
    const requests: Promise<PostField>[] = Object.keys(fields)
      .map((key) => this.sendRequests(key, fields));

    await axios.all(requests).catch((error) => {
      throw ErrorHandler(error);
    });

    return data;
  }

  async sendRequests(key: string, fields: PostFields): Promise<PostField> {
    axios.put(`${this.endpointOtcUpdate}${key}`, fields[key]);
    return axios.put(`${this.endpoint}${key}`, fields[key]);
  }
}
