import { Op } from 'sequelize';
import { sequelize } from '../../app/models';
import {
  initBtcUsdArbitrageExecution,
  BtcUsdArbitrageExecution as Model,
} from '../../app/models/btc-usd-arbitrage-execution';
import { AlgoInstance as AlgoModel } from '../../app/models/algo-instance';
import { ExecutionContext } from '../../app/algos/btc-usd-arbitrage';
import {
  setLongLeg, setShortLeg, LongLeg, ShortLeg,
} from './btc-usd-arbitrage-execution';
import { summary } from '../../app/algos/btc-usd-arbitrage/summary';
import factories from '../../spec/factories';

describe('After an arbirage execution, summary must be updated with realized trade data', () => {
  const ctx: ExecutionContext = factories.context.build();
  const longleg: LongLeg = factories.longleg.build();
  const shortleg: ShortLeg = factories.shorteg.build();
  let algoInstanceId: number;
  let arbitrageExecutionId: string;

  initBtcUsdArbitrageExecution(sequelize);

  afterAll(async () => {
    await AlgoModel.destroy({
      where: { id: { [Op.gt]: 0 } },
    });
  });

  afterEach(async () => {
    await Model.destroy({
      where: { id: arbitrageExecutionId },
    });
  });

  describe('after receiving just longLeg', () => {
    beforeAll(async () => {
      algoInstanceId = await (await AlgoModel.create({ algoKind: 'btc-usd-arbitrage' })).id;
      await Model.create({
        algoInstanceId,
        summary: summary(ctx),
        context: ctx,
        needsConciliation: false,
        conciliationId: null,
      }).then((result: Model) => {
        arbitrageExecutionId = String(result.id);
      });
    });
    it('does NOT change summary', async () => {
      longleg.order.arbitrageExecutionId = arbitrageExecutionId;
      await setLongLeg(longleg);
      const arbitrageExecution = await Model.findOne({ where: { id: arbitrageExecutionId } }) || new Model();
      const quantityLong = Number(arbitrageExecution.summary.longLeg.quantity) || 0;
      expect(quantityLong).toEqual(ctx.quantityLong);
    });
  });

  describe('after receiving just shortLeg', () => {
    beforeAll(async () => {
      algoInstanceId = await (await AlgoModel.create({ algoKind: 'btc-usd-arbitrage' })).id;
      const arbitrageExecution = await Model.create({
        algoInstanceId,
        summary: summary(ctx),
        context: ctx,
        needsConciliation: false,
        conciliationId: null,
      });
      if (arbitrageExecution) {
        arbitrageExecutionId = String(arbitrageExecution.id);
      }
    });
    it('does NOT change summary', async () => {
      shortleg.order.arbitrageExecutionId = arbitrageExecutionId;
      await setShortLeg(shortleg);
      const arbitrageExecution = await Model.findOne({ where: { id: arbitrageExecutionId } }) || new Model();
      const quantityShort = Number(arbitrageExecution.summary.shortLeg.quantity) || 0;
      expect(quantityShort).toEqual(ctx.quantityShort);
    });
  });

  describe('after receiving both shortleg & longleg', () => {
    beforeAll(async () => {
      algoInstanceId = await (await AlgoModel.create({ algoKind: 'btc-usd-arbitrage' })).id;
      const arbitrageExecution = await Model.create({
        algoInstanceId,
        summary: summary(ctx),
        context: ctx,
        needsConciliation: false,
        conciliationId: null,
      });
      if (arbitrageExecution) {
        arbitrageExecutionId = String(arbitrageExecution.id);
      }
    });
    it('summary MUST be changed', async () => {
      longleg.order.arbitrageExecutionId = arbitrageExecutionId;
      shortleg.order.arbitrageExecutionId = arbitrageExecutionId;
      await setLongLeg(longleg);
      await setShortLeg(shortleg);
      const arbitrageExecution = await Model.findOne({ where: { id: arbitrageExecutionId } }) || new Model();
      const quantityShort = Number(arbitrageExecution.summary.shortLeg.quantity) || 0;
      expect(quantityShort).toEqual(shortleg.status.quantityExecuted);
    });
  });
});
