<template>
  <view class="stats-container">
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
            <text class="stat-value">{{ getStatValue(statsData.complaint_length) }}</text>
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
        
        <!-- 时间序列图 -->
        <view class="chart-wrapper">
          <view class="chart-title">字数趋势</view>
          <qiun-data-charts 
            ref="timeSeriesChart"
            :key="'timeSeriesChart-' + chartKey"
            type="line"
            :opts="timeSeriesOpts"
            :chartData="timeSeriesChartData"
            :canvas2d="true"
            :canvasId="'timeSeriesChart-' + currentPeriod"
            :ontouch="true"
            :rotateLock="true"
            @getIndex="(e) => console.log('时序图点击索引：', e)"
            @complete="onChartComplete"
            @error="(e) => console.error('时序图渲染错误：', e)"
          />
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
          <view class="chart-tip">
            <text class="tip-icon">💡</text>
            <text class="tip-text">{{ getEmotionSummary }}</text>
          </view>
        </view>
      </view>

      <!-- 吐槽分类标题 -->
      <text class="section-title">吐槽分类</text>
      
      <!-- 分类统计图 -->
      <view class="chart-wrapper">
        <view class="chart-title">分类统计</view>
        <qiun-data-charts
          :key="'categoryChart-' + chartKey"
          type="column"
          :opts="categoryOpts"
          :chartData="categoryChartData"
          :canvas2d="true"
          canvasId="categoryChart"
        />
      </view>

      <!-- 关键词标题 -->
      <text class="section-title">吐槽关键词</text>
      
      <!-- 关键词卡片 -->
      <view class="stats-card">
        <view class="keyword-cloud">
          <view 
            v-for="(count, word) in getTargetStats" 
            :key="word"
            class="keyword"
            :style="{
              fontSize: getKeywordSize(count) + 'rpx',
              color: getKeywordColor(count)
            }"
          >
            {{ word }}
          </view>
        </view>
      </view>
    </block>

    <view class="loading-state" v-if="isLoading">
      <uni-load-more status="loading" />
    </view>
  </view>
</template>

<script>
import { getEmotionStats, getPeriodEmotionStats } from '@/api/emotion.js'
import DynamicBubbleChart from '@/utils/DynamicBubbleChart'

export default {
  components: {
  },
  data() {
    return {
      periods: [
        { label: '周', value: 'week' },
        { label: '月', value: 'month' },
        { label: '年', value: 'year' }
      ],
      currentPeriod: 'week',
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
      debugInfo: '加载中...'
    }
  },

  created() {
    console.log('组件created')
  },

  async mounted() {
    console.log('stats mounted')
    await this.initDynamicBubbles()
    await this.loadAllStats()  // 加载所有统计数据
  },

  computed: {
    statsData() {
      if (!this.periodStatsData) return null
      return {
        complaint_length: this.periodStatsData.statistics.complaint_length,
        user_stats: this.periodStatsData.user_stats,
        statistics: this.periodStatsData.statistics
      }
    },

    // 获取点赞数
    getLikesCount() {
      console.log("this.statsData",this.statsData)
      if (!this.statsData || !this.statsData.user_stats) return 0
      return this.statsData.user_stats.likes_count || 0
    },
    
    // 获取评论数
    getCommentsCount() {
      if (!this.statsData || !this.statsData.user_stats) return 0
      return this.statsData.user_stats.comments_count || 0
    },

    // 获取目标统计数据
    getTargetStats() {
      if (!this.statsData || !this.statsData.statistics || !this.statsData.statistics.target) {
        return {}
      }
      return this.statsData.statistics.target
    },

    getEmotionSummary() {
      const emotions = this.periodStatsData?.statistics?.emotion
      if (!emotions) return '暂无数据'
      
      let positive = 0
      let negative = 0
      let neutral = 0

      Object.entries(emotions).forEach(([emotion, value]) => {
        if (['快乐', '期待', '信任', '爱'].includes(emotion)) {
          positive += value
        } else if (['悲伤', '愤怒', '恐惧', '厌恶'].includes(emotion)) {
          negative += value
        } else {
          neutral += value
        }
      })

      if (positive > 50) {
        return `积极情绪占了${Math.round(positive)}%，说明你最近状态不错！`
      } else if (negative > 50) {
        return `消极情绪占了${Math.round(negative)}%，要多关注自己的心情哦`
      } else {
        return `中性情绪占主导，保持平和心态很重要`
      }
    },

    // 时序图数据
    timeSeriesChartData() {
      console.log('timeSeriesChartData computed 被触发')
      
      if (!this.timeSeriesData?.statistics) {
        return {
          categories: [],
          series: []
        }
      }

      const statistics = this.timeSeriesData.statistics
      const dates = Object.keys(statistics).sort()
      const values = dates.map(date => statistics[date].complaint_length || 0)

      console.log('时序图最终数据：', {
        categories: dates.map(d => d.slice(5)),
        series: [{
          name: '字数',
          data: values
        }]
      })

      return {
        categories: dates.map(d => d.slice(5)), // 只保留月-日
        series: [{
          name: '字数',
          data: values,
          color: '#8B5CF6',
          textColor: '#CCCCCC',  // 添加文字颜色
          type: 'line',          // 明确指定类型
          style: 'curve',        // 使用曲线样式
          pointShape: 'circle'   // 数据点形状
        }]
      }
    },

    // 分类统计图数据
    categoryChartData() {
      if (!this.periodStatsData?.statistics?.category) {
        return {
          categories: [],
          series: []
        }
      }

      const categoryData = this.periodStatsData.statistics.category
      const categories = Object.keys(categoryData)
      const values = Object.values(categoryData)

      console.log('分类统计数据：', {
        categories,
        values
      })

      return {
        categories,
        series: [{
          name: '数量',
          data: values
        }]
      }
    },

    // 获取情感统计数据（用于气泡图）
    getEmotionStats() {
      return this.periodStatsData?.statistics?.emotion || null
    }
  },

  methods: {
    // 获取统计值
    getStatValue(value) {
      return value || 0
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

    // 加载所有统计数据
    async loadAllStats() {
      this.isLoading = true
      
      try {
        // 并行加载数据
        const [timeSeriesRes, periodStatsRes] = await Promise.all([
          new Promise((resolve, reject) => {
            getEmotionStats(
              this.currentPeriod,
              (res) => resolve(res),
              (error) => reject(error)
            )
          }),
          new Promise((resolve, reject) => {
            getPeriodEmotionStats(
              this.currentPeriod,
              (res) => resolve(res),
              (error) => reject(error)
            )
          })
        ])
        

        console.log('时序数据返回：', timeSeriesRes)
        console.log('周期统计数据返回：', periodStatsRes)

        this.timeSeriesData = timeSeriesRes
        this.periodStatsData = periodStatsRes.data

        // 数据加载完成后更新气泡
        this.$nextTick(() => {
          this.updateBubbles()
        })
      } catch (error) {
        console.error('加载数据失败：', error)
        this.debugInfo = '加载数据失败，请稍后重试。'
      } finally {
        this.isLoading = false
      }
    },

    // 切换周期
    changePeriod(period) {
      this.currentPeriod = period
      this.loadAllStats()
    },

    initSize() {
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

    // 获取关键词大小
    getKeywordSize(count) {
      // 基础字号为24rpx，最大为48rpx
      const baseSize = 24
      const maxSize = 48
      
      // 获取所有count值中的最大值
      const maxCount = Math.max(...Object.values(this.getTargetStats))
      
      // 根据当前count值相对于最大值的比例计算字号
      const size = baseSize + (count / maxCount) * (maxSize - baseSize)
      
      // 确保字号在合理范围内
      return Math.min(maxSize, Math.max(baseSize, size))
    },

    // 获取关键词颜色
    getKeywordColor(count) {
      // 获取所有count值中的最大值
      const maxCount = Math.max(...Object.values(this.getTargetStats))
      
      // 计算当前count的热度（0-1之间）
      const heat = count / maxCount
      
      // 根据热度返回不同的颜色
      if (heat > 0.8) {
        return '#FF6B6B' // 热门词
      } else if (heat > 0.5) {
        return '#FFB86C' // 较热门词
      } else if (heat > 0.3) {
        return '#8BE9FD' // 一般词
      } else {
        return '#6272A4' // 较冷门词
      }
    },

    // 初始化动态气泡
    initDynamicBubbles() {
      const query = uni.createSelectorQuery().in(this)
      query.select('.emotion-bubbles-wrapper')
        .boundingClientRect(data => {
          if (data) {
            console.log('容器尺寸:', data.width, data.height)
            this.containerWidth = data.width || 300
            this.containerHeight = data.height || 450
            
            // 初始化气泡图
            this.bubbleChart = new DynamicBubbleChart({
              width: this.containerWidth,
              height: this.containerHeight,
              minSize: 60,
              maxSize: 180,
              maxSpeed: 1.2
            })

            // 生成气泡并开始动画
            this.$nextTick(() => {
              this.updateBubbles()
              this.startAnimation()
            })
          }
        }).exec()
    },

    updateBubbles() {
      if (!this.bubbleChart || !this.periodStatsData) {
        console.log('无法更新气泡:', !this.bubbleChart ? '图表未初始化' : '无数据')
        return
      }
      console.log('更新气泡，数据:', this.periodStatsData)
      this.dynamicBubbles = this.bubbleChart.generateBubbles(this.periodStatsData.statistics.emotion)
    },

    startAnimation() {
      if (this.animationTimer) {
        clearTimeout(this.animationTimer)
      }

      const animate = () => {
        if (!this.bubbleChart) return
        
        const now = Date.now()
        if (!this.lastUpdate) this.lastUpdate = now
        const deltaTime = now - this.lastUpdate
        
        if (deltaTime > 16) {
          this.bubbleChart.updatePositions()
          // 使用 uni-app 支持的数组更新方式
          const newBubbles = this.bubbleChart.bubbles.map(bubble => ({...bubble}))
          this.$set(this, 'dynamicBubbles', newBubbles)
          this.lastUpdate = now
        }
        
        this.animationTimer = setTimeout(() => {
          animate()
        }, 16)
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
    }
  },

  watch: {
    timeSeriesData: {
      handler() {
        this.$nextTick(() => {
          this.updateCharts()
        })
      },
      deep: true
    },
    periodStatsData: {
      handler(newVal) {
        if (newVal?.data?.statistics?.emotion) {
          this.updateBubbles()
        }
      },
      deep: true
    },
    getEmotionStats: {
      handler(newVal) {
        if (newVal) {
          this.updateBubbles()
        }
      },
      immediate: true,
      deep: true
    },
    
    // 监听容器尺寸变化
    containerWidth(newVal) {
      if (newVal > 0 && this.bubbleChart) {
        this.bubbleChart.options.width = newVal
        this.bubbleChart.options.height = newVal
        this.updateBubbles()
      }
    }
  },

  onReady() {
    console.log('组件已就绪')
    setTimeout(() => {
      this.initDynamicBubbles()
    }, 100) // 延迟初始化以确保容器已渲染
  },

  beforeDestroy() {
    this.stopAnimation()
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
  margin: 20rpx 0;
  padding: 20rpx;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16rpx;
  height: 400rpx;
  
  .chart-title {
    color: rgba(255, 255, 255, 0.9);
    font-size: 28rpx;
    margin-bottom: 20rpx;
  }

  :deep(.charts-box) {
    width: 100% !important;
    height: 100% !important;
  }
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
  align-items: center;
  padding: 20rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12rpx;
  margin-top: 20rpx;
  
  .tip-icon {
    font-size: 36rpx;
    margin-right: 12rpx;
  }
  
  .tip-text {
    color: rgba(255, 255, 255, 0.7);
    font-size: 26rpx;
  }
}

// 确保canvas在不同平台下都能正确显示
:deep(canvas) {
  width: 100%;
  height: 100%;
}
</style>
