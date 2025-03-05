<template>
  <view class="container">
    <!-- 状态栏 -->
    <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
    
    <!-- 头部导航 -->
    <view class="header">
        <image class="logo" src="/static/img/logo.png" mode="aspectFit"></image>
        <text class="title">黑洞吐槽</text>
      </view>
    
    <!-- WeatherDisplay 作为背景 -->
    <WeatherDisplay 
      :weatherType="weatherType" 
      :isMuted="isMuted"
    />
    
    <!-- 黑洞效果组件 -->
    <BlackHoleEffect 
      v-if="showBlackHole" 
      :position="blackHolePosition"
      targetArea="emotion-bubbles-container" 
      @animationEnd="onBlackHoleAnimationEnd"
      @startHidingBubbles="startHidingBubbles"
      @updateBubbles="updateBubbles"
    />
    
    <!-- 情绪内容区域 - 固定大小 -->
    <view class="main-content">
      <view class="emotion-content-area" :class="{ 'hidden': showBlackHole }">
        <!-- 黑洞图标 -->
        <!-- <image 
          class="emotion-icon" 
          src="https://maiya-prod.oss-cn-shanghai.aliyuncs.com/icon/hole.png"
          mode="aspectFit"
        ></image> -->
        
        <!-- 根据是否有数据显示不同内容 -->
        <block v-if="!emotions || emotions.length === 0">
          <!-- 无数据时的提示 - 居中显示 -->
          <view class="empty-state">
            <view class="black-hole-animation">
              <view class="black-hole-ring"></view>
              <view class="black-hole-center">
                <text class="recording-text" v-if="isRecording">录音中...</text>
                <text class="recording-text" v-else-if="recordDuration > 0">已接收{{recordDuration}}s</text>
              </view>
            </view>
            <view class="empty-content">
              <view class="encouragement-empty">
                <text class="slogan-text">{{ randomTip }}</text>
              </view>
            </view>
          </view>
        </block>
        
        <block v-else>
          <!-- 调整顺序：情绪气泡图在上，鼓励语句在下 -->
          
          <!-- 情绪气泡图区域 - 放在上方 -->
          <view class="emotion-bubbles-container">
            <view class="emotion-bubbles">
              <view
                v-for="(emotion, index) in emotions"
                :key="index"
                class="bubble"
                :style="{
                  width: calculateBubbleSize(emotion.percentage) + 'rpx',
                  height: calculateBubbleSize(emotion.percentage) + 'rpx',
                  background: emotion.color,
                  transform: getBubbleTransform(emotion, index),
                  opacity: getBubbleOpacity(index)
                }"
              >
                <text class="emotion-label">{{ emotion.name }}</text>
                <text class="emotion-value">{{ emotion.percentage }}%</text>
              </view>
            </view>
          </view>
          
          <!-- 鼓励语句区域 - 移除光标 -->
          <view class="encouragement-section">
            <view class="encouragement">
              <text 
                v-for="(sentence, index) in displaySentences" 
                :key="index" 
                class="sentence" 
                :class="{ 'visible': sentence.visible }"
              >
                {{ sentence.text }}
              </text>
            </view>
          </view>
        </block>
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
      
      <!-- 文字输入框 - 默认显示 -->
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
</template>

<script>
import WeatherDisplay from '@/components/WeatherDisplay.vue'
import BlackHoleEffect from '@/components/BlackHoleEffect.vue'
import { uploadEmotionAudio  } from '@/common/js/http.js'
const recorderManager = uni.getRecorderManager();
const app = getApp();

export default {
  components: {
    WeatherDisplay,
    BlackHoleEffect,
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
      isVoiceMode: false, // 默认为文字输入模式
      inputText: '', // 文字输入内容
      displaySentences: [], // 存储分句后的文本
      isTyping: false,
      typingTimer: null,
      currentSentenceIndex: 0,
      isLoading: false,
      isSubmitting: false,
      isRendering: false, // 添加渲染状态锁
      submitTimeout: null,
      defaultEncouragement: '每一天都是新的开始，分享你的心情吧！',
      showBlackHole: false,
      blackHolePosition: { x: 0, y: 0 },
      hideBubbles: false, // 控制气泡显示/隐藏
      blackHoleActive: false, // 黑洞动画是否激活
      bubblesData: [], // 存储气泡动画数据
      containerFixed: false,
      containerPosition: {
        x: 375, // 默认屏幕中心点（750rpx宽度的一半）
        y: 500  // 根据实际布局调整
      },
      randomTips: [
        '把情绪倾诉给黑洞，让它带走所有烦恼...',
        '再糟糕的一天，也会过去',
        '你的情绪很重要，记录下来会让你更好地理解自己',
        '说出来，会感觉好一些',
        '今天发生了什么？告诉黑洞吧'
      ],
      randomTip: '',
      meteors: [], // 用于存储流星数据
      windowInfo: null, // 用于存储窗口信息
      typingText: '', // 当前正在打字的文本
      fullText: '', // 完整的文本
      typingSpeed: 50, // 打字速度(毫秒/字符)
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

    // 随机选择一条提示语
    this.randomTip = this.randomTips[Math.floor(Math.random() * this.randomTips.length)];
    
    // 获取窗口信息，替代废弃的getSystemInfoSync
    // #ifdef MP-WEIXIN
    this.windowInfo = wx.getWindowInfo();
    // #endif
    
    // #ifndef MP-WEIXIN
    this.windowInfo = uni.getSystemInfoSync();
    // #endif
  },

  mounted() {
    console.log('组件挂载完成，当前 weatherType:', this.weatherType);
    // 组件挂载时获取一次位置，之后不再获取
    if (!this.containerFixed) {
      const sysInfo = uni.getSystemInfoSync();
      this.containerPosition = {
        x: sysInfo.windowWidth / 2,
        y: sysInfo.windowHeight / 2 - 100
      };
      this.containerFixed = true;
    }
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

    // 获取状态栏高度
    const systemInfo = uni.getSystemInfoSync();
    this.statusBarHeight = systemInfo.statusBarHeight;
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
        // 添加标记以防重复调用
        if (this.isSubmitting) return;
        this.isSubmitting = true;
        
        console.log('开始上传音频 initRecorder');
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
          this.isSubmitting = false; // 重置提交标记
          // 确保清除超时计时器
          if (this.submitTimeout) {
            clearTimeout(this.submitTimeout);
            this.submitTimeout = null;
          }
        }
      });

      // 录音错误处理
      recorderManager.onError((error) => {
        console.error('录音错误:', error);
        this.isRecording = false;
        this.isLoading = false;
        this.isSubmitting = false;
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
      if (!this.isRecording || this.isSubmitting) return;
      
      this.isRecording = false;
      this.isLoading = true;
      
      // 获取气泡容器位置作为黑洞起始点
      const query = uni.createSelectorQuery().in(this);
      query.select('.emotion-bubbles-container').boundingClientRect(data => {
        if (data) {
          this.blackHolePosition = {
            x: data.left + data.width / 2,
            y: data.top + data.height / 2
          };
        } else {
          // 使用屏幕中心作为默认位置，但稍微向上偏移确保在气泡区域
          const sysInfo = {};
          // #ifdef MP-WEIXIN
          sysInfo.windowWidth = wx.getWindowInfo().windowWidth;
          sysInfo.windowHeight = wx.getWindowInfo().windowHeight;
          // #endif
          // #ifndef MP-WEIXIN
          const tempInfo = uni.getSystemInfoSync();
          sysInfo.windowWidth = tempInfo.windowWidth;
          sysInfo.windowHeight = tempInfo.windowHeight;
          // #endif
          
          this.blackHolePosition = {
            x: sysInfo.windowWidth / 2,
            y: sysInfo.windowHeight / 2 - 100
          };
        }
        
        this.showBlackHole = true;
        
        // 设置5秒超时
        this.submitTimeout = setTimeout(() => {
          if (this.isLoading) {
            this.isLoading = false;
            this.isSubmitting = false;
            this.showBlackHole = false;
            this.hideBubbles = false;
            uni.showToast({
              title: '请求超时，请重试',
              icon: 'none'
            });
          }
        }, 5000);
        
        recorderManager.stop();
      }).exec();
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
    
    // 处理文本提交
    handleTextSubmit() {
      console.log('handleTextSubmit');
      if (!this.canInteract || !this.inputText.trim() || this.isSubmitting) return;
      
      const currentText = this.inputText.trim();
      this.isSubmitting = true;
      
      // 直接使用预先计算好的位置
      this.blackHolePosition = this.containerPosition;
      this.showBlackHole = true;
      
      // 设置超时保护
      this.submitTimeout = setTimeout(() => {
        this.resetAllStates();
        this.showBlackHole = false;
        uni.showToast({
          title: '请求超时，请重试',
          icon: 'none'
        });
      }, 5000);
      
      // 移除 await 关键字，使用 Promise 链式调用
      console.log("uploadEmotionAudio.....................................................")
      uploadEmotionAudio(
        null,
        (response) => {
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
            this.processEmotions(response);
            
            // 使用响应中的鼓励语，如果没有则使用默认值
            const encouragementText = response.data.emotion.encourage || this.defaultEncouragement;
            this.startTyping(encouragementText);
            
            this.updateWeatherType(response.data.emotion.weather || 'Cloudy');
            this.saveLastEmotion();
            
            // 等待一小段时间确保渲染完成
            console.log('等待一小段时间确保渲染完成');
            setTimeout(() => {
              this.resetAllStates();
            }, 500);
          } catch (error) {
            console.error('处理响应失败:', error);
            this.resetAllStates();
            uni.showToast({
              title: '处理失败',
              icon: 'none'
            });
          }
        },
        (error) => {
          console.error('请求失败:', error);
          this.resetAllStates();
          uni.showToast({
            title: error.message || '请求失败',
            icon: 'none'
          });
        },
        { text: currentText }
      );
    },

    // 黑洞动画结束回调 - 修改逻辑
    onBlackHoleAnimationEnd() {
      console.log('黑洞动画结束');
      this.showBlackHole = false;
      this.blackHoleActive = false;
      
      if (this.emotions && this.emotions.length > 0) {
        // 有情绪数据时，显示气泡
        this.hideBubbles = false;
      }
    },

    // 重置所有状态 - 确保重置标记
    resetAllStates() {
      console.log('重置所有状态----------');
      this.isLoading = false;
      this.isSubmitting = false;
      this.isRendering = false;
      this.showBlackHole = false;
      this.blackHoleActive = false;
      
      // 如果有情绪数据，应该显示
      if (this.emotions && this.emotions.length > 0) {
        this.hideBubbles = false;
      }
      
      if (this.submitTimeout) {
        clearTimeout(this.submitTimeout);
        this.submitTimeout = null;
      }
    },

    // 获取主要情绪的颜色
    getPrimaryEmotionColor() {
      if (!this.emotions || this.emotions.length === 0) {
        return { start: '#7C4DFF', end: '#448AFF' }; // 默认渐变色
      }
      
      // 获取百分比最高的情绪
      const primaryEmotion = [...this.emotions].sort((a, b) => b.percentage - a.percentage)[0];
      const color = primaryEmotion.color;
      
      // 为渐变创建一个稍微不同的结束颜色
      const endColor = this.adjustColor(color, 20);
      
      return { start: color, end: endColor };
    },
    
    // 调整颜色亮度
    adjustColor(hex, percent) {
      // 简单的颜色亮度调整
      const num = parseInt(hex.replace('#', ''), 16);
      const r = (num >> 16) + percent;
      const g = ((num >> 8) & 0x00FF) + percent;
      const b = (num & 0x0000FF) + percent;
      
      const newR = r > 255 ? 255 : r < 0 ? 0 : r;
      const newG = g > 255 ? 255 : g < 0 ? 0 : g;
      const newB = b > 255 ? 255 : b < 0 ? 0 : b;
      
      return '#' + ((newR << 16) | (newG << 8) | newB).toString(16).padStart(6, '0');
    },
    
    // 修复getHighlightClass方法，使用数据属性
    getHighlightClass(sentence, index) {
      return sentence && sentence.highlight === true;
    },
    
    // 完全重写打字效果方法 - 字符级别打字
    startTyping(text) {
      if (!text) return;
      
      // 清除之前的定时器
      if (this.typingTimer) {
        clearInterval(this.typingTimer);
      }
      
      // 保存完整文本
      this.fullText = text;
      // 初始化打字文本为空
      this.typingText = '';
      
      // 初始化句子数组，只有一个元素
      this.displaySentences = [{
        text: '',
        visible: true,
        highlight: true
      }];
      
      this.isTyping = true;
      let charIndex = 0;
      
      // 设置定时器，一个字符一个字符地显示
      this.typingTimer = setInterval(() => {
        if (charIndex < this.fullText.length) {
          // 添加下一个字符
          this.typingText += this.fullText.charAt(charIndex);
          // 更新显示的文本
          this.$set(this.displaySentences[0], 'text', this.typingText);
          charIndex++;
        } else {
          // 完成打字
          clearInterval(this.typingTimer);
          this.isTyping = false;
        }
      }, this.typingSpeed);
    },

    // 处理鼓励文本 - 在获取到情绪分析结果后调用
    handleEncouragementText(emotionResult) {
      // ... 其他处理逻辑保持不变 ...
      
      // 获取鼓励文本
      const encouragementText = this.getEncouragementText(emotionResult);
      
      // 开始打字效果
      this.startTyping(encouragementText);
    },

    // 开始隐藏气泡
    startHidingBubbles() {
      this.blackHoleActive = true;
      this.hideBubbles = true; // 立即隐藏气泡
      
      // 初始化气泡数据
      this.bubblesData = this.emotions.map((_, index) => ({
        offsetX: 0,
        offsetY: 0,
        opacity: 1
      }));
    },
    
    // 更新气泡位置和样式 - 使用新API获取窗口信息
    updateBubbles(data) {
      const { progress, blackHolePosition } = data;
      
      // 如果进度超过50%，完全隐藏气泡
      if (progress > 0.5) {
        this.hideBubbles = true;
        return;
      }
      
      // 更新每个气泡的位置，使其向黑洞中心移动
      this.emotions.forEach((emotion, index) => {
        if (!this.bubblesData[index]) return;
        
        // 计算气泡元素的中心位置（使用预先计算的位置）
        const bubbleSize = this.calculateBubbleSize(emotion.percentage);
        const bubbleX = emotion.offsetX + bubbleSize / 2;
        const bubbleY = emotion.offsetY + bubbleSize / 2;
        
        // 将rpx转换为px - 使用缓存的窗口信息，避免重复调用API
        const rpxRatio = this.windowInfo.windowWidth / 750;
        const bubbleXPx = bubbleX * rpxRatio;
        const bubbleYPx = bubbleY * rpxRatio;
        
        // 计算到黑洞的方向
        const dx = blackHolePosition.x - bubbleXPx;
        const dy = blackHolePosition.y - bubbleYPx;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 根据进度和距离计算偏移量
        const moveFactor = progress * (1 - Math.min(1, distance / 500));
        
        this.bubblesData[index] = {
          offsetX: dx * moveFactor / rpxRatio, // 转回rpx
          offsetY: dy * moveFactor / rpxRatio, // 转回rpx
          opacity: 1 - progress * 2 // 逐渐降低透明度
        };
      });
    },
    
    // 获取气泡的变换样式
    getBubbleTransform(emotion, index) {
      if (this.blackHoleActive && this.bubblesData[index]) {
        const { offsetX, offsetY } = this.bubblesData[index];
        return `translate(${emotion.offsetX + offsetX}rpx, ${emotion.offsetY + offsetY}rpx)`;
      }
      return `translate(${emotion.offsetX}rpx, ${emotion.offsetY}rpx)`;
    },
    
    // 获取气泡的透明度
    getBubbleOpacity(index) {
      if (this.blackHoleActive && this.bubblesData[index]) {
        return Math.max(0, this.bubblesData[index].opacity);
      }
      return 1;
    },

    // 停止打字效果
    stopTyping() {
      if (this.typingTimer) {
        clearInterval(this.typingTimer);
        this.typingTimer = null;
      }
      this.isTyping = false;
    },

    // 移除流星相关方法
    initMeteors() {
      // 不再初始化流星
      console.log('流星效果已禁用');
    },
    
    addMeteor() {
      // 空方法，不再添加流星
    }
  },

  // 组件销毁时清理
  beforeDestroy() {
    console.log('组件销毁');
    this.resetAllStates();
  }
}
</script>

<style lang="scss" scoped>
.container {
  position: relative;
  width: 100%;
  height: 100vh;
  background: linear-gradient(180deg, #0A0B1B 0%, rgba(10, 11, 27, 0.9) 100%);
  overflow: hidden;
}

/* 添加流星效果 */
.container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    radial-gradient(1px 1px at 25% 15%, white, transparent),
    radial-gradient(1px 1px at 50% 40%, white, transparent),
    radial-gradient(1px 1px at 75% 25%, white, transparent),
    radial-gradient(2px 2px at 20% 60%, white, transparent),
    radial-gradient(2px 2px at 40% 80%, white, transparent),
    radial-gradient(2px 2px at 80% 70%, white, transparent);
  background-repeat: no-repeat;
  z-index: 0;
}

/* 流星动画 */
@keyframes meteor {
  0% {
    transform: rotate(-45deg) translateX(0);
    opacity: 1;
  }
  70% {
    opacity: 1;
  }
  100% {
    transform: rotate(-45deg) translateX(-500px);
    opacity: 0;
  }
}

.meteor {
  position: absolute;
  width: 100px;
  height: 2px;
  background: linear-gradient(to right, rgba(255,255,255,0.8), transparent);
  animation: meteor 6s linear infinite;
  z-index: 1;
}

.emotion-icon {
  width: 180rpx;
  height: 180rpx;
  position: absolute;
  top: 40rpx;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2;
  opacity: 0.9;
}

.black-hole-animation {
  position: relative;
  width: 400rpx;
  height: 400rpx;
  margin: 0 auto 60rpx;
}

.black-hole-ring {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), rgba(186, 134, 255, 0.3), rgba(255, 184, 222, 0.3));
  animation: rotate 20s linear infinite;
  box-shadow: 0 0 30rpx rgba(255, 255, 255, 0.3);
}

.black-hole-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 250rpx;
  height: 250rpx;
  border-radius: 50%;
  background-color: #000;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2;
}

.recording-text {
  color: #fff;
  font-size: 32rpx;
  text-align: center;
}

@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.slogan-text {
  font-size: 36rpx;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.6;
  text-align: center;
  padding: 20rpx;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.3);
  letter-spacing: 2rpx;
  position: relative;
}

.slogan-text::before {
  content: '"';
  position: absolute;
  left: -10rpx;
  top: -10rpx;
  font-size: 60rpx;
  color: rgba(255, 255, 255, 0.3);
}

.slogan-text::after {
  content: '"';
  position: absolute;
  right: -10rpx;
  bottom: -30rpx;
  font-size: 60rpx;
  color: rgba(255, 255, 255, 0.3);
}

.encouragement-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 40rpx;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border-radius: 30rpx;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
  animation: float 6s ease-in-out infinite;
  width: 100%;
  max-width: 600rpx;
  margin: 0 auto;
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
  src: url('//at.alicdn.com/t/c/font_4812679_jinvpf541wn.woff2?t=1741059504282') format('woff2'),
       url('//at.alicdn.com/t/c/font_4812679_jinvpf541wn.woff?t=1741059504282') format('woff'),
       url('//at.alicdn.com/t/c/font_4812679_jinvpf541wn.ttf?t=1741059504282') format('truetype');
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

.encouragement-section {
  width: 100%;
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center;
  margin-top: 30rpx;
  padding: 0 20rpx;
  box-sizing: border-box;
}

.encouragement {
  text-align: center;
  max-width: 90%;
  margin: 0 auto;
  padding: 30rpx;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 16rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  border: none; /* 确保没有边框 */
  position: relative;
  overflow: hidden; /* 防止内容溢出 */
}

.encouragement::after {
  display: none; /* 移除可能的伪元素下划线 */
}

/* 改进句子样式 */
.sentence {
  display: inline;
  font-size: 32rpx;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
  letter-spacing: 1rpx;
  text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.2);
  border-bottom: none; /* 确保没有下边框 */
  position: relative;
}

.sentence::after {
  display: none; /* 移除可能的伪元素下划线 */
}

/* 隐藏光标 */
.cursor {
  display: none;
}

.emotion-bubbles-container {
  position: relative;
  width: 100%;
  height: 450rpx; /* 减小高度，避免向上超过header */
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 30rpx; /* 增加顶部间距，确保不会与header重叠 */
  margin-bottom: 40rpx; /* 减小底部间距 */
  overflow: visible; /* 确保气泡可以溢出容器 */
}

.emotion-bubbles {
  position: relative;
  width: 600rpx;
  height: 450rpx; /* 调整高度 */
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

.input-section {
  position: fixed;
  bottom: 100rpx;
  left: 0;
  right: 0;
  padding: 0 30rpx;
  display: flex;
  align-items: center;
  z-index: 100;
  padding-top: 20rpx;
  padding-bottom: 20rpx;
  
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

.emotion-content-area {
  position: relative;
  width: 100%;
  height: 750rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  transition: opacity 0.3s ease;
  
  &.hidden {
    opacity: 0;
    pointer-events: none;
  }
}

.empty-state {
  padding: 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
}

.empty-content {
  text-align: center;
  max-width: 80%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.encouragement-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 40rpx;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border-radius: 30rpx;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
  animation: float 6s ease-in-out infinite;
  width: 100%;
}

@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-15px);
  }
  100% {
    transform: translateY(0px);
  }
}

.tip-title {
  font-size: 42rpx;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.95);
  margin-bottom: 30rpx;
  line-height: 1.4;
  letter-spacing: 2rpx;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
}

.highlight {
  color: #7C4DFF;
  font-weight: bold;
  position: relative;
  display: inline-block;
  padding: 0 6rpx;
}

.highlight::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 8rpx;
  background: linear-gradient(90deg, #7C4DFF, #448AFF);
  border-radius: 4rpx;
  opacity: 0.6;
}

.brand-text {
  display: inline-block;
  font-size: 48rpx;
  font-weight: bold;
  margin: 0 6rpx;
  background: linear-gradient(90deg, #7C4DFF, #448AFF);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: none;
  position: relative;
  z-index: 1;
}

.tip {
  font-size: 32rpx;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  margin-top: 20rpx;
  position: relative;
  padding: 20rpx;
  border-radius: 20rpx;
  max-width: 90%;
}

.tip::before {
  content: '"';
  font-size: 60rpx;
  color: rgba(124, 77, 255, 0.3);
  position: absolute;
  top: -20rpx;
  left: -10rpx;
}

.tip::after {
  content: '"';
  font-size: 60rpx;
  color: rgba(124, 77, 255, 0.3);
  position: absolute;
  bottom: -40rpx;
  right: -10rpx;
}
</style>

<!-- 添加新的样式，确保气泡区域和输入区域不重叠 -->
<style lang="scss">
.emotion-bubbles-container {
  position: relative;
  width: 100%;
  height: 450rpx; /* 减小高度，避免向上超过header */
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 30rpx; /* 增加顶部间距，确保不会与header重叠 */
  margin-bottom: 40rpx; /* 减小底部间距 */
  overflow: visible; /* 确保气泡可以溢出容器 */
}

.emotion-bubbles {
  position: relative;
  width: 600rpx;
  height: 450rpx; /* 调整高度 */
  margin: 0 auto;
}

.input-section {
  position: fixed;
  bottom: 100rpx;
  left: 0;
  right: 0;
  padding: 0 30rpx;
  display: flex;
  align-items: center;
  z-index: 100;
  padding-top: 20rpx;
  padding-bottom: 20rpx;
  
  &.no-bubbles {
    bottom: 160rpx;
  }
}

/* 确保气泡容器和输入区域之间有足够空间 */
.content {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding-bottom: 180rpx; /* 为底部固定的输入框留出空间 */
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

/* 修复字体问题，使用正确的字体引用 */
@font-face {
  font-family: 'iconfont';  /* Project id 4812679 */
  src: url('//at.alicdn.com/t/c/font_4812679_jinvpf541wn.woff2?t=1741059504282') format('woff2'),
       url('//at.alicdn.com/t/c/font_4812679_jinvpf541wn.woff?t=1741059504282') format('woff'),
       url('//at.alicdn.com/t/c/font_4812679_jinvpf541wn.ttf?t=1741059504282') format('truetype');
}
</style>