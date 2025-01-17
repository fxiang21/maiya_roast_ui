<template>
  <view class="lottie-container" ref="lottieContainer">
    <web-view v-if="isH5" :src="lottieHtml"></web-view>
    <!-- 非H5环境可以使用其他替代方案 -->
    <image v-else :src="fallbackImage" class="weather-image"></image>
  </view>
</template>

<script>
// 仅在 H5 环境下引入 lottie
let lottie = null;
// #ifdef H5
import lottieWeb from 'lottie-web';
lottie = lottieWeb;
// #endif

export default {
  name: 'WeatherLottie',
  props: {
    animationPath: {
      type: String,
      required: true
    },
    fallbackImage: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      isH5: false,
      lottieHtml: ''
    }
  },
  mounted() {
    // #ifdef H5
    this.isH5 = true;
    this.initLottie();
    // #endif
  },
  methods: {
    initLottie() {
      if (!lottie) return;
      
      const container = this.$refs.lottieContainer;
      if (!container) return;
      
      lottie.loadAnimation({
        container: container,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: this.animationPath
      });
    }
  },
  beforeDestroy() {
    // #ifdef H5
    if (lottie) {
      lottie.destroy();
    }
    // #endif
  }
}
</script>

<style scoped>
.lottie-container {
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