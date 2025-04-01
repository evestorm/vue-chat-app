const express = require('express');
const router = express.Router();
const User = require('../models/User');

// 获取所有用户
router.get('/', async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 获取单个用户
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 创建用户
router.post('/', async (req, res) => {
  try {
    const user = await User.create({
      username: req.body.username,
      avatar: req.body.avatar,
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// 更新用户状态
router.patch('/:id/status', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    user.status = req.body.status;
    user.lastSeen = new Date();
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 