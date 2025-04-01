const express = require('express');
const router = express.Router();
const messagesRouter = require('./messages');
const contacts = require('../data/contacts');

// 从messages模块获取messagesByContact
const messagesByContact = messagesRouter.messagesByContact;

// 获取联系人列表
router.get('/', (req, res) => {
  const contactsWithLastMessage = contacts.map(contact => {
    const messages = messagesByContact[contact.id] || [];
    const lastMessage = messages[messages.length - 1];
    
    return {
      ...contact,
      lastMessage: lastMessage ? lastMessage.content : '',
      lastMessageTime: lastMessage ? lastMessage.timestamp : new Date().toISOString(),
      unreadCount: Math.floor(Math.random() * 5) // 随机未读消息数（0-4）
    };
  });
  
  res.json(contactsWithLastMessage);
});

// 获取单个联系人
router.get('/:id', (req, res) => {
  const contact = contacts.find(c => c.id === parseInt(req.params.id));
  if (!contact) {
    return res.status(404).json({ message: '联系人不存在' });
  }
  
  const messages = messagesByContact[contact.id] || [];
  const lastMessage = messages[messages.length - 1];
  
  res.json({
    ...contact,
    lastMessage: lastMessage ? lastMessage.content : '',
    lastMessageTime: lastMessage ? lastMessage.timestamp : new Date().toISOString(),
    unreadCount: Math.floor(Math.random() * 5) // 随机未读消息数（0-4）
  });
});

module.exports = router; 