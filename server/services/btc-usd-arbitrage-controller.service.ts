import {
  Errors, Service, ServiceBroker, Context,
} from 'moleculer';
import { QueryOptions } from 'moleculer-db';

import { AlgoInstance } from '../app/models/algo-instance';
import {
  AlgoDetails, AlgoData, PartialObject, InputValidationError, ExecutionData, Id,
} from '../lib/algos';
import { Template, algoKind } from './templates/btc-usd-arbitrage';

type WebMeta = {
  $statusCode: number;
}

export function serviceName(id: { toString: () => string }): string {
  return `${algoKind}-${id}`;
}

export default class extends Service {
  constructor(broker: ServiceBroker) {
    super(broker);

    this.parseServiceSchema({
      name: 'btc-usd-arbitrage-controller',
      dependencies: ['algo-instance'],
      actions: {
        create: this.handleCreate,
        finalize: this.handleFinalize,
        list: this.handleList,
        show: this.handleShow,
        update: this.handleUpdate,
        getActive: this.handleGetActive,
        getExecutions: this.handleGetExecutions,
        togglePause: this.handleTogglePause,
      },
      events: {
        [`algos.${algoKind}.finalized`]: this.handleInstanceFinalized,
      },
    });
  }

  async handleCreate(ctx: Context<never, WebMeta>): Promise<Maybe<AlgoDetails>> {
    const [instance, ok] = await AlgoInstance.findOrCreate({
      where: { algoKind, active: true, endedAt: null },
    });
    if (!ok) {
      ctx.meta.$statusCode = 409;
      return null;
    }
    const name = serviceName(instance.id);
    this.broker.createService(new Template(this.broker, instance.id, name));

    return this.getDetails(instance.id);
  }

  async handleFinalize(ctx: Context<{ id: string }>): Promise<AlgoDetails> {
    await this.broker.call<boolean>(`${serviceName(ctx.params.id)}.finalize`)
      .catch((error) => {
        if (error instanceof Errors.ServiceNotFoundError) {
          this.setInstanceFinalized(ctx.params.id);
          return true;
        }
        throw error;
      });

    return this.getDetails(ctx.params.id);
  }

  async handleList(ctx: Context<object>): Promise<Array<AlgoInstance>> {
    return this.broker.call<Array<AlgoInstance>, QueryOptions>(
      'algo-instance.list',
      { ...ctx.params, sort: '-id', query: { algoKind } },
    );
  }

  async handleShow(ctx: Context<{ id: string }>): Promise<AlgoDetails> {
    return this.getDetails(ctx.params.id);
  }

  async handleUpdate(
    ctx: Context<{ id: string; input: PartialObject }, WebMeta>,
  ): Promise<AlgoDetails | { message: string }> {
    return this.broker.call(`${serviceName(ctx.params.id)}.setInput`, ctx.params.input)
      .then(() => this.getDetails(ctx.params.id))
      .catch((err) => {
        if (err instanceof InputValidationError) {
          ctx.meta.$statusCode = 400;
          return { message: err.message };
        }
        throw err;
      });
  }

  async handleGetActive(ctx: Context<never, WebMeta>): Promise<Maybe<AlgoDetails>> {
    const [lastInstance] = await this.broker.call<Array<AlgoInstance>, QueryOptions>(
      'algo-instance.find', { sort: '-id', query: { algoKind }, limit: 1 },
    );
    if (lastInstance) {
      const lastInstancedetails = await this.getDetails(lastInstance.id);
      if (lastInstancedetails.state !== 'NOT_RUNNING') {
        return lastInstancedetails;
      }
    }

    return this.broker.call<Array<AlgoInstance>, QueryOptions>(
      'algo-instance.find',
      { sort: '-id', query: { algoKind, endedAt: null } },
    ).then(async (list) => {
      let details;
      await Promise.all(list.map(async (instance) => {
        const id = instance.id.toString();
        details = await this.getDetails(id);

        if (details.state === 'NOT_RUNNING') {
          await this.setInstanceFinalized(id);
          details = null;
        }
      }));

      if (!details) {
        ctx.meta.$statusCode = 404;
        return null;
      }

      return details;
    });
  }

  async handleGetExecutions(ctx: Context<Id>): Promise<{ rows: Array<ExecutionData> }> {
    return this.broker.call('btc_usd_arbitrage_execution.list', {
      query: { algoInstanceId: ctx.params.id },
      pageSize: 100,
    });
  }

  async handleTogglePause(ctx: Context<Id>): Promise<AlgoDetails> {
    const { id } = ctx.params;

    return this.broker.call(`${serviceName(id)}.togglePause`)
      .then(() => this.getDetails(id));
  }

  async getDetails(id: string | number): Promise<AlgoDetails> {
    const instance = await this.broker.call<AlgoInstance, QueryOptions>(
      'algo-instance.get',
      { id },
    );

    const details = await this.broker.call<AlgoData>(`${serviceName(id)}.getData`)
      .catch((error) => {
        if (
          error instanceof Errors.ServiceNotFoundError
          || error instanceof Errors.ServiceNotAvailableError
        ) {
          return {
            state: 'NOT_RUNNING',
            output: {
              message: 'Instance not running',
            },
            input: {},
          };
        }
        throw error;
      });

    return Promise.resolve({
      instance,
      ...details,
    });
  }

  async handleInstanceFinalized(ctx: Context<Id>): Promise<void> {
    await this.setInstanceFinalized(ctx.params.id.toString());
  }

  async setInstanceFinalized(id: string): Promise<void> {
    await this.broker.call<never, QueryOptions>(
      'algo-instance.update',
      { id, endedAt: Date.now(), active: null },
    );
  }
}
