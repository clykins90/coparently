// server/models/Conversation.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Conversation = sequelize.define('Conversation', {
      id: { 
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      // We enforce allowed values with ENUM or CHECK constraint later
      conversation_type: {
        type: DataTypes.ENUM('linked_partner', 'standard'),
        allowNull: false
      }
    }, {
      tableName: 'conversations',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    });
  
    Conversation.associate = (models) => {
      // A conversation has many members (users) via the join table
      Conversation.belongsToMany(models.User, {
        through: models.ConversationMember,
        foreignKey: 'conversation_id',
        otherKey: 'user_id'
      });
      // A conversation has many messages
      Conversation.hasMany(models.Message, { foreignKey: 'conversation_id' });
    };
  
    return Conversation;
  };