import { Op } from 'sequelize';
import { sequelize } from '../../app/models';
import {
  initBtcUsdArbitrageExecution,
  BtcUsdArbitrageExecution as ModelArbitrageExecution,
} from '../../app/models/btc-usd-arbitrage-execution';
import {
  Conciliation,
  AccumulatedExecutions,
} from './btc-usd-arbitrage-conciliation';
import { AlgoInstance as AlgoModel } from '../../app/models/algo-instance';
import { summary } from '../../app/algos/btc-usd-arbitrage/summary';
import factories from '../../spec/factories';

describe('templates/concilitation', () => {
  initBtcUsdArbitrageExecution(sequelize);

  const conciliation = new Conciliation();

  let algoInstanceId: number;

  const context = factories.context.build();
  const arbitrageExecutions = Array<ModelArbitrageExecution>();

  async function createInstance(): Promise<number> {
    return (await AlgoModel.create({ algoKind: 'btc-usd-arbitrage' })).id;
  }

  async function createArbitrageExecution(
    quantityLong: number,
    quantityShort: number,
  ): Promise<ModelArbitrageExecution> {
    context.quantityLong = quantityLong;
    context.quantityShort = quantityShort;
    return ModelArbitrageExecution.create({
      algoInstanceId,
      summary: summary(context),
      context,
      needsConciliation: !(context.quantityLong > 0),
      conciliationId: null,
    });
  }

  beforeAll(async () => {
    algoInstanceId = await createInstance();
    arbitrageExecutions.push(await createArbitrageExecution(0, 0.0011));
    arbitrageExecutions.push(await createArbitrageExecution(0, 0.0011));
  });

  afterEach(async () => {
    arbitrageExecutions.length = 0;
  });

  afterAll(async () => {
    await ModelArbitrageExecution.destroy({
      where: { id: { [Op.gt]: 0 } },
    });
  });

  describe('.getArbitrageExecutions', () => {
    describe('with arbitrage executions from valid instanceId', () => {
      it('should return array of BtcUSDArbitrageExecution objects', async () => {
        const executions = await conciliation.getArbitrageExecutions(algoInstanceId);

        expect(executions[0]).toEqual(
          expect.objectContaining({
            algoInstanceId,
            conciliationId: null,
            needsConciliation: true,
          }),
        );
      });
    });

    describe('with arbitrage executions from invalid instanceId', () => {
      it('Should return array of BtcUSDArbitrageExecution objects', async () => {
        const executions = await conciliation.getArbitrageExecutions(0);

        expect(executions[0]).toEqual(undefined);
      });
    });
  });

  describe('.getLongAccumulatedExecutions', () => {
    describe('with accumulated executions from valid instanceId', () => {
      it('should return valid AccumulatedExecutions object', async () => {
        const acumulatedExecutions = await conciliation.getLongAccumulatedExecutions(algoInstanceId);

        expect(acumulatedExecutions).toEqual(
          expect.objectContaining({
            algoInstanceId,
            totalAccumulated: 0.0022,
          }),
        );
      });
    });

    describe('with accumulated executions from invalid instanceId', () => {
      it('should return AcumulatedExecutions object with totalAccumulated === 0', async () => {
        const acumulatedExecutions = await conciliation.getLongAccumulatedExecutions(0);

        expect(acumulatedExecutions).toEqual(
          expect.objectContaining({
            algoInstanceId: 0,
            totalAccumulated: 0,
          }),
        );
      });
    });

    describe('when accumulated executions needsConciliation === false', () => {
      it('should return AcumulatedExecutions object with totalAccumulated === 0', async () => {
        algoInstanceId = await createInstance();
        arbitrageExecutions.push(await createArbitrageExecution(0.0011, 0.0011));
        arbitrageExecutions.push(await createArbitrageExecution(0.0011, 0.0011));
        const acumulatedExecutions = await conciliation.getLongAccumulatedExecutions(0);

        expect(acumulatedExecutions).toEqual(
          expect.objectContaining({
            algoInstanceId: 0,
            executions: [],
            totalAccumulated: 0,
          }),
        );
      });
    });
  });

  describe('.getConciliation', () => {
    describe('when accumulated executions totalAccumulated < 25 USD', () => {
      it('should return valid AccumulatedExecutions object with totalAccumulated === 0', async () => {
        conciliation.updateLongPrice(10400);
        algoInstanceId = await createInstance();
        arbitrageExecutions.push(await createArbitrageExecution(0, 0.0011));
        arbitrageExecutions.push(await createArbitrageExecution(0, 0.0011));
        const acumulatedExecutions = await conciliation.getConciliation(algoInstanceId);

        expect(acumulatedExecutions).toEqual(
          expect.objectContaining({
            algoInstanceId,
            totalAccumulated: 0,
          }),
        );
      });
    });

    describe('when accumulated executions totalAccumulated > 25 USD', () => {
      it('should return valid AccumulatedExecutions object with totalAccumulated > 0', async () => {
        conciliation.updateLongPrice(10400);
        algoInstanceId = await createInstance();
        arbitrageExecutions.push(await createArbitrageExecution(0, 0.0021));
        arbitrageExecutions.push(await createArbitrageExecution(0, 0.0021));
        const acumulatedExecutions = await conciliation.getConciliation(algoInstanceId);

        expect(acumulatedExecutions).toEqual(
          expect.objectContaining({
            algoInstanceId,
            totalAccumulated: 0.0042,
          }),
        );
      });
    });

    describe('with accumulated executions from invalid instanceId', () => {
      it('should return valid AccumulatedExecutions object with totalAccumulated === 0', async () => {
        conciliation.updateLongPrice(10400);
        const acumulatedExecutions = await conciliation.getConciliation(0);

        expect(acumulatedExecutions).toEqual(
          expect.objectContaining({
            algoInstanceId: 0,
            totalAccumulated: 0,
          }),
        );
      });
    });
  });

  describe('.updateLongPrice', () => {
    describe('given totalAccumulated before update price and after update price', () => {
      it('should return different totalAccumulated between totalBefore and totalAfter', async () => {
        const price = { totalBefore: 0, totalAfter: 0 };
        price.totalBefore = (await conciliation.getConciliation(algoInstanceId)).totalAccumulated;

        // Reduce the price in order to reduce amount in USD below of 25
        conciliation.updateLongPrice(1400);

        price.totalAfter = (await conciliation.getConciliation(algoInstanceId)).totalAccumulated;
        expect(price).toEqual({ totalBefore: 0.0042, totalAfter: 0 });
      });
    });
  });

  describe('.conciliate', () => {
    describe('then conciliate with AccumulatedExecution totalAccumulated > 0', () => {
      it('should return callback with AccumulatedExecutions object with totalAccumulated > 0', () => {
        const arbitrageConciliation = {
          algoInstanceId,
          totalAccumulated: 25,
          executions: [],
        };

        conciliation.conciliate(algoInstanceId, (result: AccumulatedExecutions) => {
          expect(result).toEqual(arbitrageConciliation);
        });
      });
    });

    describe('then conciliate with AccumulatedExecution totalAccumulated === 0', () => {
      it('should NOT return callback', () => {
        const callback = jest.fn();

        conciliation.conciliate(algoInstanceId, () => {
          expect(callback).not.toHaveBeenCalled();
        });
      });
    });
  });
});
