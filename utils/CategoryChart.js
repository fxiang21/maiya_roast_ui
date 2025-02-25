/**
 * 自定义分类统计图组件
 */
class CategoryChart {
  constructor(options) {
    this.canvas = options.canvas;
    this.ctx = options.canvas.getContext('2d');
    this.width = options.width || 300;
    this.height = options.height || 200;
    this.data = options.data || { categories: [], series: [] };
    this.backgroundColor = options.backgroundColor || '#2c3e50';
    this.fontFamily = options.fontFamily || 'Arial, sans-serif';
    this.padding = options.padding || { top: 40, right: 20, bottom: 60, left: 60 };
    this.animationDuration = options.animationDuration || 1000;
    
    // 设置canvas尺寸
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    
    // 图表区域
    this.chartArea = {
      x: this.padding.left,
      y: this.padding.top,
      width: this.width - this.padding.left - this.padding.right,
      height: this.height - this.padding.top - this.padding.bottom
    };
    
    // 动画相关
    this.animationStart = 0;
    this.animationProgress = 0;
    this.isAnimating = false;
    this.animationId = null;
    
    // 交互相关
    this.activeCategory = -1;
    this.tooltip = {
      visible: false,
      x: 0,
      y: 0,
      text: ''
    };
    
    // 初始化
    this.init();
  }
  
  init() {
    this.draw();
  }
  
  // 绘制图表
  draw(progress = 1) {
    // 清空画布
    this.ctx.fillStyle = this.backgroundColor;
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    if (!this.data || !this.data.categories || !this.data.series || 
        this.data.categories.length === 0 || this.data.series.length === 0) {
      this.drawNoData();
      return;
    }
    
    // 绘制坐标轴
    this.drawAxes();
    
    // 绘制图例
    this.drawLegend();
    
    // 绘制柱状图
    this.drawBars(progress);
    
    // 绘制提示框
    if (this.tooltip.visible) {
      this.drawTooltip();
    }
  }
  
  // 绘制无数据提示
  drawNoData() {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.font = '16px ' + this.fontFamily;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('暂无数据', this.width / 2, this.height / 2);
  }
  
  // 绘制坐标轴
  drawAxes() {
    const { x, y, width, height } = this.chartArea;
    
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = 1;
    
    // X轴
    this.ctx.beginPath();
    this.ctx.moveTo(x, y + height);
    this.ctx.lineTo(x + width, y + height);
    this.ctx.stroke();
    
    // Y轴
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(x, y + height);
    this.ctx.stroke();
    
    // Y轴刻度
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.font = '12px ' + this.fontFamily;
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';
    
    for (let i = 0; i <= 100; i += 20) {
      const yPos = y + height - (i / 100) * height;
      
      // 刻度线
      this.ctx.beginPath();
      this.ctx.moveTo(x - 5, yPos);
      this.ctx.lineTo(x, yPos);
      this.ctx.stroke();
      
      // 刻度值
      this.ctx.fillText(i + '%', x - 10, yPos);
      
      // 网格线
      if (i > 0) {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        this.ctx.beginPath();
        this.ctx.moveTo(x, yPos);
        this.ctx.lineTo(x + width, yPos);
        this.ctx.stroke();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      }
    }
    
    // X轴类别
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    
    const categories = this.data.categories;
    const barWidth = width / categories.length;
    
    categories.forEach((category, index) => {
      const xPos = x + barWidth * (index + 0.5);
      this.ctx.fillText(category, xPos, y + height + 10);
    });
  }
  
  // 绘制图例
  drawLegend() {
    const series = this.data.series;
    const legendY = 20;
    let legendX = this.width / 2 - (series.length * 80) / 2;
    
    series.forEach((item, index) => {
      // 图例颜色块
      this.ctx.fillStyle = item.color;
      this.ctx.fillRect(legendX, legendY - 8, 16, 16);
      
      // 图例文字
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      this.ctx.font = '14px ' + this.fontFamily;
      this.ctx.textAlign = 'left';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(item.name, legendX + 24, legendY);
      
      legendX += 80;
    });
  }
  
  // 绘制柱状图
  drawBars(progress) {
    const { x, y, width, height } = this.chartArea;
    const categories = this.data.categories;
    const series = this.data.series;
    
    if (categories.length === 0 || series.length === 0) return;
    
    const barWidth = width / categories.length;
    const barPadding = barWidth * 0.2;
    const actualBarWidth = barWidth - barPadding * 2;
    
    categories.forEach((category, categoryIndex) => {
      const barX = x + barWidth * categoryIndex + barPadding;
      let stackHeight = 0;
      
      series.forEach((serie, serieIndex) => {
        if (!serie.data || categoryIndex >= serie.data.length) return;
        
        const value = serie.data[categoryIndex];
        const barHeight = (value / 100) * height * progress;
        
        // 绘制柱子
        this.ctx.fillStyle = serie.color;
        
        // 高亮显示当前选中的类别
        if (categoryIndex === this.activeCategory) {
          this.ctx.globalAlpha = 1;
        } else {
          this.ctx.globalAlpha = 0.8;
        }
        
        this.ctx.fillRect(
          barX,
          y + height - stackHeight - barHeight,
          actualBarWidth,
          barHeight
        );
        
        // 如果值足够大，显示数值
        if (barHeight > 20) {
          this.ctx.fillStyle = 'white';
          this.ctx.font = '12px ' + this.fontFamily;
          this.ctx.textAlign = 'center';
          this.ctx.textBaseline = 'middle';
          this.ctx.fillText(
            value + '%',
            barX + actualBarWidth / 2,
            y + height - stackHeight - barHeight / 2
          );
        }
        
        stackHeight += barHeight;
      });
      
      this.ctx.globalAlpha = 1;
    });
  }
  
  // 绘制提示框
  drawTooltip() {
    const { x, y, text } = this.tooltip;
    
    // 测量文本宽度
    this.ctx.font = '14px ' + this.fontFamily;
    const metrics = this.ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = 20;
    const padding = 8;
    
    // 绘制背景
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.roundRect(
      x - textWidth / 2 - padding,
      y - textHeight - padding * 2,
      textWidth + padding * 2,
      textHeight + padding * 2,
      4
    );
    this.ctx.fill();
    
    // 绘制文本
    this.ctx.fillStyle = 'white';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, x, y - textHeight / 2 - padding);
  }
  
  // 更新数据
  updateData(newData) {
    this.data = newData;
    this.startAnimation();
  }
  
  // 开始动画
  startAnimation() {
    this.stopAnimation();
    
    this.isAnimating = true;
    this.animationStart = Date.now();
    this.animationProgress = 0;
    
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
    
    const now = Date.now();
    const elapsed = now - this.animationStart;
    this.animationProgress = Math.min(elapsed / this.animationDuration, 1);
    
    this.draw(this.animationProgress);
    
    if (this.animationProgress < 1) {
      this.animationId = requestAnimationFrame(() => this.animate());
    } else {
      this.isAnimating = false;
    }
  }
  
  // 处理触摸事件
  handleTouch(x, y) {
    const { chartArea } = this;
    const categories = this.data.categories;
    
    // 检查是否在图表区域内
    if (
      x < chartArea.x ||
      x > chartArea.x + chartArea.width ||
      y < chartArea.y ||
      y > chartArea.y + chartArea.height
    ) {
      this.activeCategory = -1;
      this.tooltip.visible = false;
      this.draw();
      return;
    }
    
    // 计算触摸的类别
    const barWidth = chartArea.width / categories.length;
    const categoryIndex = Math.floor((x - chartArea.x) / barWidth);
    
    if (categoryIndex >= 0 && categoryIndex < categories.length) {
      this.activeCategory = categoryIndex;
      
      // 显示提示框
      this.tooltip.visible = true;
      this.tooltip.x = chartArea.x + barWidth * (categoryIndex + 0.5);
      this.tooltip.y = chartArea.y;
      
      // 构建提示文本
      let tooltipText = categories[categoryIndex] + ': ';
      this.data.series.forEach((serie, index) => {
        if (index > 0) tooltipText += ', ';
        tooltipText += serie.name + ' ' + serie.data[categoryIndex] + '%';
      });
      
      this.tooltip.text = tooltipText;
      
      this.draw();
    }
  }
  
  // 清除触摸状态
  clearTouch() {
    this.activeCategory = -1;
    this.tooltip.visible = false;
    this.draw();
  }
  
  // 调整大小
  resize(width, height) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    
    this.chartArea = {
      x: this.padding.left,
      y: this.padding.top,
      width: this.width - this.padding.left - this.padding.right,
      height: this.height - this.padding.top - this.padding.bottom
    };
    
    this.draw();
  }
  
  // 销毁
  destroy() {
    this.stopAnimation();
    this.ctx.clearRect(0, 0, this.width, this.height);
  }
}

// 添加圆角矩形方法
CanvasRenderingContext2D.prototype.roundRect = function(x, y, width, height, radius) {
  if (width < 2 * radius) radius = width / 2;
  if (height < 2 * radius) radius = height / 2;
  
  this.beginPath();
  this.moveTo(x + radius, y);
  this.arcTo(x + width, y, x + width, y + height, radius);
  this.arcTo(x + width, y + height, x, y + height, radius);
  this.arcTo(x, y + height, x, y, radius);
  this.arcTo(x, y, x + width, y, radius);
  this.closePath();
  
  return this;
};

export default CategoryChart; 