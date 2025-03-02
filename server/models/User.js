// server/models/User.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: { 
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    hashed_password: {
      type: DataTypes.STRING,
      allowNull: true
    },
    google_id: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true
    },
    google_profile_picture: {
      type: DataTypes.STRING,
      allowNull: true
    },
    auth_provider: {
      type: DataTypes.ENUM('local', 'google'),
      defaultValue: 'local',
      allowNull: false
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'parent',
      validate: {
        isIn: [['parent', 'child']]
      }
    }
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  User.associate = (models) => {
    User.belongsToMany(models.Conversation, {
      through: models.ConversationMember,
      foreignKey: 'user_id',
      otherKey: 'conversation_id'
    });
    User.hasMany(models.Message, { foreignKey: 'sender_id' });
    
    // Add associations for calendar functionality
    User.belongsToMany(models.Child, {
      through: 'parent_children',
      foreignKey: 'user_id',
      otherKey: 'child_id'
    });
    
    User.hasMany(models.CalendarEvent, { 
      foreignKey: 'created_by_id',
      as: 'createdEvents'
    });
    
    User.hasMany(models.CalendarEvent, { 
      foreignKey: 'responsible_parent_id',
      as: 'responsibleEvents'
    });
    
    User.hasMany(models.CustodySchedule, { 
      foreignKey: 'created_by_id',
      as: 'createdSchedules'
    });
    
    User.belongsToMany(models.CustodySchedule, {
      through: 'schedule_parents',
      foreignKey: 'user_id',
      otherKey: 'schedule_id',
      as: 'custodySchedules'
    });
    
    // Add associations for partner requests
    User.hasMany(models.PartnerRequest, {
      foreignKey: 'requester_id',
      as: 'sentPartnerRequests'
    });
    
    User.hasMany(models.PartnerRequest, {
      foreignKey: 'recipient_id',
      as: 'receivedPartnerRequests'
    });
    
    // Add associations for child-parent links
    User.hasMany(models.ChildParentLink, {
      foreignKey: 'child_user_id',
      as: 'parentLinks'
    });
    
    User.hasMany(models.ChildParentLink, {
      foreignKey: 'parent_user_id',
      as: 'childLinks'
    });
  };

  return User;
};