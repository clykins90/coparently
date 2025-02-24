// server/models/Message.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Message = sequelize.define('Message', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      conversation_id: {
        type: DataTypes.INTEGER,
        references: { model: 'conversations', key: 'id' },
        allowNull: false
      },
      sender_id: {
        type: DataTypes.INTEGER,
        references: { model: 'users', key: 'id' },
        allowNull: false
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      }
    }, {
      tableName: 'messages',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    });
  
    Message.associate = (models) => {
      // Each message belongs to a conversation
      Message.belongsTo(models.Conversation, { foreignKey: 'conversation_id' });
      // Each message has a sender (user)
      Message.belongsTo(models.User, { as: 'sender', foreignKey: 'sender_id' });
    };
  
    return Message;
  };