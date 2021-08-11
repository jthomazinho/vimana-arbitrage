module.exports = {
  up: (queryInterface) => queryInterface.addIndex('fees', {
    fields: ['service_provider', 'service'],
    unique: true,
  }),

  down: (queryInterface) => queryInterface.removeIndex('fees', ['service_provider', 'service']),
};
