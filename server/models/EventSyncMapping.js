const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EventSyncMapping = sequelize.define('EventSyncMapping', {
    id: { 
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    coparently_event_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'calendar_events',
        key: 'id'
      }
    },
    google_event_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    google_calendar_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    last_synced: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'event_sync_mappings',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  EventSyncMapping.associate = (models) => {
    EventSyncMapping.belongsTo(models.CalendarEvent, {
      foreignKey: 'coparently_event_id'
    });
  };

  return EventSyncMapping;
}; 