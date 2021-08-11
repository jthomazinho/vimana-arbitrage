module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('input_shared_instances',
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      takerRateBitstamp: {
        type: Sequelize.DECIMAL(32, 16),
        allowNull: false,
        field: 'taker_rate_bitstamp',
      },
      exchangeRate: {
        type: Sequelize.DECIMAL(32, 16),
        allowNull: false,
        field: 'exchange_rate',
      },
      iof: {
        type: Sequelize.DECIMAL(32, 16),
        allowNull: false,
        field: 'iof',
      },
      algoInstanceId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        field: 'algo_instance_id',
      },
      algoOTCInstanceId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        field: 'algo_otc_instance_id',
      },
      endedAt: {
        type: Sequelize.DATE,
        field: 'ended_at',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'created_at',
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'updated_at',
        defaultValue: Sequelize.NOW,
      },
    }),

  down: (queryInterface, _Sequelize) => queryInterface.dropTable('input_shared_instances'),
};
