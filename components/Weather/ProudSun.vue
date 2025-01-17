<template>
  <view class="proud-sun-container">
    <image src="@/assets/weather/proud-sun.png" class="weather-image" />
  </view>
</template>

<script>
export default {
  name: 'ProudSun'
}
</script>

<style scoped>
.proud-sun-container {
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