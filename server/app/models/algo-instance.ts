import Sequelize from 'sequelize';

export class AlgoInstance extends Sequelize.Model {
  id!: number;

  algoKind!: string;

  active!: boolean;
}

export function initAlgoInstance(sequelize: Sequelize.Sequelize): void {
  AlgoInstance.init(
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      algoKind: {
        type: Sequelize.STRING(30),
        allowNull: false,
        field: 'algo_kind',
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
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
      tableName: 'algo_instances',
    },
  );
}
