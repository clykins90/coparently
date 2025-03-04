'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Store Google Calendar tokens and settings
    await queryInterface.createTable('user_google_calendars', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      access_token: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      refresh_token: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      token_expiry: {
        type: Sequelize.DATE,
        allowNull: true
      },
      coparently_calendar_id: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'ID of the Coparently calendar in Google'
      },
      sync_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Store which Google Calendars to display in Coparently
    await queryInterface.createTable('user_selected_calendars', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      google_calendar_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      calendar_name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      color: {
        type: Sequelize.STRING,
        allowNull: true
      },
      display_in_coparently: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Map between Coparently events and Google Calendar events
    await queryInterface.createTable('event_sync_mappings', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      coparently_event_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'calendar_events',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      google_event_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      google_calendar_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      last_synced: {
        type: Sequelize.DATE,
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('event_sync_mappings');
    await queryInterface.dropTable('user_selected_calendars');
    await queryInterface.dropTable('user_google_calendars');
  }
}; 