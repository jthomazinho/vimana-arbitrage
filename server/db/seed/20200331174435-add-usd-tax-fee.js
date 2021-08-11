module.exports = {
  up: (queryInterface) => {
    const timestamps = {
      created_at: new Date(),
      updated_at: new Date(),
    };

    return queryInterface.bulkInsert('fees', [
      {
        service_provider: 'plural', service: 'iof', fixed: 0, rate: 0, ...timestamps,
      },
    ]);
  },

  down: (queryInterface) => queryInterface.bulkDelete('fees', {
    service_provider: 'plural', service: 'iof',
  }, null),
};
