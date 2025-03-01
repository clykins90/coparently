const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ChildParentLink = sequelize.define('ChildParentLink', {
    id: { 
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    child_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    parent_user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    relationship: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Describes the relationship between child and parent (e.g., "mother", "father")'
    },
    can_view_messages: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: 'Whether the parent can view messages sent by this child'
    }
  }, {
    tableName: 'child_parent_links',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  ChildParentLink.associate = (models) => {
    ChildParentLink.belongsTo(models.User, { 
      foreignKey: 'child_user_id',
      as: 'childUser'
    });
    
    ChildParentLink.belongsTo(models.User, { 
      foreignKey: 'parent_user_id',
      as: 'parentUser'
    });
  };

  return ChildParentLink;
}; 