module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('algo_otc_instances',
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      spread: {
        type: Sequelize.DECIMAL(32, 16),
        allowNull: false,
      },
      endedAt: {
        type: Sequelize.DATE,
        field: 'ended_at',
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

  down: (queryInterface, _Sequelize) => queryInterface.dropTable('algo_otc_instances'),
};
