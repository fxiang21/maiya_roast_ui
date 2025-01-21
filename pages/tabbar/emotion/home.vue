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
      <view 
        class="encouragement" 
        :class="{ 'no-bubbles': emotions.length === 0 }"
        @tap="handleEncouragementTap"
      >
        <view 
          v-for="(sentence, index) in displaySentences" 
          :key="index"
          class="sentence"
          :style="{ 
            opacity: sentence.visible ? 1 : 0,
            transform: sentence.visible ? 'translateY(0)' : 'translateY(10rpx)'
          }"
        >
          {{ sentence.text }}
        </view>
        <text v-if="isTyping" class="cursor">|</text>
      </view>

      <!-- 情绪气泡图 -->
      <view class="emotion-bubbles-container" v-if="emotions.length > 0">
        <view class="emotion-bubbles">
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
      </view>

      <!-- 输入区域 -->
      <view class="input-section" :class="{ 'no-bubbles': emotions.length === 0 }">
        <!-- 切换按钮 -->
        <view 
          class="switch-input-mode" 
          @tap="switchInputMode"
          :class="{ 'disabled': !canInteract }"
        >
          <text class="iconfont" :class="isVoiceMode ? 'icon-keyboard' : 'icon-mic'"></text>
        </view>
        
        <!-- 文字输入框 -->
        <view v-if="!isVoiceMode" class="text-input-area">
          <input 
            type="text" 
            v-model="inputText"
            placeholder="输入你想说的话..."
            @confirm="handleTextSubmit"
            :disabled="!canInteract"
          />
          <view 
            class="submit-btn" 
            @tap="handleTextSubmit"
            :class="{
              'submit-btn--disabled': !canInteract || !inputText.trim(),
              'submit-btn--active': canInteract && inputText.trim()
            }"
          >
            <text class="iconfont icon-send"></text>
          </view>
        </view>
        
        <!-- 语音输入按钮 -->
        <view v-else class="voice-input-area">
          <view 
            class="record-btn"
            @touchstart="startRecord"
            @touchend="stopRecord"
            @touchcancel="stopRecord"
            :class="{ 'disabled': !canInteract }"
          >
            <text>{{ isRecording ? '松开结束' : '长按开始吐槽' }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import WeatherDisplay from '@/components/WeatherDisplay.vue'
import { uploadEmotionAudio } from '@/common/js/http.js'
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
      isVoiceMode: true, // 默认语音模式
      inputText: '', // 文字输入内容
      displaySentences: [], // 存储分句后的文本
      isTyping: false,
      typingTimer: null,
      currentSentenceIndex: 0,
      isLoading: false,
      isSubmitting: false,
      isRendering: false, // 添加渲染状态锁
      submitTimeout: null,
      defaultEncouragement: '每一天都是新的开始，分享你的心情吧！'
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
    },
    canInteract() {
      return !this.isLoading && !this.isSubmitting && !this.isRendering;
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

    // 初始化时显示默认鼓励语
    this.startTyping(this.defaultEncouragement);
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
          await uploadEmotionAudio(
            tempFilePath,
            (response) => {
              this.stResult = response.data.text;
              this.processEmotions(response);
              const encouragementText = response.data.emotion.encourage || this.defaultEncouragement;
              this.encouragementText = encouragementText;
              this.updateWeatherType(response.data.emotion.weather || 'Cloudy');
              this.saveLastEmotion();
              this.startTyping(encouragementText);
            },
            (error) => {
              uni.showToast({
                title: error.message || '上传失败',
                icon: 'none'
              });
            }
          );
        } catch (error) {
          console.error('处理失败:', error);
          uni.showToast({
            title: '处理失败',
            icon: 'none'
          });
        } finally {
          this.isLoading = false; // 结束加载
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
      if (this.isLoading) return;
      
      this.isRecording = true;
      recorderManager.start({
        duration: 60000,
        sampleRate: 16000,
        numberOfChannels: 1,
        encodeBitRate: 48000,
        format: 'mp3',
        frameSize: 4
      });
    },

    // 停止录音
    stopRecord() {
      if (!this.isRecording) return;
      
      this.isRecording = false;
      this.isLoading = true;
      
      // 设置5秒超时
      this.submitTimeout = setTimeout(() => {
        if (this.isLoading) {
          this.isLoading = false;
          uni.showToast({
            title: '请求超时，请重试',
            icon: 'none'
          });
        }
      }, 5000);
      
      recorderManager.stop();
    },

    generateRandomOffset(bubbleSize, index, totalBubbles) {
      const containerRadius = 250; // 容器半径
      const minDistance = 60;  // 最小气泡间距
      
      // 使用黄金角度来创建螺旋分布
      const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // 约137.5度
      const angle = index * goldenAngle;

      // 根据索引动态计算半径，使气泡螺旋分布
      let radius = Math.sqrt(index / totalBubbles) * containerRadius;
      
      // 确保半径不会太小，避免气泡靠得太近
      radius = Math.max(radius, minDistance);

      // 添加一些随机性，但范围要小
      const randomRadius = radius + (Math.random() - 0.5) * minDistance;
      
      return {
        x: Math.cos(angle) * randomRadius,
        y: Math.sin(angle) * randomRadius
      };
    },

    calculateBubbleSize(percentage) {
      // 根据百分比的大小范围调整气泡尺寸
      const minSize = 80;  // 最小气泡尺寸
      const maxSize = 140; // 最大气泡尺寸
      
      // 使用非线性映射使差异更明显
      const normalizedSize = Math.pow(percentage / 100, 0.7); // 使用幂函数调整大小差异
      return minSize + normalizedSize * (maxSize - minSize);
    },

    processEmotions(responseData) {
      // 处理情绪数据
      const percentages = responseData.data.emotion.percentage;
      const colorMap = {
        '悲伤': '#7BB9F7',
        '愤怒': '#FF6B6B',
        '平静': '#95D475',
        '开心': '#FFD93D',
        '失望': '#A78BFA',
        '焦虑': '#F59E0B',
        '恐惧': '#7C3AED',
        '淡定': '#95D475'
      };

      // 先计算所有气泡的位置和大小
      let emotionsArray = Object.entries(percentages)
        .map(([name, value]) => ({
          name,
          percentage: value,
          color: colorMap[name] || '#CCCCCC'
        }))
        .sort((a, b) => b.percentage - a.percentage);

      // 第一次布局
      let positions = emotionsArray.map((emotion, index) => {
        const bubbleSize = this.calculateBubbleSize(emotion.percentage);
        const offset = this.generateRandomOffset(
          bubbleSize,
          index,
          emotionsArray.length
        );
        return { ...emotion, bubbleSize, offsetX: offset.x, offsetY: offset.y };
      });

      // 检测和调整重叠
      for (let i = 0; i < 5; i++) { // 最多尝试5次调整
        let hasOverlap = false;
        for (let j = 0; j < positions.length; j++) {
          for (let k = j + 1; k < positions.length; k++) {
            const bubble1 = positions[j];
            const bubble2 = positions[k];
            
            // 计算两个气泡中心点之间的距离
            const dx = bubble1.offsetX - bubble2.offsetX;
            const dy = bubble1.offsetY - bubble2.offsetY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 计算需要的最小距离（两个气泡半径之和）
            const minDistance = (bubble1.bubbleSize + bubble2.bubbleSize) / 2;
            
            // 如果重叠，调整位置
            if (distance < minDistance) {
              hasOverlap = true;
              const angle = Math.atan2(dy, dx);
              const overlap = minDistance - distance;
              
              // 将气泡稍微推开
              const push = overlap / 2;
              positions[j].offsetX += Math.cos(angle) * push;
              positions[j].offsetY += Math.sin(angle) * push;
              positions[k].offsetX -= Math.cos(angle) * push;
              positions[k].offsetY -= Math.sin(angle) * push;
            }
          }
        }
        if (!hasOverlap) break;
      }

      // 计算所有气泡的中心点
      let centerX = 0;
      let centerY = 0;
      positions.forEach(bubble => {
        centerX += bubble.offsetX;
        centerY += bubble.offsetY;
      });
      centerX /= positions.length;
      centerY /= positions.length;

      // 将整体布局移动到容器中心
      const offsetX = -centerX;
      const offsetY = -centerY;
      positions.forEach(bubble => {
        bubble.offsetX += offsetX;
        bubble.offsetY += offsetY;
      });

      this.emotions = positions;

      // 当获取到新的鼓励语时，启动打字效果
      if (responseData.data.emotion.encourage) {
        this.startTyping(responseData.data.emotion.encourage);
      }
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

    // 切换输入模式
    switchInputMode() {
      if (this.isLoading) return;
      this.isVoiceMode = !this.isVoiceMode;
    },
    
    // 处理文字提交
    async handleTextSubmit() {
      // 严格检查所有状态
      if (!this.inputText.trim() || !this.canInteract) {
        console.log('提交被阻止：', {
          isLoading: this.isLoading,
          isSubmitting: this.isSubmitting,
          isRendering: this.isRendering
        });
        return;
      }
      
      // 立即锁定所有状态
      this.isSubmitting = true;
      this.isLoading = true;
      const currentText = this.inputText;
      
      // 设置超时保护
      this.submitTimeout = setTimeout(() => {
        this.resetAllStates();
        uni.showToast({
          title: '请求超时，请重试',
          icon: 'none'
        });
      }, 5000);
      
      try {
        await new Promise((resolve, reject) => {
          uploadEmotionAudio(
            null,
            async (response) => {
              try {
                // 开始渲染过程
                this.isRendering = true;
                
                // 清除超时定时器
                if (this.submitTimeout) {
                  clearTimeout(this.submitTimeout);
                  this.submitTimeout = null;
                }
                
                // 清空输入
                if (this.inputText === currentText) {
                  this.inputText = '';
                }
                
                // 处理响应数据
                this.stResult = response.data.text;
                await this.processEmotions(response);
                
                // 使用响应中的鼓励语，如果没有则使用默认值
                const encouragementText = response.data.emotion.encourage || this.defaultEncouragement;
                this.startTyping(encouragementText);
                
                this.updateWeatherType(response.data.emotion.weather || 'Cloudy');
                await this.saveLastEmotion();
                
                resolve();
              } catch (error) {
                reject(error);
              }
            },
            (error) => {
              reject(error);
            },
            { text: currentText }
          );
        });
      } catch (error) {
        console.error('处理失败:', error);
        uni.showToast({
          title: error.message || '处理失败',
          icon: 'none'
        });
      } finally {
        // 等待一小段时间确保渲染完成
        setTimeout(() => {
          this.resetAllStates();
        }, 500);
      }
    },

    // 重置所有状态
    resetAllStates() {
      this.isLoading = false;
      this.isSubmitting = false;
      this.isRendering = false;
      if (this.submitTimeout) {
        clearTimeout(this.submitTimeout);
        this.submitTimeout = null;
      }
    },

    // 将文本按标点符号分句，并去掉每句末尾的标点
    splitIntoSentences(text) {
      // 按照中文标点符号分割文本
      return text
        .split(/[，。！？；]/g)
        .map(sentence => sentence.trim()) // 去除空白字符
        .filter(sentence => sentence.length > 0) // 过滤空字符串
        .map(sentence => ({
          text: sentence,  // 不再添加标点符号
          visible: false
        }));
    },

    // 开始打字效果
    startTyping(text, callback) {
      this.stopTyping();
      this.displaySentences = this.splitIntoSentences(text);
      this.isTyping = true;
      this.currentSentenceIndex = 0;
      
      const showNextSentence = () => {
        if (this.currentSentenceIndex < this.displaySentences.length) {
          // 显示当前句子
          this.$set(
            this.displaySentences[this.currentSentenceIndex], 
            'visible', 
            true
          );
          
          // 设置下一句的延时
          this.currentSentenceIndex++;
          if (this.currentSentenceIndex < this.displaySentences.length) {
            this.typingTimer = setTimeout(showNextSentence, 800); // 每句之间的延迟
          } else {
            this.isTyping = false;
            if (callback) callback();
          }
        }
      };
      
      showNextSentence();
    },

    // 停止打字效果
    stopTyping() {
      if (this.typingTimer) {
        clearTimeout(this.typingTimer);
        this.typingTimer = null;
      }
      this.isTyping = false;
    },

    // 处理点击事件 - 立即显示所有文本
    handleEncouragementTap() {
      if (this.isTyping) {
        this.stopTyping();
        this.displaySentences.forEach(sentence => {
          sentence.visible = true;
        });
        this.isTyping = false;
      }
    }
  },

  // 组件销毁时清理
  beforeDestroy() {
    this.resetAllStates();
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
  margin: 40rpx 30rpx;
  padding: 40rpx;
  // 使用更温暖的渐变背景
  background: linear-gradient(
    135deg, 
    rgba(147, 197, 253, 0.15),  // 柔和的蓝色
    rgba(196, 181, 253, 0.08)   // 淡紫色
  );
  backdrop-filter: blur(12px);
  border-radius: 24rpx;
  text-align: center;
  // 更柔和的边框
  border: 1px solid rgba(147, 197, 253, 0.15);
  position: relative;
  z-index: 1;
  // 更柔和的阴影
  box-shadow: 0 8rpx 32rpx rgba(59, 130, 246, 0.08);
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(
      circle at center,
      rgba(147, 197, 253, 0.12) 0%,  // 柔和的蓝色光晕
      rgba(196, 181, 253, 0.08) 30%, // 淡紫色过渡
      transparent 70%
    );
    opacity: 0.6;
    z-index: -1;
    pointer-events: none;
    animation: rotate 15s linear infinite;
  }
  
  &.no-bubbles {
    margin-bottom: 200rpx;
  }
  
  .sentence {
    font-size: 34rpx;
    // 更温暖的文字颜色
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.98),  // 纯白色起始
      rgba(228, 228, 231, 0.95)   // 略微灰白色结束
    );
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    line-height: 1.6;
    margin: 8rpx 0;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    opacity: 0;
    transform: translateY(10rpx);
    text-align: center;
    width: 100%;
    display: block;
    // 更柔和的文字阴影
    text-shadow: 0 2rpx 4rpx rgba(59, 130, 246, 0.08);
    font-weight: 400;
    letter-spacing: 1rpx;
    
    &:first-child {
      margin-top: 0;
    }
    
    &:last-child {
      margin-bottom: 0;
    }
    
    &.visible {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .cursor {
    display: inline-block;
    margin-left: 4rpx;
    animation: blink 1.2s infinite;
    font-weight: 200;
    vertical-align: middle;
    opacity: 0.8;
  }

  // 悬浮效果增强
  &:hover {
    background: linear-gradient(
      135deg, 
      rgba(147, 197, 253, 0.18),
      rgba(196, 181, 253, 0.1)
    );
    
    &::before {
      opacity: 0.8;
    }
  }
}

@keyframes blink {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 0; }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.emotion-bubbles-container {
  position: relative;
  width: 100%;
  height: 600rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 200rpx;
}

.emotion-bubbles {
  position: relative;
  width: 600rpx;
  height: 600rpx;
  margin: 0 auto;
}

.bubble {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  position: absolute;
  left: 50%;
  top: 50%;
  transform-origin: center center;
  transition: all 0.3s ease;
  z-index: 1;
  
  .emotion-label {
    color: rgba(255, 255, 255, 0.9);
    font-size: 28rpx;
    font-weight: 500;
    margin-bottom: 6rpx;
  }
  
  .emotion-value {
    color: rgba(255, 255, 255, 0.7);
    font-size: 22rpx;
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
  bottom: 100rpx;
  left: 0;
  right: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  
  &.no-bubbles {
    bottom: 160rpx; // 当没有气泡时，调整按钮位置
  }
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

.input-section {
  position: fixed;
  bottom: 100rpx;
  left: 0;
  right: 0;
  padding: 0 30rpx;
  display: flex;
  align-items: center;
  z-index: 100;
  
  &.no-bubbles {
    bottom: 160rpx;
  }
}

.switch-input-mode {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  margin-right: 20rpx;
  
  .iconfont {
    font-size: 40rpx;
    color: #ffffff;
  }
}

.text-input-area {
  flex: 1;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 40rpx;
  padding: 10rpx 20rpx;
  
  input {
    flex: 1;
    height: 60rpx;
    color: #ffffff;
    padding: 0 20rpx;
  }
  
  .submit-btn {
    width: 80rpx;
    height: 60rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    
    .iconfont {
      font-size: 40rpx;
      transition: all 0.3s ease;
    }
    
    // 可点击状态
    &.submit-btn--active {
      cursor: pointer;
      
      .iconfont {
        color: #4CAF50; // 使用绿色表示可发送
      }
      
      &:active {
        transform: scale(0.95);
        
        .iconfont {
          color: #45a049; // 点击时的颜色
        }
      }
    }
    
    // 禁用状态
    &.submit-btn--disabled {
      pointer-events: none;
      
      .iconfont {
        color: rgba(255, 255, 255, 0.3); // 使用半透明灰色表示禁用
      }
    }
  }
}

.voice-input-area {
  flex: 1;
  
  .record-btn {
    height: 80rpx;
    line-height: 80rpx;
    text-align: center;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 40rpx;
    color: #ffffff;
    font-size: 32rpx;
  }
}

.disabled {
  opacity: 0.5;
  pointer-events: none;
  cursor: not-allowed;
}

.switch-input-mode {
  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
}

.submit-btn {
  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
}

.record-btn {
  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
}
</style>