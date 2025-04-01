<template>
  <div class="virtual-list-container" ref="container" @scroll="handleScroll">
    <div class="virtual-list-phantom" :style="{ height: totalHeight + 'px' }"></div>
    <div 
      class="virtual-list" 
      :style="{ 
        transform: `translateY(${offsetY}px)`,
        transition: 'transform 0.1s ease-out'
      }"
    >
      <div
        v-for="item in visibleItems"
        :key="item.id"
        class="virtual-list-item"
        :ref="el => itemRefs[item.id] = el"
      >
        <slot :item="item"></slot>
      </div>
    </div>
    <div v-if="loading" class="loading-indicator">
      <slot name="loading">
        <div class="loading">加载中...</div>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  itemHeight: {
    type: Number,
    default: 60
  },
  buffer: {
    type: Number,
    default: 5
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['load-more-top', 'load-more-bottom'])

const container = ref(null)
const itemRefs = ref({})
const scrollTop = ref(0)
const itemHeights = ref({})

// 计算可见区域的高度
const containerHeight = computed(() => {
  return container.value?.clientHeight || 0
})

// 计算所有项目的总高度
const totalHeight = computed(() => {
  return props.items.reduce((total, item) => {
    return total + (itemHeights.value[item.id] || props.itemHeight)
  }, 0)
})

// 计算可见项目的偏移量
const offsetY = computed(() => {
  let offset = 0
  for (const item of props.items) {
    if (item.id === visibleItems.value[0]?.id) break
    offset += itemHeights.value[item.id] || props.itemHeight
  }
  return Math.max(0, offset)
})

// 计算可见的项目
const visibleItems = computed(() => {
  let startIndex = 0
  let currentOffset = 0
  
  // 找到第一个可见的项目
  for (let i = 0; i < props.items.length; i++) {
    const itemHeight = itemHeights.value[props.items[i].id] || props.itemHeight
    if (currentOffset + itemHeight > scrollTop.value) {
      startIndex = Math.max(0, i - props.buffer)
      break
    }
    currentOffset += itemHeight
  }
  
  // 计算可见项目的数量
  let visibleCount = 0
  let visibleHeight = 0
  
  for (let i = startIndex; i < props.items.length; i++) {
    const itemHeight = itemHeights.value[props.items[i].id] || props.itemHeight
    if (visibleHeight > containerHeight.value + props.itemHeight * props.buffer * 2) {
      break
    }
    visibleHeight += itemHeight
    visibleCount++
  }
  
  return props.items.slice(startIndex, startIndex + visibleCount)
})

// 处理滚动事件
const handleScroll = () => {
  if (!container.value) return
  
  const { scrollTop: newScrollTop, scrollHeight, clientHeight } = container.value
  scrollTop.value = Math.max(0, newScrollTop)

  // 检查是否需要加载更多数据
  if (newScrollTop < props.itemHeight * props.buffer) {
    emit('load-more-top')
  }
  
  if (scrollHeight - newScrollTop - clientHeight < props.itemHeight * props.buffer) {
    emit('load-more-bottom')
  }
}

// 更新项目高度
const updateItemHeight = (id) => {
  const el = itemRefs.value[id]
  if (el) {
    const height = el.offsetHeight
    if (height !== itemHeights.value[id]) {
      itemHeights.value[id] = height
    }
  }
}

// 监听可见项目的变化
watch(visibleItems, () => {
  nextTick(() => {
    visibleItems.value.forEach(item => {
      updateItemHeight(item.id)
    })
  })
}, { deep: true })

// 初始化时更新所有项目的高度
onMounted(() => {
  nextTick(() => {
    props.items.forEach(item => {
      updateItemHeight(item.id)
    })
  })
})

// 使用 ResizeObserver 监听项目高度变化
onMounted(() => {
  const observer = new ResizeObserver(entries => {
    entries.forEach(entry => {
      const id = entry.target.dataset.id
      if (id) {
        itemHeights.value[id] = entry.contentRect.height
      }
    })
  })

  visibleItems.value.forEach(item => {
    const el = itemRefs.value[item.id]
    if (el) {
      el.dataset.id = item.id
      observer.observe(el)
    }
  })

  onUnmounted(() => {
    observer.disconnect()
  })
})
</script>

<style scoped>
.virtual-list-container {
  position: relative;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
}

.virtual-list-phantom {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  z-index: -1;
}

.virtual-list {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  will-change: transform;
}

.virtual-list-item {
  position: relative;
  width: 100%;
}

.loading-indicator {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  text-align: center;
  padding: 10px;
  background: rgba(255, 255, 255, 0.9);
}
</style> 