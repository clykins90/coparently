const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserSelectedCalendar = sequelize.define('UserSelectedCalendar', {
    id: { 
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    google_calendar_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    calendar_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    color: {
      type: DataTypes.STRING,
      allowNull: true
    },
    display_in_coparently: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    }
  }, {
    tableName: 'user_selected_calendars',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  UserSelectedCalendar.associate = (models) => {
    UserSelectedCalendar.belongsTo(models.User, {
      foreignKey: 'user_id'
    });
  };

  return UserSelectedCalendar;
}; 