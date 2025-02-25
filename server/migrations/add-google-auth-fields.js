'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add Google OAuth fields to users table
    await queryInterface.addColumn('users', 'google_id', {
      type: Sequelize.STRING,
      unique: true,
      allowNull: true
    });
    
    await queryInterface.addColumn('users', 'google_profile_picture', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('users', 'auth_provider', {
      type: Sequelize.ENUM('local', 'google'),
      defaultValue: 'local',
      allowNull: false
    });
    
    // Make hashed_password and phone nullable for Google OAuth users
    await queryInterface.changeColumn('users', 'hashed_password', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.changeColumn('users', 'phone', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert changes
    await queryInterface.removeColumn('users', 'google_id');
    await queryInterface.removeColumn('users', 'google_profile_picture');
    await queryInterface.removeColumn('users', 'auth_provider');
    
    // Make hashed_password and phone required again
    await queryInterface.changeColumn('users', 'hashed_password', {
      type: Sequelize.STRING,
      allowNull: false
    });
    
    await queryInterface.changeColumn('users', 'phone', {
      type: Sequelize.STRING,
      allowNull: false
    });
  }
}; 