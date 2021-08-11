/* eslint-disable class-methods-use-this */
import axios from 'axios';
import { Data } from './interfaces';
import { Data as BotData } from '../shared/api/bot-instance/interfaces';
import transform from './transform';
import { Routes } from '../shared/api/routes';
import ErrorHandler from '../shared/error-handler';
import initialData from './initial-data';

interface ServiceInterface {
  transform: (instance: BotData) => Data;
  save: (data: Data, instanceId: number) => Promise<Data>;
}

export default class Service implements ServiceInterface {
  private endpoint = Routes.algoInstance;

  transform(instance: BotData): Data {
    return transform.get(initialData, instance.input);
  }

  async save(data: Data, instanceId: number): Promise<Data> {
    const output = await axios.post(`${this.endpoint}${instanceId}`, {
      input: {
        ...transform.post(data),
      },
    }).catch((error) => {
      throw ErrorHandler(error);
    });

    return transform.get(initialData, output.data.input);
  }
}
