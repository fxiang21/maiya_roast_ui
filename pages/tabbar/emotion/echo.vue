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
        <stats v-if="currentTab === 'analysis'" ref="stats" :hasData="hasEmotionData"></stats>
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
        isTabSwitching: false,
        _dataInitialized: false,
        hasEmotionData: false
      }
    },
    
    onLoad(options) {
      console.log('echo.vue onLoad')
      this.statusBarHeight = uni.getSystemInfoSync().statusBarHeight
      const targetTab = options.tab || 'history'
      this.currentTab = targetTab
      this.tabLineLeft = targetTab === 'history' ? '0%' : '50%'
      
      this.checkEmotionDataExistence();
    },
    
    onShow() {
      console.log('echo.vue onShow')
      this.checkEmotionDataExistence();
      
      this.$nextTick(() => {
        this.initCurrentTabData(true)
        this._dataInitialized = true
      })
    },
    
    onHide() {
      if (this.$refs.history?.abortRequests) {
        this.$refs.history.abortRequests();
      }
      if (this.$refs.stats?.abortAllRequests) {
        this.$refs.stats.abortAllRequests();
      }
    },
    
    methods: {
      async checkEmotionDataExistence() {
        try {
          const historyKey = 'emotion_history_cache';
          const historyCache = uni.getStorageSync(historyKey);
          
          if (historyCache) {
            const historyData = JSON.parse(historyCache);
            this.hasEmotionData = historyData && historyData.length > 0;
          } else {
            this.hasEmotionData = false;
          }
          
          if (!this.hasEmotionData) {
            try {
              const response = await this.checkHistoryDataExistence();
              this.hasEmotionData = response.data && response.data.length > 0;
            } catch (error) {
              console.log('检查历史数据存在性失败:', error);
              this.hasEmotionData = false;
            }
          }
          
          console.log('检查情感数据存在性:', this.hasEmotionData ? '有数据' : '无数据');
        } catch (error) {
          console.error('检查情感数据失败:', error);
          this.hasEmotionData = false;
        }
      },
      
      checkHistoryDataExistence() {
        return new Promise((resolve, reject) => {
          uni.request({
            url: 'YOUR_API_URL/emotions',
            method: 'GET',
            data: {
              page: 1,
              limit: 1
            },
            success: (res) => {
              resolve(res);
            },
            fail: (err) => {
              reject(err);
            }
          });
        });
      },
      
      initCurrentTabData(forceRefresh = false) {
        console.log('初始化数据，当前标签：', this.currentTab)
        this.$nextTick(() => {
          if (this.currentTab === 'history') {
            this.initHistoryData();
          } else if (this.currentTab === 'analysis') {
            if (this.hasEmotionData) {
              this.initAnalysisData();
            } else {
              console.log('没有情感数据，跳过加载分析');
              if (this.$refs.stats && typeof this.$refs.stats.showEmptyState === 'function') {
                this.$refs.stats.showEmptyState();
              }
            }
          }
        })
      },
      
      initHistoryData() {
        console.log('开始加载历史数据')
        if (this.$refs.history && typeof this.$refs.history.init === 'function') {
          this.$refs.history.abortRequests();
          this.$refs.history.init();
        }
      },
      
      initAnalysisData() {
        console.log('开始加载统计数据');
        try {
          if (this.$refs.stats) {
            if (!this.hasEmotionData) {
              if (typeof this.$refs.stats.showEmptyState === 'function') {
                this.$refs.stats.showEmptyState();
              }
              return;
            }
            
            this.$refs.stats.initAnalysis();
          } else {
            console.warn('stats组件未找到');
          }
        } catch (error) {
          console.error('加载统计数据失败:', error);
        }
      },
      switchTab(tab) {
        if (this.currentTab === tab || this.isTabSwitching) return
        
        this.isTabSwitching = true
        this.currentTab = tab
        this.tabLineLeft = tab === 'history' ? '0%' : '50%'
        
        this.$nextTick(async () => {
          if (tab === 'analysis') {
            await this.$nextTick()
            if (this.hasEmotionData) {
              this.initAnalysisData()
            } else {
              console.log('没有情感数据，跳过加载分析');
              if (this.$refs.stats && typeof this.$refs.stats.showEmptyState === 'function') {
                this.$refs.stats.showEmptyState();
              }
            }
          } else {
            this.initHistoryData()
          }
          this.isTabSwitching = false
        })
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