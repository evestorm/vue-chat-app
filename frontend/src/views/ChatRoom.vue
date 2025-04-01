<template>
  <div class="chat-room">
    <div class="header">
      <router-link to="/" class="back-button">返回</router-link>
      <h2>{{ contact?.username }}</h2>
      <span :class="['status', contact?.status]">{{ contact?.status }}</span>
    </div>

    <div class="messages-container" ref="messagesContainer">
      <div v-if="loading" class="loading">加载中...</div>
      <div
        v-else
        class="messages"
        :style="{ transform: `translateY(${scrollOffset}px)` }"
      >
        <div
          v-for="message in visibleMessages"
          :key="message.id"
          :class="['message', message.senderId === currentUserId ? 'sent' : 'received']"
          :ref="el => messageRefs[message.id] = el"
        >
          <img
            :src="message.senderId === currentUserId ? currentUserAvatar : contact?.avatar"
            :alt="message.senderId === currentUserId ? '我' : contact?.username"
            class="avatar"
          />
          <div class="message-content">{{ message.content }}</div>
        </div>
      </div>
    </div>

    <div class="input-area">
      <input
        v-model="newMessage"
        @keyup.enter="sendMessage"
        placeholder="输入消息..."
        type="text"
      />
      <button @click="sendMessage">发送</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useVirtualList } from '@vueuse/core'
import axios from 'axios'
import { io } from 'socket.io-client'

const route = useRoute()
const socket = io('http://localhost:3002')
const currentUserId = ref(1) // 使用第一个测试用户（张三）的 ID
const currentUserAvatar = ref('https://api.dicebear.com/7.x/avataaars/svg?seed=1')

const contact = ref(null)
const messages = ref([])
const newMessage = ref('')
const messagesContainer = ref(null)
const messageRefs = ref({})
const page = ref(1)
const loading = ref(false)
const hasMore = ref(true)

const ITEMS_PER_PAGE = 20
const ITEM_HEIGHT = 60

const { list: visibleMessages, containerProps, wrapperProps } = useVirtualList(
  messages,
  {
    itemHeight: ITEM_HEIGHT,
    containerRef: messagesContainer,
  }
)

const scrollOffset = computed(() => {
  return (messages.value.length - visibleMessages.value.length) * ITEM_HEIGHT
})

const fetchMessages = async () => {
  if (loading.value || !hasMore.value) return
  
  loading.value = true
  try {
    const response = await axios.get(`http://localhost:3002/api/messages`, {
      params: {
        senderId: currentUserId.value,
        receiverId: route.params.userId,
        page: page.value,
        limit: ITEMS_PER_PAGE
      }
    })
    
    const newMessages = response.data.messages
    messages.value = [...newMessages, ...messages.value]
    hasMore.value = newMessages.length === ITEMS_PER_PAGE
    page.value++
  } catch (error) {
    console.error('Error fetching messages:', error)
  } finally {
    loading.value = false
  }
}

const fetchContact = async () => {
  try {
    const response = await axios.get(`http://localhost:3002/api/users/${route.params.userId}`)
    contact.value = response.data
  } catch (error) {
    console.error('Error fetching contact:', error)
  }
}

const sendMessage = async () => {
  if (!newMessage.value.trim()) return

  const messageData = {
    senderId: currentUserId.value,
    receiverId: route.params.userId,
    content: newMessage.value
  }

  try {
    await axios.post('http://localhost:3002/api/messages', messageData)
    socket.emit('send_message', messageData)
    newMessage.value = ''
  } catch (error) {
    console.error('Error sending message:', error)
  }
}

const handleScroll = () => {
  if (messagesContainer.value.scrollTop === 0) {
    fetchMessages()
  }
}

onMounted(() => {
  fetchContact()
  fetchMessages()
  socket.emit('join', currentUserId.value)
  socket.on('receive_message', (message) => {
    if (message.senderId === route.params.userId || message.receiverId === route.params.userId) {
      messages.value.push(message)
    }
  })
  messagesContainer.value?.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  socket.disconnect()
  messagesContainer.value?.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.chat-room {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 800px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.back-button {
  margin-right: 15px;
  text-decoration: none;
  color: #333;
}

.header h2 {
  margin: 0;
  flex: 1;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  position: relative;
}

.messages {
  position: relative;
}

.message {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20px;
}

.message.sent {
  flex-direction: row-reverse;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin: 0 10px;
}

.message-content {
  max-width: 70%;
  padding: 10px 15px;
  border-radius: 15px;
  background-color: #f0f0f0;
}

.sent .message-content {
  background-color: #007AFF;
  color: white;
}

.input-area {
  display: flex;
  padding: 15px;
  border-top: 1px solid #eee;
}

input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 20px;
  margin-right: 10px;
}

button {
  padding: 10px 20px;
  background-color: #007AFF;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
}

button:hover {
  background-color: #0056b3;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

.status {
  font-size: 14px;
  margin-left: 10px;
}

.status.online {
  color: #4CAF50;
}

.status.offline {
  color: #999;
}
</style> 