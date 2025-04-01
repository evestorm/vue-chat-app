const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  avatar: {
    type: DataTypes.STRING,
    defaultValue: 'https://via.placeholder.com/150'
  },
  status: {
    type: DataTypes.ENUM('online', 'offline'),
    defaultValue: 'offline'
  },
  lastSeen: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

module.exports = User; 