<template>
  <view class="default-weather-container">
    <image :src="defaultImageUrl" class="weather-image" />
  </view>
</template>

<script>
export default {
  data() {
    return {
      defaultImageUrl: '/static/weather/default.png'
    }
  }
}
</script>

<style scoped>
.default-weather-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}

.weather-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style> 