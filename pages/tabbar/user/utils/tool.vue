<template>
  <view>
    <!-- 常用工具 -->
    <view class="interact-tools" style="margin-bottom: 15px">
      <div class="paddingBox">
        <view class="interact-container">
          <view class="interact-item" @click="navigateTo('/pages/mine/set/editionIntro')">
            <text class="iconfont icon-about"></text>
            <view>关于</view>
          </view>
          
          <view class="interact-item" @click="navigateTo('/pages/mine/set/setUp')">
            <text class="iconfont icon-setting"></text>
            <view>设置</view>
          </view>
        </view>
      </div>
    </view>
  </view>
</template>

<script>
import { distribution } from "@/api/goods";
import configs from "@/config/config";
import storage from "@/utils/storage";

export default {
  data() {
    return {
      configs,
      storage
    }
  },
  
  methods: {
    handleNavigate(url) {
      uni.navigateTo({
        url,
      });
    },
    navigateTo(url) {
      const ignores = [
        '/pages/mine/set/setUp',
        '/pages/mine/set/editionIntro',
        '/pages/mine/set/feedBack'
      ]
      if (!ignores.includes(url)) {
        if (this.$options.filters.tipsToLogin('normal')) {
          this.handleNavigate(url)
        }
      }
      else {
        this.handleNavigate(url)
      }
    },
    
    linkMsgDetail(){
      uni.navigateTo({
        url: `/pages/mine/im/list`,
      });
    },
    
    distribution() {
      distribution().then((res) => {
        if (res.data.result) {
          let type = res.data.result.distributionStatus;
          if (type == "PASS") {
            uni.navigateTo({
              url: "/pages/mine/distribution/home",
            });
          } else if (type == "REFUSE") {
            uni.navigateTo({
              url: "/pages/mine/distribution/auth",
            });
          } else if (type == "RETREAT") {
            uni.showToast({
              title: "您的分销资格已被清退。请联系管理员！",
              duration: 2000,
              icon: "none",
            });
          } else {
            uni.showToast({
              title: "您的信息正在审核",
              duration: 2000,
              icon: "none",
            });
          }
        } else if (!res.data.success && res.data.code == 22000) {
          uni.showToast({
            title: "分销功能暂未开启",
            duration: 2000,
            icon: "none",
          });
        } else {
          // 没有资格申请 先去实名认证
          uni.navigateTo({
            url: "/pages/mine/distribution/auth",
          });
        }
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.interact-tools {
  border-left: none;
  border-right: none;
  margin-top: 30rpx;

  .interactBox {
    height: 156rpx;
  }
  
  .interact-container {
    margin: 0 20rpx;
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(10px);
    border-radius: 20rpx;
    box-shadow: 0 4rpx 24rpx 0 rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
    
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    text-align: center;

    .interact-item {
      font-size: $font-sm;
      width: 25%;
      height: 160rpx;
      padding: 30rpx;
      color: rgba(255, 255, 255, 0.9);
      transition: all 0.3s ease;
      
      &:active {
        transform: scale(0.95);
        opacity: 0.8;
      }
      
      .iconfont {
        font-size: 52rpx;
        margin-bottom: 6rpx;
        display: block;
        color: rgba(255, 255, 255, 0.9);
      }
    }
  }
}

/* 添加图标定义 */
.icon-about:before {
  content: "\e6a1";
}

.icon-setting:before {
  content: "\e643";
}
</style>
