import axios from 'axios';
import { Data, PostFields, PostField } from './interfaces';
import { Data as BotData } from '../shared/api/bot-instance/interfaces';
import transform from './transform';
import ErrorHandler from '../shared/error-handler';

interface ServiceInterface {
  fetch: (instance: BotData) => Promise<Data>;
  save: (data: Data) => Promise<Data>;
}

export default class Service implements ServiceInterface {
  private data: Data;

  private endpoint = '/algos/foxbit-otc/spread/';

  constructor(data: Data) {
    this.data = data;
  }

  async fetch(instance: BotData): Promise<Data> {
    const result = await axios.get(`${this.endpoint}?${transform.queryParams({
      serviceProvider: 'foxbit-otc',
      service: ['spread-otc'],
    })}`)
      .catch((error) => {
        throw ErrorHandler(error);
      });

    return transform.get(this.data, result.data, instance.output?.pegPrice);
  }

  async save(data: Data): Promise<Data> {
    const fields: PostFields = transform.post(data);
    const requests: Promise<PostField>[] = Object.keys(fields)
      .map((key) => axios.put(`${this.endpoint}${key}`, fields[key]));

    await axios.all(requests).catch((error) => {
      throw ErrorHandler(error);
    });

    return data;
  }
}
