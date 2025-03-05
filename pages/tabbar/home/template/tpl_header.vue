<template>
  <u-navbar
    :border="false"
    background="#b7fff1"

    :placeholder="true"
    :safeAreaInsetTop="truelsnode"
    :is-back="false"
    :border-bottom="false"
	:title="title"
  >
  </u-navbar>
</template>

<script>
export default {
  name: 'CustomNavbar',
  props: {
    title: {
      type: String,
      default: '黑洞吐槽',
    },
  },
};
</script>

<style scoped>
/* 导航栏整体样式 */
u-navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

</style>
