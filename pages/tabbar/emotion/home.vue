<template>
  <view class="container">
    <!-- WeatherDisplay 作为背景 -->
    <WeatherDisplay 
      :weatherType="weatherType" 
      :isMuted="isMuted"
    />
    
    <!-- 内容层，确保在背景之上 -->
    <view class="content" style="position: relative; z-index: 2;">
      <!-- 添加状态栏占位 -->
      <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
      
      <!-- 顶部栏 -->
      <view class="top-section">
        <!-- 日期 -->
        <view class="date-wrapper">
          <text class="date-text">{{ currentDate }}</text>
          <view class="date-underline"></view>
        </view>
        
        <!-- 音量控制按钮，现在对所有天气都显示 -->
        <view 
          class="volume-control"
          @tap="toggleSound"
        >
          <text class="iconfont" :class="isMuted ? 'icon-jingyin-F' : 'icon-yinliang-L'"></text>
        </view>
      </view>

      <!-- 顶部信息区域 -->
      <view class="info-section">
        <view class="weather-icon">
          <image 
            :src="weatherIconUrl" 
            mode="aspectFit"
            :style="{ filter: 'brightness(0) invert(1)' }"
          ></image>
        </view>
      </view>

      <!-- 鼓励语句 -->
      <view class="encouragement">
        <text>{{ encouragementText }}</text>
      </view>

      <!-- 情绪气泡图 -->
      <view class="emotion-bubbles" v-if="emotions.length > 0">
        <view 
          v-for="(emotion, index) in emotions" 
          :key="index"
          class="bubble"
          :style="{
            width: calculateBubbleSize(emotion.percentage) + 'rpx',
            height: calculateBubbleSize(emotion.percentage) + 'rpx',
            backgroundColor: emotion.color,
            transform: `translate(${emotion.offsetX}rpx, ${emotion.offsetY}rpx)`,
            position: 'absolute'
          }"
        >
          <text class="emotion-label">{{emotion.name}}</text>
          <text class="emotion-value">{{emotion.percentage}}%</text>
        </view>
      </view>

      <!-- 录音按钮区域 -->
      <view class="record-section">
        <!-- 提示文字 -->
        <text class="record-tip" :class="{ 'recording': isRecording }">
          {{ isRecording ? '正在录音...' : '长按开始吐槽' }}
        </text>
        
        <!-- 录音按钮 -->
        <view 
          class="record-container"
          @touchstart="startRecord"
          @touchend="stopRecord"
        >
          <view class="wave-container" :class="{ 'recording': isRecording }">
            <view class="wave wave1"></view>
            <view class="wave wave2"></view>
            <view class="wave wave3"></view>
          </view>
          <text class="icon-mic"></text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import WeatherDisplay from '@/components/WeatherDisplay.vue'
const recorderManager = uni.getRecorderManager();
const app = getApp();

export default {
  components: {
    WeatherDisplay,
  },
  data() {
    return {
      statusBarHeight: 0,
      isRecording: false,
      stResult: '',
      weatherType: 'Cloudy',
      emotions: [],
      currentDate: '',
      encouragementText: '每一天都是新的开始，分享你的心情吧！',
      audioContext: null,
      isMuted: false,
    }
  },

  computed: {
    weatherIconUrl() {
      console.log('当前 weatherType:', this.weatherType);
      return `https://maiya-prod.oss-cn-shanghai.aliyuncs.com/icon/roast/emotions/${this.weatherType.toLowerCase()}-nbg.png`;
    },
    isStormWeather() {
      const isStorm = this.weatherType?.toLowerCase() === 'storm';
      console.log('是否为暴风天气:', isStorm);
      return isStorm;
    }
  },

  created() {
    console.log('组件创建，初始 weatherType:', this.weatherType);
    // 获取系统状态栏高度
    const systemInfo = uni.getSystemInfoSync();
    this.statusBarHeight = systemInfo.statusBarHeight || 20;
    
    // 格式化当前日期
    const now = new Date();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const day = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][now.getDay()];
    this.currentDate = `${month}月${date}日 ${day}`;

    // 初始化录音管理器
    this.initRecorder();

    // 获取缓存的情绪数据
    this.loadLastEmotion();
  },

  mounted() {
    console.log('组件挂载完成，当前 weatherType:', this.weatherType);
  },

  onShow() {
    console.log('页面显示，当前静音状态:', this.isMuted);
    // 页面显示时，根据静音状态决定是否恢复播放
    if (this.audioContext && !this.isMuted) {
      this.audioContext.play();
    }
  },

  onHide() {
    console.log('页面隐藏');
    uni.$emit('tabChange', 'other');
    // 页面隐藏时暂停音频
    console.log('页面隐藏，暂停音频');
    if (this.audioContext) {
      this.audioContext.pause();
    }
  },

  onUnload() {
    // 页面卸载时停止并销毁音频
    console.log('页面卸载，停止音频');
    if (this.audioContext) {
      this.audioContext.stop();
      this.audioContext.destroy();
      this.audioContext = null;
    }
  },

  onLoad() {
    console.log('=== 页面加载 ===');
    // 从缓存读取静音状态
    try {
      const mutedStatus = uni.getStorageSync('weatherAudioMuted');
      console.log('从缓存读取的原始值:', mutedStatus);
      this.isMuted = mutedStatus === true;
      console.log('设置初始静音状态:', this.isMuted);
    } catch (e) {
      console.error('读取静音状态失败:', e);
    }
  },

  // 监听标签页切换
  onTabItemTap(e) {
    console.log('标签页切换:', e);
    // 发送标签页切换事件
    uni.$emit('tabChange', 'emotion');
  },

  methods: {
    initDate() {
      const date = new Date();
      this.currentDate = `${date.getMonth() + 1}月${date.getDate()}日`;
    },

    // 检查图片是否存在
    async checkImageExists(url) {
      console.log('正在检查图片URL:', url); // 添加日志
      try {
        const res = await uni.request({
          url: url,
          method: 'HEAD',
          timeout: 5000, // 添加超时设置
        });
        console.log('图片检查响应:', res); // 添加日志
        // 修改判断逻辑，200-299 的状态码都认为是成功
        return res.statusCode >= 200 && res.statusCode < 300;
      } catch (error) {
        console.error('检查图片失败，详细错误:', error); // 添加详细错误日志
        // 如果是网络错误，我们假设图片存在（因为之前能用）
        return true; // 修改为在发生错误时返回 true
      }
    },

    async updateWeatherType(type) {
      console.log('更新天气类型:', type);
      this.weatherType = type;
    },

    // 初始化录音管理器
    initRecorder() {
      recorderManager.onStop(async (res) => {
        const { tempFilePath } = res;
        try {
          const uploadResult = await uni.uploadFile({
            url: `${this.$baseUrl}/emotion/analyze`,
            filePath: tempFilePath,
            name: 'file',
            formData: {
              is_public: true
            },
            header: {
              'content-type': 'multipart/form-data',
              'Authorization': uni.getStorageSync('token')
            }
          });
          
          let response;
          // 测试数据
          // 测试数据模拟响应
          const mockResponse = {
            data: JSON.stringify({
              "code": 200,
              "message": "情感分析成功", 
              "data": {
                "emotion": {
                  "percentage": {
                    "失望": 40,
                    "愤怒": 60
                  },
                  "reason": "老板",
                  "weather": "Storm"
                },
                "is_public": true,
                "text": "今天被老板骂了，哎"
              }
            })
          };
          // 使用模拟数据替换真实响应
          Object.assign(uploadResult, mockResponse);
          try {
            response = JSON.parse(uploadResult.data);
            console.log('服务器返回的天气类型:', response.data.emotion.weather);
          } catch (parseError) {
            console.error('解析响应数据失败:', parseError);
            uni.showToast({
              title: '糟糕,遇到问题了',
              icon: 'none'
            });
            return;
          }
          
          if (response.code === 200) {
            this.stResult = response.data.text;
            this.processEmotions(response.data.emotion.percentage);
            this.updateEncouragement(response.data.emotion.percentage);
            console.log('准备更新天气为:', response.data.emotion.weather);
            await this.updateWeatherType(response.data.emotion.weather || 'Cloudy');
            
            // 保存最新状态
            this.saveLastEmotion();
            
            // 如果需要，天气组件会自动根据 weatherType 更新
          } else {
            throw new Error(response.message || '分析失败');
          }
        } catch (error) {
          console.error('上传或处理失败:', error);
          uni.showToast({
            title: error.message || '上传失败',
            icon: 'none'
          });
        }
      });

      // 录音错误处理
      recorderManager.onError((error) => {
        console.error('录音错误:', error);
        this.isRecording = false;
        uni.showToast({
          title: '录音出错',
          icon: 'none'
        });
      });
    },

    // 开始录音
    startRecord() {
      this.isRecording = true;
      recorderManager.start({
        duration: 60000,
        sampleRate: 44100,
        numberOfChannels: 1,
        encodeBitRate: 192000,
        format: 'mp3'
      });
    },

    // 停止录音
    stopRecord() {
      this.isRecording = false;
      recorderManager.stop();
    },

    // 生成随机偏移量，但确保气泡不会重叠太多
    generateRandomOffset(bubbleSize, index, totalBubbles) {
      // 定义中心区域范围
      const centerZoneWidth = 400;  // 可调整的区域宽度
      const centerZoneHeight = 400; // 可调整的区域高度
      
      // 生成基于角度的随机位置
      const angle = (index / totalBubbles) * 2 * Math.PI + Math.random() * 0.5;
      const radius = Math.random() * (centerZoneWidth / 4) + bubbleSize / 2;
      
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      };
    },

    processEmotions(percentages) {
      const colorMap = {
        '悲伤': '#7BB9F7',
        '愤怒': '#FF6B6B',
        '平静': '#95D475',
        '开心': '#FFD93D',
        '失望': '#A78BFA',
        '焦虑': '#F59E0B',
        '恐惧': '#7C3AED'
      };
      
      const emotionsArray = Object.entries(percentages)
        .map(([name, value]) => ({
          name,
          percentage: value,
          color: colorMap[name] || '#CCCCCC'
        }))
        .sort((a, b) => b.percentage - a.percentage);

      // 为每个气泡添加随机位置
      this.emotions = emotionsArray.map((emotion, index) => {
        const bubbleSize = this.calculateBubbleSize(emotion.percentage);
        const offset = this.generateRandomOffset(
          bubbleSize, 
          index, 
          emotionsArray.length
        );
        
        return {
          ...emotion,
          offsetX: offset.x,
          offsetY: offset.y
        };
      });

      // 处理完情绪数据后保存到本地存储
      this.saveLastEmotion();
    },

    updateEncouragement(percentages) {
      const encouragements = {
        negative: [
          '记住，每个困难都是暂时的，明天会更好！',
          '让我们一起面对，你并不孤单。',
          '生活中总会有起起落落，这很正常。'
        ],
        positive: [
          '太棒了！保持这份好心情！',
          '你的积极态度真是太棒了！',
          '继续保持，你做得很好！'
        ]
      };

      // 定义消极情绪列表
      const negativeEmotions = [
        '悲伤', '愤怒', '恐惧', '厌恶', '焦虑', 
        '失望', '嫉妒', '羞愧', '内疚', '孤独'
      ];
      
      // 计算消极情绪的总百分比
      const negativePercentage = Object.entries(percentages)
        .filter(([emotion]) => negativeEmotions.includes(emotion))
        .reduce((sum, [_, value]) => sum + value, 0);
      
      // 如果消极情绪超过50%，则选择安慰性的语句
      const list = negativePercentage > 50 ? encouragements.negative : encouragements.positive;
      this.encouragementText = list[Math.floor(Math.random() * list.length)];
    },

    // 计算气泡大小的方法
    calculateBubbleSize(percentage) {
      const minSize = 160;
      const maxSize = 300;
      return minSize + (percentage / 100) * (maxSize - minSize);
    },

    // 保存最后的情绪状态到本地存储
    saveLastEmotion() {
      const today = new Date().toLocaleDateString();
      const emotionCache = {
        date: today,
        emotions: this.emotions,
        weatherType: this.weatherType,
        encouragementText: this.encouragementText
      };
      uni.setStorageSync('lastEmotion', JSON.stringify(emotionCache));
    },

    // 加载最后的情绪状态
    loadLastEmotion() {
      try {
        const today = new Date().toLocaleDateString();
        const cachedEmotion = uni.getStorageSync('lastEmotion');
        
        if (cachedEmotion) {
          const emotionData = JSON.parse(cachedEmotion);
          console.log('加载缓存的情绪数据:', emotionData);
          
          if (emotionData.date === today) {
            this.emotions = emotionData.emotions;
            this.weatherType = emotionData.weatherType;
            console.log('从缓存加载的天气类型:', this.weatherType);
            this.encouragementText = emotionData.encouragementText;
            
            // 加载完数据后，如果是暴风天气，初始化动画
            if (this.isStormWeather) {
              this.$nextTick(() => {
                // Storm.vue 已经独立处理画布和音效
              });
            }
          }
        }
      } catch (error) {
        console.error('加载缓存情绪数据失败:', error);
      }
    },

    onTouchStart() {
      console.log('音量按钮触摸开始');
    },

    onTouchEnd() {
      console.log('音量按钮触摸结束');
    },

    onMutedChange(value) {
      console.log('子组件通知静音状态变化:', value);
      this.isMuted = value;
    },

    toggleSound() {
      console.log('音量控制按钮被点击，当前静音状态:', this.isMuted);
      this.isMuted = !this.isMuted;
      
      // 保存到缓存
      try {
        uni.setStorageSync('weatherAudioMuted', this.isMuted);
        console.log('新的静音状态已保存:', this.isMuted);
      } catch (e) {
        console.error('保存静音状态失败:', e);
      }
    },
  }
}
</script>

<style lang="scss" scoped>
.container {
  position: relative;
  width: 100%;
  height: 100vh;
}

.status-bar {
  width: 100%;
  background: transparent;
}

.top-section {
  padding: 30rpx 40rpx;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  z-index: 2;
}

.date-wrapper {
  position: relative;
  display: inline-block;
  padding: 20rpx 0;
  
  .date-text {
    font-size: 48rpx;
    font-weight: 600;
    color: #ffffff;
    text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
    letter-spacing: 2rpx;
  }
  
  .date-underline {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 40%;
    height: 6rpx;
    background: linear-gradient(to right, rgba(255,255,255,0.8), transparent);
    border-radius: 3rpx;
  }
}

.volume-control {
  position: fixed;
  top: var(--status-bar-height);
  right: 40rpx;
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  z-index: 9999;
  
  .iconfont {
    font-size: 36rpx;
    color: #ffffff;
  }
  
  &:active {
    background: rgba(255, 255, 255, 0.3);
  }
}

.iconfont {
  font-family: "iconfont" !important;
  font-size: 36rpx;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #ffffff;
}

.icon-jingyin-F:before {
  content: "\e652";
}

.icon-yinliang-L:before {
  content: "\e653";
}

// 确保添加了字体图标
@font-face {
  font-family: 'iconfont';  /* Project id 4812679 */
  src: url('https://at.alicdn.com/t/c/font_4812679_8elh349vf1l.woff2?t=1737091794388') format('woff2'),
       url('https://at.alicdn.com/t/c/font_4812679_8elh349vf1l.woff?t=1737091794388') format('woff'),
       url('https://at.alicdn.com/t/c/font_4812679_8elh349vf1l.ttf?t=1737091794388') format('truetype');
}

.icon-mic {
  color: #fff;
  font-size: 48rpx;
  z-index: 1;
}

.recording-tip {
  position: absolute;
  bottom: -50rpx;
  font-size: 28rpx;
  color: #ff4444;
  white-space: nowrap;
  background: rgba(255, 255, 255, 0.9);
  padding: 8rpx 20rpx;
  border-radius: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.content {
  position: relative;
  z-index: 2;
  pointer-events: auto;
  height: 100%;
}

.info-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;  // 左对齐
  gap: 30rpx;
  margin-bottom: 40rpx;
  position: relative;
  z-index: 1;
  
  .date-section {
    font-size: 48rpx;
    font-weight: bold;
    color: #ffffff;
    text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
    padding-left: 20rpx;  // 添加左边距
  }
  
  .weather-icon {
    width: 120rpx;
    height: 120rpx;
    display: flex;
    justify-content: center;
    align-items: center;
    align-self: center;  // 天气图标居中
    
    image {
      width: 100%;
      height: 100%;
      filter: drop-shadow(0 2rpx 8rpx rgba(255, 255, 255, 0.3));
    }
  }
}

.encouragement {
  margin: 40rpx 0;
  padding: 30rpx;
  background: rgba(255, 255, 255, 0.1);  // 半透明背景
  backdrop-filter: blur(10px);  // 毛玻璃效果
  border-radius: 20rpx;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 1;
  
  text {
    font-size: 36rpx;
    color: #ffffff;
    line-height: 1.6;
    font-weight: 500;
  }
}

.emotion-bubbles {
  position: relative;
  width: 100%;
  height: 600rpx; // 减小容器高度，给底部按钮留出空间
  margin: 50rpx 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
  
  .bubble {
    position: absolute;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    transition: all 0.5s ease-out;
    box-shadow: 0 8rpx 16rpx rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(5px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    
    &:hover {
      transform: scale(1.05);
      z-index: 10;
      box-shadow: 0 12rpx 24rpx rgba(0, 0, 0, 0.3);
    }
    
    .emotion-label {
      color: #fff;
      font-size: 36rpx;
      font-weight: bold;
      text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.3);
      white-space: nowrap;
    }
    
    .emotion-value {
      color: #fff;
      font-size: 32rpx;
      margin-top: 8rpx;
      opacity: 0.9;
    }
  }
}

.result-box {
  margin: 30rpx 0;
  padding: 30rpx;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20rpx;
  border: 1px solid rgba(255, 255, 255, 0.1);

  .result-text {
    font-size: 32rpx;
    color: #ffffff;
    line-height: 1.6;
  }
}

.record-section {
  position: fixed;
  z-index: 2; // 录音按钮保持在最上层
  bottom: 100rpx;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.record-tip {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 20rpx;
  padding: 10rpx 30rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 30rpx;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  
  &.recording {
    background: rgba(255, 82, 82, 0.2);
    color: #fff;
  }
}

.record-container {
  position: relative;
  width: 120rpx;
  height: 120rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  
  &:active {
    transform: scale(0.95);
    background: rgba(255, 82, 82, 0.3);
  }
  
  .icon-mic {
    font-size: 48rpx;
    color: #ffffff;
  }
}

.wave-container {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.3s ease;
  
  &.recording {
    opacity: 1;
  }
  
  .wave {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: rgba(255, 82, 82, 0.2);
    animation: waveEffect 2s infinite;
    
    &.wave1 {
      animation-delay: 0s;
    }
    
    &.wave2 {
      animation-delay: 0.5s;
    }
    
    &.wave3 {
      animation-delay: 1s;
    }
  }
}

@keyframes waveEffect {
  0% {
    transform: scale(1);
    opacity: 0.8;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

// 添加按压提示动画
@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(255, 82, 82, 0.4);
  }
  70% {
    box-shadow: 0 0 0 20rpx rgba(255, 82, 82, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(255, 82, 82, 0);
  }
}

// 适配 iPhone 刘海屏
@supports (padding-top: constant(safe-area-inset-top)) {
  .container {
    padding-top: constant(safe-area-inset-top);
  }
}

@supports (padding-top: env(safe-area-inset-top)) {
  .container {
    padding-top: env(safe-area-inset-top);
  }
}

/* 确保其他所有内容组件都有更高的 z-index */
.top-section,
.info-section,
.emotion-bubbles,
.record-section,
.volume-control {
  position: relative;
  z-index: 2;
}

// .black-hole-effect {
//   position: absolute;
//   top: 0;
//   left: 0;
//   width: 100%;
//   height: 100%;
//   z-index: 1; // 调整层级确保不会遮挡其他内容
// }
</style>