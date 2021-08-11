module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('btc_usd_arbitrage_conciliation',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },
        algoInstanceId: {
          type: Sequelize.INTEGER,
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
      });

    await queryInterface.addIndex('btc_usd_arbitrage_conciliation', { fields: ['algo_instance_id'] });
  },

  down: async (queryInterface, _Sequelize) => {
    await queryInterface.dropTable('btc_usd_arbitrage_conciliation');
  },
};
