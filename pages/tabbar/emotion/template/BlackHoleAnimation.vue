<template>
  <view class="black-hole-container">
    <view class="black-hole">
      <view class="accretion-disk"></view>
      <view class="event-horizon"></view>
      <view class="singularity"></view>
      <view class="light-ring ring-1"></view>
      <view class="light-ring ring-2"></view>
      <view class="light-ring ring-3"></view>
      <block v-for="i in 20" :key="i">
        <view :class="['particle', 'particle-' + i]"></view>
      </block>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.black-hole-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: radial-gradient(circle at center, 
    rgba(0, 0, 0, 0.8) 0%,
    rgba(0, 0, 0, 0.6) 50%,
    rgba(0, 0, 0, 0.4) 100%
  );
  overflow: hidden;
}

.black-hole {
  position: relative;
  width: 300rpx;
  height: 300rpx;
  transform-style: preserve-3d;
  animation: rotate 20s linear infinite;
}

.event-horizon {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 100rpx;
  height: 100rpx;
  background: #000;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 60rpx 20rpx rgba(0, 0, 0, 0.8);
  z-index: 2;
}

.singularity {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40rpx;
  height: 40rpx;
  background: #000;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 30rpx 10rpx rgba(255, 255, 255, 0.1);
  z-index: 3;
}

.accretion-disk {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 280rpx;
  height: 280rpx;
  border-radius: 50%;
  transform: translate(-50%, -50%) rotateX(70deg);
  background: linear-gradient(to right,
    rgba(255, 100, 0, 0.8),
    rgba(255, 200, 0, 0.8),
    rgba(255, 100, 0, 0.8)
  );
  filter: blur(5rpx);
  animation: rotate 8s linear infinite;
  z-index: 1;
}

.light-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  border-radius: 50%;
  border: 2rpx solid rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  animation: pulse 3s ease-in-out infinite;
}

.ring-1 {
  width: 160rpx;
  height: 160rpx;
  animation-delay: 0s;
}

.ring-2 {
  width: 200rpx;
  height: 200rpx;
  animation-delay: 1s;
}

.ring-3 {
  width: 240rpx;
  height: 240rpx;
  animation-delay: 2s;
}

.particle {
  position: absolute;
  width: 4rpx;
  height: 4rpx;
  background: white;
  border-radius: 50%;
  animation: particle-move 4s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0.8;
  }
  50% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.4;
  }
  100% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0.8;
  }
}

@keyframes particle-move {
  0% {
    transform: translate(var(--x, 0), var(--y, 0)) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate(calc(var(--x, 0) * 0.2), calc(var(--y, 0) * 0.2)) scale(0);
    opacity: 0;
  }
}

@for $i from 1 through 20 {
  .particle-#{$i} {
    --x: #{random(300) - 150}rpx;
    --y: #{random(300) - 150}rpx;
    top: 50%;
    left: 50%;
    animation-delay: #{random(4000) / 1000}s;
  }
}
</style>

<script>
export default {
  name: 'BlackHole',
  data() {
    return {
      particleCount: 20
    }
  },
}
</script>