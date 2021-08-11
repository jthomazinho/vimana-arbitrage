import axios from 'axios';
import { Routes } from '../shared/api/routes';
import ErrorHandler from '../shared/error-handler';
import { Data } from './interfaces';
import transform from './transform';

interface ServiceInterface {
  fetch: () => Promise<Data>;
}

export default class Service implements ServiceInterface {
  endpoint = Routes.status;

  async fetch(): Promise<Data> {
    const result = await axios.get<Data>(this.endpoint)
      .catch((error) => {
        throw ErrorHandler(error);
      });
    return transform.get(result.data);
  }
}
