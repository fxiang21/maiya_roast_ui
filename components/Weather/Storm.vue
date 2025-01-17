<template>
  <view class="storm-container">
    <canvas 
      canvas-id="stormCanvas"
      id="stormCanvas"
      class="storm-canvas"
      type="2d"
    ></canvas>
  </view>
</template>

<script>
export default {
  name: 'StormWeather',
  
  props: {
    audioContext: {
      type: Object,
      default: null
    },
    isPlaying: {
      type: Boolean,
      default: true
    }
  },

  data() {
    return {
      ctx: null,
      canvasWidth: 0,
      canvasHeight: 0,
      raindrops: [],
      isAnimating: false,
      animationFrame: null
    }
  },

  mounted() {
    console.log('Storm组件已挂载，开始初始化画布');
    this.$nextTick(() => {
      setTimeout(() => {
        this.initStormCanvas();
      }, 100); // 给一个小延时确保canvas已经渲染
    });
  },

  methods: {
    async initStormCanvas() {
      try {
        console.log('开始初始化暴风雨画布');
        const query = uni.createSelectorQuery().in(this);
        query.select('#stormCanvas')
          .fields({ node: true, size: true })
          .exec((res) => {
            console.log('Canvas查询结果:', res);
            if (res && res[0]) {
              const canvas = res[0].node;
              const ctx = canvas.getContext('2d');
              
              // 获取设备信息以设置正确的画布大小
              const systemInfo = uni.getSystemInfoSync();
              this.canvasWidth = systemInfo.windowWidth;
              this.canvasHeight = systemInfo.windowHeight;
              
              // 设置画布的实际大小
              canvas.width = this.canvasWidth * systemInfo.pixelRatio;
              canvas.height = this.canvasHeight * systemInfo.pixelRatio;
              
              // 缩放以适应设备像素比
              ctx.scale(systemInfo.pixelRatio, systemInfo.pixelRatio);
              
              this.ctx = ctx;
              this.raindrops = this.generateRaindrops(100); // 生成100个雨滴
              this.isAnimating = true;
              this.animate();
              
              console.log('暴风雨画布初始化完成', {
                width: this.canvasWidth,
                height: this.canvasHeight,
                raindrops: this.raindrops.length
              });
            } else {
              console.error('未找到Canvas元素');
            }
          });
      } catch (error) {
        console.error('初始化暴风雨画布失败:', error);
      }
    },

    generateRaindrops(count) {
      const drops = [];
      for (let i = 0; i < count; i++) {
        drops.push({
          x: Math.random() * this.canvasWidth,
          y: Math.random() * this.canvasHeight,
          length: Math.random() * 20 + 10, // 雨滴长度10-30
          speed: Math.random() * 15 + 10,  // 雨滴速度10-25
          thickness: Math.random() * 2 + 1, // 雨滴粗细1-3
          color: `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.5})` // 随机透明度
        });
      }
      return drops;
    },

    animate() {
      if (!this.isAnimating || !this.ctx) return;

      // 清除画布
      this.ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      
      // 绘制每个雨滴
      this.raindrops.forEach(drop => {
        // 更新雨滴位置
        drop.y += drop.speed;
        if (drop.y > this.canvasHeight) {
          drop.y = -drop.length;
          drop.x = Math.random() * this.canvasWidth;
        }

        // 绘制雨滴
        this.ctx.beginPath();
        this.ctx.moveTo(drop.x, drop.y);
        this.ctx.lineTo(drop.x - drop.length * 0.3, drop.y + drop.length);
        this.ctx.strokeStyle = drop.color;
        this.ctx.lineWidth = drop.thickness;
        this.ctx.stroke();
      });

      // 使用setTimeout替代requestAnimationFrame
      if (this.isAnimating) {
        setTimeout(() => {
          this.animate();
        }, 1000 / 60); // 约60fps的刷新率
      }
    },

    stopRainAnimation() {
      console.log('停止暴风雨动画');
      this.isAnimating = false;
    }
  },

  beforeDestroy() {
    this.stopRainAnimation();
  }
}
</script>

<style scoped>
.storm-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -998;
  background: linear-gradient(
    135deg, 
    rgba(28, 35, 45, 0.8) 0%,
    rgba(18, 25, 35, 0.85) 50%,
    rgba(8, 15, 25, 0.9) 100%
  );
  /* 添加轻微的光晕效果 */
  box-shadow: inset 0 0 100px rgba(0, 150, 255, 0.1);
}

.storm-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  /* 添加轻微的模糊效果增强科技感 */
  backdrop-filter: blur(1px);
}
</style>