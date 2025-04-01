const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
const sequelize = require('./config/database');
require('dotenv').config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// 中间件
app.use(cors());
app.use(express.json());

// 路由
const usersRouter = require('./routes/users');
const messagesRouter = require('./routes/messages');

app.use('/api/users', usersRouter);
app.use('/api/messages', messagesRouter);

// Socket.IO 连接处理
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('send_message', (data) => {
    io.to(data.receiverId).emit('receive_message', {
      senderId: data.senderId,
      content: data.content,
      timestamp: new Date()
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// 数据库同步和服务器启动
const PORT = process.env.PORT || 3002;
sequelize.sync({ force: false }).then(() => {
  console.log('数据库已同步');
  httpServer.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
  });
}).catch(err => {
  console.error('数据库同步错误:', err);
}); 