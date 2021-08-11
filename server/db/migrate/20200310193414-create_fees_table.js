module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('fees',
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      serviceProvider: {
        type: Sequelize.STRING(30),
        allowNull: false,
        field: 'service_provider',
      },
      service: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      fixed: {
        type: Sequelize.DECIMAL(32, 16),
        allowNull: false,
        defaultValue: 0.0,
      },
      rate: {
        type: Sequelize.DECIMAL(32, 16),
        allowNull: false,
        defaultValue: 0.0,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'created_at',
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'updated_at',
      },
    }),

  down: (queryInterface, _Sequelize) => queryInterface.dropTable('fees'),
};
