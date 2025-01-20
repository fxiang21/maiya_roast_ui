<!-- components/Weather/Sunny.vue -->
<template>
    <view class="sunny-container">
      <image 
        :src="imageUrl" 
        class="weather-image"
        :cache="true"
        @error="handleImageError"
      />
    </view>
  </template>
  
  <script>
  export default {
    data() {
      return {
        imageUrl: '',
        cdnUrl: 'https://maiya-prod.oss-cn-shanghai.aliyuncs.com/image/weather/sunny.jpg',
        localUrl: '@/static/weather/sunny.jpg'  // 本地备份
      }
    },
    created() {
      // 优先使用 CDN
      this.imageUrl = this.cdnUrl;
    },
    methods: {
      handleImageError() {
        // CDN 加载失败时使用本地图片
        this.imageUrl = this.localUrl;
      }
    }
  }
  </script>
  
  <style scoped>
  .sunny-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1; /* 确保在最底层 */
  }
  
  .weather-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  </style>