import {
  BtcUsdArbitrageExecution as Model,
} from '../../app/models/btc-usd-arbitrage-execution';

export interface AccumulatedExecutions {
  algoInstanceId: number;
  totalAccumulated: number;
  executions: Array<{
    id: number;
    qtyAccumulated: number;
  }>;
}

export class Conciliation {
  private interval!: NodeJS.Timeout;

  private actualPrice = 0;

  private arbitrageExecutions: Array<Model> | undefined;

  private minUSDValue = 25;

  async getArbitrageExecutions(instanceId: number): Promise<Array<Model>> {
    this.arbitrageExecutions = await Model.findAll({
      where: {
        // eslint-disable-next-line @typescript-eslint/camelcase
        algo_instance_id: instanceId,
        needsConciliation: 1,
        conciliationId: null,
      },
    });
    return this.arbitrageExecutions;
  }

  getLongAccumulatedExecutions(algoInstanceId: number): Promise<AccumulatedExecutions> {
    const accumulatedExecutions: AccumulatedExecutions = {
      algoInstanceId,
      totalAccumulated: 0,
      executions: [],
    };
    return this.getArbitrageExecutions(algoInstanceId).then((response: Array<Model>) => {
      response.forEach((arbitrageExecution: Model) => {
        if (Number(arbitrageExecution.summary.longLeg.quantity) === 0) {
          accumulatedExecutions.totalAccumulated += Number(arbitrageExecution.summary.shortLeg.quantity);
          accumulatedExecutions.executions.push({
            id: arbitrageExecution.id,
            qtyAccumulated: Number(arbitrageExecution.summary.shortLeg.quantity),
          });
        }
      });
      return accumulatedExecutions;
    }).catch(() => {
      accumulatedExecutions.totalAccumulated = 0;
      return accumulatedExecutions;
    });
  }

  async getConciliation(instanceId: number): Promise<AccumulatedExecutions> {
    const accumulatedExecutions = await this.getLongAccumulatedExecutions(instanceId);
    const usdAccumulated = accumulatedExecutions.totalAccumulated * this.actualPrice;

    if (usdAccumulated > this.minUSDValue) {
      return accumulatedExecutions;
    }
    accumulatedExecutions.totalAccumulated = 0;
    return accumulatedExecutions;
  }

  updateLongPrice(price: number): void {
    this.actualPrice = price;
  }

  async conciliate(algoInstanceId: number, sendConciliation: Function) {
    const accumulatedExecutions = await this.getConciliation(algoInstanceId);
    if (accumulatedExecutions.totalAccumulated > 0) {
      sendConciliation(accumulatedExecutions);
    }
  }

  start(
    algoInstanceId: number,
    sendConciliation: Function,
  ) {
    if (!this.interval) {
      this.interval = setInterval(() => {
        this.conciliate(algoInstanceId, sendConciliation);
      }, 15000);
    }
  }

  stop(): void {
    clearInterval(this.interval);
  }
}
