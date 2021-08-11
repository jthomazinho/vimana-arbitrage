module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('orders', 'symbol', {
      type: Sequelize.STRING(30),
      after: 'exchange',
      allowNull: false,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('orders', 'symbol');
  },
};
