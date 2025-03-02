'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add invitation fields to users table
    await queryInterface.addColumn('users', 'invitation_token', {
      type: Sequelize.STRING,
      allowNull: true
    });
    
    await queryInterface.addColumn('users', 'invitation_token_expiry', {
      type: Sequelize.DATE,
      allowNull: true
    });
    
    await queryInterface.addColumn('users', 'invitation_parent_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    });
    
    // Add status field to child_parent_links table
    await queryInterface.addColumn('child_parent_links', 'status', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'active'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove invitation fields from users table
    await queryInterface.removeColumn('users', 'invitation_token');
    await queryInterface.removeColumn('users', 'invitation_token_expiry');
    await queryInterface.removeColumn('users', 'invitation_parent_id');
    
    // Remove status field from child_parent_links table
    await queryInterface.removeColumn('child_parent_links', 'status');
  }
}; 