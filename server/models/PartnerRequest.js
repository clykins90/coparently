const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PartnerRequest = sequelize.define('PartnerRequest', {
    id: { 
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    requester_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    recipient_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    recipient_email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'invited'),
      defaultValue: 'pending',
      allowNull: false
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'partner_requests',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  PartnerRequest.associate = (models) => {
    // A request belongs to a requester (user who sent the request)
    PartnerRequest.belongsTo(models.User, { 
      as: 'requester',
      foreignKey: 'requester_id' 
    });
    
    // A request belongs to a recipient (user who receives the request)
    PartnerRequest.belongsTo(models.User, { 
      as: 'recipient',
      foreignKey: 'recipient_id' 
    });
  };

  return PartnerRequest;
}; 