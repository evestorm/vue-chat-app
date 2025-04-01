const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 生成聊天消息测试数据
const generateChatMessages = (count, startId = 1, isEarlier = false) => {
  const messages = [];
  const users = [
    { id: 1, name: '我', avatar: 'https://randomuser.me/api/portraits/men/1.jpg', isSelf: true },
    { id: 2, name: '张三', avatar: 'https://randomuser.me/api/portraits/women/2.jpg', isSelf: false }
  ];
  
  for (let i = 0; i < count; i++) {
    const id = isEarlier ? startId - i - 1 : startId + i;
    if (id <= 0) continue; // 不生成ID小于1的消息
    
    const user = users[id % 2];
    const date = new Date();
    
    // 如果是历史消息，日期往前推
    if (isEarlier) {
      date.setHours(date.getHours() - Math.floor((1000 - id) / 10));
    } else {
      date.setMinutes(date.getMinutes() - (count - i));
    }
    
    messages.push({
      id,
      content: `这是第 ${id} 条聊天消息。${Math.random() > 0.7 ? '这是一条较长的消息，包含更多的内容，以便测试不同高度的消息气泡。'.repeat(Math.floor(Math.random() * 3) + 1) : ''}`,
      senderId: user.id,
      senderName: user.name,
      senderAvatar: user.avatar,
      isSelf: user.isSelf,
      timestamp: date.toISOString(),
      status: 'sent'
    });
  }
  
  return isEarlier ? messages.reverse() : messages;
};

// 初始化聊天数据 - 总共有1000条消息
const TOTAL_MESSAGES = 1000;
let chatMessages = generateChatMessages(TOTAL_MESSAGES);

// 获取最新的聊天消息
app.get('/api/messages/latest', (req, res) => {
  const { limit = 50 } = req.query;
  const limitNum = parseInt(limit);
  
  // 返回最新的n条消息
  const messages = chatMessages.slice(-limitNum);
  
  setTimeout(() => {
    res.json({
      messages,
      hasMore: messages.length > 0 && messages[0].id > 1
    });
  }, 500); // 模拟网络延迟
});

// 获取历史聊天消息
app.get('/api/messages/history', (req, res) => {
  const { beforeId, limit = 50 } = req.query;
  const beforeIdNum = parseInt(beforeId);
  const limitNum = parseInt(limit);
  
  if (!beforeId) {
    return res.status(400).json({ error: 'Missing beforeId parameter' });
  }
  
  // 找到beforeId对应的消息索引
  const messageIndex = chatMessages.findIndex(msg => msg.id === beforeIdNum);
  
  if (messageIndex === -1) {
    return res.status(404).json({ error: 'Message not found' });
  }
  
  // 获取之前的消息
  const startIndex = Math.max(0, messageIndex - limitNum);
  const messages = chatMessages.slice(startIndex, messageIndex);
  
  setTimeout(() => {
    res.json({
      messages,
      hasMore: startIndex > 0
    });
  }, 500); // 模拟网络延迟
});

// 旧接口保留兼容
app.get('/api/items', (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const startId = (page - 1) * pageSize;
  
  setTimeout(() => {
    res.json({
      items: generateItems(startId, parseInt(pageSize)),
      total: 100,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  }, 500);
});

// 生成测试数据
const generateItems = (startId, count) => {
  return Array.from({ length: count }, (_, index) => ({
    id: startId + index,
    title: `项目 ${startId + index}`,
    content: `这是项目 ${startId + index} 的内容。这是一个测试项目，用于演示虚拟列表的功能。内容高度可能会不同，以测试动态高度功能。`.repeat(Math.floor(Math.random() * 3) + 1)
  }));
};

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`聊天记录 Mock 服务器运行在端口 ${PORT}`);
}); 