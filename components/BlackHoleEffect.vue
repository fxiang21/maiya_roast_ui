<template>
  <view class="black-hole-container" :style="containerStyle">
    <canvas 
      class="black-hole-canvas" 
      type="2d"
      id="blackHoleCanvas"
      @touchstart.stop.prevent
      @touchmove.stop.prevent
      @touchend.stop.prevent
    ></canvas>
  </view>
</template>

<script>
export default {
  name: 'BlackHoleEffect',
  props: {
    position: {
      type: Object,
      default: () => ({ x: 0, y: 0 })
    },
    targetArea: {
      type: String,
      default: 'emotion-bubbles-container' // 默认目标区域为情绪气泡区
    }
  },
  data() {
    return {
      canvasContext: null,
      animationTimer: null,
      particles: [],
      blackHoleRadius: 10, // 起始半径更小
      maxBlackHoleRadius: 80, // 最大半径适中
      animationStartTime: 0,
      animationDuration: 2000, // 2秒动画
      isAnimating: false,
      canvasWidth: 0,
      canvasHeight: 0,
      lastFrameTime: 0,
      rotationSpeed: 0.05, // 旋转速度
      spiralFactor: 0.02, // 螺旋收缩因子
      particleCount: 150, // 增加粒子数量
      coreRotationAngle: 0, // 核心旋转角度
      targetPosition: { x: 0, y: 0 }, // 目标区域中心位置
      targetSize: { width: 0, height: 0 }, // 目标区域尺寸
      pixelRatio: 1, // 设备像素比
      canvas: null, // Canvas 元素引用
      targetElements: [], // 存储目标元素（气泡）
      targetElementsData: [], // 存储目标元素的初始位置和大小
      emitAnimationEndEvent: true, // 添加一个标志，控制是否发送动画结束事件
    }
  },
  computed: {
    containerStyle() {
      return {
        position: 'fixed',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        zIndex: 999,
        pointerEvents: 'none'
      }
    }
  },
  mounted() {
    this.$nextTick(() => {
      setTimeout(() => {
        this.initCanvas();
      }, 100);
    });
  },
  beforeDestroy() {
    this.stopAnimation();
  },
  methods: {
    initCanvas() {
      try {
        // 替换废弃的 getSystemInfoSync 方法
        let sysInfo = {};
        // #ifdef MP-WEIXIN
        sysInfo = {
          windowWidth: wx.getWindowInfo().windowWidth,
          windowHeight: wx.getWindowInfo().windowHeight,
          pixelRatio: wx.getWindowInfo().pixelRatio || 2
        };
        // #endif
        
        // #ifndef MP-WEIXIN
        sysInfo = uni.getSystemInfoSync();
        // #endif
        
        this.canvasWidth = sysInfo.windowWidth;
        this.canvasHeight = sysInfo.windowHeight;
        this.pixelRatio = sysInfo.pixelRatio || 2; // 获取设备像素比
        
        // 获取 Canvas 节点
        const query = uni.createSelectorQuery().in(this);
        query.select('#blackHoleCanvas')
          .fields({ node: true, size: true })
          .exec(res => {
            if (res && res[0] && res[0].node) {
              const canvas = res[0].node;
              this.canvas = canvas;
              
              // 设置画布大小，考虑像素比
              canvas.width = this.canvasWidth * this.pixelRatio;
              canvas.height = this.canvasHeight * this.pixelRatio;
              
              // 获取绘图上下文
              const ctx = canvas.getContext('2d');
              this.canvasContext = ctx;
              
              // 应用像素比例缩放
              ctx.scale(this.pixelRatio, this.pixelRatio);
              
              // 使用传入的位置作为黑洞位置
              this.targetPosition = {
                x: this.position.x,
                y: this.position.y
              };
              
              console.log('初始黑洞位置:', this.targetPosition);
              
              // 初始化粒子
              this.createParticles();
              
              // 开始动画
              this.startAnimation();
            } else {
              console.error('获取Canvas节点失败');
              // 尝试使用旧的Canvas API
              this.fallbackToLegacyCanvas();
            }
          });
      } catch (error) {
        console.error('初始化Canvas失败:', error);
        this.fallbackToLegacyCanvas();
      }
    },
    
    // 回退到旧版Canvas API
    fallbackToLegacyCanvas() {
      try {
        console.log('尝试使用旧版Canvas API');
        const ctx = uni.createCanvasContext('blackHoleCanvas', this);
        this.canvasContext = ctx;
        
        // 替换废弃的 getSystemInfoSync 方法
        let sysInfo = {};
        // #ifdef MP-WEIXIN
        sysInfo = {
          windowWidth: wx.getWindowInfo().windowWidth,
          windowHeight: wx.getWindowInfo().windowHeight
        };
        // #endif
        
        // #ifndef MP-WEIXIN
        sysInfo = uni.getSystemInfoSync();
        // #endif
        
        this.canvasWidth = sysInfo.windowWidth;
        this.canvasHeight = sysInfo.windowHeight;
        
        // 使用传入的位置作为黑洞位置
        this.targetPosition = {
          x: this.position.x,
          y: this.position.y
        };
        
        // 创建粒子
        this.createParticles();
        
        // 开始动画
        this.startAnimation();
      } catch (error) {
        console.error('回退到旧版Canvas API失败:', error);
      }
    },
    
    getTargetAreaPosition(callback) {
      // 直接使用传入的位置作为目标位置
      this.targetPosition = {
        x: this.position.x,
        y: this.position.y
      };
      
      console.log('使用传入位置作为目标:', this.targetPosition);
      
      // 设置默认目标区域大小
      this.targetSize = {
        width: 300,
        height: 300
      };
      
      if (callback) callback();
    },
    
    // 获取目标区域内的所有气泡元素
    getTargetElements(callback) {
      const query = uni.createSelectorQuery().in(this);
      
      // 选择所有气泡元素
      query.selectAll(`.${this.targetArea} .bubble`).boundingClientRect(data => {
        if (data && data.length > 0) {
          this.targetElements = data;
          
          // 存储每个气泡的初始位置和大小
          this.targetElementsData = data.map(bubble => ({
            id: bubble.id,
            initialX: bubble.left + bubble.width / 2,
            initialY: bubble.top + bubble.height / 2,
            width: bubble.width,
            height: bubble.height,
            opacity: 1,
            scale: 1,
            distance: Math.sqrt(
              Math.pow(bubble.left + bubble.width / 2 - this.position.x, 2) +
              Math.pow(bubble.top + bubble.height / 2 - this.position.y, 2)
            )
          }));
          
          console.log(`找到 ${this.targetElements.length} 个气泡元素`);
        } else {
          console.log('没有找到气泡元素');
        }
        
        if (callback) callback();
      }).exec();
    },
    
    // 更新气泡元素的位置和样式
    updateTargetElements(progress) {
      // 发出事件通知页面更新气泡样式
      this.$emit('updateBubbles', {
        progress: progress,
        blackHolePosition: this.targetPosition
      });
    },
    
    // 创建粒子
    createParticles() {
      this.particles = [];
      
      for (let i = 0; i < this.particleCount; i++) {
        // 随机角度
        const angle = Math.random() * Math.PI * 2;
        // 随机距离
        const distance = Math.random() * 150 + 50;
        
        // 计算位置
        const x = this.targetPosition.x + Math.cos(angle) * distance;
        const y = this.targetPosition.y + Math.sin(angle) * distance;
        
        // 创建粒子
        this.particles.push({
          x,
          y,
          size: Math.random() * 3 + 1,
          angle,
          distance,
          speed: Math.random() * 0.02 + 0.01,
          opacity: Math.random() * 0.5 + 0.5,
          trail: [{x, y}] // 初始轨迹点
        });
      }
    },
    
    startAnimation() {
      if (this.isAnimating) return;
      
      this.isAnimating = true;
      this.animationStartTime = Date.now();
      this.lastFrameTime = this.animationStartTime;
      this.emitAnimationEndEvent = true; // 重置标志
      
      // 通知页面开始隐藏气泡
      this.$emit('startHidingBubbles');
      
      // 使用 setTimeout 替代 requestAnimationFrame
      const animate = () => {
        if (!this.isAnimating) return;
        
        const currentTime = Date.now();
        const delta = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        const progress = Math.min(1, (currentTime - this.animationStartTime) / this.animationDuration);
        
        // 更新黑洞半径
        this.blackHoleRadius = this.maxBlackHoleRadius * progress;
        
        // 更新旋转角度
        this.coreRotationAngle += 0.05 * (delta / 16.67);
        
        // 更新气泡元素
        this.$emit('updateBubbles', {
          progress: progress,
          blackHolePosition: this.targetPosition
        });
        
        // 清除画布
        if (this.canvas) {
          // Canvas 2D API
          this.canvasContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
          
          // 绘制黑洞核心
          this.drawBlackHoleCore();
          
          // 更新和绘制粒子
          this.updateAndDrawParticles(delta);
        } else {
          // 旧版Canvas API
          this.canvasContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
          
          // 绘制黑洞核心
          this.drawBlackHoleCore();
          
          // 更新和绘制粒子
          this.updateAndDrawParticles(delta);
          
          // 执行绘制
          this.canvasContext.draw();
        }
        
        // 如果动画未完成，继续下一帧
        if (progress < 1) {
          this.animationTimer = setTimeout(animate, 16);
        } else {
          // 动画完成后保持最终状态一段时间，然后发送完成事件
          setTimeout(() => {
            this.stopAnimation();
            this.$emit('animationEnd');
          }, 1000);
        }
      };
      
      // 启动动画循环
      animate();
    },
    
    stopAnimation() {
      this.isAnimating = false;
      if (this.animationTimer) {
        clearTimeout(this.animationTimer);
        this.animationTimer = null;
      }
      
      // 确保只发送一次动画结束事件
      if (this.emitAnimationEndEvent) {
        this.emitAnimationEndEvent = false;
        this.$emit('animationEnd');
      }
    },
    
    drawBlackHoleCore() {
      const ctx = this.canvasContext;
      const x = this.targetPosition.x;
      const y = this.targetPosition.y;
      const radius = this.blackHoleRadius;
      
      // 检查是否为Canvas 2D API
      if (this.canvas) {
        // 创建径向渐变
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, 'rgba(139, 92, 246, 0.8)');
        gradient.addColorStop(0.5, 'rgba(76, 29, 149, 0.6)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
        
        // 绘制黑洞核心
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // 绘制光晕
        ctx.beginPath();
        ctx.arc(x, y, radius * 1.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(139, 92, 246, 0.2)';
        ctx.fill();
      } else {
        // 旧版Canvas API
        // 创建圆形渐变
        const gradient = ctx.createCircularGradient(x, y, radius);
        gradient.addColorStop(0, 'rgba(139, 92, 246, 0.8)');
        gradient.addColorStop(0.5, 'rgba(76, 29, 149, 0.6)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
        
        // 绘制黑洞核心
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.setFillStyle(gradient);
        ctx.fill();
        
        // 绘制光晕
        ctx.beginPath();
        ctx.arc(x, y, radius * 1.2, 0, Math.PI * 2);
        ctx.setFillStyle('rgba(139, 92, 246, 0.2)');
        ctx.fill();
      }
    },
    
    updateAndDrawParticles(delta) {
      const ctx = this.canvasContext;
      const isCanvas2D = !!this.canvas;
      
      // 更新粒子位置
      this.particles.forEach(particle => {
        // 更新角度
        particle.angle += particle.speed * (delta / 16.67);
        
        // 随着黑洞半径增大，粒子距离减小
        const distanceFactor = 1 - (this.blackHoleRadius / this.maxBlackHoleRadius) * 0.5;
        particle.distance = Math.max(10, particle.distance * distanceFactor);
        
        // 计算新位置
        const newX = this.targetPosition.x + Math.cos(particle.angle) * particle.distance;
        const newY = this.targetPosition.y + Math.sin(particle.angle) * particle.distance;
        
        // 更新位置
        particle.x = newX;
        particle.y = newY;
        
        // 添加到轨迹
        particle.trail.push({x: newX, y: newY});
        
        // 限制轨迹长度
        if (particle.trail.length > 5) {
          particle.trail.shift();
        }
        
        // 绘制轨迹
        if (particle.trail.length > 1) {
          ctx.beginPath();
          ctx.moveTo(particle.trail[0].x, particle.trail[0].y);
          
          for (let i = 1; i < particle.trail.length; i++) {
            ctx.lineTo(particle.trail[i].x, particle.trail[i].y);
          }
          
          if (isCanvas2D) {
            ctx.lineWidth = particle.size * 0.5;
            ctx.strokeStyle = `rgba(139, 92, 246, ${particle.opacity * 0.3})`;
            ctx.stroke();
          } else {
            ctx.setLineWidth(particle.size * 0.5);
            ctx.setStrokeStyle(`rgba(139, 92, 246, ${particle.opacity * 0.3})`);
            ctx.stroke();
          }
        }
        
        // 绘制粒子
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        
        if (isCanvas2D) {
          ctx.fillStyle = `rgba(139, 92, 246, ${particle.opacity})`;
          ctx.fill();
        } else {
          ctx.setFillStyle(`rgba(139, 92, 246, ${particle.opacity})`);
          ctx.fill();
        }
      });
      
      // 绘制光弧效果
      this.drawLightArcs();
    },
    
    drawLightArcs() {
      const ctx = this.canvasContext;
      const isCanvas2D = !!this.canvas;
      
      // 绘制3个光弧，均匀分布
      for (let i = 0; i < 3; i++) {
        const startAngle = this.coreRotationAngle + (i * Math.PI * 2 / 3);
        const arcRadius = this.blackHoleRadius * 2;
        
        ctx.beginPath();
        ctx.arc(
          this.targetPosition.x, 
          this.targetPosition.y, 
          arcRadius, 
          startAngle, 
          startAngle + Math.PI * 0.5
        );
        
        if (isCanvas2D) {
          ctx.lineWidth = 3;
          ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
          ctx.stroke();
        } else {
          ctx.setLineWidth(3);
          ctx.setStrokeStyle('rgba(139, 92, 246, 0.4)');
          ctx.stroke();
        }
      }
    }
  }
}
</script>

<style scoped>
.black-hole-container {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  z-index: 999;
  pointer-events: none;
}

.black-hole-canvas {
  width: 100%;
  height: 100%;
}
</style> 