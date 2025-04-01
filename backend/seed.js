const sequelize = require('./config/database');
const User = require('./models/User');

const seedUsers = async () => {
  try {
    // 同步数据库
    await sequelize.sync({ force: true });
    
    // 创建测试用户
    const users = [
      {
        username: '张三',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
        status: 'online'
      },
      {
        username: '李四',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
        status: 'offline'
      },
      {
        username: '王五',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
        status: 'online'
      }
    ];
    
    await User.bulkCreate(users);
    console.log('测试用户数据已创建');
    
    await sequelize.close();
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

seedUsers(); 