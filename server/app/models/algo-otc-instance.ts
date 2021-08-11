import Sequelize from 'sequelize';

export class AlgoOTCInstance extends Sequelize.Model {
  readonly id!: number;

  readonly active!: boolean;

  readonly spread!: number;
}

export function initAlgoOTCInstance(sequelize: Sequelize.Sequelize): void {
  AlgoOTCInstance.init(
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      spread: {
        type: Sequelize.DECIMAL(32, 16),
        allowNull: false,
      },
      endedAt: {
        type: Sequelize.DATE,
        field: 'ended_at',
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
      tableName: 'algo_otc_instances',
    },
  );
}
