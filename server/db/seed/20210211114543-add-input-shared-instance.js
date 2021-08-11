module.exports = {
  up: (queryInterface) => {
    const timestamps = {
      created_at: new Date(),
      updated_at: new Date(),
    };

    return queryInterface.bulkInsert('input_shared_instances', [
      {
        exchange_rate: 0, iof: 0, taker_rate_bitstamp: 0, ...timestamps,
      },
      {
        exchange_rate: 0, iof: 0, taker_rate_bitstamp: 0, ...timestamps,
      },
    ]);
  },

  down: (queryInterface) => queryInterface.bulkDelete('input_shared_instances', null),
};
