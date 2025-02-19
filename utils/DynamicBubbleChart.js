class DynamicBubbleChart {
    constructor(options = {}) {
      this.options = {
        width: options.width || 300,
        height: options.height || 300,
        minSize: options.minSize || 40,  // 最小直径
        maxSize: options.maxSize || 150, // 最大直径
        padding: options.padding || 10,
        maxSpeed: options.maxSpeed || 1.5, // 最大移动速度
        repulsion: options.repulsion || 0.8 // 碰撞反弹系数
      }
      this.bubbles = []
    }
  
    // 计算气泡尺寸（面积比例）
    calculateSizes(data) {
      const totalValue = Object.values(data).reduce((a, b) => a + b, 0)
      const containerArea = this.options.width * this.options.height
      const targetArea = containerArea * 0.8
      const scaleFactor = targetArea / totalValue
      
      return Object.entries(data).map(([emotion, value]) => {
        const area = value * scaleFactor
        const size = Math.sqrt(area / Math.PI) * 2 // 直径
        return {
          emotion,
          size: Math.min(this.options.maxSize, Math.max(this.options.minSize, size)),
          x: Math.random() * (this.options.width - size) + size/2,
          y: Math.random() * (this.options.height - size) + size/2,
          vx: (Math.random() - 0.5) * this.options.maxSpeed,
          vy: (Math.random() - 0.5) * this.options.maxSpeed
        }
      })
    }
  
    // 碰撞检测
    checkCollisions() {
      this.bubbles.forEach((a, i) => {
        // 边界碰撞
        if (a.x - a.size/2 < 0 || a.x + a.size/2 > this.options.width) {
          a.vx *= -this.options.repulsion
        }
        if (a.y - a.size/2 < 0 || a.y + a.size/2 > this.options.height) {
          a.vy *= -this.options.repulsion
        }
        
        // 气泡间碰撞
        this.bubbles.slice(i+1).forEach(b => {
          const dx = b.x - a.x
          const dy = b.y - a.y
          const distance = Math.sqrt(dx*dx + dy*dy)
          const minDistance = (a.size + b.size)/2
          
          if (distance < minDistance) {
            const angle = Math.atan2(dy, dx)
            const force = (minDistance - distance) * 0.5
            
            a.vx -= Math.cos(angle) * force
            a.vy -= Math.sin(angle) * force
            b.vx += Math.cos(angle) * force
            b.vy += Math.sin(angle) * force
          }
        })
      })
    }
  
    // 生成气泡形状
    generateBubbleShape(size) {
      const points = [];
      const numPoints = 24; // 点数越多形状越圆润
      const baseRadius = size / 2;
      
      for(let i = 0; i < numPoints; i++) {
        const angle = (i * 2 * Math.PI) / numPoints;
        // 添加随机扰动（最大10%的形变）
        const radius = baseRadius * (0.9 + Math.random() * 0.2);
        const x = radius * Math.cos(angle) + baseRadius;
        const y = radius * Math.sin(angle) + baseRadius;
        points.push(`${x}px ${y}px`);
      }
      
      return `polygon(${points.join(', ')})`;
    }
  
    // 生成动态气泡数据
    generateBubbles(data) {
      this.bubbles = this.calculateSizes(data).map(bubble => ({
        ...bubble,
        shape: this.generateBubbleShape(bubble.size)
      }));
      return this.bubbles;
    }
  
    // 更新气泡位置（动画用）
    updatePositions() {
      this.bubbles.forEach(b => {
        b.x += b.vx
        b.y += b.vy
      })
      this.checkCollisions()
    }
  }
  
  export default DynamicBubbleChart