import BotInstance from '../shared/api/bot-instance';
import { Data } from '../shared/api/bot-instance/interfaces';

interface ServiceInterface {
  create: () => Promise<Data>;
  finalize: (id: number) => Promise<Data>;
  tooglePause: (id: number) => Promise<Data>;
  createMaker: () => Promise<Data>;
  finalizeMaker: (id: number) => Promise<Data>;
  tooglePauseMaker: (id: number) => Promise<Data>;
}

export default class Service implements ServiceInterface {
  private botInstance: BotInstance;

  constructor() {
    this.botInstance = new BotInstance();
  }

  async create(): Promise<Data> {
    await this.botInstance.createMaker();
    const result = await this.botInstance.create();

    return result;
  }

  async finalize(id: number): Promise<Data> {
    const result = await this.botInstance.finalize(id);

    return result;
  }

  async tooglePause(id: number): Promise<Data> {
    return this.botInstance.tooglePause(id);
  }

  async createMaker(): Promise<Data> {
    const result = await this.botInstance.createMaker();

    return result;
  }

  async finalizeMaker(id: number): Promise<Data> {
    const result = await this.botInstance.finalizeMaker(id);

    return result;
  }

  async tooglePauseMaker(id: number): Promise<Data> {
    return this.botInstance.tooglePauseMaker(id);
  }
}
