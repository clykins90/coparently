const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserGoogleCalendar = sequelize.define('UserGoogleCalendar', {
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
    access_token: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    refresh_token: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    token_expiry: {
      type: DataTypes.DATE,
      allowNull: true
    },
    coparently_calendar_id: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'ID of the Coparently calendar in Google'
    },
    sync_enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
    }
  }, {
    tableName: 'user_google_calendars',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  UserGoogleCalendar.associate = (models) => {
    UserGoogleCalendar.belongsTo(models.User, {
      foreignKey: 'user_id'
    });
  };

  return UserGoogleCalendar;
}; 