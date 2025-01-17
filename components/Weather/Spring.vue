<template>
  <view class="spring-container">
    <image src="@/assets/weather/spring.png" class="weather-image" />
  </view>
</template>

<script>
export default {
  name: 'Spring'
}
</script>

<style scoped>
.spring-container {
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