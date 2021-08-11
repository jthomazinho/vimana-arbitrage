import { ServiceBroker, Service } from 'moleculer';

import { Template as TestService } from './btc-usd-arbitrage';
import AlgoInstanceService from '../algo-instance.service';
import FeeService from '../fees.service';
import {
  Algo, InputParameters, State,
} from '../../app/algos/btc-usd-arbitrage';
import { AlgoData, PartialObject } from '../../lib/algos';

import factories from '../../spec/factories';

jest.mock('../../app/algos/btc-usd-arbitrage');

const MockAlgo = Algo as jest.MockedClass<typeof Algo>;

let idCounter = 0;
function nextServiceId(): { id: number; name: string } {
  idCounter += 1;
  return {
    id: idCounter,
    name: `testAlgo-${idCounter}`,
  };
}

async function createNewTestService(broker: ServiceBroker): Promise<Service> {
  const { id, name } = nextServiceId();
  const service = broker.createService(new TestService(broker, id, name));
  await broker.waitForServices(name);

  return service;
}

function getAlgoMock(): jest.Mocked<Algo> {
  const mock = MockAlgo.mock.instances[0] as jest.Mocked<Algo>;
  mock.state = State.Initializing;

  return mock;
}

describe('BTC-USD Template service', () => {
  let broker: ServiceBroker;

  beforeAll(async () => {
    broker = new ServiceBroker({ logger: false });
    broker.createService(AlgoInstanceService);
    broker.createService(FeeService);

    await broker.start();
  });

  afterAll(async () => {
    await broker.stop();
  });

  describe('on create', () => {
    it('loads all required fees', async () => {
      await createNewTestService(broker);

      const algo = getAlgoMock();
      expect(algo.onShortFee).toHaveBeenCalledTimes(2);
      expect(algo.onLongFee).toHaveBeenCalledTimes(2);
      expect(algo.onPegFee).toHaveBeenCalledTimes(2);
    });
  });

  describe('event handlers', () => {
    it('updates short fees', async () => {
      await createNewTestService(broker);

      const algo = getAlgoMock();

      algo.onShortFee.mockClear();
      const shortTradeFee = factories.fee.build({
        service: 'trade-taker',
        serviceProvider: 'foxbit',
      });
      broker.emit('fees.foxbit.trade-taker.update', shortTradeFee);
      expect(algo.onShortFee).toHaveBeenCalledWith('trade-taker', shortTradeFee);

      algo.onShortFee.mockClear();
      const shortWithdrawFee = factories.fee.build({
        service: 'withdraw-brl',
        serviceProvider: 'foxbit',
      });
      broker.emit('fees.foxbit.withdraw-brl.update', shortWithdrawFee);
      expect(algo.onShortFee).toHaveBeenCalledWith('withdraw-brl', shortWithdrawFee);

      algo.onShortFee.mockClear();
      const unknownFee = factories.fee.build({
        service: 'unknown',
        serviceProvider: 'foxbit',
      });
      broker.emit('fees.foxbit.unknown.update', unknownFee);
      expect(algo.onShortFee).not.toHaveBeenCalled();
    });

    it('updates long fees', async () => {
      await createNewTestService(broker);

      const algo = getAlgoMock();

      algo.onLongFee.mockClear();
      const longTradeFee = factories.fee.build({
        service: 'trade-taker',
        serviceProvider: 'bitstamp',
      });
      broker.emit('fees.bitstamp.trade-taker.update', longTradeFee);
      expect(algo.onLongFee).toHaveBeenCalledWith('trade-taker', longTradeFee);

      algo.onLongFee.mockClear();
      const longWithdrawFee = factories.fee.build({
        service: 'withdraw-btc',
        serviceProvider: 'bitstamp',
      });
      broker.emit('fees.bitstamp.withdraw-btc.update', longWithdrawFee);
      expect(algo.onLongFee).toHaveBeenCalledWith('withdraw-btc', longWithdrawFee);

      algo.onLongFee.mockClear();
      const unknownFee = factories.fee.build({
        service: 'unknown',
        serviceProvider: 'bitstamp',
      });
      broker.emit('fees.bitstamp.unknown.update', unknownFee);
      expect(algo.onLongFee).not.toHaveBeenCalled();
    });

    it('updates peg fees', async () => {
      await createNewTestService(broker);

      const algo = getAlgoMock();

      algo.onPegFee.mockClear();
      const pegExchangeFee = factories.fee.build({
        service: 'exchange',
        serviceProvider: 'plural',
      });
      broker.emit('fees.plural.exchange.update', pegExchangeFee);
      expect(algo.onPegFee).toHaveBeenCalledWith('exchange', pegExchangeFee);

      algo.onPegFee.mockClear();
      const pegIofFee = factories.fee.build({
        service: 'iof',
        serviceProvider: 'plural',
      });
      broker.emit('fees.plural.iof.update', pegIofFee);
      expect(algo.onPegFee).toHaveBeenCalledWith('iof', pegIofFee);

      algo.onPegFee.mockClear();
      const unknownFee = factories.fee.build({
        service: 'unknown',
        serviceProvider: 'plural',
      });
      broker.emit('fees.plural.unknown.update', unknownFee);
      expect(algo.onPegFee).not.toHaveBeenCalled();
    });
  });

  describe('action setInput', () => {
    it('parses the input to update the algo params', async () => {
      const service = await createNewTestService(broker);

      const algo = getAlgoMock();
      algo.setInput.mockResolvedValue();

      const params: PartialObject = {
        totalQuantity: '2',
        maxOrderQuantity: '1',
        targetSpread: '1.5',
        crowdFactor: '1',
      };

      await broker.call<AlgoData, PartialObject>(`${service.name}.setInput`, params);

      expect(algo.setInput).toHaveBeenCalledWith<InputParameters[]>({
        totalQuantity: 2,
        maxOrderQuantity: 1,
        targetSpread: 1.5,
        crowdFactor: 1,
        manualPegQuote: 0,
      });
    });

    describe('with invalid input', () => {
      it('propagates the rejection', async () => {
        const service = await createNewTestService(broker);

        const algo = getAlgoMock();
        algo.setInput.mockRejectedValue(new Error());
        const result = broker.call<AlgoData, PartialObject>(`${service.name}.setInput`, {});

        await expect(result).toReject();
      });
    });
  });

  describe('action togglePause', () => {
    it('toggles the pause toggle', async () => {
      await createNewTestService(broker);

      const algo = getAlgoMock();
      algo.togglePause();

      expect(algo.togglePause).toHaveBeenCalled();
    });
  });
});
