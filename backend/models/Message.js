const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// 定义关联关系
Message.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });
Message.belongsTo(User, { as: 'receiver', foreignKey: 'receiverId' });

module.exports = Message; 