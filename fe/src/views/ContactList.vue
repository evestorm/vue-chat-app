<template>
  <div class="contact-list">
    <div class="header">
      <h1>联系人</h1>
    </div>
    <div class="contacts">
      <div
        v-for="contact in contacts"
        :key="contact.id"
        class="contact-item"
        @click="navigateToChat(contact.id)"
      >
        <img :src="contact.avatar" :alt="contact.username" class="avatar" />
        <div class="contact-info">
          <h3>{{ contact.username }}</h3>
          <span :class="['status', contact.status]">{{ contact.status }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const contacts = ref([])

const fetchContacts = async () => {
  try {
    const response = await axios.get('http://localhost:3002/api/users')
    contacts.value = response.data
  } catch (error) {
    console.error('Error fetching contacts:', error)
  }
}

const navigateToChat = (userId) => {
  router.push(`/chat/${userId}`)
}

onMounted(() => {
  fetchContacts()
})
</script>

<style scoped>
.contact-list {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  padding: 20px 0;
  border-bottom: 1px solid #eee;
}

.header h1 {
  margin: 0;
  font-size: 24px;
}

.contacts {
  margin-top: 20px;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background-color 0.2s;
}

.contact-item:hover {
  background-color: #f5f5f5;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin-right: 15px;
}

.contact-info {
  flex: 1;
}

.contact-info h3 {
  margin: 0;
  font-size: 16px;
}

.status {
  font-size: 14px;
  color: #666;
}

.status.online {
  color: #4CAF50;
}

.status.offline {
  color: #999;
}
</style> 