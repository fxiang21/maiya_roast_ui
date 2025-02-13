<template>
  <view class="container">
    <!-- 状态栏 -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
    
    <!-- 头部 -->
    <view class="header">
      <image class="logo" src="/static/images/logo.png" mode="aspectFit"></image>
      <text class="title">黑洞吐槽</text>
      <view class="more">
        <text class="iconfont">&#xe601;</text>
      </view>
    </view>
    
    <!-- 标签切换 -->
    <view class="tabs">
      <text class="tab-item" :class="{ active: currentTab === 'history' }" @tap="currentTab = 'history'">历史</text>
      <text class="tab-item" :class="{ active: currentTab === 'analysis' }" @tap="currentTab = 'analysis'">分析</text>
    </view>
    
    <!-- 时间轴列表 -->
    <scroll-view 
      class="timeline-list" 
      scroll-y 
      @scrolltolower="loadMore"
      refresher-enabled
      :refresher-triggered="isRefreshing"
      @refresherrefresh="onRefresh"
    >
      <block v-if="historyList.length > 0">
        <view 
          class="timeline-item" 
          v-for="item in historyList" 
          :key="item.id"
        >
          <view 
            class="content-card" 
            @longpress="showActionSheet(item)" 
            :style="{
              backgroundColor: getCardBackgroundColor(item),
              borderColor: getCardBorderColor(item)
            }"
          >
            <!-- 头部信息栏 -->
            <view class="card-header">
              <view class="interaction-info">
                <text class="action-btn" @tap="togglePublic(item)">
                  <text class="iconfont lock-icon">{{ item.is_public ? '&#xe655;' : '&#xe602;' }}</text>
                </text>
                <text class="action-btn" @tap="handleLike(item)">
                  <text class="iconfont">&#xe60c;</text>
                  <text class="count">{{ item.like_count }}</text>
                </text>
                <text class="action-btn">
                  <text class="iconfont">&#xe60b;</text>
                  <text class="count">{{ item.comment_count }}</text>
                </text>
              </view>
            </view>
            
            <!-- 内容区域 -->
            <view class="card-content">
              <!-- 标签 -->
              <view class="tag-list" v-if="item.tags && item.tags.length">
                <text class="tag-item" v-for="(tag, index) in item.tags" :key="index">
                  {{ tag }}
                </text>
              </view>
              
              <text class="content-text">{{ item.original_text }}</text>
              
              <!-- 心情百分比 -->
              <view class="emotion-bar" v-if="item.emotions && item.emotions.length">
                <view 
                  class="emotion-item"
                  v-for="(emotion, index) in item.emotions"
                  :key="index"
                  :style="{ width: emotion.percentage + '%' }"
                >
                  <text class="emotion-text">{{ emotion.label }} {{ emotion.percentage }}%</text>
                </view>
              </view>
              
              <!-- 语音播放器 -->
              <view class="voice-player" v-if="item.converted_text">
                <view class="voice-wave"></view>
                <text class="duration">20s</text>
              </view>
            </view>
          </view>
        </view>
      </block>
      <view v-else class="empty-state" style="color: white; text-align: center; padding: 40rpx;">
        暂无数据
      </view>
    </scroll-view>

    <!-- 操作菜单 -->
    <u-action-sheet
      :show="showActions"
      :actions="actions"
      @close="showActions = false"
      @select="handleAction"
      :round="10"
      cancel-text="取消"
    ></u-action-sheet>
  </view>
</template>

<style lang="scss" scoped>
@font-face {
  font-family: 'iconfont';
  src: url('//at.alicdn.com/t/c/font_4812679_2pf2j8wg6os.woff2?t=1738917188006') format('woff2'),
       url('//at.alicdn.com/t/c/font_4812679_2pf2j8wg6os.woff?t=1738917188006') format('woff'),
       url('//at.alicdn.com/t/c/font_4812679_2pf2j8wg6os.ttf?t=1738917188006') format('truetype');
}

.container {
  min-height: 100vh;
  background-color: #111827; // 改为深蓝灰色背景
  display: flex;
  flex-direction: column;
}

.header {
  padding: 20rpx 30rpx;
  display: flex;
  align-items: center;
  
  .logo {
    width: 60rpx;
    height: 60rpx;
    border-radius: 30rpx;
  }
  
  .title {
    margin-left: 20rpx;
    font-size: 36rpx;
    font-weight: 500;
    color: #fff;
  }
  
  .more {
    margin-left: auto;
    color: #fff;
  }
}

.tabs {
  display: flex;
  justify-content: center;
  padding: 20rpx 0;
  
  .tab-item {
    margin: 0 40rpx;
    font-size: 32rpx;
    color: rgba(255, 255, 255, 0.6);
    position: relative;
    
    &.active {
      color: #fff;
      font-weight: 500;
      
      &::after {
        content: '';
        position: absolute;
        bottom: -10rpx;
        left: 50%;
        transform: translateX(-50%);
        width: 40rpx;
        height: 4rpx;
        background: #fff;
        border-radius: 2rpx;
      }
    }
  }
}

.timeline-list {
  flex: 1;
  padding: 0 30rpx;
  box-sizing: border-box;
}

.time-label {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  
  .time-icon {
    margin-right: 10rpx;
    color: rgba(255, 255, 255, 0.6);
  }
  
  .time {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.6);
  }
}

.content-card {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  
  .card-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20rpx;
    
    .interaction-info {
      display: flex;
      align-items: center;
      gap: 32rpx;
      
      .action-btn {
        display: flex;
        align-items: center;
        gap: 8rpx;
        
        .iconfont {
          font-size: 32rpx;
          color: rgba(255, 255, 255, 0.6);
          
          &.lock-icon {
            font-size: 36rpx;
          }
        }
        
        .count {
          font-size: 24rpx;
          color: rgba(255, 255, 255, 0.6);
        }
      }
    }
  }
  
  .card-content {
    .tag-list {
      display: flex;
      flex-wrap: wrap;
      gap: 16rpx;
      margin-bottom: 16rpx;
      
      .tag-item {
        font-size: 24rpx;
        color: rgba(255, 255, 255, 0.8);
        background: rgba(255, 255, 255, 0.1);
        padding: 4rpx 16rpx;
        border-radius: 100rpx;
      }
    }
    
    .emotion-bar {
      display: flex;
      height: 40rpx;
      border-radius: 20rpx;
      overflow: hidden;
      margin-top: 20rpx;
      
      .emotion-item {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.1);
        transition: width 0.3s ease;
        
        .emotion-text {
          font-size: 24rpx;
          color: rgba(255, 255, 255, 0.8);
          white-space: nowrap;
        }
      }
    }
    
    .content-text {
      font-size: 28rpx;
      line-height: 1.6;
      color: #fff;
    }
    
    .voice-player {
      margin-top: 20rpx;
      display: flex;
      align-items: center;
      
      .voice-wave {
        flex: 1;
        height: 40rpx;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 20rpx;
      }
      
      .duration {
        margin-left: 20rpx;
        font-size: 24rpx;
        color: rgba(255, 255, 255, 0.6);
      }
    }
  }
}

.iconfont {
  font-family: 'iconfont';
}
</style>

<script>
import { getEmotionHistory, toggleLike, toggleEmotionPublic, deleteEmotion } from '@/api/emotion'

export default {
  name: 'Echo',  // 添加组件名称
  
  data() {
    return {
      statusBarHeight: 0,
      historyList: [],
      page: 1,
      pageSize: 10,
      loadMoreStatus: 'more',
      isRefreshing: false,
      showActions: false,
      currentItem: null,
      currentTab: 'history',
      actions: [
        { name: '设为私密', icon: 'lock' },
        { name: '删除', icon: 'trash', color: '#ff5151' }
      ]
    }
  },
  
  created() {
    // 在 created 钩子中初始化一些数据
    this.statusBarHeight = uni.getSystemInfoSync().statusBarHeight
  },
  
  onLoad() {
    // 页面加载时获取数据
    this.loadData()
  },
  
  onPullDownRefresh() {
    this.loadData(true).then(() => {
      uni.stopPullDownRefresh()
    })
  },
  
  methods: {
    loadData(refresh = false) {
      console.log('loadData 开始时 historyList:', this.historyList) // 添加调试日志
      
      if (refresh) {
        this.page = 1
        this.historyList = []
      }
      
      getEmotionHistory(
        this.page,
        this.pageSize,
        (res) => {
          console.log('获取到的数据：', res) // 添加调试日志
          if (res.code === 200) {
            const newData = res.data?.data || []
            console.log('新数据：', newData) // 添加调试日志
            this.historyList = [...(this.historyList || []), ...newData]
            console.log('更新后的 historyList:', this.historyList) // 添加调试日志
            this.loadMoreStatus = this.page >= res.data.total_pages ? 'noMore' : 'more'
          } else {
            this.$u.toast(res.message || '加载失败')
          }
        },
        (error) => {
          console.error('加载失败：', error)
          this.$u.toast(error.message || '加载失败')
        }
      )
    },
    
    async loadMore() {
      if (this.loadMoreStatus === 'noMore') return
      this.page++
      await this.loadData()
    },
    
    async onRefresh() {
      this.isRefreshing = true
      await this.loadData(true)
      this.isRefreshing = false
    },
    
    showActionSheet(item) {
      this.currentItem = item
      this.showActions = true
    },
    
    handleAction(action) {
      if (!this.currentItem) return
      
      if (action.name === '设为私密') {
        this.togglePrivacy(this.currentItem)
      } else if (action.name === '删除') {
        this.deleteItem(this.currentItem)
      }
      
      this.showActions = false
    },
    
    async togglePrivacy(item) {
      try {
        await toggleEmotionPublic(item.id)
        this.loadData(true)
      } catch (error) {
        this.$u.toast(error.message || '操作失败')
      }
    },
    
    async deleteItem(item) {
      uni.showModal({
        title: '确认删除',
        content: '删除后无法恢复，是否继续？',
        success: async (res) => {
          if (res.confirm) {
            try {
              await deleteEmotion(item.id)
              this.loadData(true)
            } catch (error) {
              this.$u.toast(error.message || '删除失败')
            }
          }
        }
      })
    },
    
    // 获取卡片背景色
    getCardBackgroundColor(item) {
      const emotion = item.emotions?.[0]
      if (!emotion) return '#1f2937'
      
      const emotionColors = {
        '积极': '#10b981',
        '消极': '#ef4444',
        '中性': '#6366f1'
      }
      return (emotionColors[emotion.label] || '#1f2937') + '1A'
    },
    
    getCardBorderColor(item) {
      const emotion = item.emotions?.[0]
      if (!emotion) return '#1f2937'
      
      const emotionColors = {
        '积极': '#10b981',
        '消极': '#ef4444',
        '中性': '#6366f1'
      }
      return (emotionColors[emotion.label] || '#1f2937') + '33'
    },
    
    handleLike(item) {
      toggleLike(
        item.id,
        () => {
          this.loadData(true)
        },
        (error) => {
          this.$u.toast(error.message || '操作失败')
        }
      )
    },
    
    // 添加切换公开/私密状态的方法
    togglePublic(item) {
      toggleEmotionPublic(
        item.id,
        () => {
          this.loadData(true)
        },
        (error) => {
          this.$u.toast(error.message || '操作失败')
        }
      )
    }
  }
}
</script>
