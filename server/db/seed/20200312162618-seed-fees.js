module.exports = {
  up: (queryInterface) => {
    const timestamps = {
      created_at: new Date(),
      updated_at: new Date(),
    };

    return queryInterface.bulkInsert('fees', [
      {
        service_provider: 'foxbit', service: 'withdraw-brl', fixed: 0, rate: 0, ...timestamps,
      },
      {
        service_provider: 'foxbit', service: 'withdraw-btc', fixed: 0, rate: 0, ...timestamps,
      },
      {
        service_provider: 'foxbit', service: 'trade-taker', fixed: 0, rate: 0, ...timestamps,
      },
      {
        service_provider: 'bitstamp', service: 'withdraw-usd', fixed: 0, rate: 0, ...timestamps,
      },
      {
        service_provider: 'bitstamp', service: 'withdraw-btc', fixed: 0, rate: 0, ...timestamps,
      },
      {
        service_provider: 'bitstamp', service: 'trade-taker', fixed: 0, rate: 0, ...timestamps,
      },
      {
        service_provider: 'plural', service: 'exchange', fixed: 0, rate: 0, ...timestamps,
      },
    ]);
  },

  down: (queryInterface) => queryInterface.bulkDelete('fees', null),
};
