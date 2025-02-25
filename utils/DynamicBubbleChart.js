class DynamicBubbleChart {
    constructor(options = {}) {
      // 获取转换系数，默认情况下（已经在外层转换了），scaleFactor传入1即可
      const scaleFactor = options.scaleFactor || 1;
      this.options = {
        width: (options.width || 300) * scaleFactor,
        height: (options.height || 300) * scaleFactor,
        minSize: (options.minSize || 40) * scaleFactor,  // 最小直径
        maxSize: (options.maxSize || 150) * scaleFactor, // 最大直径
        // 内边距（注意：这里是气泡所在区域的边距，比如模板中padding设为20rpx）
        padding: (options.padding || 10) * scaleFactor,
        maxSpeed: options.maxSpeed || 1.5, // 最大移动速度
        repulsion: options.repulsion || 0.8 // 碰撞反弹系数
      }
      this.bubbles = []
    }
  
    // 使用内部有效区域进行气泡尺寸计算和坐标生成
    calculateSizes(data) {
      const totalValue = Object.values(data).reduce((a, b) => a + b, 0);
      
      // 有效区域计算（考虑内边距）
      const effectiveWidth = this.options.width - 2 * this.options.padding;
      const effectiveHeight = this.options.height - 2 * this.options.padding;
      const containerArea = effectiveWidth * effectiveHeight;
  
      // 计算总面积（保留20%空白区域）
      const targetArea = containerArea * 0.8;
      const areaPerUnit = targetArea / totalValue;
  
      // 生成原始面积数据
      const MIN_AREA = (this.options.minSize ** 2 * Math.PI) / 4; // 直径转半径后的面积
      const areas = Object.values(data).map(value => Math.max(value * areaPerUnit, MIN_AREA));
      
      // 计算原始半径（面积 → 半径）
      const baseRadii = areas.map(area => Math.sqrt(area / Math.PI));
      
      // 动态调整半径范围
      const minRadius = Math.sqrt((this.options.minSize ** 2 * Math.PI) / Math.PI); // minSize 是直径
      const maxRadius = Math.sqrt((this.options.maxSize ** 2 * Math.PI) / Math.PI); // maxSize 是直径
      const minRaw = Math.min(...baseRadii);
      const maxRaw = Math.max(...baseRadii);
      
      // 线性映射半径到 [minRadius, maxRadius]
      const scale = (maxRadius - minRadius) / (maxRaw - minRaw || 1); // 避免除零
  
      return Object.entries(data).map(([emotion, value], index) => {
        // 计算比例半径
        const radius = minRadius + (baseRadii[index] - minRaw) * scale;
        const size = radius * 2; // 转换为直径
        
        // 位置生成（保持在内边距区域内）
        const x = Math.random() * (effectiveWidth - size) + this.options.padding + size/2;
        const y = Math.random() * (effectiveHeight - size) + this.options.padding + size/2;
  
        return {
          emotion,
          size: Math.min(this.options.maxSize, Math.max(this.options.minSize, size)),
          x,
          y,
          vx: (Math.random() - 0.5) * this.options.maxSpeed,
          vy: (Math.random() - 0.5) * this.options.maxSpeed
        };
      });
    }
  
    // 修正碰撞检测：把边界换成有效区域（[padding, width-padding] 和 [padding, height-padding]）
    checkCollisions() {
      const minX = this.options.padding;
      const maxX = this.options.width - this.options.padding;
      const minY = this.options.padding;
      const maxY = this.options.height - this.options.padding;
      this.bubbles.forEach((a, i) => {
        if (a.x - a.size / 2 < minX) {
          a.x = minX + a.size / 2;
          a.vx *= -this.options.repulsion;
        }
        if (a.x + a.size / 2 > maxX) {
          a.x = maxX - a.size / 2;
          a.vx *= -this.options.repulsion;
        }
        if (a.y - a.size / 2 < minY) {
          a.y = minY + a.size / 2;
          a.vy *= -this.options.repulsion;
        }
        if (a.y + a.size / 2 > maxY) {
          a.y = maxY - a.size / 2;
          a.vy *= -this.options.repulsion;
        }
        
        // 气泡之间的碰撞
        this.bubbles.slice(i + 1).forEach(b => {
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const minDistance = (a.size + b.size) / 2;
          
          if (distance < minDistance) {
            const angle = Math.atan2(dy, dx);
            const force = (minDistance - distance) * 0.5;
            
            a.vx -= Math.cos(angle) * force;
            a.vy -= Math.sin(angle) * force;
            b.vx += Math.cos(angle) * force;
            b.vy += Math.sin(angle) * force;
          }
        });
      });
    }
  
    // 生成不规则圆形气泡的clip-path
    generateBubbleShape(size) {
      const points = [];
      const numPoints = 24; // 点数越多形状越圆润
      const baseRadius = size / 2;
      
      for (let i = 0; i < numPoints; i++) {
        const angle = (i * 2 * Math.PI) / numPoints;
        // 调整随机扰动范围为[0.95, 1.05)
        const radius = baseRadius * (0.95 + Math.random() * 0.1);
        const x = radius * Math.cos(angle) + baseRadius;
        const y = radius * Math.sin(angle) + baseRadius;
        points.push(`${x}rpx ${y}rpx`);
      }
      
      return `polygon(${points.join(', ')})`;
    }
  
    // 生成带形状数据的气泡
    generateBubbles(data) {
      this.bubbles = this.calculateSizes(data).map(bubble => ({
        ...bubble,
        shape: this.generateBubbleShape(bubble.size)
      }));
      return this.bubbles;
    }
  
    // 更新气泡位置（动画用）
    updatePositions() {
      const start = Date.now();
      this.bubbles.forEach(b => {
        b.x += b.vx;
        b.y += b.vy;
      });
      this.checkCollisions();
    }
  }
  
  export default DynamicBubbleChart