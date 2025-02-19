<template>
    <view class="container">
      <!-- 状态栏 -->
      <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
      
      <!-- 头部 -->
      <view class="header">
        <image class="logo" src="/static/img/logo.png" mode="aspectFit"></image>
        <text class="title">黑洞吐槽</text>
        <view class="more">
          <text class="iconfont">&#xe601;</text>
        </view>
      </view>
      
      <!-- 切换导航 -->
      <view class="nav-wrapper">
        <view class="nav-tabs">
          <view 
            class="tab-item" 
            :class="{ active: currentTab === 'history' }"
            @tap="switchTab('history')"
          >
            历史
          </view>
          <view 
            class="tab-item" 
            :class="{ active: currentTab === 'analysis' }"
            @tap="switchTab('analysis')"
          >
            分析
          </view>
          <view class="tab-line" :style="{ left: tabLineLeft }"></view>
        </view>
      </view>
      
      <!-- 内容区域 -->
      <view class="content-area">
        <history v-if="currentTab === 'history'" ref="history"></history>
        <stats v-if="currentTab === 'analysis'" ref="stats"></stats>
      </view>
    </view>
  </template>
  
  <script>
  import History from './history.vue'
  import Stats from './stats.vue'
  
  export default {
    components: {
      History,
      Stats
    },
    
    data() {
      return {
        statusBarHeight: 0,
        currentTab: 'history',
        tabLineLeft: '0%',
        isTabSwitching: false
      }
    },
    
    onLoad(options) {
      console.log('echo.vue onLoad')
      this.statusBarHeight = uni.getSystemInfoSync().statusBarHeight
      const targetTab = options.tab || 'history'
      this.currentTab = targetTab
      this.tabLineLeft = targetTab === 'history' ? '0%' : '50%'
    },
    
    onShow() {
      console.log('echo.vue onShow')
      // 每次显示页面时都刷新数据
      this.$nextTick(() => {
        this.initCurrentTabData()
      })
    },
    
    methods: {
      initCurrentTabData() {
        console.log('初始化数据，当前标签：', this.currentTab)
        this.$nextTick(() => {
          if (this.currentTab === 'history') {
            console.log('开始加载历史数据')
            if (this.$refs.history && typeof this.$refs.history.init === 'function') {
              this.$refs.history.init()
            }
          } else if (this.currentTab === 'analysis') {
            console.log('开始加载统计数据')
            try {
              if (this.$refs.stats) {
                this.$refs.stats.loadStats()
              } else {
                console.warn('stats组件未找到')
              }
            } catch (error) {
              console.error('加载统计数据失败:', error)
            }
          }
        })
      },
      
      switchTab(tab) {
        if (this.currentTab === tab || this.isTabSwitching) return
        
        this.isTabSwitching = true
        this.currentTab = tab
        this.tabLineLeft = tab === 'history' ? '0%' : '50%'
        
        // 切换后初始化数据
        this.$nextTick(() => {
          this.initCurrentTabData()
        })

        setTimeout(() => {
          this.isTabSwitching = false
        }, 300)
      }
    }
  }
  </script>
  
  <style lang="scss" scoped>
  .container {
    min-height: 100vh;
    background-color: #0A0B1B;
    display: flex;
    flex-direction: column;
  }
  
  .header {
    padding: 20rpx 30rpx;
    display: flex;
    align-items: center;
    background: linear-gradient(180deg, #0A0B1B 0%, rgba(10, 11, 27, 0.9) 100%);
    
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
  
  .nav-wrapper {
    padding: 20rpx 0;
  }
  
  .nav-tabs {
    position: relative;
    display: flex;
    width: 400rpx;
    margin: 0 auto;
    
    .tab-item {
      flex: 1;
      text-align: center;
      font-size: 32rpx;
      color: rgba(255, 255, 255, 0.6);
      padding: 20rpx 0;
      position: relative;
      transition: all 0.3s;
      
      &.active {
        color: #fff;
        font-weight: 500;
      }
    }
    
    .tab-line {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 50%;
      height: 4rpx;
      background: linear-gradient(90deg, #7C4DFF 0%, #7C4DFF 100%);
      transition: all 0.3s ease;
    }
  }
  
  .content-area {
    flex: 1;
    position: relative;
  }
  
  .iconfont {
    font-family: 'iconfont';
  }
  </style>