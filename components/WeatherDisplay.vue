<template>
  <view class="weather-container">
    <view class="tech-background">
      <view class="grid-overlay"></view>
      <view class="glow-effect"></view>
    </view>
    <block v-if="weatherType === 'Storm'">
      <storm-weather
        :audio-context="audioContext"
        :is-playing="!isMuted"
      />
    </block>
    <block v-else-if="weatherType === 'Sunny'">
      <sunny-weather
        :audio-context="audioContext"
        :is-playing="!isMuted"
      />
    </block>
    <block v-else-if="weatherType === 'Rainbow'">
      <rainbow-weather
        :audio-context="audioContext"
        :is-playing="!isMuted"
      />
    </block>
    <block v-else-if="weatherType === 'Windy'">
      <windy-weather
        :audio-context="audioContext"
        :is-playing="!isMuted"
      />
    </block>
    <block v-else>
      <default-weather
        :audio-context="audioContext"
        :is-playing="!isMuted"
      />
    </block>
  </view>
</template>

<script>
import StormWeather from './Weather/Storm.vue'
import SunnyWeather from './Weather/Sunny.vue'
import RainbowWeather from './Weather/Rainbow.vue'
import WindyWeather from './Weather/Windy.vue'
import DefaultWeather from './Weather/DefaultWeather.vue'

export default {
  name: 'WeatherDisplay',
  
  components: {
    'storm-weather': StormWeather,
    'sunny-weather': SunnyWeather,
    'rainbow-weather': RainbowWeather,
    'windy-weather': WindyWeather,
    'default-weather': DefaultWeather
  },

  props: {
    weatherType: {
      type: String,
      default: 'Cloudy'
    },
    isMuted: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      audioContext: null,
      audioUrls: {
        Storm: 'https://maiya-prod.oss-cn-shanghai.aliyuncs.com/audio/storm.mp3',
        Sunny: 'https://maiya-prod.oss-cn-shanghai.aliyuncs.com/audio/sunny.mp3',
        Cloudy: 'https://maiya-prod.oss-cn-shanghai.aliyuncs.com/audio/cloudy.mp3',
        // ... 其他天气的音频URL
      },
      isPageVisible: true // 添加页面可见性状态
    }
  },

  watch: {
    weatherType: {
      immediate: true,
      handler(newType) {
        console.log('天气类型变化:', newType);
        this.initAudio(newType);
      }
    },
    isMuted: {
      immediate: true,
      handler(newVal) {
        console.log('=== WeatherDisplay 检测到静音状态变化 ===');
        console.log('新的静音状态:', newVal);
        console.log('当前音频实例:', this.audioContext ? '存在' : '不存在');
        console.log('页面是否可见:', this.isPageVisible);
        
        if (this.audioContext) {
          if (newVal) {
            console.log('执行静音操作');
            this.stopAndDestroyAudio();
          } else if (this.isPageVisible) {
            console.log('执行取消静音操作');
            this.initAudio(this.weatherType);
          }
        } else if (!newVal && this.isPageVisible) {
          console.log('没有音频实例，需要初始化');
          this.initAudio(this.weatherType);
        }
      }
    }
  },

  created() {
    // 监听页面显示/隐藏事件
    uni.$on('hideWeatherAudio', this.handlePageHide);
    uni.$on('showWeatherAudio', this.handlePageShow);
    
    // 修改标签页切换监听的处理方式
    uni.$on('tabChange', (tabPage) => {
      console.log('标签页切换到:', tabPage);
      if (tabPage !== 'emotion') {
        // 如果切换到其他标签页，停止并销毁音频
        this.stopAndDestroyAudio();
      } else {
        // 如果切换回情绪页面，重新初始化音频
        this.initAudio(this.weatherType);
      }
    });
  },

  methods: {
    // 添加新方法：完全停止并销毁音频
    stopAndDestroyAudio() {
      console.log('=== 停止并销毁音频 ===');
      if (this.audioContext) {
        try {
          console.log('开始停止音频');
          this.audioContext.stop();
          console.log('开始销毁音频实例');
          this.audioContext.destroy();
          this.audioContext = null;
          console.log('音频已完全停止并销毁');
        } catch (error) {
          console.error('停止音频时出错:', error);
        }
      } else {
        console.log('没有音频实例需要销毁');
      }
    },

    handlePageShow() {
      console.log('页面显示');
      this.isPageVisible = true;
      // 只在非静音状态下重新初始化并播放
      if (!this.isMuted) {
        this.initAudio(this.weatherType);
      }
    },

    handlePageHide() {
      console.log('页面隐藏');
      this.isPageVisible = false;
      // 页面隐藏时完全停止音频
      this.stopAndDestroyAudio();
    },

    initAudio(weatherType) {
      console.log('=== 初始化音频 ===');
      console.log('天气类型:', weatherType);
      console.log('静音状态:', this.isMuted);
      console.log('页面可见性:', this.isPageVisible);

      // 先清理现有音频
      this.stopAndDestroyAudio();

      const audioUrl = this.audioUrls[weatherType];
      if (!audioUrl) {
        console.log('未找到对应的音频URL');
        return;
      }

      try {
        // 创建新的音频实例
        this.audioContext = uni.createInnerAudioContext();
        this.audioContext.src = audioUrl;
        this.audioContext.loop = true;

        // 添加音频状态监听
        this.audioContext.onPlay(() => {
          console.log('音频开始播放');
        });

        this.audioContext.onStop(() => {
          console.log('音频已停止');
        });

        this.audioContext.onError((res) => {
          console.error('音频播放错误:', res);
        });

        // 只有在页面可见且非静音状态下才播放
        if (!this.isMuted && this.isPageVisible) {
          console.log('开始播放音频');
          this.audioContext.play();
        }
      } catch (error) {
        console.error('初始化音频实例出错:', error);
      }
    },

    playAudio() {
      if (this.audioContext) {
        try {
          this.audioContext.play();
          console.log('播放音频');
        } catch (error) {
          console.error('播放音频出错:', error);
        }
      }
    },

    pauseAudio() {
      if (this.audioContext) {
        try {
          this.audioContext.pause();
          console.log('暂停音频');
        } catch (error) {
          console.error('暂停音频出错:', error);
        }
      }
    }
  },

  beforeDestroy() {
    console.log('组件销毁');
    // 移除所有事件监听
    uni.$off('hideWeatherAudio', this.handlePageHide);
    uni.$off('showWeatherAudio', this.handlePageShow);
    uni.$off('tabChange');

    // 确保完全停止并销毁音频
    this.stopAndDestroyAudio();
  }
}
</script>

<style scoped>
.weather-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1; /* 确保背景层的 z-index 低于内容层 */
  overflow: hidden;
}

.tech-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -2; /* 更低的 z-index */
  /* 主背景渐变，从深蓝到深紫 */
  background: linear-gradient(
    135deg,
    rgba(16, 20, 40, 0.95) 0%,
    rgba(28, 34, 72, 0.9) 25%,
    rgba(38, 42, 85, 0.85) 50%,
    rgba(28, 34, 72, 0.9) 75%,
    rgba(16, 20, 40, 0.95) 100%
  );
}

.grid-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* 网格效果 */
  background-image: 
    linear-gradient(rgba(108, 99, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(108, 99, 255, 0.05) 1px, transparent 1px);
  background-size: 30px 30px;
  /* 添加深度感 */
  transform: perspective(500px) rotateX(30deg);
  opacity: 0.4;
  z-index: -2; /* 更低的 z-index */
}

.glow-effect {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* 光晕效果 */
  background: radial-gradient(
    circle at 50% 50%,
    rgba(103, 122, 255, 0.15) 0%,
    rgba(76, 0, 255, 0.05) 50%,
    transparent 100%
  );
  /* 添加动画 */
  animation: glow-pulse 8s ease-in-out infinite;
  z-index: -2; /* 更低的 z-index */
}

@keyframes glow-pulse {
  0% { opacity: 0.5; }
  50% { opacity: 0.7; }
  100% { opacity: 0.5; }
}

/* 确保雨滴动画也位于低层 */
.rain-animation {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1; /* 低于内容层 */
}
</style>
  