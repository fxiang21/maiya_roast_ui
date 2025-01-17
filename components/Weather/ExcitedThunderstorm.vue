<template>
  <view class="thunderstorm-container">
    <WeatherLottie 
      :animation-path="'@/assets/lottie/thunderstorm.json'"
      :fallback-image="'@/assets/weather/thunderstorm.png'"
    />
  </view>
</template>

<script>
import WeatherLottie from './WeatherLottie.vue'

export default {
  name: 'ExcitedThunderstorm',
  components: {
    WeatherLottie
  }
}
</script>

<style scoped>
.thunderstorm-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}
</style> 