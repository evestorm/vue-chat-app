const express = require('express');
const router = express.Router();
const contacts = require('../data/contacts');

// 生成随机时间戳
function getRandomTimestamp(startDays, endDays) {
  const now = new Date();
  const start = new Date(now - startDays * 24 * 60 * 60 * 1000);
  const end = new Date(now - endDays * 24 * 60 * 60 * 1000);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
}

// 生成随机消息内容
function getRandomMessage() {
  const messages = [
    '你好！',
    '在吗？',
    '最近怎么样？',
    '有空一起吃饭吗？',
    '今天天气不错',
    '周末有什么安排？',
    '项目进展如何？',
    '收到了，谢谢！',
    '好的，没问题',
    '改天再聊',
    '这个想法很好',
    '需要我帮忙吗？',
    '什么时候有空？',
    '好的，我知道了',
    '这个问题我来解决',
    '你太客气了',
    '不用谢，应该的',
    '这个方案可行',
    '我们下次再聊',
    '祝你周末愉快',
    '工作顺利！',
    '注意身体',
    '早点休息',
    '明天见',
    '路上小心',
    '到家了吗？',
    '今天辛苦了',
    '周末愉快',
    '节日快乐',
    '新年快乐',
    '生日快乐！',
    '恭喜你！',
    '太棒了！',
    '继续加油！',
    '相信自己',
    '别担心',
    '慢慢来',
    '我理解',
    '我支持你',
    '保持联系',
    '随时找我',
    '我在这里',
    '我明白了',
    '我同意',
    '我不同意',
    '让我们讨论一下',
    '这是个好主意',
    '我们可以试试',
    '需要我解释吗？',
    '你做得对'
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

// 生成随机图片URL
function getRandomImage() {
  const images = [
    'https://picsum.photos/200/200?random=1',
    'https://picsum.photos/200/200?random=2',
    'https://picsum.photos/200/200?random=3',
    'https://picsum.photos/200/200?random=4',
    'https://picsum.photos/200/200?random=5',
    'https://picsum.photos/200/200?random=6',
    'https://picsum.photos/200/200?random=7',
    'https://picsum.photos/200/200?random=8',
    'https://picsum.photos/200/200?random=9',
    'https://picsum.photos/200/200?random=10'
  ];
  return images[Math.floor(Math.random() * images.length)];
}

// 生成随机消息内容（可能包含文字和图片）
function generateMessageContent(messageIndex) {
  // 确保至少有一种内容（文字或图片）
  const hasText = Math.random() > 0.3; // 70%的概率有文字
  const hasImage = Math.random() > 0.5; // 50%的概率有图片
  
  // 如果都没有，强制添加文字
  if (!hasText && !hasImage) {
    return `[${messageIndex + 1}] ${getRandomMessage()}`;
  }
  
  let content = '';
  
  if (hasText) {
    content += `[${messageIndex + 1}] ${getRandomMessage()}`;
  }
  
  if (hasImage) {
    if (hasText) {
      content += '\n'; // 如果有文字，添加换行
    }
    content += `[图片]${getRandomImage()}`;
  }
  
  return content;
}

// 生成联系人的聊天记录
function generateMessagesForContact(contactId, contactName, contactAvatar) {
  const messageCount = Math.floor(Math.random() * 1000); // 0-1000条消息
  const messages = [];
  
  // 先生成所有时间戳
  const timestamps = Array.from({ length: messageCount }, () => getRandomTimestamp(0, 30));
  timestamps.sort((a, b) => new Date(a) - new Date(b)); // 按时间排序
  
  for (let i = 0; i < messageCount; i++) {
    const isSelf = Math.random() > 0.5;
    messages.push({
      id: i + 1, // 使用纯数字ID
      content: generateMessageContent(i), // 传入当前索引
      sender: isSelf ? 'user' : 'other',
      senderName: isSelf ? '我' : contactName,
      senderAvatar: isSelf ? 'https://randomuser.me/api/portraits/men/1.jpg' : contactAvatar,
      timestamp: timestamps[i], // 使用排序后的时间戳
      isSelf: isSelf,
      contactId: contactId
    });
  }
  
  return messages; // 不再需要排序，因为时间戳已经排序
}

// 为每个联系人生成聊天记录
const messagesByContact = {};
contacts.forEach(contact => {
  messagesByContact[contact.id] = generateMessagesForContact(contact.id, contact.name, contact.avatar);
});

// 获取最新消息
router.get('/latest', (req, res) => {
  const contactId = parseInt(req.query.contactId);
  const limit = parseInt(req.query.limit) || 50;
  
  if (!contactId || !messagesByContact[contactId]) {
    return res.status(400).json({ message: '无效的联系人ID' });
  }
  
  const messages = messagesByContact[contactId];
  const latestMessages = messages.slice(-limit);
  
  res.json({
    messages: latestMessages,
    hasMore: messages.length > limit
  });
});

// 获取历史消息
router.get('/history', (req, res) => {
  const contactId = parseInt(req.query.contactId);
  const beforeId = parseInt(req.query.beforeId);
  const limit = parseInt(req.query.limit) || 50;
  
  if (!contactId || !messagesByContact[contactId]) {
    return res.status(400).json({ message: '无效的联系人ID' });
  }
  
  const messages = messagesByContact[contactId];
  let messageIndex = messages.findIndex(msg => msg.id === beforeId);
  
  if (messageIndex === -1) {
    messageIndex = messages.length;
  }
  
  const historyMessages = messages.slice(Math.max(0, messageIndex - limit), messageIndex);
  
  res.json({
    messages: historyMessages,
    hasMore: messageIndex > limit
  });
});

module.exports = router;
module.exports.messagesByContact = messagesByContact; 