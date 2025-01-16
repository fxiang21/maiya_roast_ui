<template>
  <view class="black-hole-container" v-if="showBlackHole">
    <!-- 黑洞 -->
    <view class="black-hole"></view>

    <!-- 光点 -->
    <view
      class="light-point"
      v-for="(point, index) in lightPoints"
      :key="index"
      :style="lightStyles[index]"
    ></view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      showBlackHole: false, // 是否显示黑洞动画
      lightPoints: 12, // 光点数量
    };
  },
  computed: {
    // 动态生成光点样式
    lightStyles() {
      return Array.from({ length: this.lightPoints }, (_, index) => {
        const angle = (360 / this.lightPoints) * index; // 光点角度
        const distance = 100; // 光点距离黑洞中心的距离
        return {
          transform: `rotate(${angle}deg) translate(${distance}px) rotate(-${angle}deg)`,
          animationDelay: `${index * 0.1}s`, // 光点动画延迟
        };
      });
    },
  },
  methods: {
    // 启动黑洞动画
    startBlackHole() {
      this.showBlackHole = true;
      setTimeout(() => {
        this.showBlackHole = false;
      }, 2000); // 动画持续2秒
    },
  },
};
</script>

<style scoped>
.black-hole-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.black-hole {
  width: 0;
  height: 0;
  background-color: black;
  border-radius: 50%;
  animation: blackHole 2s forwards;
}

.light-point {
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: white;
  border-radius: 50%;
  animation: lightPoint 2s forwards;
}

@keyframes blackHole {
  0% {
    width: 0;
    height: 0;
  }
  50% {
    width: 100px;
    height: 100px;
  }
  100% {
    width: 0;
    height: 0;
  }
}

@keyframes lightPoint {
  0% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(0.5);
  }
  100% {
    opacity: 0;
    transform: scale(0);
  }
}
</style>