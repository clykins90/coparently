const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Child = sequelize.define('Child', {
    id: { 
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    color: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Color code for the child in the UI'
    },
    // Add a reference to a user account if this child has one
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Reference to a user account if this child has one'
    }
  }, {
    tableName: 'children',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  Child.associate = (models) => {
    // Child belongs to multiple parents (users)
    Child.belongsToMany(models.User, {
      through: 'parent_children',
      foreignKey: 'child_id',
      otherKey: 'user_id'
    });
    
    // Child can be associated with multiple calendar events
    Child.belongsToMany(models.CalendarEvent, {
      through: 'event_children',
      foreignKey: 'child_id',
      otherKey: 'event_id'
    });
    
    // A child can optionally have a user account
    Child.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'userAccount',
      constraints: false // Make this optional
    });
  };

  return Child;
}; 