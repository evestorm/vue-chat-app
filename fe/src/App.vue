<script setup>
import { ref, onMounted, nextTick } from 'vue'
import axios from 'axios'
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import { RecycleScroller } from 'vue-virtual-scroller'

// 状态管理
const currentUser = ref('张三')
const messages = ref([])
const loading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(true)
const messageLimit = 50
const oldestMessageId = ref(null)
const newestMessageId = ref(null)

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
    const el = scroller.value.$el
    previousScrollHeightMinusTop.value = el.scrollHeight - el.scrollTop
  }
}

// 恢复滚动位置
const restoreScroll = () => {
  if (scroller.value) {
    const el = scroller.value.$el
    el.scrollTop = el.scrollHeight - previousScrollHeightMinusTop.value
  }
}

// 加载最新消息
const loadLatestMessages = async () => {
  if (loading.value) return
  
  loading.value = true
  try {
    const response = await axios.get('http://localhost:3001/api/messages/latest', {
      params: { limit: messageLimit }
    })
    
    const newMessages = response.data.messages
    if (newMessages.length > 0) {
      messages.value = newMessages
      oldestMessageId.value = newMessages[0].id
      newestMessageId.value = newMessages[newMessages.length - 1].id
    }
    
    hasMore.value = response.data.hasMore
    
    // 等待 DOM 更新后滚动到底部
    await nextTick()
    // 添加一个小延时确保 DOM 完全渲染
    setTimeout(() => {
      if (scroller.value) {
        const el = scroller.value.$el
        el.scrollTop = el.scrollHeight
        // 再次检查并滚动，确保完全触底
        setTimeout(() => {
          el.scrollTop = el.scrollHeight
        }, 100)
      }
    }, 100)
  } catch (error) {
    console.error('加载最新消息失败:', error)
  } finally {
    loading.value = false
    isInitialLoad.value = false
  }
}

// 加载更多历史消息
const loadMoreHistory = async () => {
  if (!hasMore.value || loadingMore.value || messages.value.length === 0) return
  
  loadingMore.value = true
  prepareScroll()
  
  try {
    const response = await axios.get('http://localhost:3001/api/messages/history', {
      params: {
        beforeId: oldestMessageId.value,
        limit: messageLimit
      }
    })
    
    const historyMessages = response.data.messages
    if (historyMessages.length > 0) {
      oldestMessageId.value = historyMessages[0].id
      messages.value = [...historyMessages, ...messages.value]
      
      nextTick(() => {
        restoreScroll()
      })
    }
    
    hasMore.value = response.data.hasMore
  } catch (error) {
    console.error('加载历史消息失败:', error)
  } finally {
    loadingMore.value = false
  }
}

// 处理滚动事件
const handleScroll = (event) => {
  if (isInitialLoad.value) return
  
  const el = event.target
  const { scrollTop, scrollHeight, clientHeight } = el
  
  isScrolledToBottom.value = scrollHeight - scrollTop - clientHeight < 10
  isAutoScrollEnabled.value = isScrolledToBottom.value
  
  if (scrollTop < 50 && hasMore.value && !loadingMore.value) {
    loadMoreHistory()
  }
}

// 发送消息
const sendMessage = async () => {
  if (!newMessage.value.trim()) return

  const message = {
    id: Date.now(),
    content: newMessage.value.trim(),
    sender: 'user',
    senderName: '我',
    senderAvatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    timestamp: new Date().toISOString(),
    isSelf: true
  }

  // 添加消息到列表
  messages.value.push(message)

  // 清空输入框
  newMessage.value = ''

  // 等待 DOM 更新后滚动到底部
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
  loadLatestMessages()
})
</script>

<template>
  <v-app>
    <div class="chat-app">
      <header class="chat-header">
        <h2>聊天记录</h2>
      </header>
      
      <main class="chat-content">
        <div v-if="loadingMore" class="loading-indicator">
          <v-progress-circular indeterminate color="primary" size="24"></v-progress-circular>
          <span class="ml-2">正在加载历史消息...</span>
        </div>
        
        <div v-if="!hasMore" class="no-more-messages">
          没有更多历史消息了
        </div>
        
        <DynamicScroller
          ref="scroller"
          :items="messages"
          :min-item-size="60"
          class="message-list"
          @scroll="handleScroll"
        >
          <template v-slot="{ item }">
            <DynamicScrollerItem
              :item="item"
              :active="true"
            >
              <div 
                class="message-container"
                :class="{ 'message-self': item.isSelf }"
              >
                <div class="avatar">
                  <v-avatar size="40">
                    <v-img :src="item.senderAvatar" :alt="item.senderName"></v-img>
                  </v-avatar>
                </div>
                <div class="message-content">
                  <div class="message-info">
                    <span class="sender-name">{{ item.senderName }}</span>
                    <span class="timestamp">{{ formatTime(item.timestamp) }}</span>
                  </div>
                  <div class="message-bubble">
                    {{ item.content }}
                  </div>
                </div>
              </div>
            </DynamicScrollerItem>
          </template>
        </DynamicScroller>
      </main>
      
      <footer class="chat-footer">
        <v-form @submit.prevent="sendMessage" class="message-form">
          <v-row no-gutters>
            <v-col cols="12">
              <v-textarea
                v-model="newMessage"
                rows="3"
                auto-grow
                hide-details
                placeholder="输入消息..."
                @keydown.enter.prevent="sendMessage"
                class="message-input"
              ></v-textarea>
            </v-col>
          </v-row>
          <v-row no-gutters class="mt-2">
            <v-col cols="12" class="d-flex justify-end">
              <v-btn
                color="primary"
                type="submit"
                :disabled="!newMessage.trim()"
                class="send-button"
              >
                发送
              </v-btn>
            </v-col>
          </v-row>
        </v-form>
      </footer>
    </div>
  </v-app>
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

.chat-app {
  max-width: 1200px;
  width: 100%;
  height: 100vh;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  background-color: white;
  position: relative;
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
  position: relative;
  background-color: #f5f5f5;
  overflow: hidden;
}

.message-list {
  height: 100%;
  overflow-y: auto;
  padding: 10px 0;
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.message-container {
  display: flex;
  margin-bottom: 15px;
  align-items: flex-start;
  min-height: 60px;
  padding: 0 20px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.message-self {
  flex-direction: row-reverse;
}

.avatar {
  margin: 0 10px;
  flex-shrink: 0;
}

.message-content {
  max-width: 70%;
  display: flex;
  flex-direction: column;
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
  background-color: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  word-break: break-word;
  line-height: 1.4;
}

.message-self .message-bubble {
  background-color: #dcf8c6;
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
  flex: 1;
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
  padding: 10px;
  color: #666;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.9);
  z-index: 2;
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
  .chat-app {
    max-width: 100%;
  }
  
  .message-container {
    padding: 0 10px;
  }
  
  .message-content {
    max-width: 85%;
  }
  
  .chat-footer {
    padding: 10px;
  }
  
  .message-form {
    padding: 0 10px;
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
</style>
