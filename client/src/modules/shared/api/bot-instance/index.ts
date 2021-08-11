import axios from 'axios';
import { Data } from './interfaces';
import { Routes } from '../routes';
import ErrorHandler from '../../error-handler';

interface ServiceInterface {
  create: () => Promise<Data>;
  fetch: () => Promise<Data>;
  finalize: (id: number) => Promise<Data>;
  tooglePause: (id: number) => Promise<Data>;
}

export default class Service implements ServiceInterface {
  private endpoint = Routes.algoInstance;

  private endpointMaker = Routes.algoInstanceMaker;

  async fetch(): Promise<Data> {
    let data = await this.getActiveInstance();

    if (!data) {
      data = await this.create();
    }

    return data;
  }

  async finalize(id: number): Promise<Data> {
    const result = await axios.post(`${this.endpoint}${id}/finalize`);

    return result;
  }

  async create(): Promise<Data> {
    const result = await axios.post(this.endpoint)
      .catch((error) => {
        throw ErrorHandler(error);
      });

    return result.data;
  }

  async tooglePause(id: number): Promise<Data> {
    return axios.post(`${this.endpoint}${id}/toggle-pause`)
      .catch((error) => {
        throw ErrorHandler(error);
      });
  }

  async finalizeMaker(id: number): Promise<Data> {
    const result = await axios.post(`${this.endpointMaker}${id}/finalize`);

    return result;
  }

  async createMaker(): Promise<Data> {
    const result = await axios.post(this.endpointMaker)
      .catch((error) => {
        throw ErrorHandler(error);
      });

    return result.data;
  }

  async tooglePauseMaker(id: number): Promise<Data> {
    return axios.post(`${this.endpointMaker}${id}/toggle-pause`)
      .catch((error) => {
        throw ErrorHandler(error);
      });
  }

  private async getActiveInstance(): Promise<Data | undefined> {
    return axios.get(`${this.endpoint}active`)
      .then(({ data }) => data)
      .catch((error) => {
        if (error.response.status === 404) {
          return undefined;
        }

        throw ErrorHandler(error);
      });
  }

  private async getActiveMakerInstance(): Promise<Data | undefined> {
    return axios.get(`${this.endpoint}active`)
      .then(({ data }) => data)
      .catch((error) => {
        if (error.response.status === 404) {
          return undefined;
        }

        throw ErrorHandler(error);
      });
  }
}
