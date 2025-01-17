<!-- components/Weather/WeatherLottie.vue -->
<template>
    <div ref="lottieContainer" class="lottie-container"></div>
  </template>
  
  <script>
  import lottie from 'lottie-web';
  
  export default {
    props: {
      animationPath: {
        type: String,
        required: true
      }
    },
    mounted() {
      this.lottieInstance = lottie.loadAnimation({
        container: this.$refs.lottieContainer,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: this.animationPath
      });
    },
    beforeDestroy() {
      if (this.lottieInstance) {
        this.lottieInstance.destroy();
      }
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
    z-index: -1; /* 确保在最底层 */
  }
  </style>