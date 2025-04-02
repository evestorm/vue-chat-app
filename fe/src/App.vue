<script setup>
import { ref, onMounted, nextTick } from 'vue'
import axios from 'axios'
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import { RecycleScroller } from 'vue-virtual-scroller'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'

// 状态管理
const currentUser = ref('张三')
const messages = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(true)
const messageLimit = 50
const oldestMessageId = ref(null)
const newestMessageId = ref(null)
const contacts = ref([])
const selectedContact = ref(null)
const showNoMoreMessage = ref(false)

// 引用
const scroller = ref(null)
const isAutoScrollEnabled = ref(true)
const isScrolledToBottom = ref(true)
const isInitialLoad = ref(true)
const previousScrollHeightMinusTop = ref(0)
const newMessage = ref('')

// 准备滚动位置
const prepareScroll = () => {
  if (scroller.value) {
    const el = scroller.value.$el;
    previousScrollHeightMinusTop.value = el.scrollHeight - el.scrollTop;
  }
};

// 恢复滚动位置
const restoreScroll = () => {
  if (scroller.value) {
    const el = scroller.value.$el;
    el.scrollTop = el.scrollHeight - previousScrollHeightMinusTop.value;
  }
};

// 加载最新消息
const loadLatestMessages = async () => {
  if (!selectedContact.value) return;
  
  try {
    const response = await fetch(`http://localhost:3001/api/messages/latest?contactId=${selectedContact.value.id}&limit=50`);
    const data = await response.json();
    
    messages.value = data.messages;
    hasMore.value = data.hasMore;
    
    // 如果首次加载就没有更多消息，显示提示
    if (!hasMore.value) {
      showNoMoreMessage.value = true;
      setTimeout(() => {
        showNoMoreMessage.value = false;
      }, 2000);
    }
    
    // 等待DOM更新后滚动到底部
    await nextTick();
    setTimeout(() => {
      if (scroller.value?.$el) {
        scroller.value.$el.scrollTop = scroller.value.$el.scrollHeight;
        // 再次检查并滚动，确保位置正确
        setTimeout(() => {
          if (scroller.value?.$el) {
            scroller.value.$el.scrollTop = scroller.value.$el.scrollHeight;
          }
        }, 100);
      }
    }, 100);
  } catch (error) {
    console.error('加载最新消息失败:', error);
  } finally {
    isInitialLoad.value = false; // 设置初始加载完成
  }
};

// 加载更多历史消息
// 解决方案来源: https://github.com/Akryum/vue-virtual-scroller/issues/728
const loadMoreHistory = async () => {
  if (!selectedContact.value || !hasMore.value || loadingMore.value) return;
  
  loadingMore.value = true;
  prepareScroll();
  
  try {
    const oldestMessage = messages.value[0];
    if (!oldestMessage) return;
    
    const response = await fetch(
      `http://localhost:3001/api/messages/history?contactId=${selectedContact.value.id}&beforeId=${oldestMessage.id}&limit=50`
    );
    const data = await response.json();
    
    if (data.messages.length > 0) {
      messages.value = [...data.messages, ...messages.value];
      hasMore.value = data.hasMore;
      showNoMoreMessage.value = !data.hasMore;
      if (showNoMoreMessage.value) {
        setTimeout(() => {
          showNoMoreMessage.value = false;
        }, 2000);
      }
      
      nextTick(() => {
        restoreScroll();
      });
    }
  } catch (error) {
    console.error('加载历史消息失败:', error);
  } finally {
    loadingMore.value = false;
  }
};

// 处理滚动事件
const handleScroll = (event) => {
  if (isInitialLoad.value) return;
  
  const el = event.target;
  const { scrollTop, scrollHeight, clientHeight } = el;
  
  isScrolledToBottom.value = scrollHeight - scrollTop - clientHeight < 10;
  isAutoScrollEnabled.value = isScrolledToBottom.value;
  
  // 当滚动到顶部时加载更多历史消息
  if (scrollTop < 100 && hasMore.value && !loadingMore.value) {
    console.log('触发加载历史消息', { scrollTop, hasMore: hasMore.value, loadingMore: loadingMore.value });
    loadMoreHistory();
  }
};

// 加载联系人列表
const loadContacts = async () => {
  try {
    const response = await axios.get('http://localhost:3001/api/contacts')
    contacts.value = response.data
    if (contacts.value.length > 0) {
      selectedContact.value = contacts.value[0]
      loadLatestMessages()
    }
  } catch (error) {
    console.error('加载联系人列表失败:', error)
  }
}

// 切换联系人
const switchContact = async (contact) => {
  selectedContact.value = contact;
  messages.value = [];
  hasMore.value = true; // 重置hasMore状态
  await loadLatestMessages();
};

// 修改发送消息函数
const sendMessage = async () => {
  if (!newMessage.value.trim() || !selectedContact.value) return

  const message = {
    id: Date.now(),
    content: newMessage.value.trim(),
    sender: 'user',
    senderName: '我',
    senderAvatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    timestamp: new Date().toISOString(),
    isSelf: true
  }

  messages.value.push(message)
  newMessage.value = ''

  await nextTick()
  if (scroller.value) {
    scroller.value.$el.scrollTop = scroller.value.$el.scrollHeight
  }
}

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadContacts()
})
</script>

<template>
  <div class="chat-layout">
    <!-- 左侧联系人列表 -->
    <aside class="contacts-sidebar">
      <div class="contacts-header">
        <h2>联系人列表</h2>
      </div>
      <div class="contacts-list">
        <div
          v-for="contact in contacts"
          :key="contact.id"
          class="contact-item"
          :class="{ 'contact-item--active': selectedContact?.id === contact.id }"
          @click="switchContact(contact)"
        >
          <el-avatar :size="40" :src="contact.avatar" :alt="contact.name"></el-avatar>
          <div class="contact-info">
            <div class="contact-name">{{ contact.name }}</div>
            <div class="contact-last-message">{{ contact.lastMessage }}</div>
          </div>
          <div class="contact-meta">
            <div class="contact-time">{{ formatTime(contact.lastMessageTime) }}</div>
            <el-badge
              v-if="contact.unreadCount > 0"
              :value="contact.unreadCount"
              class="unread-badge"
            ></el-badge>
          </div>
        </div>
      </div>
    </aside>

    <!-- 右侧聊天区域 -->
    <div class="chat-main">
      <header class="chat-header">
        <h2>与 {{ selectedContact?.name || '选择联系人' }} 的聊天</h2>
      </header>
      
      <main class="chat-content">
        <DynamicScroller
          ref="scroller"
          :items="messages"
          :min-item-size="60"
          class="message-list"
          @scroll="handleScroll"
          :buffer="2000"
        >
          <template v-slot="{ item }">
            <DynamicScrollerItem
              :item="item"
              :active="true"
            >
              <div 
                class="message-container"
                :class="{ 'message-self': item.isSelf }"
                :data-message-id="item.id"
              >
                <div class="avatar">
                  <el-avatar :size="40" :src="item.senderAvatar" :alt="item.senderName"></el-avatar>
                </div>
                <div class="message-content">
                  <div class="message-info">
                    <span class="sender-name">{{ item.senderName }}</span>
                    <span class="timestamp">{{ formatTime(item.timestamp) }}</span>
                  </div>
                  <div class="message-bubble">
                    <template v-if="item.content.includes('[图片]')">
                      <div v-if="item.content.startsWith('[图片]')" class="message-image">
                        <el-image :src="item.content.replace('[图片]', '')" alt="图片"></el-image>
                      </div>
                      <template v-else>
                        <div class="message-text">{{ item.content.split('\n')[0] }}</div>
                        <div class="message-image">
                          <el-image :src="item.content.split('\n')[1].replace('[图片]', '')" alt="图片"></el-image>
                        </div>
                      </template>
                    </template>
                    <template v-else>
                      <div class="message-text">{{ item.content }}</div>
                    </template>
                  </div>
                </div>
              </div>
            </DynamicScrollerItem>
          </template>
        </DynamicScroller>

        <div v-if="loadingMore" class="loading-indicator">
          <el-icon class="is-loading"><Loading /></el-icon>
          <span>正在加载历史消息...</span>
        </div>
        
        <div v-if="!hasMore && showNoMoreMessage" class="no-more-messages">
          没有更多历史消息了
        </div>
      </main>
      
      <footer class="chat-footer">
        <el-form @submit.prevent="sendMessage" class="message-form">
          <el-input
            v-model="newMessage"
            type="textarea"
            :rows="3"
            :autosize="{ minRows: 3, maxRows: 5 }"
            placeholder="输入消息..."
            @keydown.enter.prevent="sendMessage"
            class="message-input"
          ></el-input>
          <div class="message-actions">
            <el-button
              type="primary"
              @click="sendMessage"
              :disabled="!newMessage.trim()"
              class="send-button"
            >
              发送
            </el-button>
          </div>
        </el-form>
      </footer>
    </div>
  </div>
</template>

<style>
html, body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  background-color: #f5f5f5;
  margin: 0;
  padding: 0;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

#app {
  width: 100%;
  height: 100vh;
}

.v-application {
  width: 100% !important;
  height: 100vh !important;
}

.v-application__wrap {
  width: 100% !important;
  height: 100vh !important;
}

.chat-layout {
  display: flex;
  height: 100vh;
  width: 100%;
  background-color: #f5f5f5;
}

.contacts-sidebar {
  width: 300px;
  background-color: white;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.contacts-header {
  padding: 15px;
  background-color: #42b983;
  color: white;
  text-align: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.contacts-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.contact-item:hover {
  background-color: var(--el-fill-color-light);
}

.contact-item--active {
  background-color: var(--el-color-primary-light-9);
}

.contact-info {
  flex: 1;
  margin-left: 10px;
  overflow: hidden;
}

.contact-name {
  font-weight: 500;
  margin-bottom: 2px;
}

.contact-last-message {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.contact-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-left: 10px;
}

.contact-time {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
  overflow: hidden;
}

.chat-header {
  padding: 15px;
  background-color: #42b983;
  color: white;
  text-align: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  z-index: 1;
  position: sticky;
  top: 0;
}

.chat-content {
  flex: 1;
  overflow: hidden;
  position: relative;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.message-list {
  flex: 1;
  overflow: hidden;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-container {
  display: flex;
  gap: 12px;
  padding: 8px;
  max-width: 100%;
}

.message-self {
  flex-direction: row-reverse;
}

.avatar {
  margin: 0 10px;
  flex-shrink: 0;
}

.message-content {
  max-width: 100%;
}

.message-self .message-content {
  align-items: flex-end;
}

.message-info {
  font-size: 12px;
  margin-bottom: 2px;
  color: #888;
}

.timestamp {
  margin-left: 5px;
}

.message-self .timestamp {
  margin-left: 0;
  margin-right: 5px;
}

.message-bubble {
  padding: 8px 12px;
  border-radius: 12px;
  background-color: #95EC69;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  word-break: break-word;
  line-height: 1.4;
}

.message-self .message-bubble {
  background-color: #95EC69;
}

.chat-footer {
  padding: 10px 15px;
  background-color: white;
  border-top: 1px solid #eee;
  z-index: 1;
  position: sticky;
  bottom: 0;
}

.message-form {
  width: 100%;
}

.message-input {
  margin-bottom: 10px;
}

.message-actions {
  display: flex;
  justify-content: flex-end;
}

.send-button {
  margin-left: 8px;
}

.loading-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  color: #666;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.9);
  z-index: 2;
}

.loading-indicator .el-icon {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.no-more-messages {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  text-align: center;
  padding: 10px;
  color: #999;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.9);
  z-index: 2;
}

.footer-note {
  text-align: center;
  margin-top: 10px;
  font-size: 12px;
  color: #999;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .contacts-sidebar {
    width: 100%;
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.3s;
  }

  .contacts-sidebar--show {
    transform: translateX(0);
  }

  .chat-main {
    width: 100%;
  }
}

/* 滚动条样式 */
.message-list::-webkit-scrollbar {
  width: 6px;
}

.message-list::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.message-list::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.message-list::-webkit-scrollbar-thumb:hover {
  background: #555;
}

.message-image {
  max-width: 100%;
}

.message-image img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  cursor: pointer;
}

.message-text {
  margin-bottom: 5px;
}

/* 更新一些样式以适应 Element Plus */
.unread-badge {
  margin-top: 4px;
}

/* 移除 Vuetify 相关样式 */
.v-application,
.v-application__wrap {
  width: 100% !important;
  height: 100vh !important;
}
</style>
