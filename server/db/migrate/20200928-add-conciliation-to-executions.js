module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('btc_usd_arbitrage_executions', 'needsConciliation', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
    });
    await queryInterface.addColumn('btc_usd_arbitrage_executions', 'conciliationId', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },

  down: async (queryInterface, _Sequelize) => {
    await queryInterface.removeColumn('btc_usd_arbitrage_executions', 'needsConciliation');
    await queryInterface.removeColumn('btc_usd_arbitrage_executions', 'conciliationId');
  },
};
