import Sequelize from 'sequelize';
import { AlgoInstance } from './algo-instance';

export class BtcUsdArbitrageConciliation extends Sequelize.Model {
  [x: string]: any;
}

export function initBtcUsdArbitrageConciliation(sequelize: Sequelize.Sequelize): void {
  BtcUsdArbitrageConciliation.init(
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
      conciliation: {
        type: Sequelize.JSON,
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
      tableName: 'btc_usd_arbitrage_conciliation',
    },
  );
}
