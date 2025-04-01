const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const { Op } = require('sequelize');

// 获取消息列表
router.get('/', async (req, res) => {
  try {
    const { senderId, receiverId, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const messages = await Message.findAndCountAll({
      where: {
        [Op.or]: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId }
        ]
      },
      include: [
        { model: User, as: 'sender', attributes: ['username', 'avatar'] },
        { model: User, as: 'receiver', attributes: ['username', 'avatar'] }
      ],
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({ messages: messages.rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 发送消息
router.post('/', async (req, res) => {
  try {
    const message = await Message.create({
      senderId: req.body.senderId,
      receiverId: req.body.receiverId,
      content: req.body.content,
    });

    const populatedMessage = await Message.findByPk(message.id, {
      include: [
        { model: User, as: 'sender', attributes: ['username', 'avatar'] },
        { model: User, as: 'receiver', attributes: ['username', 'avatar'] }
      ]
    });

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 