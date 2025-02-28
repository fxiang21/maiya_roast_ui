<template>
  <view class="stats-container">
    <!-- 空状态提示 -->
    <view v-if="showEmptyState" class="empty-state">
      <view class="empty-content">
        <!-- 图标和主要提示文字 -->
        <view class="main-empty">
          <view class="empty-text">
            <text class="highlight">好</text>与<text class="highlight">不好</text>，
            <text class="brand-text">黑洞吐槽</text>
          </view>
        </view>
        
        <!-- 添加鼓励性的随机提示语 -->
        <view class="encouragement">
          <text class="tip">{{ randomTip }}</text>
        </view>
        
        <!-- 操作按钮 -->
        <button class="goto-emotion-btn" @tap="navigateToEmotion">
          <text class="iconfont icon-edit"></text>
          去吐槽
        </button>
      </view>
    </view>

    <!-- 原有内容，只在有数据时显示 -->
    <block v-else>
      <!-- 周期选择器 -->
      <view class="period-selector">
        <view 
          v-for="item in periods" 
          :key="item.value"
          class="period-item"
          :class="{ active: currentPeriod === item.value }"
          @tap="changePeriod(item.value)"
        >
          {{ item.label }}
        </view>
      </view>

      <block v-if="statsData">
        <!-- 数据概览标题 -->
        <text class="section-title">数据概览</text>
        
        <!-- 数据概览卡片 -->
        <view class="stats-card">
          <view class="overview-stats">
            <view class="stat-item">
              <text class="stat-value">{{ getStatValue(statsData.statistics.complaint_length) }}</text>
              <text class="stat-label">吐槽字数</text>
            </view>
            <view class="stat-item">
              <text class="stat-value">{{ getLikesCount }}</text>
              <text class="stat-label">点赞数</text>
            </view>
            <view class="stat-item">
              <text class="stat-value">{{ getCommentsCount }}</text>
              <text class="stat-label">评论数</text>
            </view>
          </view>
          
          <!-- 情感气泡图 -->
          <view class="chart-section">
            <view class="emotion-bubbles-wrapper">
              <view class="emotion-bubbles">
                <!-- 调试信息 -->
                <view v-if="!dynamicBubbles.length" class="debug-info">
                  {{ debugInfo || '加载中...' }}
                </view>
                
                <!-- 气泡容器 -->
                <view v-else class="bubbles-container">
                  <view
                    v-for="(bubble, index) in dynamicBubbles"
                    :key="index"
                    class="bubble-item"
                    :style="{
                      width: bubble.size + 'rpx',
                      height: bubble.size + 'rpx',
                      left: (bubble.x - bubble.size/2) + 'rpx',
                      top: (bubble.y - bubble.size/2) + 'rpx',
                      background: getBubbleGradient(bubble.emotion),
                      'clip-path': bubble.shape
                    }"
                  >
                    <view class="bubble-content">
                      <text class="emotion-face" :style="{
                        color: getContrastColor(bubble.emotion),
                        textShadow: '0 2rpx 4rpx rgba(0, 0, 0, 0.3)'
                      }">
                        {{ getEmotionFace(bubble.emotion) }}
                      </text>
                      <text class="emotion-text" :style="{
                        color: getContrastColor(bubble.emotion),
                        backgroundColor: 'rgba(0, 0, 0, 0.15)',
                        padding: '4rpx 12rpx',
                        borderRadius: '20rpx'
                      }">
                        {{ bubble.emotion }}
                      </text>
                    </view>
                  </view>
                </view>
              </view>
            </view>
            
            <!-- 新增提示文本 -->
            <view class="chart-tip" v-if="emotionTips && emotionTips.emotion">
              <text class="tip-icon">💡</text>
              <text class="tip-text">{{ emotionTips.emotion }}</text>
            </view>
          </view>
        </view>

        <!-- 分类统计标题 -->
        <text class="section-title">吐槽分类</text>
        
        <!-- 分类统计图 -->
        <view class="stats-card">
          <view class="chart-wrapper">
            <view class="chart-title">分类统计</view>
            <view class="category-chart">
              <view v-for="(categoryData, category) in processedCategoryData" :key="category" class="category-item">
                <view class="category-bars">
                  <view 
                    v-if="categoryData.positive > 0"
                    class="emotion-bar positive" 
                    :style="{height: categoryData.positive_height + 'rpx'}" 
                  >
                    <text class="bar-value">{{categoryData.positive}}</text>
                  </view>
                  
                  <view 
                    v-if="categoryData.neutral > 0"
                    class="emotion-bar neutral" 
                    :style="{height: categoryData.neutral_height + 'rpx'}" 
                  >
                    <text class="bar-value">{{categoryData.neutral}}</text>
                  </view>
                  
                  <view 
                    v-if="categoryData.negative > 0"
                    class="emotion-bar negative" 
                    :style="{height: categoryData.negative_height + 'rpx'}" 
                  >
                    <text class="bar-value">{{categoryData.negative}}</text>
                  </view>
                </view>
                <view class="category-name">{{category}}</view>
              </view>
              <view v-if="!Object.keys(processedCategoryData).length" class="empty-chart">
                暂无分类数据
              </view>
            </view>
            
            <!-- 添加图例 -->
            <view class="chart-legend">
              <view class="legend-item">
                <view class="legend-color positive"></view>
                <text class="legend-text">积极</text>
              </view>
              <view class="legend-item">
                <view class="legend-color neutral"></view>
                <text class="legend-text">中性</text>
              </view>
              <view class="legend-item">
                <view class="legend-color negative"></view>
                <text class="legend-text">消极</text>
              </view>
            </view>
            
            <!-- 分类统计提示文本 -->
            <view class="chart-tip" v-if="emotionTips && emotionTips.category">
              <text class="tip-icon">💡</text>
              <text class="tip-text">{{ emotionTips.category }}</text>
            </view>
          </view>
        </view>

        <!-- 关键词标题 -->
        <text class="section-title">吐槽关键词</text>
        
        <!-- 关键词云图 -->
        <view class="stats-card">
          <view class="chart-wrapper">
            <view class="chart-title">关键词云</view>
            <view class="keyword-cloud-container">
              <view v-if="!processedKeywords.length" class="empty-chart">
                暂无关键词数据
              </view>
              <view v-else class="keyword-cloud">
                <view 
                  v-for="(keyword, index) in processedKeywords" 
                  :key="index"
                  class="keyword-tag"
                  :style="{
                    fontSize: keyword.size + 'rpx',
                    color: keyword.color,
                    left: keyword.x + 'rpx',
                    top: keyword.y + 'rpx',
                    transform: `rotate(${keyword.rotate}deg)`,
                    opacity: keyword.opacity
                  }"
                >
                  {{ keyword.word }}
                </view>
              </view>
            </view>
            
            <!-- 关键词提示文本 -->
            <view class="chart-tip" v-if="emotionTips && emotionTips.target">
              <text class="tip-icon">💡</text>
              <text class="tip-text">{{ emotionTips.target }}</text>
            </view>
          </view>
        </view>
      </block>

      <view class="loading-state" v-if="isLoading">
        <uni-load-more status="loading" />
      </view>
    </block>
  </view>
</template>

<script>
import { getEmotionStats, getPeriodEmotionStats, getEmotionTips } from '@/api/emotion.js'
import DynamicBubbleChart from '@/utils/DynamicBubbleChart'

export default {
  components: {
  },
  data() {
    return {
      periods: [
        { label: '周', value: 'weekly' },
        { label: '月', value: 'monthly' },
        { label: '年', value: 'yearly' }
      ],
      currentPeriod: 'weekly',
      timeSeriesOpts: {
        padding: [15, 15, 0, 15],
        legend: { show: false },
        xAxis: {
          disableGrid: true,
          fontColor: '#CCCCCC'
        },
        yAxis: {
          gridType: 'dash',
          gridColor: 'rgba(255, 255, 255, 0.1)',
          fontColor: '#CCCCCC',
          min: 0
        },
        extra: {
          line: {
            type: 'curve',
            width: 2,
            activeType: 'hollow'
          }
        }
      },
      categoryOpts: {
        padding: [15, 15, 0, 15],
        legend: { show: false },
        xAxis: {
          disableGrid: true,
          fontColor: '#CCCCCC'
        },
        yAxis: {
          gridType: 'dash',
          gridColor: 'rgba(255, 255, 255, 0.1)',
          fontColor: '#CCCCCC',
          min: 0
        },
        extra: {
          column: {
            width: 30,
            radius: 6
          }
        }
      },
      timeSeriesData: null,
      periodStatsData: null,
      isLoading: false,
      cWidth: 0,
      cHeight: 0,
      pixelRatio: 1,
      chartKey: 0, // 用于强制刷新图表
      containerWidth: 0,
      containerHeight: 0,
      dynamicBubbles: [],
      bubbleChart: null,
      animationTimer: null,
      lastUpdate: 0,
      debugInfo: '加载中...',
      currentRequests: [],
      autoRefreshTimer: null,
      _initialized: false,
      _statValueCache: {}, // 添加缓存对象
      _requestLock: false,
      _requestLockTimer: null,
      _initializingBubblePromise: null,
      processedKeywords: [],
      emotionTips: null,
      tipTaskId: null,
      tipRetryCount: 0,
      tipMaxRetries: 5,
      // 添加提示信息数组
      tips: [
        "吐槽越多，统计越准确",
        "抒发情感，看见自己",
        "情绪变化，尽在掌握",
        "记录心情，发现规律",
        "让黑洞帮你分析情绪"
      ],
    }
  },

  created() {
    console.log('组件created')
  },

  async mounted() {
    console.log('stats mounted');
    
    // 添加可见性检测
    this.$nextTick(() => {
      this.checkVisibility();
    });
    
    // 添加定时刷新
    this.autoRefreshTimer = setInterval(() => {
      if (this.$parent?.currentTab === 'analysis' && !this.isLoading) {
        this.loadAllStats();
      }
    }, 300000); // 5分钟自动刷新
  },

  computed: {
    statsData() {
      return this.periodStatsData || null
    },

    // 获取点赞数
    getLikesCount() {
      console.log("this.statsData",this.statsData)
      if (!this.statsData || !this.statsData.user_stats) return 0
      return this.statsData.user_stats.likes_count || 0
    },
    
    // 获取评论数
    getCommentsCount() {
      console.log('getCommentsCount被调用')
      if (!this.statsData || !this.statsData.user_stats) return 0
      return this.statsData.user_stats.comments_count || 0
    },

    // 获取目标统计数据
    getTargetStats() {
      console.log('getTargetStats被调用')
      if (!this.statsData || !this.statsData.statistics || !this.statsData.statistics.target) {
        return {}
      }
      return this.statsData.statistics.target
    },

    // 重写分类数据处理计算属性
    processedCategoryData() {
      if (!this.statsData || !this.statsData.statistics || !this.statsData.statistics.category) {
        console.log('分类数据为空');
        return {};
      }
      
      const categoryData = this.statsData.statistics.category;
      console.log('原始分类数据:', JSON.stringify(categoryData));
      
      const result = {};
      
      // 处理每个分类
      Object.entries(categoryData).forEach(([category, emotions]) => {
        if (!result[category]) {
          result[category] = {
            positive: 0,
            neutral: 0,
            negative: 0,
            total: 0
          };
        }
        
        // 直接使用positive/negative/neutral键
        if (typeof emotions === 'object' && emotions !== null) {
          // 直接映射情绪分类
          if ('positive' in emotions) {
            result[category].positive = emotions.positive || 0;
          }
          if ('negative' in emotions) {
            result[category].negative = emotions.negative || 0;
          }
          if ('neutral' in emotions) {
            result[category].neutral = emotions.neutral || 0;
          }
          
          // 计算总数
          result[category].total = 
            result[category].positive + 
            result[category].negative + 
            result[category].neutral;
        } else {
          console.warn(`分类 ${category} 的情绪数据格式不正确:`, emotions);
        }
      });
      
      console.log('处理后的分类数据:', JSON.stringify(result));
      
      // 寻找最大值用于缩放
      let maxValue = 1;
      Object.values(result).forEach(item => {
        maxValue = Math.max(maxValue, item.positive, item.neutral, item.negative);
      });
      console.log('最大值:', maxValue);
      
      // 重新调整比例 - 限制最大高度
      const maxHeight = 160; // 降低最大高度(rpx)，防止覆盖
      const minHeight = 20;  // 最小高度(rpx)
      
      Object.values(result).forEach(item => {
        // 确保有值的柱状图至少有最小高度，但不超过最大高度
        item.positive_height = item.positive > 0 ? 
          Math.max(minHeight, Math.min(maxHeight, Math.floor(item.positive / maxValue * maxHeight))) : 0;
        
        item.neutral_height = item.neutral > 0 ? 
          Math.max(minHeight, Math.min(maxHeight, Math.floor(item.neutral / maxValue * maxHeight))) : 0;
        
        item.negative_height = item.negative > 0 ? 
          Math.max(minHeight, Math.min(maxHeight, Math.floor(item.negative / maxValue * maxHeight))) : 0;
      });
      
      console.log('最终渲染数据:', JSON.stringify(result));
      return result;
    },
    
    // 优化关键词相关计算属性
    keywordMaxCount() {
      if (!this.getTargetStats || Object.keys(this.getTargetStats).length === 0) {
        return 1;
      }
      return Math.max(...Object.values(this.getTargetStats));
    },
    
    // 计算关键词总数，用于调整显示效果
    keywordTotalCount() {
      if (!this.getTargetStats) return 0;
      return Object.values(this.getTargetStats).reduce((sum, count) => sum + count, 0);
    },

    // 添加空状态判断
    showEmptyState() {
      // 判断是否有统计数据且数据为空
      return !this.isLoading && 
             (!this.statsData || 
              !this.statsData.statistics || 
              (this.statsData.statistics && 
               Object.keys(this.statsData.statistics).length === 0));
    },
    
    // 随机提示语
    randomTip() {
      return this.tips[Math.floor(Math.random() * this.tips.length)];
    },
  },

  methods: {
    // 优化 getStatValue 方法，添加缓存
    getStatValue(value) {
      // 使用简单的缓存机制
      const cacheKey = `stat_${value}`;
      if (this._statValueCache[cacheKey] !== undefined) {
        return this._statValueCache[cacheKey];
      }
      
      // 只在调试模式下打印日志
      if (process.env.NODE_ENV === 'development') {
        console.log('getStatValue被调用', value);
      }
      
      const result = value || 0;
      this._statValueCache[cacheKey] = result;
      return result;
    },
    
    // 在数据更新时清除缓存
    clearStatValueCache() {
      this._statValueCache = {};
    },

    // 获取气泡的不规则圆形效果
    getBubbleRadius(size) {
      const radius1 = size * 0.5;
      const radius2 = size * 0.48;
      const radius3 = size * 0.52;
      const radius4 = size * 0.49;
      return `${radius1}% ${radius2}% ${radius3}% ${radius4}%`;
    },

    // 获取表情颜色
    getEmotionFaceColor(emotion) {
      const colors = {
        // 积极情绪 - 暖色调
        '快乐': '#FFD700',  // 金色
        '期待': '#FFA500',  // 橙色
        '信任': '#98FB98',  // 浅绿色
        '爱': '#FF69B4',    // 粉红色
        '骄傲': '#DDA0DD',  // 梅红色
        '希望': '#90EE90',  // 淡绿色
        '兴奋': '#FFA07A',  // 浅鲑鱼色
        '满足': '#FFB6C1',  // 浅粉色
        
        // 中性情绪 - 柔和色调
        '惊讶': '#87CEEB',  // 天蓝色
        '平静': '#E0FFFF',  // 淡青色
        '好奇': '#B0E0E6',  // 粉蓝色
        '淡定': '#F0F8FF',  // 爱丽丝蓝
        '困惑': '#E6E6FA',  // 淡紫色
        
        // 消极情绪 - 冷色调
        '悲伤': '#B0C4DE',  // 浅钢蓝
        '愤怒': '#FF6B6B',  // 浅红色
        '恐惧': '#A9A9A9',  // 深灰色
        '厌恶': '#DDA0DD',  // 梅红色
        '焦虑': '#D3D3D3',  // 浅灰色
        '失望': '#C0C0C0',  // 银色
        '嫉妒': '#DA70D6',  // 兰花紫
        '羞愧': '#FFB6C1',  // 浅粉红
        '内疚': '#B0C4DE',  // 浅钢蓝
        '孤独': '#A9A9A9'   // 深灰色
      }
      return colors[emotion] || '#FFFFFF'
    },

    // 获取气泡渐变背景
    getBubbleGradient(emotion) {
      const gradients = {
        // 积极情绪 - 暖色调渐变
        '快乐': 'radial-gradient(circle at 30% 30%, rgba(255, 228, 214, 0.95), rgba(255, 196, 176, 0.85))',
        '期待': 'radial-gradient(circle at 30% 30%, rgba(255, 232, 214, 0.95), rgba(255, 212, 176, 0.85))',
        '信任': 'radial-gradient(circle at 30% 30%, rgba(200, 255, 200, 0.95), rgba(170, 255, 170, 0.85))',
        '爱': 'radial-gradient(circle at 30% 30%, rgba(255, 214, 244, 0.95), rgba(255, 176, 224, 0.85))',
        '骄傲': 'radial-gradient(circle at 30% 30%, rgba(255, 214, 244, 0.95), rgba(255, 176, 224, 0.85))',
        '希望': 'radial-gradient(circle at 30% 30%, rgba(200, 255, 200, 0.95), rgba(170, 255, 170, 0.85))',
        '兴奋': 'radial-gradient(circle at 30% 30%, rgba(255, 214, 214, 0.95), rgba(255, 176, 176, 0.85))',
        '满足': 'radial-gradient(circle at 30% 30%, rgba(255, 228, 228, 0.95), rgba(255, 196, 196, 0.85))',
        
        // 中性情绪 - 淡色调渐变
        '惊讶': 'radial-gradient(circle at 30% 30%, rgba(186, 225, 255, 0.95), rgba(143, 198, 255, 0.85))',
        '平静': 'radial-gradient(circle at 30% 30%, rgba(224, 255, 255, 0.95), rgba(196, 255, 255, 0.85))',
        '好奇': 'radial-gradient(circle at 30% 30%, rgba(176, 224, 230, 0.95), rgba(143, 198, 208, 0.85))',
        '淡定': 'radial-gradient(circle at 30% 30%, rgba(240, 248, 255, 0.95), rgba(220, 230, 240, 0.85))',
        '困惑': 'radial-gradient(circle at 30% 30%, rgba(230, 230, 250, 0.95), rgba(210, 210, 230, 0.85))',
        
        // 消极情绪 - 冷色调渐变
        '悲伤': 'radial-gradient(circle at 30% 30%, rgba(232, 241, 255, 0.95), rgba(210, 219, 255, 0.85))',
        '愤怒': 'radial-gradient(circle at 30% 30%, rgba(255, 200, 200, 0.95), rgba(255, 162, 162, 0.85))',
        '恐惧': 'radial-gradient(circle at 30% 30%, rgba(200, 200, 200, 0.95), rgba(180, 180, 180, 0.85))',
        '厌恶': 'radial-gradient(circle at 30% 30%, rgba(255, 200, 255, 0.95), rgba(255, 170, 255, 0.85))',
        '焦虑': 'radial-gradient(circle at 30% 30%, rgba(211, 211, 211, 0.95), rgba(190, 190, 190, 0.85))',
        '失望': 'radial-gradient(circle at 30% 30%, rgba(192, 192, 192, 0.95), rgba(170, 170, 170, 0.85))',
        '嫉妒': 'radial-gradient(circle at 30% 30%, rgba(218, 112, 214, 0.95), rgba(198, 92, 194, 0.85))',
        '羞愧': 'radial-gradient(circle at 30% 30%, rgba(255, 182, 193, 0.95), rgba(255, 162, 173, 0.85))',
        '内疚': 'radial-gradient(circle at 30% 30%, rgba(176, 196, 222, 0.95), rgba(156, 176, 202, 0.85))',
        '孤独': 'radial-gradient(circle at 30% 30%, rgba(169, 169, 169, 0.95), rgba(149, 149, 149, 0.85))'
      }
      return gradients[emotion] || 'radial-gradient(circle at 30% 30%, rgba(200, 200, 200, 0.95), rgba(170, 170, 170, 0.85))'
    },

    // 获取情感对应的表情符号
    getEmotionFace(emotion) {
      const faces = {
        // 积极情绪
        '快乐': '˃ᴗ˂',
        '期待': '✧ ✧',
        '信任': '˶⚈ ᴗ ⚈˵',
        '爱': '♡ ♡',
        '骄傲': '⌢̈ ⌢̈',
        '希望': '˶⚈ ᴗ ⚈˵',
        '兴奋': '✧ ✧',
        '满足': '⌣̈ ⌣̈',
        
        // 中性情绪
        '惊讶': '◎ ◎',
        '平静': '⌣̈ ⌣̈',
        '好奇': '• •',
        '淡定': '⌣̈ ⌣̈',
        '困惑': '? ?',
        
        // 消极情绪
        '悲伤': '﹏',
        '愤怒': '⋋_⋌',
        '恐惧': '﹏',
        '厌恶': '︿',
        '焦虑': '⊙﹏⊙',
        '失望': '︶',
        '嫉妒': '⋋_⋌',
        '羞愧': '⁄⁄•⁄ω⁄•⁄⁄',
        '内疚': '﹏',
        '孤独': '︶'
      }
      return faces[emotion] || '⌣̈' // 默认表情
    },

    // 获取气泡大小
    getBubbleSize(value) {
      // 基础大小为120rpx，最大为300rpx
      const baseSize = 120
      const maxSize = 300
      // 根据情感值的百分比计算大小
      const size = baseSize + (value / 100) * (maxSize - baseSize)
      return Math.min(maxSize, Math.max(baseSize, size))
    },

    // 修改后的周期切换方法
    async changePeriod(period) {
      if (this.currentPeriod === period) return;
      
      // 中止所有进行中的请求
      this.abortAllRequests();
      this.stopAnimation();

      this.currentPeriod = period;
      this.loadAllStats();
    },

    abortAllRequests() {
      this.currentRequests.forEach(task => {
        if (task && typeof task.abort === 'function') {
          task.abort();
        }
      });
      this.currentRequests = [];
    },

    // 优化 initAnalysis 方法，确保组件可见时立即加载数据
    initAnalysis() {
      console.log('统一初始化分析页面');
      
      // 无论是否已初始化，都尝试加载数据
      // 避免重复初始化图表
      const shouldInitBubbles = !this.bubbleChart;
      
      // 标记为已初始化
      this._initialized = true;
      
      // 使用 nextTick 确保 DOM 已渲染
      this.$nextTick(async () => {
        try {
          // 先初始化图表容器（如果需要）
          if (shouldInitBubbles) {
            await this.initDynamicBubbles(true);
          }
          
          // 使用请求锁定机制加载数据
          this.loadAllStatsWithLock();
          
          console.log('分析页面初始化完成');
        } catch (error) {
          console.error('初始化分析页面失败:', error);
          this.debugInfo = '初始化失败，请重试';
        }
      });
    },

    // 添加带锁定机制的数据加载方法
    loadAllStatsWithLock() {
      // 如果锁定中，跳过请求
      if (this._requestLock) {
        console.log('请求已锁定，跳过重复请求');
        return;
      }
      
      // 设置锁定
      this._requestLock = true;
      
      // 清除之前的定时器
      if (this._requestLockTimer) {
        clearTimeout(this._requestLockTimer);
      }
      
      // 执行数据加载
      this.loadAllStats();
      
      // 设置锁定释放定时器（1秒后释放锁定）
      this._requestLockTimer = setTimeout(() => {
        this._requestLock = false;
      }, 1000);
    },

    // 修改 onShow 生命周期钩子
    onShow() {
      console.log('stats onShow');
      if (this._initialized && this.$parent?.currentTab === 'analysis' && !this.periodStatsData) {
        // 只在没有数据时才加载
        this.loadAllStatsWithLock();
      }
    },

    // 改进 initDynamicBubbles 方法，增强稳定性和可靠性
    initDynamicBubbles(forceReset = false) {
      // 添加防重复初始化逻辑
      if (this.bubbleChart && !forceReset) {
        console.log('气泡图已初始化，跳过')
        return Promise.resolve(this.bubbleChart)
      }
      
      // 如果正在初始化中，返回现有的promise
      if (this._initializingBubblePromise && !forceReset) {
        console.log('气泡图正在初始化中，返回现有promise')
        return this._initializingBubblePromise
      }
      
      console.log('initDynamicBubbles被调用')
      
      // 创建初始化Promise并保存引用
      this._initializingBubblePromise = new Promise((resolve, reject) => {
        const attemptInit = (retryCount = 0) => {
          if (retryCount > 5) {
            console.error('气泡图初始化失败，超过最大重试次数')
            reject(new Error('初始化失败，超过最大重试次数'))
            this._initializingBubblePromise = null
            return
          }
          
          // 确保在DOM渲染完成后执行
          this.$nextTick(() => {
            const query = uni.createSelectorQuery().in(this)
            query.select('.emotion-bubbles-wrapper')
              .boundingClientRect(data => {
                if (data && data.width && data.height && data.width > 0 && data.height > 0) {
                  // 这里 data.width 和 data.height 为 px 单位
                  try {
                    uni.getSystemInfo({
                      success: (res) => {
                        const designWidth = 750;
                        const scaleFactor = designWidth / res.windowWidth;
                        // 转换成 rpx 后的尺寸
                        this.containerWidth = data.width * scaleFactor;
                        this.containerHeight = data.height * scaleFactor;
            
                        // 初始化气泡图时传入 scaleFactor
                        this.bubbleChart = new DynamicBubbleChart({
                          width: this.containerWidth,
                          height: this.containerHeight,
                          minSize: 60,
                          maxSize: 180,
                          maxSpeed: 1.2,
                          scaleFactor: 1 // 此处在 DynamicBubbleChart 里已调用转换，所以传入1即可
                        });
            
                        console.log('气泡图初始化成功，容器尺寸:', {
                          width: this.containerWidth,
                          height: this.containerHeight
                        });
                        
                        // 清除初始化Promise引用
                        this._initializingBubblePromise = null
                        
                        // 如果有数据，立即更新气泡
                        if (this.periodStatsData?.statistics?.emotion) {
                          this.updateBubbles();
                        }
                        
                        resolve(this.bubbleChart);
                      },
                      fail: (err) => {
                        console.error('获取系统信息失败:', err);
                        // 清除初始化Promise引用
                        this._initializingBubblePromise = null
                        reject(err);
                      }
                    });
                  } catch (error) {
                    console.error('初始化气泡图出错:', error);
                    this._initializingBubblePromise = null
                    reject(error);
                  }
                } else {
                  console.warn(`未找到容器元素或容器尺寸为0 (尝试 ${retryCount+1}/6):`, data);
                  // 延迟重试，每次增加延迟时间
                  setTimeout(() => {
                    attemptInit(retryCount + 1);
                  }, 300 * (retryCount + 1));
                }
              }).exec();
          });
        };
        
        // 开始初始化尝试
        attemptInit();
      });
      
      return this._initializingBubblePromise;
    },

    // 改进updateBubbles方法，增加更多检查
    updateBubbles() {
      if (!this.bubbleChart) {
        console.warn('无法更新气泡: 图表未初始化');
        // 尝试初始化图表
        this.initDynamicBubbles(true).then(() => {
          this.updateBubbles();
        });
        return;
      }
      
      if (!this.periodStatsData || !this.periodStatsData.statistics || !this.periodStatsData.statistics.emotion) {
        console.warn('无法更新气泡: 无数据或数据格式不正确', this.periodStatsData);
        return;
      }
      
      console.log('更新气泡，数据:', this.periodStatsData.statistics.emotion);
      try {
        this.dynamicBubbles = this.bubbleChart.generateBubbles(this.periodStatsData.statistics.emotion);
        // 更新后立即开始动画
        this.startAnimation();
      } catch (error) {
        console.error('生成气泡时出错:', error);
      }
    },

    startAnimation() {
      if (this.animationTimer) {
        clearTimeout(this.animationTimer)
        this.animationTimer = null
      }

      let isStable = false
      const stabilityThreshold = 0.1
      const maxStableFrames = 60
      let stableFrameCount = 0

      const checkStability = () => {
        const movingBubbles = this.dynamicBubbles.filter(b => 
          Math.abs(b.vx) > stabilityThreshold || 
          Math.abs(b.vy) > stabilityThreshold
        )
        return movingBubbles.length === 0
      }

      const animate = () => {
        if (!this.bubbleChart || isStable) return

        const now = Date.now()
        if (!this.lastUpdate) this.lastUpdate = now
        const deltaTime = now - this.lastUpdate
        
        if (deltaTime > 16) {
          try {
            this.bubbleChart.updatePositions()
            
            // 添加速度衰减
            this.dynamicBubbles.forEach(b => {
              b.vx *= 0.98
              b.vy *= 0.98
            })

            // 更新视图
            this.$set(this, 'dynamicBubbles', [...this.bubbleChart.bubbles])
            this.lastUpdate = now

            // 稳定性检测
            if (checkStability()) {
              stableFrameCount++
              if (stableFrameCount >= maxStableFrames) {
                isStable = true
                console.log('动画已稳定，停止更新')
                return
              }
            } else {
              stableFrameCount = 0
            }
          } catch (e) {
            console.error('动画更新异常：', e)
            this.stopAnimation()
            return
          }
        }
        
        // 改用 setTimeout 兼容小程序环境
        this.animationTimer = setTimeout(animate, 16)
      }
      
      animate()
    },

    stopAnimation() {
      if (this.animationTimer) {
        clearTimeout(this.animationTimer)
        this.animationTimer = null
      }
    },

    onChartComplete() {
      console.log('图表渲染完成')
    },

    // 新增颜色计算方法
    getContrastColor(emotion) {
      const gradient = this.getBubbleGradient(emotion);
      // 从渐变中提取主色
      const mainColor = gradient.match(/rgba?\([^)]+\)/)?.[0] || '#FFFFFF';
      // 计算亮度值
      const rgb = mainColor.match(/\d+/g);
      const brightness = (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
      return brightness > 150 ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)';
    },

    // 添加 loadStats 方法
    loadStats() {
      console.log('loadStats被调用')
      // 重新加载数据
      this.initDynamicBubbles()
      // 如果有其他数据加载逻辑，也放在这里
    },

    // 修改 loadAllStats 方法，确保数据加载和气泡更新的正确顺序
    async loadAllStats() {
      // 如果已经在加载中，则跳过
      if (this.isLoading) {
        console.log('数据正在加载中，跳过重复请求');
        return;
      }
      
      this.isLoading = true;
      this.debugInfo = '加载中...';
      
      try {
        this.abortAllRequests(); // 清除旧请求
        this.clearStatValueCache(); // 清除缓存
        
        // 使用 Promise.all 并发请求数据
        const [periodStatsRes] = await Promise.all([
          //this.fetchEmotionStats(this.currentPeriod),
          this.fetchPeriodStats(this.currentPeriod)
        ]);
        
        
        // 检查数据有效性
        if (!periodStatsRes.data || !periodStatsRes.data.statistics) {
          console.warn('加载的数据格式不正确:', periodStatsRes);
          this.debugInfo = '数据格式不正确，请重试';
          this.isLoading = false;
          return;
        }
        
        // 先更新数据
        this.periodStatsData = periodStatsRes.data;
        this.chartKey++; // 强制刷新图表
        
        // 确保气泡图已初始化，然后更新气泡
        try {
          // 如果气泡图未初始化，先初始化
          if (!this.bubbleChart) {
            await this.initDynamicBubbles(true);
          }
          
          // 更新气泡
          this.updateBubbles();
        } catch (error) {
          console.error('更新气泡失败:', error);
        }
        
        // 在数据更新后刷新词云布局
        this.$nextTick(() => {
          this.layoutKeywords();
        });
        
        // 最后清除加载状态
        this.isLoading = false;
        this.debugInfo = '';
      } catch (error) {
        console.error('加载统计数据失败:', error);
        this.isLoading = false;
        this.debugInfo = '加载失败，请重试';
      }
    },

    fetchEmotionStats(period) {
      return new Promise((resolve, reject) => {
        const requestTask = getEmotionStats(
          period,
          (res) => {
            this.currentRequests = this.currentRequests.filter(t => t !== requestTask);
            resolve(res);
          },
          (err) => {
            this.currentRequests = this.currentRequests.filter(t => t !== requestTask);
            reject(err);
          }
        );
        this.currentRequests.push(requestTask);
      });
    },

    fetchPeriodStats(period) {
      return new Promise((resolve, reject) => {
        const requestTask = getPeriodEmotionStats(
          period,
          (res) => {
            this.currentRequests = this.currentRequests.filter(t => t !== requestTask);
            
            // 如果返回了task_id，则获取情感建议
            if (res.data && res.data.task_id) {
              this.tipTaskId = res.data.task_id;
              this.tipRetryCount = 0;
              this.fetchEmotionTips();
            }
            
            resolve(res);
          },
          (err) => {
            this.currentRequests = this.currentRequests.filter(t => t !== requestTask);
            reject(err);
          }
        );
        this.currentRequests.push(requestTask);
      });
    },

    initSize() {
      console.log('initSize被调用')
      uni.getSystemInfo({
        success: (res) => {
          this.cWidth = res.windowWidth - 40 // 考虑padding
          this.cHeight = 300
          this.pixelRatio = res.pixelRatio
        }
      })
    },

    // 更新图表
    updateCharts() {
      this.chartKey += 1;
    },

    onComplete(e) {
      console.log('图表渲染完成：', e)
    },
    
    onError(e) {
      console.error('图表渲染错误：', e)
    },
    
    touchChart(e) {
      console.log('图表触摸事件：', e)
    },

    // 布局词云
    layoutKeywords() {
      // 先清空数组
      this.processedKeywords = [];
      
      if (!this.getTargetStats || Object.keys(this.getTargetStats).length === 0) {
        return;
      }
      
      // 获取容器尺寸
      const containerWidth = 690; // 整个容器宽度，单位rpx
      const containerHeight = 400; // 整个容器高度，单位rpx
      const centerX = containerWidth / 2;
      const centerY = containerHeight / 2;
      
      // 将对象转为数组，便于排序
      const keywords = Object.entries(this.getTargetStats)
        .map(([word, count]) => ({
          word,
          count,
          size: this.getWordSize(count),
          color: this.getWordColor(count),
          rotate: Math.random() > 0.5 ? Math.random() * 30 : Math.random() * -30, // 随机旋转角度
          placed: false,
          width: 0, // 将在后面计算
          height: 0 // 将在后面计算
        }))
        .sort((a, b) => b.count - a.count); // 按数量降序排序
      
      // 从中心点开始，螺旋向外放置
      let angle = 0;
      let radius = 0;
      const radiusIncrement = 10;
      const angleIncrement = 0.3;
      const maxAttempts = 100; // 防止无限循环
      
      // 假设每个字大约占据的rpx宽度
      const getWordDimensions = (word, fontSize) => {
        // 粗略估计：中文字符宽度约等于字体大小，英文字符宽度约为字体大小的0.6倍
        let width = 0;
        for (let i = 0; i < word.length; i++) {
          const char = word.charAt(i);
          if (/[\u4e00-\u9fa5]/.test(char)) {
            width += fontSize; // 中文字符
          } else {
            width += fontSize * 0.6; // 英文和其他字符
          }
        }
        return {
          width: width + 20, // 增加一些内边距
          height: fontSize + 20 // 增加一些内边距
        };
      };
      
      // 检查位置是否合法（不与已放置的词重叠）
      const isPositionValid = (x, y, width, height) => {
        // 检查是否在容器内
        if (x < 0 || x + width > containerWidth || y < 0 || y + height > containerHeight) {
          return false;
        }
        
        // 检查是否与其他词重叠
        for (const keyword of this.processedKeywords) {
          const kx = keyword.x;
          const ky = keyword.y;
          const kw = keyword.width;
          const kh = keyword.height;
          
          // 简单的矩形碰撞检测
          if (!(x > kx + kw || x + width < kx || y > ky + kh || y + height < ky)) {
            return false;
          }
        }
        
        return true;
      };
      
      // 按顺序放置词语
      for (const keyword of keywords) {
        const { width, height } = getWordDimensions(keyword.word, keyword.size);
        keyword.width = width;
        keyword.height = height;
        
        // 尝试找到一个位置
        let attempts = 0;
        let placed = false;
        
        // 重要的词（数量多的）尝试放在中心位置
        if (keyword.count >= this.keywordMaxCount * 0.8) {
          const x = centerX - width / 2;
          const y = centerY - height / 2;
          if (isPositionValid(x, y, width, height)) {
            keyword.x = x;
            keyword.y = y;
            keyword.placed = true;
            this.processedKeywords.push(keyword);
            placed = true;
          }
        }
        
        if (!placed) {
          // 螺旋方式尝试放置
          while (attempts < maxAttempts && !placed) {
            angle += angleIncrement;
            radius += radiusIncrement / (Math.floor(angle / (2 * Math.PI)) + 1);
            
            const x = centerX + radius * Math.cos(angle) - width / 2;
            const y = centerY + radius * Math.sin(angle) - height / 2;
            
            if (isPositionValid(x, y, width, height)) {
              keyword.x = x;
              keyword.y = y;
              keyword.placed = true;
              this.processedKeywords.push(keyword);
              placed = true;
            }
            
            attempts++;
          }
        }
        
        // 如果尝试多次仍无法放置，则忽略碰撞规则
        if (!placed && keyword.count > 1) {
          keyword.x = Math.random() * (containerWidth - width);
          keyword.y = Math.random() * (containerHeight - height);
          keyword.placed = true;
          this.processedKeywords.push(keyword);
        }
      }
    },
    
    // 获取词云中字的大小
    getWordSize(count) {
      const maxSize = 60; // 最大字体大小
      const minSize = 24; // 最小字体大小
      
      if (count === this.keywordMaxCount) {
        return maxSize;
      }
      
      // 使用对数尺度使大小差异更明显
      const ratio = Math.log(count + 1) / Math.log(this.keywordMaxCount + 1);
      return Math.max(minSize, Math.round(minSize + ratio * (maxSize - minSize)));
    },
    
    // 获取词云中字的颜色
    getWordColor(count) {
      const colorOptions = [
        '#FF6B6B', // 红色 - 重要
        '#FFB86C', // 橙色
        '#8BE9FD', // 蓝色
        '#BD93F9', // 紫色
        '#6272A4'  // 灰蓝色 - 不重要
      ];
      
      // 计算颜色索引，使用对数尺度
      const maxIndex = colorOptions.length - 1;
      const ratio = Math.log(count + 1) / Math.log(this.keywordMaxCount + 1);
      const index = Math.floor((1 - ratio) * maxIndex);
      
      return colorOptions[Math.min(index, maxIndex)];
    },

    // 修改 checkVisibility 方法
    checkVisibility() {
      const query = uni.createSelectorQuery().in(this);
      query.select('.stats-container').boundingClientRect(data => {
        const isVisible = data && data.width > 0 && data.height > 0;
        console.log('分析页面可见性:', isVisible);
        
        if (isVisible) {
          // 如果组件可见，则初始化并加载数据
          if (!this._initialized) {
            this.initAnalysis();
          } else if (!this.periodStatsData && !this._requestLock) {
            // 如果已初始化但没有数据且未锁定，则加载数据
            this.loadAllStatsWithLock();
          }
        }
      }).exec();
    },

    // 修改获取统计数据的方法
    fetchStats() {
      this.loading = true
      this.statsData = null
      this.emotionTips = null // 重置提示数据
      
      getPeriodEmotionStats(this.currentPeriod, (res) => {
        console.log('获取统计数据成功:', res)
        this.statsData = res
        this.loading = false
        
        // 如果返回了task_id，则获取情感建议
        if (res.data && res.data.task_id) {
          this.tipTaskId = res.data.task_id
          this.tipRetryCount = 0
          this.fetchEmotionTips()
        }
      }, (error) => {
        console.error('获取统计数据失败:', error)
        this.loading = false
        uni.showToast({
          title: '获取统计数据失败',
          icon: 'none'
        })
      })
    },
    
    // 新增获取情感建议的方法
    fetchEmotionTips() {
      if (!this.tipTaskId || this.tipRetryCount >= this.tipMaxRetries) {
        return
      }
      
      getEmotionTips(this.tipTaskId, (res) => {
        console.log('获取情感建议成功:', res)
        
        // 处理成功响应
        if (res.data && res.data.tips) {
          this.emotionTips = res.data.tips
        }
      }, (error) => {
        console.log('获取情感建议失败或处理中:', error)
        
        // 如果是处理中状态，则延迟重试
        if (error.message && error.message.includes('处理中')) {
          this.tipRetryCount++
          if (this.tipRetryCount < this.tipMaxRetries) {
            setTimeout(() => {
              this.fetchEmotionTips()
            }, 3000)
          }
        }
      })
    },

    // 添加导航方法
    navigateToEmotion() {
      uni.switchTab({
        url: '/pages/tabbar/emotion/home'
      });
    },
  },

  watch: {
    // timeSeriesData: {
    //   handler() {
    //     this.$nextTick(() => {
    //       this.updateCharts()
    //     })
    //   },
    //   deep: true
    // },
    periodStatsData: {
      handler(newVal) {
        if (!newVal) return
        
        this.$nextTick(() => {
          // 批量处理所有依赖于periodStatsData的更新
          this.updateCharts()
          if (newVal?.statistics?.emotion) {
            this.updateBubbles()
          }
        })
      },
      deep: true
    },
    
    // 监听容器尺寸变化
    containerWidth(newVal) {
      if (newVal > 0 && this.bubbleChart) {
        this.bubbleChart.options.width = newVal;
        this.bubbleChart.options.height = this.containerHeight;
        this.updateBubbles();
      }
    },

    // 添加路由变化监听
    '$route.query.period'(newPeriod) {
      if (newPeriod && this.periods.includes(newPeriod)) {
        this.changePeriod(newPeriod);
      }
    },

    // 优化currentPeriod监听器
    currentPeriod: {
      immediate: false, // 改为false，避免组件创建时就触发
      handler(newVal, oldVal) {
        if (newVal !== oldVal) { // 只在真正变化时触发
          this.loadAllStats()
        }
      }
    }
  },

  onReady() {
    console.log('组件已就绪')
  },

  beforeDestroy() {
    this.stopAnimation()
    clearInterval(this.autoRefreshTimer)
  }
}
</script>

<style lang="scss" scoped>
.stats-container {
  min-height: 100vh;
  background-color: #0A0B1B;
  padding: 30rpx;
}

.period-selector {
  display: flex;
  justify-content: center;
  margin-bottom: 40rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 16rpx;
  padding: 8rpx;
  
  .period-item {
    flex: 1;
    text-align: center;
    padding: 16rpx 0;
    color: rgba(255, 255, 255, 0.6);
    font-size: 28rpx;
    border-radius: 12rpx;
    max-width: 160rpx;
    
    &.active {
      background: #7C4DFF;
      color: #ffffff;
    }
  }
}

.section-title {
  display: block;
  color: rgba(255, 255, 255, 0.9);
  font-size: 32rpx;
  font-weight: 500;
  margin: 40rpx 0 20rpx;
  padding-left: 20rpx;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 6rpx;
    height: 24rpx;
    background: #7C4DFF;
    border-radius: 3rpx;
  }
}

.stats-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
}

.overview-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 40rpx;
  
  .stat-item {
    text-align: center;
    background: rgba(255, 255, 255, 0.1);
    padding: 20rpx;
    border-radius: 16rpx;
    flex: 1;
    margin: 0 10rpx;
    
    .stat-value {
      display: block;
      color: #7C4DFF;
      font-size: 36rpx;
      font-weight: 600;
    }
    
    .stat-label {
      color: rgba(255, 255, 255, 0.6);
      font-size: 24rpx;
    }
  }
}

.chart-wrapper {
  width: 100%;
  padding: 20rpx;
  box-sizing: border-box;
  position: relative;
  overflow: hidden; /* 防止内容溢出 */
}

.chart-title {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 30rpx;
  text-align: center;
}

.chart-section {
  margin: 30rpx 0;
}

.emotion-bubbles-wrapper {
  margin: 20rpx 0;
  width: 100%;
  height: 450rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
  padding: 20rpx;
  overflow: hidden;
}

.emotion-bubbles {
  position: relative;
  width: 100%;
  height: 100%;
}

.bubbles-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.bubble-item {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: inset 0 0 15rpx rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(5px);
  border-radius: 50%;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: -10%;
    left: -10%;
    width: 120%;
    height: 120%;
    background: linear-gradient(
      120deg,
      rgba(255, 255, 255, 0) 30%,
      rgba(255, 255, 255, 0.3) 50%,
      rgba(255, 255, 255, 0) 70%
    );
    transform: rotate(30deg);
  }
}

.bubble-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.emotion-face {
  font-size: 36rpx;
  margin-bottom: 8rpx;
}

.emotion-text {
  font-size: 24rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
}

.debug-info {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: rgba(255, 255, 255, 0.5);
  font-size: 28rpx;
}

.chart-tip {
  display: flex;
  align-items: flex-start;
  padding: 16rpx 20rpx;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 12rpx;
  margin-top: 20rpx;
  border-left: 6rpx solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  
  .tip-icon {
    font-size: 32rpx;
    margin-right: 12rpx;
    flex-shrink: 0;
  }
  
  .tip-text {
    color: rgba(255, 255, 255, 0.8);
    font-size: 24rpx;
    line-height: 1.5;
    flex: 1;
  }
}

// 确保canvas在不同平台下都能正确显示
:deep(canvas) {
  width: 100%;
  height: 100%;
}

// 分类统计图表样式
.category-chart {
  display: flex;
  justify-content: space-around;
  align-items: flex-start;
  height: 280rpx; // 减小整体高度
  width: 100%;
  padding: 40rpx 0 20rpx 0; // 增加顶部内边距，为数值标签留出空间
  box-sizing: border-box;
  overflow-x: auto;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  min-width: 100rpx;
  margin: 0 10rpx;
}

.category-name {
  color: rgba(255, 255, 255, 0.8);
  font-size: 24rpx;
  font-weight: 500;
  margin-top: 15rpx;
  text-align: center;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-bars {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  height: 180rpx; // 减小高度
  width: 100%;
}

.emotion-bar {
  width: 30rpx;
  margin: 0 4rpx;
  border-radius: 6rpx 6rpx 0 0;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 20rpx;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
  
  &.positive {
    background: linear-gradient(to top, #4CAF50, #81C784);
  }
  
  &.neutral {
    background: linear-gradient(to top, #42A5F5, #90CAF9);
  }
  
  &.negative {
    background: linear-gradient(to top, #FF5252, #FF8A80);
  }
  
  .bar-value {
    position: absolute;
    top: -24rpx; // 增加与柱状图的距离
    font-size: 20rpx;
    color: rgba(255, 255, 255, 0.8);
    background: rgba(0, 0, 0, 0.5); // 增加背景不透明度
    padding: 2rpx 8rpx;
    border-radius: 10rpx;
    z-index: 2; // 确保显示在最上层
  }
}

// 修改后的词云样式
.keyword-cloud-container {
  height: 400rpx;
  width: 100%;
  position: relative;
}

.keyword-cloud {
  width: 100%;
  height: 100%;
  position: relative;
}

.keyword-tag {
  position: absolute;
  padding: 10rpx 16rpx;
  background-color: rgba(255, 255, 255, 0.08);
  border-radius: 30rpx;
  white-space: nowrap;
  text-align: center;
  font-weight: 500;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
}

.empty-chart {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200rpx;
  width: 100%;
  color: rgba(255, 255, 255, 0.5);
  font-size: 26rpx;
}

// 添加图例样式
.chart-legend {
  display: flex;
  justify-content: center;
  margin-top: 10rpx;
  padding: 10rpx 0;
  width: 100%;
  box-sizing: border-box;
}

.legend-item {
  display: flex;
  align-items: center;
  margin: 0 15rpx;
}

.legend-color {
  width: 20rpx;
  height: 20rpx;
  border-radius: 4rpx;
  margin-right: 6rpx;
  
  &.positive {
    background: linear-gradient(to top, #4CAF50, #81C784);
  }
  
  &.neutral {
    background: linear-gradient(to top, #42A5F5, #90CAF9);
  }
  
  &.negative {
    background: linear-gradient(to top, #FF5252, #FF8A80);
  }
}

.legend-text {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.7);
}

// 添加空状态样式，与 history.vue 保持一致
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: 0 40rpx;
  background: linear-gradient(180deg, #0A0B1B 0%, #0A0B1B 100%);
  
  .empty-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    transform: translateY(-10%);
    
    .main-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 60rpx;
      
      .empty-text {
        font-size: 36rpx;
        color: rgba(255, 255, 255, 0.8);
        margin-bottom: 20rpx;
        letter-spacing: 4rpx;
        font-weight: 300;
        text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
        
        .highlight {
          color: #7C4DFF;
          font-weight: 500;
          background: linear-gradient(135deg, #7C4DFF, #8B5CF6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .brand-text {
          font-weight: 500;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          padding: 0 4rpx;
        }
      }
    }
    
    .encouragement {
      margin-bottom: 80rpx;
      text-align: center;
      
      .tip {
        font-size: 28rpx;
        color: rgba(255, 255, 255, 0.5);
        font-style: italic;
        line-height: 1.5;
        padding: 20rpx 40rpx;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 30rpx;
        backdrop-filter: blur(10px);
      }
    }
    
    .goto-emotion-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #ffffff;
      border: none;
      padding: 20rpx 60rpx;
      border-radius: 40rpx;
      font-size: 28rpx;
      box-shadow: 0 4rpx 12rpx rgba(99, 102, 241, 0.2);
      
      .iconfont {
        font-size: 28rpx;
        margin-right: 10rpx;
      }
      
      &:active {
        transform: scale(0.98);
      }
    }
  }
}

// 添加简单的渐入动画
.empty-content {
  animation: fadeIn 0.8s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5%);
  }
  to {
    opacity: 1;
    transform: translateY(-10%);
  }
}
</style>
