module.exports = {
  up: async (queryInterface, _Sequelize) => {
    await queryInterface.addIndex('orders', {
      fields: ['exchange', 'exchange_order_id'],
      unique: true,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('orders', ['exchange', 'exchange_order_id']);
  },
};
