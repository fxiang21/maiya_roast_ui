<!-- components/Weather/Sunny.vue -->
<template>
    <view class="sunny-container">
      <image src="@/assets/weather/sunny.png" class="weather-image" />
    </view>
  </template>
  
  <script>
  export default {
    // 空间配置或方法
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