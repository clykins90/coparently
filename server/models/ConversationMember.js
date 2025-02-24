// server/models/ConversationMember.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ConversationMember = sequelize.define('ConversationMember', {
      conversation_id: {
        type: DataTypes.INTEGER,
        references: { model: 'conversations', key: 'id' },
        primaryKey: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        references: { model: 'users', key: 'id' },
        primaryKey: true
      },
      joined_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      last_read: {
        type: DataTypes.DATE,
        allowNull: true
      }
    }, {
      tableName: 'conversation_members',
      timestamps: false
    });
  
    // Optionally, you can add association helper function if needed.
    ConversationMember.associate = (models) => {
      // Not strictly required here if associations are set in User and Conversation.
    };
  
    return ConversationMember;
  };