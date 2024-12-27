<template>
  <view class="tabbar">
    <view
      v-for="(item, index) in tabBarList"
      :key="index"
      class="tabbar-item"
      :class="{ 'middle-item': index === 1 }"
      @click="handleTabChange(item.pagePath)"
    >
      <image :src="item.selected ? item.selectedIconPath : item.iconPath" class="tabbar-icon"></image>
      <text :style="{ color: item.selected ? selectedColor : color }">{{ item.text }}</text>
    </view>
  </view>
</template>

<script>
export default {
  props: {
    tabBarList: Array,
    color: String,
    selectedColor: String
  },
  methods: {
    handleTabChange(pagePath) {
      this.$emit('tabchange', pagePath);
    }
  }
};
</script>

<style scoped>
.tabbar {
  display: flex;
  justify-content: space-around;
  align-items: center;
  height: 60px; /* 自定义高度 */
  background-color: #fff;
}

.tabbar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.middle-item {
  flex: 2; /* 中间项占用更多空间 */
  margin: -10px; /* 调整位置以使其更加显眼 */
  border-radius: 20px; /* 添加圆角效果 */
  background-color: #f0f0f0; /* 背景色 */
}
</style>