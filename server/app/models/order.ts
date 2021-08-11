import Sequelize from 'sequelize';

import * as oms from '../../lib/oms';

export class Order extends Sequelize.Model implements oms.Order {
  id!: number;

  exchangeOrderId!: string | undefined;

  algoInstanceId!: number;

  exchange!: oms.Exchange;

  symbol!: string;

  side!: oms.Side;

  type!: oms.Type;

  quantity!: number;

  price?: number | undefined;
}

export function initOrder(sequelize: Sequelize.Sequelize): void {
  Order.init(
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      exchangeOrderId: {
        type: new Sequelize.STRING(36),
        allowNull: true,
        field: 'exchange_order_id',
      },
      exchange: {
        type: new Sequelize.STRING(10),
        allowNull: false,
        validate: {
          isIn: [[...oms.exchanges]],
        },
      },
      symbol: {
        type: new Sequelize.STRING(30),
        allowNull: false,
      },
      side: {
        type: new Sequelize.CHAR(1),
        allowNull: false,
        validate: {
          isIn: [Object.values(oms.sides)],
        },
      },
      type: {
        type: new Sequelize.STRING(30),
        allowNull: false,
        validate: {
          isIn: [[...oms.types]],
        },
      },
      quantity: {
        type: new Sequelize.DECIMAL(32, 16),
        allowNull: true,
      },
      price: {
        type: new Sequelize.DECIMAL(32, 16),
        allowNull: true,
      },
      algoInstanceId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'algo_instances',
          key: 'id',
        },
        allowNull: false,
        field: 'algo_instance_id',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'created_at',
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'updated_at',
      },
    },
    {
      sequelize,
      tableName: 'orders',
    },
  );
}
