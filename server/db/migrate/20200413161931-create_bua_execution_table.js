module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('btc_usd_arbitrage_executions',
      {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
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
        summary: {
          type: Sequelize.JSON,
          allowNull: true,
        },
        context: {
          type: Sequelize.JSON,
          allowNull: true,
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

    await queryInterface.addIndex('btc_usd_arbitrage_executions', { fields: ['algo_instance_id'] });
  },

  down: async (queryInterface, _Sequelize) => {
    await queryInterface.dropTable('btc_usd_arbitrage_executions');
  },
};
