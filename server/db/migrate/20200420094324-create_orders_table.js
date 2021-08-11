/* eslint-disable arrow-body-style */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('orders',
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
        },
        side: {
          type: new Sequelize.CHAR(1),
          allowNull: false,
        },
        type: {
          type: new Sequelize.STRING(30),
          allowNull: false,
        },
        quantity: {
          type: new Sequelize.DECIMAL(32, 16),
          allowNull: false,
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
      });

    await queryInterface.addIndex('orders', { fields: ['exchange_order_id'] });
  },

  down: async (queryInterface, _Sequelize) => {
    await queryInterface.dropTable('orders');
  },
};
