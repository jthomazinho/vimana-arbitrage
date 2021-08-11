import axios from 'axios';
import { DataTable } from './interfaces';
import transform from './transform';
import initialData from './initial-data';
import { Routes } from '../shared/api/routes';
import ErrorHandler from '../shared/error-handler';

interface ServiceInterface {
  fetch: (id: number) => Promise<DataTable>;
}

export default class Service implements ServiceInterface {
  private endpoint = Routes.algoInstance;

  static get interval(): number {
    return 5000;
  }

  async fetch(id: number): Promise<DataTable> {
    const result = await axios.get(`${this.endpoint}${id}/executions`)
      .catch((error) => {
        throw ErrorHandler(error);
      });

    return transform.get(initialData, result.data);
  }
}
