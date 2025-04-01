<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  direction: {
    type: String,
    default: 'bottom',
    validator: value => ['top', 'bottom'].includes(value)
  },
  distance: {
    type: Number,
    default: 50
  },
  loading: {
    type: Boolean,
    default: false
  },
  finished: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['load'])

const container = ref(null)
const observer = ref(null)
const loadingEl = ref(null)

// 创建 Intersection Observer
const createObserver = () => {
  if (observer.value) {
    observer.value.disconnect()
  }

  observer.value = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !props.loading && !props.finished) {
          emit('load')
        }
      })
    },
    {
      root: null,
      rootMargin: `${props.distance}px`,
      threshold: 0
    }
  )

  if (loadingEl.value) {
    observer.value.observe(loadingEl.value)
  }
}

// 监听属性变化
watch(() => props.direction, () => {
  createObserver()
})

watch(() => props.distance, () => {
  createObserver()
})

// 生命周期钩子
onMounted(() => {
  createObserver()
})

onUnmounted(() => {
  if (observer.value) {
    observer.value.disconnect()
  }
})
</script>

<template>
  <div ref="container" class="infinite-scroll">
    <div v-if="direction === 'top'" ref="loadingEl" class="loading-trigger">
      <slot name="spinner">
        <div class="loading-indicator">
          <v-progress-circular indeterminate color="primary" size="24"></v-progress-circular>
          <span class="ml-2">正在加载...</span>
        </div>
      </slot>
    </div>

    <slot></slot>

    <div v-if="direction === 'bottom'" ref="loadingEl" class="loading-trigger">
      <slot name="spinner">
        <div class="loading-indicator">
          <v-progress-circular indeterminate color="primary" size="24"></v-progress-circular>
          <span class="ml-2">正在加载...</span>
        </div>
      </slot>
    </div>
  </div>
</template>

<style scoped>
.infinite-scroll {
  position: relative;
  width: 100%;
  height: 100%;
}

.loading-trigger {
  width: 100%;
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  color: #666;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.9);
}

.ml-2 {
  margin-left: 8px;
}
</style> 