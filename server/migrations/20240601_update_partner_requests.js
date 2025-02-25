'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, update the ENUM type to include 'invited'
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_partner_requests_status" ADD VALUE 'invited' AFTER 'rejected';
    `).catch(error => {
      // If the error is about the value already existing, we can ignore it
      if (!error.message.includes('already exists')) {
        throw error;
      }
    });

    // Add recipient_email column
    await queryInterface.addColumn('partner_requests', 'recipient_email', {
      type: Sequelize.STRING,
      allowNull: true
    });

    // Make recipient_id nullable (since we won't have an ID for invited users)
    await queryInterface.changeColumn('partner_requests', 'recipient_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Remove the unique constraint
    await queryInterface.removeConstraint('partner_requests', 'unique_partner_request');

    // Add a new unique constraint that accounts for both recipient_id and recipient_email
    await queryInterface.addConstraint('partner_requests', {
      fields: ['requester_id', 'recipient_id'],
      type: 'unique',
      name: 'unique_partner_request_by_id',
      where: {
        recipient_id: {
          [Sequelize.Op.ne]: null
        }
      }
    });

    await queryInterface.addConstraint('partner_requests', {
      fields: ['requester_id', 'recipient_email'],
      type: 'unique',
      name: 'unique_partner_request_by_email',
      where: {
        recipient_email: {
          [Sequelize.Op.ne]: null
        }
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the new constraints
    await queryInterface.removeConstraint('partner_requests', 'unique_partner_request_by_id');
    await queryInterface.removeConstraint('partner_requests', 'unique_partner_request_by_email');

    // Add back the original constraint
    await queryInterface.addConstraint('partner_requests', {
      fields: ['requester_id', 'recipient_id'],
      type: 'unique',
      name: 'unique_partner_request'
    });

    // Make recipient_id non-nullable again
    await queryInterface.changeColumn('partner_requests', 'recipient_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Remove recipient_email column
    await queryInterface.removeColumn('partner_requests', 'recipient_email');

    // We can't remove values from an ENUM type in PostgreSQL without recreating it
    // So we'll skip that part in the down migration
  }
}; 