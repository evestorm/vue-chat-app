import { createRouter, createWebHistory } from 'vue-router'
import ContactList from '../views/ContactList.vue'
import ChatRoom from '../views/ChatRoom.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'contacts',
      component: ContactList
    },
    {
      path: '/chat/:userId',
      name: 'chat',
      component: ChatRoom
    }
  ]
})

export default router 