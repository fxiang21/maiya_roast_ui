<template>
  <view class="rainbow-container">
    <WeatherLottie 
      :animation-path="'@/assets/lottie/rainbow.json'"
      :fallback-image="'@/assets/weather/rainbow.png'"
    />
  </view>
</template>

<script>
import WeatherLottie from './WeatherLottie.vue'

export default {
  name: 'Rainbow',
  components: {
    WeatherLottie
  }
}
</script>

<style scoped>
.rainbow-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
}
</style>
