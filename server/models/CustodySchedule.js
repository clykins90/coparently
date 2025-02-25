const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CustodySchedule = sequelize.define('CustodySchedule', {
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
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Null means indefinite'
    },
    schedule_type: {
      type: DataTypes.ENUM('weekly', 'biweekly', 'monthly', 'custom'),
      defaultValue: 'weekly',
      allowNull: false
    },
    schedule_pattern: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'JSON object containing the custody pattern details'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false
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
      defaultValue: 'pending',
      allowNull: false
    }
  }, {
    tableName: 'custody_schedules',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  CustodySchedule.associate = (models) => {
    // Schedule belongs to a creator (user who created the schedule)
    CustodySchedule.belongsTo(models.User, { 
      as: 'creator',
      foreignKey: 'created_by_id' 
    });
    
    // Schedule is associated with one or more children
    CustodySchedule.belongsToMany(models.Child, {
      through: 'schedule_children',
      foreignKey: 'schedule_id',
      otherKey: 'child_id'
    });
    
    // Schedule involves two parents
    CustodySchedule.belongsToMany(models.User, {
      through: 'schedule_parents',
      foreignKey: 'schedule_id',
      otherKey: 'user_id',
      as: 'parents'
    });
  };

  return CustodySchedule;
}; 