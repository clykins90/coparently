const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CalendarEvent = sequelize.define('CalendarEvent', {
    id: { 
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: false
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: false
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    event_type: {
      type: DataTypes.ENUM('custody_transfer', 'appointment', 'activity', 'school', 'other'),
      defaultValue: 'other',
      allowNull: false
    },
    is_recurring: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    recurrence_pattern: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'JSON object containing recurrence details (frequency, interval, end date, etc.)'
    },
    is_all_day: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false
    },
    responsible_parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    created_by_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'approved',
      allowNull: false,
      comment: 'Status of event if it requires approval from the other parent'
    },
    color: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Color code for the event'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'calendar_events',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  CalendarEvent.associate = (models) => {
    // Event belongs to a creator (user who created the event)
    CalendarEvent.belongsTo(models.User, { 
      as: 'creator',
      foreignKey: 'created_by_id' 
    });
    
    // Event can have a responsible parent
    CalendarEvent.belongsTo(models.User, { 
      as: 'responsibleParent',
      foreignKey: 'responsible_parent_id' 
    });
    
    // Event can be associated with one or more children
    CalendarEvent.belongsToMany(models.Child, {
      through: 'event_children',
      foreignKey: 'event_id',
      otherKey: 'child_id'
    });
  };

  return CalendarEvent;
}; 