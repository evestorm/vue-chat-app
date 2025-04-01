<template>
  <v-app>
    <div class="chat-layout">
      <!-- 顶部标题栏 -->
      <header class="chat-header">
        <v-toolbar color="primary" dark flat>
          <v-toolbar-title>与 {{ currentUser }} 的聊天</v-toolbar-title>
        </v-toolbar>
      </header>

      <!-- 中间聊天内容区域 -->
      <main class="chat-main">
        <div v-if="loading" class="loading-container">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>
        <RecycleScroller
          ref="scroller"
          class="chat-scroller"
          :items="messages"
          :item-size="80"
          key-field="id"
          v-slot="{ item }"
        >
          <div
            :class="[
              'message-container',
              { 'message-container--sent': item.sender === 'user' }
            ]"
            :key="item.id"
          >
            <div class="message-bubble">
              <div class="message-content">{{ item.content }}</div>
              <div class="message-time">{{ formatTime(item.timestamp) }}</div>
            </div>
          </div>
        </RecycleScroller>
      </main>

      <!-- 底部输入区域 -->
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
/* 重置样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  width: 100%;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f5f5f5;
}

#app {
  height: 100%;
  width: 100%;
}

.v-application {
  height: 100% !important;
  width: 100% !important;
}

.v-application__wrap {
  height: 100% !important;
  width: 100% !important;
}

/* 主布局 */
.chat-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  background-color: white;
}

/* 头部样式 */
.chat-header {
  flex: 0 0 auto;
}

.chat-header .v-toolbar {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

/* 主体区域样式 */
.chat-main {
  flex: 1 1 auto;
  position: relative;
  overflow: hidden;
  background-color: #f5f5f5;
  padding: 16px;
}

.chat-scroller {
  height: 100%;
}

/* 底部样式 */
.chat-footer {
  flex: 0 0 auto;
  background-color: white;
  border-top: 1px solid rgba(0, 0, 0, 0.12);
  padding: 16px;
}

/* 消息样式 */
.message-container {
  display: flex;
  margin-bottom: 16px;
  padding: 0 16px;
}

.message-container--sent {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
  background-color: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message-container--sent .message-bubble {
  background-color: #1976d2;
  color: white;
}

.message-content {
  margin-bottom: 4px;
  word-break: break-word;
}

.message-time {
  font-size: 0.75rem;
  color: #666;
  text-align: right;
}

.message-container--sent .message-time {
  color: rgba(255, 255, 255, 0.8);
}

/* 加载状态 */
.loading-container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
}

/* 表单样式 */
.message-form {
  width: 100%;
}

.message-input {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 8px;
}

.send-button {
  min-width: 100px;
}

/* 滚动条样式 */
.chat-scroller::-webkit-scrollbar {
  width: 6px;
}

.chat-scroller::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.chat-scroller::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.chat-scroller::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .chat-main {
    padding: 8px;
  }

  .chat-footer {
    padding: 8px;
  }

  .message-container {
    padding: 0 8px;
  }

  .message-bubble {
    max-width: 85%;
  }
}
</style> 