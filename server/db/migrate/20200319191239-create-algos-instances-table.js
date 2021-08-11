module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('algo_instances',
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      algoKind: {
        type: Sequelize.STRING(30),
        allowNull: false,
        field: 'algo_kind',
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

  down: (queryInterface, _Sequelize) => queryInterface.dropTable('algo_instances'),
};
