module.exports = {
  up: (queryInterface) => {
    const timestamps = {
      created_at: new Date(),
      updated_at: new Date(),
    };

    return queryInterface.bulkInsert('algo_otc_instances', [
      {
        active: true, spread: 0, ...timestamps,
      },
      {
        active: false, spread: 0, ...timestamps,
      },
      {
        active: true, spread: 0, ...timestamps,
      },
      {
        active: true, spread: 3.12, ...timestamps,
      },
      {
        active: true, spread: 6.10, ...timestamps,
      },
      {
        active: true, spread: 5.20, ...timestamps,
      },
    ]);
  },

  down: (queryInterface) => queryInterface.bulkDelete('algo_otc_instances', null),
};
