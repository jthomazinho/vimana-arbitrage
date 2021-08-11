import Sequelize from 'sequelize';
import { AlgoInstance } from './algo-instance';

export class BtcUsdArbitrageExecution extends Sequelize.Model {
  summary: any;

  id!: number;
}

export function initBtcUsdArbitrageExecution(sequelize: Sequelize.Sequelize): void {
  BtcUsdArbitrageExecution.init(
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      algoInstanceId: {
        type: Sequelize.INTEGER,
        references: {
          model: AlgoInstance,
        },
        allowNull: false,
        field: 'algo_instance_id',
      },
      summary: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      context: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      needsConciliation: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
      },
      conciliationId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'created_at',
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'updated_at',
        defaultValue: Sequelize.NOW,
      },
    },
    {
      sequelize,
      tableName: 'btc_usd_arbitrage_executions',
    },
  );
}
