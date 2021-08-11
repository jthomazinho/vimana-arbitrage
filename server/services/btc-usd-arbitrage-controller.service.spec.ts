import { ServiceBroker } from 'moleculer';
import { Op } from 'sequelize';

import TestService, { serviceName } from './btc-usd-arbitrage-controller.service';
import AlgoInstanceService from './algo-instance.service';
import FeeService from './fees.service';
import { AlgoDetails } from '../lib/algos';
import { AlgoInstance } from '../app/models/algo-instance';

async function createInstance(broker: ServiceBroker): Promise<number> {
  const { instance } = await broker.call<AlgoDetails>('btc-usd-arbitrage-controller.create');

  return instance.id;
}

describe('BtcUsdArbitrage Controller service', () => {
  let broker: ServiceBroker;

  beforeAll(async () => {
    broker = new ServiceBroker({ logger: false });
    broker.createService(AlgoInstanceService);
    broker.createService(FeeService);
    broker.createService(TestService);

    await broker.start();
  });

  afterAll(async () => {
    await broker.stop();
  });

  beforeEach(async () => {
    await AlgoInstance.destroy({
      where: { id: { [Op.gt]: 0 } },
    });
  });

  describe('action create', () => {
    it('creates an AlgoInstance', async () => {
      const { instance } = await broker.call<AlgoDetails>('btc-usd-arbitrage-controller.create');

      expect(instance.id).not.toBeUndefined();
    });

    it('creates a new service to manage the algo', async () => {
      const { instance } = await broker.call<AlgoDetails>('btc-usd-arbitrage-controller.create');
      const name = serviceName(instance.id);

      const algoService = broker.services.find((s) => s.name === name);
      expect(algoService).not.toBeUndefined();
    });
  });

  describe('action getActive', () => {
    // would be nice to be able to test the meta attribute in the context
    // to test it sets the statusCode to 404
    it('returns null when all instances have ended', async () => {
      const result = await broker.call<AlgoDetails>('btc-usd-arbitrage-controller.getActive');

      expect(result).toBeNull();
    });

    it('finalizes an instance not-ended not-running', async () => {
      let instance = await AlgoInstance.create({ id: 999, algoKind: 'btc-usd-arbitrage-taker' });

      await broker.call<AlgoDetails>('btc-usd-arbitrage-controller.getActive');

      instance = await instance.reload();
      expect(instance.get('endedAt')).not.toBeNull();
    });

    it('returns the oldest non-ended instance', async () => {
      const id = await createInstance(broker);

      const { instance } = await broker.call<AlgoDetails>('btc-usd-arbitrage-controller.getActive');

      expect(instance.id).toStrictEqual(id);
    });
  });
});
