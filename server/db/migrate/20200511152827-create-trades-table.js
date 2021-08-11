module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable(
      'trades',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        exchangeTradeId: {
          type: Sequelize.STRING(36),
          allowNull: false,
          field: 'exchange_trade_id',
        },
        exchange: {
          type: new Sequelize.STRING(10),
          allowNull: false,
        },
        tradeTime: {
          type: Sequelize.DATE,
          allowNull: false,
          field: 'trade_time',
        },
        symbol: {
          type: Sequelize.STRING(30),
          allowNull: false,
        },
        side: {
          type: new Sequelize.CHAR(1),
          allowNull: false,
        },
        quantity: {
          type: new Sequelize.DECIMAL(32, 16),
          allowNull: false,
        },
        price: {
          type: new Sequelize.DECIMAL(32, 16),
          allowNull: false,
        },
        orderId: {
          type: Sequelize.INTEGER,
          references: {
            model: 'orders',
            key: 'id',
          },
          allowNull: false,
          field: 'order_id',
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
    );
  },

  down: async (queryInterface, _Sequelize) => {
    await queryInterface.dropTable('trades');
  },
};
