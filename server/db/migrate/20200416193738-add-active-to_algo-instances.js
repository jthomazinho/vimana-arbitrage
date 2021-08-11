module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('algo_instances', 'active', {
      type: Sequelize.BOOLEAN,
      after: 'algo_kind',
    });

    await queryInterface.addIndex('algo_instances', { fields: ['algo_kind', 'active'], unique: true });
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('algo_instances', ['algo_kind', 'active']);
    await queryInterface.removeColumn('algo_instances', 'active');
  },
};
