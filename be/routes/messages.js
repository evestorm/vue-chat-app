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
    '你做得对',
    // 添加一些长文本消息
    '我最近在开发一个新的项目，这是一个基于 Vue 3 和 Element Plus 的聊天应用。我们使用了虚拟滚动来优化长列表的性能，并且实现了消息的懒加载功能。目前正在测试各种边界情况，包括长文本消息、图片消息以及混合消息的显示效果。',
    '关于上周讨论的那个功能，我已经完成了初步的实现。主要改动包括：1. 优化了消息加载的性能 2. 改进了图片加载的体验 3. 添加了更多的交互动画 4. 修复了一些已知的 bug。你可以测试一下，看看效果如何。',
    '这个周末我准备去爬山，预计早上7点出发，中午在山顶野餐，下午3点左右下山。路线已经规划好了，从山脚到山顶大约需要3个小时。天气看起来不错，应该是个适合爬山的好日子。你要不要也一起来？',
    '我们团队最近在讨论项目的技术选型，主要考虑以下几个方面：1. 前端框架的选择（Vue/React）2. 状态管理方案（Pinia/Vuex/Redux）3. UI 组件库（Element Plus/Ant Design）4. 构建工具（Vite/Webpack）。你觉得我们应该如何选择？',
    '昨天开会的总结：1. 项目进度正常，预计下周可以完成第一个里程碑 2. 需要解决几个技术难点，包括大量数据的处理、实时通信的优化等 3. 下周开始进行性能测试，重点关注内存占用和响应时间 4. 团队需要加强代码审查，确保代码质量。',
    '关于新功能的开发计划，我建议按以下步骤进行：1. 先完成基础架构的搭建 2. 实现核心功能 3. 添加单元测试 4. 进行性能优化 5. 最后做UI美化。每个阶段预计需要一周时间，总共5周。你觉得这个计划如何？',
    '我刚刚完成了一个重要的功能重构，主要改动包括：1. 将消息存储从本地存储改为数据库 2. 优化了消息加载的性能 3. 改进了图片处理逻辑 4. 添加了更多的错误处理 5. 优化了代码结构。现在系统应该更稳定了。',
    '这个项目的技术栈我们选择了：Vue 3 + TypeScript + Element Plus + Vite。选择这些技术的原因：1. Vue 3 提供了更好的性能和开发体验 2. TypeScript 可以帮助我们避免很多运行时错误 3. Element Plus 提供了丰富的组件 4. Vite 提供了更快的开发体验。',
    '我们最近遇到了一些性能问题，主要是消息列表在数据量大的时候会出现卡顿。解决方案包括：1. 使用虚拟滚动 2. 实现消息懒加载 3. 优化图片加载 4. 减少不必要的重渲染 5. 使用 Web Worker 处理大量数据。这些优化应该能显著提升性能。',
    '关于项目的部署方案，我建议采用以下架构：1. 前端使用 Nginx 部署静态资源 2. 后端使用 Node.js + Express 提供 API 服务 3. 数据库使用 MongoDB 存储消息数据 4. 使用 Redis 做缓存 5. 使用 Docker 容器化部署。这样可以保证系统的可扩展性和维护性。'
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

// 生成随机图片URL
function getRandomImage() {
  const images = [
    'https://picsum.photos/200/200?random=1',
    'https://picsum.photos/200/200?random=2',
    'https://picsum.photos/300/200?random=3',
    'https://picsum.photos/300/300?random=4',
    'https://picsum.photos/400/200?random=5',
    'https://picsum.photos/400/300?random=6',
    'https://picsum.photos/400/400?random=7',
    'https://picsum.photos/200/300?random=8',
    'https://picsum.photos/200/400?random=9',
    'https://picsum.photos/200/500?random=10'
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