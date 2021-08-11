import { ServiceBroker } from 'moleculer';

import { Fee as Model } from '../app/models/fee';

import TestService from './fees.service';
import { Fee } from '../lib/fee';
import factories from '../spec/factories';

function extractUpdateEvent(mockFn: jest.Mock): Fee {
  const [event, payload] = mockFn.mock.calls.find(
    (args) => (args[0] as string).match(/fees\..*.\..*\.update/),
  );
  expect(event).toBeDefined();

  return payload;
}

describe('FeesService', () => {
  let broker: ServiceBroker;

  beforeAll(async () => {
    broker = new ServiceBroker({ logger: false });
    broker.createService(TestService);

    await broker.start();
  });

  afterAll(async () => {
    await broker.stop();
  });

  beforeEach(async () => {
    await Model.truncate();
  });

  const feeAttributes = {
    ...factories.fee.build(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  describe('action find', () => {
    it('converts the result`s fixed attribute', async () => {
      const { id } = await broker.call<Fee, object>('fees.create', feeAttributes);

      const fees = await broker.call<Array<Fee>, object>('fees.find', { query: { id } });

      expect(fees).toHaveLength(1);
      expect(fees[0].fixed).toBeNumber();
      expect(fees[0].rate).toBeNumber();
    });
  });

  describe('action update', () => {
    const createFee = async (): Promise<Fee> => broker.call<Fee, object>('fees.create', feeAttributes);

    it('broadcasts an event with the updated Fee', async () => {
      const { id } = await createFee();
      const broadcast = jest.fn();
      broker.broadcast = broadcast;

      await broker.call('fees.update', { id });

      const payload = extractUpdateEvent(broadcast);
      expect(payload.id).toStrictEqual(id);
      expect(payload.fixed).toBeNumber();
      expect(payload.rate).toBeNumber();
    });
  });
});
