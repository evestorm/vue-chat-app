// 生成随机联系人数据
function generateContacts(count) {
  const contacts = [];
  const firstNames = ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴'];
  const lastNames = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '洋'];
  
  for (let i = 1; i <= count; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = firstName + lastName;
    const gender = Math.random() > 0.5 ? 'men' : 'women';
    const avatarNumber = Math.floor(Math.random() * 100) + 1;
    
    contacts.push({
      id: i,
      name: name,
      avatar: `https://randomuser.me/api/portraits/${gender}/${avatarNumber}.jpg`
    });
  }
  
  return contacts;
}

// 生成50个联系人
const contacts = generateContacts(50);

module.exports = contacts; 