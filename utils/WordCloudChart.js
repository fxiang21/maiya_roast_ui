/**
 * 自定义词云图组件
 */
class WordCloudChart {
  constructor(options) {
    this.canvas = options.canvas;
    this.ctx = options.canvas.getContext('2d');
    this.width = options.width || 300;
    this.height = options.height || 200;
    this.data = options.data || [];
    this.backgroundColor = options.backgroundColor || '#2c3e50';
    this.fontFamily = options.fontFamily || 'Arial, sans-serif';
    this.colorPalette = options.colorPalette || [
      '#67C23A', '#409EFF', '#F56C6C', '#E6A23C', '#909399',
      '#7C4DFF', '#FF9800', '#00BCD4', '#8BC34A', '#FF5722'
    ];
    
    // 设置canvas尺寸
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    
    // 初始化词云布局
    this.words = [];
    this.isAnimating = false;
    this.animationId = null;
    
    // 初始化
    this.init();
  }
  
  init() {
    this.processData();
    this.draw();
  }
  
  // 处理数据，计算字体大小和位置
  processData() {
    if (!this.data || this.data.length === 0) return;
    
    // 找出最大值和最小值
    let maxValue = 0;
    let minValue = Infinity;
    
    this.data.forEach(item => {
      maxValue = Math.max(maxValue, item.value);
      minValue = Math.min(minValue, item.value);
    });
    
    // 防止除以零
    const range = maxValue - minValue || 1;
    
    // 清空现有词
    this.words = [];
    
    // 计算每个词的大小和初始位置
    this.data.forEach((item, index) => {
      // 根据值计算字体大小 (16-48px)
      const fontSize = 16 + (item.value - minValue) / range * 32;
      
      // 随机初始位置
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * Math.min(this.width, this.height) / 3;
      const x = this.width / 2 + Math.cos(angle) * radius;
      const y = this.height / 2 + Math.sin(angle) * radius;
      
      // 随机颜色
      const color = this.colorPalette[index % this.colorPalette.length];
      
      this.words.push({
        text: item.name,
        value: item.value,
        fontSize,
        x,
        y,
        color,
        // 添加一些随机运动参数
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        angle: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 0.5
      });
    });
    
    // 尝试避免重叠
    this.resolveCollisions();
  }
  
  // 解决词之间的碰撞
  resolveCollisions() {
    const iterations = 50;
    
    for (let i = 0; i < iterations; i++) {
      let moved = false;
      
      for (let a = 0; a < this.words.length; a++) {
        for (let b = a + 1; b < this.words.length; b++) {
          const wordA = this.words[a];
          const wordB = this.words[b];
          
          // 计算两个词的边界框
          const boxA = this.getWordBox(wordA);
          const boxB = this.getWordBox(wordB);
          
          // 检查碰撞
          if (this.checkCollision(boxA, boxB)) {
            // 计算移动方向
            const dx = wordB.x - wordA.x;
            const dy = wordB.y - wordA.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;
            
            // 移动词
            const moveX = dx / distance * 2;
            const moveY = dy / distance * 2;
            
            wordA.x -= moveX;
            wordA.y -= moveY;
            wordB.x += moveX;
            wordB.y += moveY;
            
            // 确保词不会移出画布
            this.keepInBounds(wordA);
            this.keepInBounds(wordB);
            
            moved = true;
          }
        }
      }
      
      // 如果没有移动，提前结束
      if (!moved) break;
    }
  }
  
  // 获取词的边界框
  getWordBox(word) {
    this.ctx.font = `${word.fontSize}px ${this.fontFamily}`;
    const metrics = this.ctx.measureText(word.text);
    const width = metrics.width;
    const height = word.fontSize;
    
    return {
      left: word.x - width / 2,
      right: word.x + width / 2,
      top: word.y - height / 2,
      bottom: word.y + height / 2
    };
  }
  
  // 检查两个边界框是否碰撞
  checkCollision(boxA, boxB) {
    return !(
      boxA.right < boxB.left ||
      boxA.left > boxB.right ||
      boxA.bottom < boxB.top ||
      boxA.top > boxB.bottom
    );
  }
  
  // 确保词不会移出画布
  keepInBounds(word) {
    this.ctx.font = `${word.fontSize}px ${this.fontFamily}`;
    const metrics = this.ctx.measureText(word.text);
    const width = metrics.width;
    const height = word.fontSize;
    
    const padding = 10;
    
    // 水平边界
    if (word.x - width / 2 < padding) {
      word.x = width / 2 + padding;
    } else if (word.x + width / 2 > this.width - padding) {
      word.x = this.width - width / 2 - padding;
    }
    
    // 垂直边界
    if (word.y - height / 2 < padding) {
      word.y = height / 2 + padding;
    } else if (word.y + height / 2 > this.height - padding) {
      word.y = this.height - height / 2 - padding;
    }
  }
  
  // 绘制词云
  draw() {
    // 清空画布
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // 绘制每个词
    this.words.forEach(word => {
      this.ctx.save();
      
      // 设置字体和颜色
      this.ctx.font = `${word.fontSize}px ${this.fontFamily}`;
      this.ctx.fillStyle = word.color;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      
      // 应用旋转
      this.ctx.translate(word.x, word.y);
      this.ctx.rotate(word.angle * Math.PI / 180);
      
      // 绘制文字
      this.ctx.fillText(word.text, 0, 0);
      
      this.ctx.restore();
    });
  }
  
  // 更新数据
  updateData(newData) {
    this.data = newData;
    this.processData();
    this.draw();
  }
  
  // 开始动画
  startAnimation() {
    if (this.isAnimating) return;
    
    this.isAnimating = true;
    this.animate();
  }
  
  // 停止动画
  stopAnimation() {
    this.isAnimating = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  
  // 动画帧
  animate() {
    if (!this.isAnimating) return;
    
    // 更新每个词的位置和角度
    this.words.forEach(word => {
      word.x += word.vx;
      word.y += word.vy;
      word.angle += word.rotationSpeed;
      
      // 边界检查
      this.keepInBounds(word);
    });
    
    // 重绘
    this.draw();
    
    // 继续动画
    this.animationId = requestAnimationFrame(() => this.animate());
  }
  
  // 销毁
  destroy() {
    this.stopAnimation();
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.words = [];
    this.data = [];
  }
}

export default WordCloudChart; 