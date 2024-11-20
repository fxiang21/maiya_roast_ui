<template>
  <div class="layout">
    <div class="box">
     <u-swiper @click="clickSwiper" interval="5000" duration="500" height="350" v-if="res" name="img" :list="res.list">
      </u-swiper>
    </div>
  </div>
</template>

<script>
import { modelNavigateTo } from "./tpl";
export default {
  title: "导航栏",
  props: ["res"],
  watch: {
    res: {
      handler(newValue, oldValue) {
        this.$set(this, "res", newValue);
      },
      deep: true,
    },
  },

  mounted() {
   
  },
  methods: {
    clickSwiper(index) {
      modelNavigateTo(this.res.list[index]);
    },
  },
};
</script>
<style lang="scss" scoped>
@import "./tpl.scss";
.swiper-item {
  // 根据需要设置样式
  display: flex;
  flex-direction: column; // 或者row，取决于你想要的布局
  align-items: center; // 垂直居中
  justify-content: center; // 水平居中（如果flex-direction是column）
  // 其他样式...
  position: relative;
}

.swiper-image {
  // 图片样式
  max-width: 100%;
  height: auto;
  object-fit: cover; // 保持图片比例填充容器
}

// .swiper-text {
//   // 文字样式
//   margin-top: 10px; // 或其他值，根据需要调整
//   text-align: center; // 如果需要的话
//   // 其他样式...
// }

//.swiper-text {
//  position: absolute;
//  bottom: 20px;
//  left: 20px;
//  color: white;
//  font-size: 18px;
//  font-weight: bold;
//  background-color: rgba(0, 0, 0, 0.5);
//  padding: 5px 10px;
//  border-radius: 5px;
//}
.swiper-text {
  position: absolute; // 绝对定位，相对于.swiper-item定位文字
  bottom: 20px; // 距离底部20px，可根据需要调整
  left: 50%; // 水平居中，可根据需要调整
  transform: translateX(-50%); // 配合left: 50%实现水平居中
  color: white; // 文字颜色
  // font-size: 18px; // 字体大小，现在通过内联样式动态设置
  font-weight: bold; // 字体加粗
  background-color: rgba(0, 0, 0, 0.5); // 背景色，半透明黑色
  padding: 5px 10px; // 内边距
  border-radius: 5px; // 圆角
}
</style>
