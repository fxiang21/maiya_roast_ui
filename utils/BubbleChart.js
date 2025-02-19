/**
 * 自定义的 BubbleChart 类
 * 说明：
 *  - 根据后台情绪数据（{ emotion: value }）按比例计算气泡尺寸
 *  - 调整每个气泡的面积，使得所有气泡总面积占容器面积 80%
 *  - 使用高点数的随机多边形生成圆润自然的 clip-path（近似贝塞尔曲线效果）
 *  - 采用螺旋搜索算法，确保气泡之间不重叠且尽可能铺满整个容器
 */
class BubbleChart {
  constructor(options = {}) {
    this.options = {
      width: options.width || 300,
      height: options.height || 400,
      minBubbleSize: options.minBubbleSize || 60,    // 最小气泡直径（rpx）
      maxBubbleSize: options.maxBubbleSize || 200,    // 最大气泡直径（rpx）
      padding: options.padding || 10,                 // 容器内边距
      collisionPadding: options.collisionPadding || 6, // 气泡间隔（碰撞检测时添加额外距离）
      wobblePoints: options.wobblePoints || 36,        // 用于生成圆润气泡的点数（点越多越平滑）
      wobbleFactor: options.wobbleFactor || 0.08       // 气泡形状的随机扰动程度
    };
  }

  /**
   * 生成气泡的 clip-path
   * 为了保证适配 bubble-item（宽高为 bubble.size），这里直接返回百分比坐标的 polygon 字符串
   */
  generateBubblePath() {
    const points = [];
    const numPoints = this.options.wobblePoints;
    const wobbleFactor = this.options.wobbleFactor;
    const angleStep = (2 * Math.PI) / numPoints;
    // 对于一个完美圆形，clip-path 的各点坐标应为 (50% + 50%×cos(angle), 50% + 50%×sin(angle))
    // 这里在 50% 的基础上引入随机扰动
    for (let i = 0; i < numPoints; i++) {
      const angle = i * angleStep;
      const randomFactor = 1 + (Math.random() - 0.5) * wobbleFactor; // 随机介于 1 - wobbleFactor/2 与 1 + wobbleFactor/2
      const r = 50 * randomFactor; // 基于 50% 计算
      const x = 50 + r * Math.cos(angle);
      const y = 50 + r * Math.sin(angle);
      points.push(`${x.toFixed(2)}% ${y.toFixed(2)}%`);
    }
    return `polygon(${points.join(', ')})`;
  }

  /**
   * 根据情绪值和 scaleFactor 计算气泡直径（保证面积正比于情绪值）
   */
  calculateBubbleSize(value, scaleFactor) {
    // 目标气泡面积 = value * scaleFactor
    const area = value * scaleFactor;
    const diameter = 2 * Math.sqrt(area / Math.PI);
    // 限制在设置的最小和最大直径之间
    return Math.max(this.options.minBubbleSize, Math.min(diameter, this.options.maxBubbleSize));
  }

  /**
   * 根据传入的数据生成气泡布局数据
   * data: { emotion: value, ... }
   * 返回的数组中每个 bubble 包括：{ emotion, value, size, centerX, centerY, path }
   */
  generateBubbles(data) {
    if (!data || Object.keys(data).length === 0) {
      return [];
    }
    // 计算容器面积（rpx²）
    const containerArea = this.options.width * this.options.height;
    // 目标：所有气泡面积之和占容器面积的 80%
    const targetTotalArea = containerArea * 0.8;
    // 求所有情绪值总和
    const totalValue = Object.values(data).reduce((sum, v) => sum + v, 0);
    // 计算 scaleFactor 使得 sum( value * scaleFactor ) = targetTotalArea
    const scaleFactor = targetTotalArea / totalValue;
    
    // 对数据按数值从大到小排序，先放置大气泡
    const sortedEntries = Object.entries(data).sort((a, b) => b[1] - a[1]);
    const bubbles = [];
    for (const [emotion, value] of sortedEntries) {
      const size = this.calculateBubbleSize(value, scaleFactor);
      const position = this.findAvailablePosition(size, bubbles);
      if (position) {
        bubbles.push({
          emotion,
          value,
          size,
          centerX: position.x,
          centerY: position.y,
          path: this.generateBubblePath() // 生成圆润自然的clip-path
        });
      }
    }
    return bubbles;
  }

  /**
   * 采用螺旋搜索算法寻找一个可用的位置
   * 尝试从容器中心向外扩展，检查候选位置是否符合不重叠要求（以及容器边界）
   */
  findAvailablePosition(size, existingBubbles) {
    const padding = this.options.padding;
    const radius = size / 2;
    const containerWidth = this.options.width;
    const containerHeight = this.options.height;
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;
    // 搜索最大半径：容器对角线的一半
    const maxSearchRadius = Math.sqrt(Math.pow(containerWidth, 2) + Math.pow(containerHeight, 2)) / 2;
    const step = radius / 2; // 搜索步长

    // 从 r = 0 开始向外搜索
    for (let r = 0; r < maxSearchRadius; r += step) {
      // 当前圈上尝试若干个角度
      const stepsInCircle = Math.max(8, Math.floor((2 * Math.PI * r) / step));
      for (let i = 0; i < stepsInCircle; i++) {
        const angle = (2 * Math.PI / stepsInCircle) * i;
        let x = centerX + r * Math.cos(angle);
        let y = centerY + r * Math.sin(angle);
        // 添加随机偏移，让布局不那么刻板
        const offsetX = (Math.random() - 0.5) * step;
        const offsetY = (Math.random() - 0.5) * step;
        x += offsetX;
        y += offsetY;
        const candidate = { centerX: x, centerY: y, size };
        if (this.isPositionValid(candidate, existingBubbles)) {
          return { x, y };
        }
      }
    }
    // 若没有找到合适位置，则返回 null
    return null;
  }

  /**
   * 检查候选的气泡位置是否有效
   * 需满足：位于容器边界内；与已有气泡不发生碰撞（圆心距离大于两半径和+collisionPadding）
   */
  isPositionValid(bubble, existingBubbles) {
    const padding = this.options.padding;
    const radius = bubble.size / 2;
    if (
      bubble.centerX - radius < padding ||
      bubble.centerX + radius > this.options.width - padding ||
      bubble.centerY - radius < padding ||
      bubble.centerY + radius > this.options.height - padding
    ) {
      return false;
    }
    for (const existing of existingBubbles) {
      const dx = bubble.centerX - existing.centerX;
      const dy = bubble.centerY - existing.centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const minDistance = (bubble.size + existing.size) / 2 + this.options.collisionPadding;
      if (distance < minDistance) {
        return false;
      }
    }
    return true;
  }
}

export default BubbleChart;