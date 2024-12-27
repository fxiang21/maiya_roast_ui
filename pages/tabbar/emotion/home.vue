<template>
  <view class="wrapper">
    <uni-nav-bar title="情绪助手" />
    
    <view class="content">
      <view class="result-box">
        <text class="result-text">{{stResult}}</text>
      </view>

      <view class="analysis-box" v-if="emotionResult">
        <text class="analysis-text">情绪分析结果: {{emotionResult}}</text>
        <text class="analysis-text" v-if="emotionFor">分析原因: {{emotionFor}}</text>
      </view>

      <view class="record-container">
        <view 
          :class="['record-btn', {'recording': isRecording}]"
          @touchstart="startRecord"
          @touchend="stopRecord"
        >
          <view class="wave-container" v-if="isRecording">
            <view class="wave wave1"></view>
            <view class="wave wave2"></view>
            <view class="wave wave3"></view>
          </view>
          <text class="iconfont icon-mic"></text>
          <text v-if="isRecording" class="recording-tip">正在录音...</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
const recorderManager = uni.getRecorderManager();
const app = getApp();

export default {
  data() {
    return {
      isRecording: false,
      stResult: '',
      emotionResult: '',
      emotionFor: '',
    }
  },
  
  onLoad() {
    // 配置录音结束事件
    recorderManager.onStop(async (res) => {
      const { tempFilePath } = res;
      
      try {
        const uploadResult = await uni.uploadFile({
          url: `${app.globalData.url}api/analysis/message`,
          filePath: tempFilePath,
          name: 'file',
          formData: {
            timestamp: Date.now(), // 当前时间戳
            language: '16k_zh',
            format: 'wav',
            sampleRate: '16000',
            channels: '1',  // 单声道
            bitRate: '96000', // 比特率
          },
          header: {
            'content-type': 'multipart/form-data'
          }
        });
        
        // 处理不同平台返回格式的差异
        const responseData = Array.isArray(uploadResult) ? uploadResult[1].data : uploadResult.data;
        const response = JSON.parse(responseData);
        
        if (response.code === 200) {
          this.stResult = response.data.text || '';
          this.emotionResult = response.data.emotion || '';
          this.emotionFor = response.data.for || '';
        } else {
          throw new Error(response.message || '分析失败');
        }
      } catch (error) {
        console.error('上传失败:', error);
        uni.showToast({
          title: error.message || '上传失败',
          icon: 'none'
        });
      }
    });
  },
  
  methods: {
    startRecord() {
      this.isRecording = true;
      this.stResult = '';
      this.emotionResult = '';
      this.emotionFor = '';
      
      recorderManager.start({
        duration: 60000, // 最长录音时间
        sampleRate: 16000,
        numberOfChannels: 1, // 对应后端的 channels
        encodeBitRate: 96000, // 对应后端的 bitRate
        format: 'wav'
      });
    },
    
    stopRecord() {
      this.isRecording = false;
      recorderManager.stop();
    }
  }
}
</script>

<style scoped lang="scss">
.container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.record-container {
  position: fixed;
  bottom: 120px;
  left: 50%;
  transform: translateX(-50%);
}

.record-btn {
  width: 80px;
  height: 80px;
  background: #007AFF;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  transition: all 0.3s ease;
  
  &.recording {
    background: #ff4444;
    transform: scale(1.1);
  }
}

.wave-container {
  position: absolute;
  width: 100%;
  height: 100%;
}

.wave {
  position: absolute;
  width: 100%;
  height: 100%;
  background: rgba(255, 68, 68, 0.4);
  border-radius: 50%;
  animation: ripple 2s linear infinite;
  
  &.wave1 {
    animation-delay: 0s;
  }
  
  &.wave2 {
    animation-delay: 0.6s;
  }
  
  &.wave3 {
    animation-delay: 1.2s;
  }
}

@keyframes ripple {
  0% {
    transform: scale(1);
    opacity: 0.4;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.icon-mic {
  color: #fff;
  font-size: 32px;
  z-index: 1;
}

.recording-tip {
  position: absolute;
  bottom: -25px;
  font-size: 12px;
  color: #ff4444;
}

.result-box {
  margin: 20px 0;
  padding: 15px;
  background: #fff;
  border-radius: 8px;
  min-height: 100px;
}

.analysis-box {
  margin: 10px 0;
  padding: 15px;
  background: #e8f4ff;
  border-radius: 8px;
}

.result-text, .analysis-text {
  font-size: 16px;
  line-height: 1.5;
}

.analysis-text {
  color: #0066cc;
  display: block;
  margin-bottom: 8px;
  
  &:last-child {
    margin-bottom: 0;
  }
}
</style>