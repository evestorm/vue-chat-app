<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import axios from 'axios'
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import { RecycleScroller } from 'vue-virtual-scroller'
import { ElMessage } from 'element-plus'
import { Loading, Search } from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import { ElImageViewer } from 'element-plus'

// 状态管理
const messages = ref([]) // 消息列表
const loadingMore = ref(false) // 是否正在加载更多消息
const hasMoreHistory = ref(true) // 是否有更多历史消息
const hasMoreNew = ref(true) // 是否有更多新消息
const messageLimit = 50 // 消息限制
const contacts = ref([]) // 联系人列表
const selectedContact = ref(null) // 选中的联系人
const showNoMoreMessage = ref(false) // 是否显示没有更多消息
const showPreview = ref(false) // 是否显示图片预览
const previewUrlList = ref([]) // 图片预览列表
const previewInitialIndex = ref(0) // 图片预览初始索引

// 消息显示位置配置
const selfMessagePosition = ref('right') // 'left' 或 'right'

// 常量定义
const IMAGE_HEIGHT = 200 // 聊天消息中图片的固定高度（像素）

// 引用
const scroller = ref(null) // 虚拟滚动器
const isInitialLoad = ref(true) // 是否是初始加载
const previousScrollHeightMinusTop = ref(0) // 上一次滚动高度
const newMessage = ref('') // 底部 input 框中要发送的新消息

// 聊天记录相关状态
const searchKeyword = ref('') // 搜索关键词
const historyRecords = ref([]) // 与某人的聊天记录
const selectedRecord = ref(null) // 在聊天记录中选中的要跳转的聊天记录

// 根据搜索关键词过滤后的聊天记录
const filteredHistoryRecords = computed(() => {
  if (!searchKeyword.value) return historyRecords.value
  const keyword = searchKeyword.value.toLowerCase()
  return historyRecords.value.filter(record => 
    record.content.toLowerCase().includes(keyword)
  )
})

// 准备滚动位置
const prepareScroll = () => {
  if (scroller.value) {
    const el = scroller.value.$el;
    // 计算上一次滚动高度
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

// 处理滚动事件
const handleScroll = (event) => {
  if (isInitialLoad.value) return;
  
  const el = event.target;
  const { scrollTop, scrollHeight, clientHeight } = el;

  // 当滚动到顶部时加载更多历史消息
  if (scrollTop < 100 && hasMoreHistory.value && !loadingMore.value) {
    console.log('触发加载历史消息', { 
      scrollTop, 
      hasMoreHistory: hasMoreHistory.value, 
      loadingMore: loadingMore.value,
    });
    loadMoreHistory();
  }
  
  // 当滚动到底部时加载更多新消息
  if (scrollHeight - scrollTop - clientHeight < 100 && 
      hasMoreNew.value && 
      !loadingMore.value && 
      selectedRecord.value) {
    console.log('触发加载新消息', { 
      scrollTop, 
      scrollHeight, 
      clientHeight, 
      hasMoreNew: hasMoreNew.value, 
      loadingMore: loadingMore.value,
    });
    loadMoreAfter();
  }
};

// 加载最新消息
const loadLatestMessages = async () => {
  if (!selectedContact.value) return;
  
  try {
    const response = await fetch(`http://localhost:3001/api/messages/latest?contactId=${selectedContact.value.id}&limit=${messageLimit}`);
    const data = await response.json();
    
    messages.value = data.messages;
    hasMoreNew.value = false; // 已经加载的是最新的消息，没有更多消息了
    showNoMoreMessage.value = !data.hasMore;
    if (showNoMoreMessage.value) {
      setTimeout(() => showNoMoreMessage.value = false, 2000);
    }
    
    // 等待DOM更新后滚动到底部
    await nextTick();
    scrollToBottom();
  } catch (error) {
    console.error('加载最新消息失败:', error);
  } finally {
    isInitialLoad.value = false; // 设置初始加载完成
  }
};

// 加载更多历史消息
const loadMoreHistory = async () => {
  if (!selectedContact.value || !hasMoreHistory.value || loadingMore.value) return;
  
  loadingMore.value = true;
  prepareScroll();
  
  try {
    const oldestMessage = messages.value[0];
    if (!oldestMessage) return;
    
    const response = await fetch(
      `http://localhost:3001/api/messages/history?contactId=${selectedContact.value.id}&beforeId=${oldestMessage.id}&limit=${messageLimit}`
    );
    const data = await response.json();
    
    if (data.messages.length > 0) {
      messages.value = [...data.messages, ...messages.value];
      hasMoreHistory.value = data.hasMore;
      showNoMoreMessage.value = !data.hasMore;
      if (showNoMoreMessage.value) {
        setTimeout(() => {
          showNoMoreMessage.value = false;
        }, 2000);
      }
      
      nextTick(() => {
        restoreScroll();
      });
    } else {
      hasMoreHistory.value = false;
    }
  } catch (error) {
    console.error('加载历史消息失败:', error);
  } finally {
    loadingMore.value = false;
  }
};

// 加载更多新消息
const loadMoreAfter = async () => {
  if (!selectedContact.value || !hasMoreNew.value || loadingMore.value || !selectedRecord.value) return;
  
  loadingMore.value = true;
  
  try {
    const newestMessage = messages.value[messages.value.length - 1];
    if (!newestMessage) return;
    
    const response = await axios.get(`http://localhost:3001/api/messages/after/${newestMessage.id}`, {
      params: {
        contactId: selectedContact.value.id,
        limit: messageLimit
      }
    });
    
    if (response.data.messages.length > 0) {
      // 过滤掉重复的消息（第一条消息，即 newestMessage）
      // 因为 after 接口的第一条消息就是 newestMessage, 
      // 而 newestMessage 已经在 messages 列表中, 
      // 如果直接 push 会导致 newestMessage 消息列表重复
      const newMessages = response.data.messages.slice(1);
      messages.value.push(...newMessages);
      hasMoreNew.value = response.data.hasMore;
    }
  } catch (error) {
    console.error('加载新消息失败:', error);
    ElMessage.error('加载新消息失败');
  } finally {
    loadingMore.value = false;
  }
};

// 加载联系人列表
const loadContacts = async () => {
  try {
    const response = await axios.get('http://localhost:3001/api/contacts')
    contacts.value = response.data
    if (contacts.value.length > 0) {
      selectedContact.value = contacts.value[0]
      await loadLatestMessages();
      await loadChatHistory(selectedContact.value.id); // 加载该联系人的聊天记录
    }
  } catch (error) {
    console.error('加载联系人列表失败:', error)
  }
}

const resetState = () => {
  // 重置所有状态
  messages.value = [] // 消息列表
  loadingMore.value = false // 是否正在加载更多消息
  hasMoreHistory.value = true // 是否有更多历史消息
  hasMoreNew.value = true // 是否有更多新消息
  // contacts.value = [] // 联系人列表
  // selectedContact.value = null // 选中的联系人
  showNoMoreMessage.value = false // 是否显示没有更多消息
  showPreview.value = false // 是否显示图片预览
  previewUrlList.value = [] // 图片预览列表
  previewInitialIndex.value = 0 // 图片预览初始索引

  // 引用
  // scroller.value = null // 虚拟滚动器
  isInitialLoad.value = true // 是否是初始加载
  previousScrollHeightMinusTop.value = 0 // 上一次滚动高度
  newMessage.value = '' // 底部 input 框中要发送的新消息

  // 聊天记录相关状态
  // searchKeyword.value = '' // 搜索关键词
  // historyRecords.value = [] // 与某人的聊天记录
  // selectedRecord.value = null // 在聊天记录中选中的要跳转的聊天记录
}

// 切换联系人
const switchContact = async (contact) => {
  // 重置所有状态
  resetState();
  // 更新选中的联系人
  selectedContact.value = contact;
  
  // 加载新数据
  await loadLatestMessages();
  await loadChatHistory(contact.id);
};

// 修改发送消息函数
const sendMessageBak = async () => {
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

  resetState()
  await loadLatestMessages()
  messages.value.push(message)
  await nextTick()
  scrollToBottom();
}

const scrollToBottom = () => {
  if (scroller.value) {
    scroller.value.$el.scrollTop = scroller.value.$el.scrollHeight
    // 延迟滚动，二次保险确保滚动到底部
    setTimeout(() => {
      scroller.value.$el.scrollTop = scroller.value.$el.scrollHeight
    }, 500)
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

// 修改图片预览处理函数
const handleImagePreview = (src, index = 0) => {
  previewUrlList.value = [src]
  previewInitialIndex.value = index
  showPreview.value = true
}

// 加载聊天记录
const loadChatHistory = async (contactId) => {
  try {
    const response = await axios.get(`http://localhost:3001/api/messages/history/${contactId}`)
    historyRecords.value = response.data
  } catch (error) {
    console.error('加载聊天记录失败:', error)
    ElMessage.error('加载聊天记录失败')
  }
}

// 选择聊天记录
const selectHistoryRecord = async (record) => {
  selectedRecord.value = record;
  
  // 1. 检查消息是否在当前加载的消息列表中
  const currentIndex = messages.value.findIndex(msg => msg.id === record.id);
  if (currentIndex !== -1) {
    console.log('消息在当前列表中，直接滚动到该消息', currentIndex);
    hasMoreNew.value = false; // note: 由于有可能选中项在列表的底部位置，这可能导致触发 loadMoreAfter 方法，从而导致消息列表的重复加载
    // 如果消息在当前列表中，直接滚动到该消息
    scroller.value?.scrollToItem(currentIndex);
    setTimeout(() => scroller.value?.scrollToItem(currentIndex), 0);
    return;
  }
  
  console.log('消息不在当前列表中，需要加载相关消息', currentIndex, record);
  // 2. 如果消息不在当前列表中，需要加载相关消息
  try {
    // 加载该消息之前的历史消息
    const historyResponse = await axios.get(`http://localhost:3001/api/messages/history`, {
      params: {
        contactId: selectedContact.value.id,
        beforeId: record.id,
        limit: messageLimit
      }
    });
    
    // 加载该消息之后的消息
    const afterResponse = await axios.get(`http://localhost:3001/api/messages/after/${record.id}`, {
      params: {
        contactId: selectedContact.value.id,
        limit: messageLimit
      }
    });
    
    // 合并消息并更新
    const combinedMessages = [...historyResponse.data.messages, ...afterResponse.data.messages];
    messages.value = combinedMessages;
    
    // 更新 hasMore 状态
    hasMoreHistory.value = historyResponse.data.hasMore;
    showNoMoreMessage.value = !hasMoreHistory.value;
    if (showNoMoreMessage.value) {
      setTimeout(() => {
        showNoMoreMessage.value = false;
      }, 2000);
    }
    // 更新 hasMoreNew 状态
    hasMoreNew.value = afterResponse.data.hasMore;
    
    // 等待 DOM 更新后滚动到目标消息
    await nextTick();
    const newIndex = combinedMessages.findIndex(msg => msg.id === record.id);
    if (newIndex !== -1) {
      scroller.value?.scrollToItem(newIndex);
      setTimeout(() => scroller.value?.scrollToItem(newIndex), 0); // note: 延迟滚动，确保消息列表已经更新
    }
  } catch (error) {
    console.error('加载消息失败:', error);
    ElMessage.error('加载消息失败');
  }
};

onMounted(() => {
  loadContacts()
});
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

    <!-- 中间聊天区域 -->
    <div class="chat-main">
      <header class="chat-header">
        <h2>与 {{ selectedContact?.name || '选择联系人' }} 的聊天</h2>
      </header>
      
      <main class="chat-content">
        <DynamicScroller
          ref="scroller"
          :items="messages"
          :min-item-size="1"
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
                :class="{ 
                  'message-self': item.isSelf && selfMessagePosition === 'right',
                  'message-self-left': item.isSelf && selfMessagePosition === 'left',
                  'message-other-right': !item.isSelf && selfMessagePosition === 'left',
                  'message-other-left': !item.isSelf && selfMessagePosition === 'right'
                }"
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
                        <el-image 
                          :src="item.content.replace('[图片]', '')" 
                          alt="图片" 
                          lazy 
                          fit="contain"
                          @click="handleImagePreview(item.content.replace('[图片]', ''))"
                        >
                          <template #placeholder>
                            <div class="image-slot"></div>
                          </template>
                        </el-image>
                      </div>
                      <template v-else>
                        <div class="message-text">{{ item.content.split('\n')[0] }}</div>
                        <div class="message-image">
                          <el-image 
                            :src="item.content.split('\n')[1].replace('[图片]', '')" 
                            alt="图片" 
                            lazy 
                            fit="contain"
                            @click="handleImagePreview(item.content.split('\n')[1].replace('[图片]', ''))"
                          >
                            <template #placeholder>
                              <div class="image-slot"></div>
                            </template>
                          </el-image>
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
        
        <div v-if="!hasMoreHistory && showNoMoreMessage" class="no-more-messages">
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

    <!-- 右侧聊天记录面板 -->
    <aside class="chat-history-sidebar">
      <div class="chat-history-header">
        <h2>聊天记录</h2>
      </div>
      <div class="chat-history-search">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索聊天记录..."
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>
      <div class="chat-history-list">
        <div
          v-for="record in filteredHistoryRecords"
          :key="record.id"
          class="chat-history-item"
          :class="{ 'chat-history-item--active': selectedRecord?.id === record.id }"
          @click="selectHistoryRecord(record)"
        >
          <div class="chat-history-content">{{ record.content }}</div>
          <div class="chat-history-time">{{ formatTime(record.timestamp) }}</div>
        </div>
      </div>
    </aside>

    <!-- 添加图片预览容器 -->
    <el-image-viewer
      v-if="showPreview"
      :url-list="previewUrlList"
      :initial-index="previewInitialIndex"
      @close="showPreview = false"
      :hide-on-click-modal="true"
      :infinite="false"
      :zoom-rate="1.2"
      :min-scale="0.2"
      :max-scale="7"
      show-progress
    />
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
  border-right: 1px solid #e0e0e0;
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
  display: flex;
  align-items: center;
}

.message-self .message-info {
  flex-direction: row-reverse;
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
  background-color: #e8f5e9;  /* 浅绿色背景 */
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  word-break: break-word;
  line-height: 1.4;
}

.message-self .message-bubble {
  background-color: #c8e6c9;  /* 稍深的绿色背景 */
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
  height: v-bind(IMAGE_HEIGHT + 'px'); /* 使用定义的常量 */
}

.message-image .el-image {
  width: 100%;
  height: 100%;
  border-radius: 8px;
  cursor: pointer;
}

.message-image .el-image img {
  width: 100%;
  height: 100%;
}

.message-text {
  margin-bottom: 5px;
}

/* 更新一些样式以适应 Element Plus */
.unread-badge {
  margin-top: 4px;
}

.message-image .image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: var(--el-fill-color-light);
  position: relative;
  overflow: hidden;
}

.message-image .image-slot::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 50%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.2),
    transparent
  );
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 200%;
  }
}

/* 移除旧的 dot 动画 */
.message-image .dot {
  display: none;
}

/* 移动端样式 */
@media screen and (max-width: 768px) {
  .message-container {
    max-width: 83.33%; /* 5/6 */
  }
  
  .message-self,
  .message-other-right {
    margin-left: auto;
  }
}

/* PC端样式 */
@media screen and (min-width: 769px) {
  .message-container {
    max-width: 68%;
  }
  
  .message-self,
  .message-other-right {
    margin-left: auto;
  }
}

/* 添加图片预览相关样式 */
.el-image-viewer__wrapper {
  z-index: 2000;
}

.el-image-viewer__btn {
  color: #fff;
}

.el-image-viewer__actions {
  background-color: rgba(0, 0, 0, 0.5);
}

.el-image-viewer__actions__inner {
  color: #fff;
}

.el-image-viewer__progress {
  color: #fff;
}

.chat-history-sidebar {
  width: 300px;
  background-color: white;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-history-header {
  padding: 15px;
  background-color: #42b983;
  color: white;
  text-align: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.chat-history-search {
  padding: 15px;
  border-bottom: 1px solid #e0e0e0;
}

.chat-history-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.chat-history-item {
  padding: 10px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.2s;
}

.chat-history-item:hover {
  background-color: var(--el-fill-color-light);
}

.chat-history-item--active {
  background-color: var(--el-color-primary-light-9);
}

.chat-history-content {
  font-size: 14px;
  color: #333;
  margin-bottom: 5px;
}

.chat-history-time {
  font-size: 12px;
  color: #999;
}

.message-self-left {
  flex-direction: row;
}

.message-other-right {
  flex-direction: row-reverse;
}

.message-self-left .message-content {
  align-items: flex-start;
}

.message-other-right .message-content {
  align-items: flex-end;
}

.message-self-left .message-info {
  flex-direction: row;
}

.message-other-right .message-info {
  flex-direction: row-reverse;
}

.message-self-left .timestamp {
  margin-left: 5px;
  margin-right: 0;
}

.message-other-right .timestamp {
  margin-right: 5px;
  margin-left: 0;
}
</style>
