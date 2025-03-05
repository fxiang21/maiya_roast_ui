<template>
  <view class="user">
    <!-- 个人信息 -->
    <view class="status_bar">
      <!-- 这里是状态栏 -->
    </view>
    <view class="header"  @click="userDetail">
      <view class="head-1">
        <image :src="userInfo.face || userImage"></image>
      </view>
      <view class="head-2" v-if="userInfo.id">
        <view class="user-name">
          {{ userInfo.nickname === '微信用户' ? userInfo.username : userInfo.nickname }}
        </view>
      </view>
      <view class="head-2" v-else>
        <view class="user-name">登录/注册</view>
      </view>
      <u-icon style="display: flex;align-items: flex-start;" name="arrow-right" color="#ffffff"></u-icon>
    </view>
    <!-- 积分，优惠券，关注， -->
    <!-- <div class="pointBox box"> -->
      <!-- <u-row text-align="center" gutter="16" class="point"> -->
<!--        <u-col text-align="center" span="4" @click="navigateTo('/pages/mine/deposit/operation')">
          <view>预存款</view>
          <view class="money">{{ walletNum | unitPrice }}</view>
        </u-col>

        <u-col text-align="center" span="4" @click="navigateTo('/pages/cart/coupon/myCoupon')">
          <view>优惠券</view>
          <view>{{ couponNum || 0 }}</view>
        </u-col> -->

        <!-- <u-col text-align="center" span="4" @click="navigateTo('/pages/mine/myTracks')">
          <view>足迹</view>
          <view>{{ footNum || 0 }}</view>
        </u-col> -->
      <!-- </u-row> -->
      <!-- 我的订单，代付款 -->
      <!-- <view class="order"> -->
      <!--  <view class="order-item" @click="navigateTo('/pages/order/myOrder?status=1')">
          <div class="bag bag2">
            <u-icon name="bag-fill" size="35" color="#fff"></u-icon>
          </div>
          <view>待付款</view>
        </view>
        <view class="order-item" @click="navigateTo('/pages/order/myOrder?status=3')">
          <div class="bag bag3">
            <u-icon name="car-fill" size="35" color="#fff"></u-icon>
          </div>
          <view>待收货</view>
        </view>
        <view class="order-item" @click="navigateTo('/pages/order/evaluate/myEvaluate')">
          <div class="bag bag4">
            <u-icon name="star-fill" size="35" color="#fff"></u-icon>
          </div>
          <view>待评价</view>
        </view>
        <view class="order-item" @click="navigateTo('/pages/order/afterSales/afterSales')">
          <div class="bag bag5">
            <u-icon name="server-fill" size="35" color="#fff"></u-icon>
          </div>
          <view>售后</view>
        </view> -->
       <!-- <view class="order-item" @click="navigateTo('/pages/order/myOrder?status=0')">
          <div class="bag bag1">
            <u-icon name="order" size="35" color="#fff"></u-icon>
          </div>
          <view>我的订单</view>
        </view> -->
      <!-- </view>
    </div> -->
    <!-- 常用工具 -->

    <tool />

    <!-- 流星效果 -->
    <view class="meteor-container">
      <view v-for="(meteor, index) in meteors" :key="index" 
            class="meteor" 
            :style="{ top: meteor.top + 'rpx', left: meteor.left + 'rpx', animationDelay: meteor.delay + 's' }">
      </view>
    </view>

  </view>
</template>
<script>
import tool from "@/pages/tabbar/user/utils/tool.vue";
import { getCouponsNum, getFootprintNum, getUserWallet } from "@/api/members.js";
import configs from '@/config/config'

export default {
  components: {
    tool,
  },
  data() {
    return {
      configs,
      userImage: configs.defaultUserPhoto,
      coverTransform: "translateY(0px)",
      coverTransition: "0s",
      moving: false,
      userInfo: {},
      couponNum: "",
      footNum: "",
      walletNum: "",
      meteors: []
    };
  },
  onLoad() {
    console.log("onLoad:", this.userInfo)
    this.generateMeteors();
  },
  onShow() {
    console.log("onShow:", this.userInfo)
    this.userInfo = this.$options.filters.isLogin() || {};
	console.log("userInfo:", this.userInfo)
    if (this.$options.filters.isLogin("auth")) {
      // this.getUserOrderNum();
    } else {
      this.walletNum = 0;
      this.couponNum = 0;
      this.footNum = 0;
    }
  },
  onPullDownRefresh() {
    // this.getUserOrderNum();
    this.userInfo = this.$options.filters.isLogin();
  },
  // #ifndef MP
  onNavigationBarButtonTap(e) {
    const index = e.index;
    if (index === 0) {
      this.navigateTo("/pages/mine/set/setUp");
    }
  },
  // #endif

  mounted() { },
  methods: {
    /**
     * 统一跳转接口,拦截未登录路由
     */
    navigateTo(url) {
      uni.navigateTo({
        url,
      });
    },
    userDetail() {
      this.userInfo.id
        ? this.navigateTo("/pages/mine/set/personMsg")
        : this.$options.filters.navigateToLogin();;
    },
    // async getUserOrderNum() {
    //   uni.stopPullDownRefresh();

    //   Promise.all([
    //     getCouponsNum(), //优惠券
    //     getFootprintNum(), //浏览数量
    //     getUserWallet(), //预存款
    //   ]).then((res) => {
    //     this.couponNum = res[0].data.result;
    //     this.footNum = res[1].data.result;
    //     this.walletNum = res[2].data.result.memberWallet;
    //   });
    // },
    // 生成随机流星
    generateMeteors() {
      const meteorCount = 15;
      for (let i = 0; i < meteorCount; i++) {
        this.meteors.push({
          top: Math.random() * 1000,
          left: Math.random() * 750,
          delay: Math.random() * 5
        });
      }
    }
  },
};
</script>

<style lang="scss" scoped>
html,
body {
  overflow: auto;
}

.money {
  overflow: hidden;

  text-overflow: ellipsis;
  white-space: nowrap;
}

.user {
  position: relative;
  min-height: 100vh;
  background: linear-gradient(180deg, #0A0B1B 0%, rgba(10, 11, 27, 0.9) 100%);
  overflow: hidden;
  
  /* 星空背景 */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: 
      radial-gradient(1px 1px at 25% 15%, white, transparent),
      radial-gradient(1px 1px at 50% 40%, white, transparent),
      radial-gradient(1px 1px at 75% 25%, white, transparent),
      radial-gradient(2px 2px at 20% 60%, white, transparent),
      radial-gradient(2px 2px at 40% 80%, white, transparent),
      radial-gradient(2px 2px at 80% 70%, white, transparent);
    background-repeat: no-repeat;
    z-index: 0;
  }
  
  .header {
    position: relative;
    z-index: 1;
    max-width: 100%;
    padding: calc(50rpx + var(--status-bar-height)) 30rpx 0 6%;
    height: calc(var(--status-bar-height) + 360rpx);
    background-size: cover;
    border-bottom-left-radius: 30rpx;
    border-bottom-right-radius: 30rpx;
    background-image: url("/static/img/main-bg.png");
    background-position: bottom;
    background-repeat: no-repeat;
    color: #ffffff;
    display: flex;
    justify-content: space-between;
    
    /* 添加深色渐变叠加层 */
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(180deg, rgba(10, 11, 27, 0.7) 0%, rgba(10, 11, 27, 0.5) 100%);
      border-bottom-left-radius: 30rpx;
      border-bottom-right-radius: 30rpx;
      z-index: -1;
    }

    .head-1 {
      text-align: center;
      width: 152rpx;
      position: relative;
      display: flex;
      align-items: center;

      image {
        width: 152rpx;
        height: 144rpx;
        border-radius: 50%;
        margin-bottom: 30rpx;
        border: 3px solid rgba(255, 255, 255, 0.3);
        box-shadow: 0 0 20rpx rgba(124, 77, 255, 0.4);
      }

      .edti-head {
        position: absolute;
        width: 40rpx;
        height: 40rpx;
        border-radius: 50%;
        background-color: rgba(255, 255, 255, 0.3);
        top: 100rpx;
        right: 0;

        image {
          width: 100%;
          height: 100%;
        }
      }
    }

    .head-2 {
      flex: 1;
      margin-left: 30rpx;
      margin-top: 100rpx;
      line-height: 1;
    }

    /deep/ .u-icon,
    .u-icon {
      margin-top: 106rpx;
    }
  }

  .pointBox {
    width: 94%;
    margin: 0 3%;
    background: #fff;
    border-radius: 20rpx;
    box-shadow: 0 4rpx 24rpx 0 rgba($color: #f6f6f6, $alpha: 1);
  }

  .point {
    text-align: center;
    height: 160rpx;

    font-size: $font-sm;
    // #ifdef MP-WEIXIN
    padding: 24rpx;

    // #endif
    .u-col {
      view {
        color: $u-main-color;
        font-size: 28rpx;
      }

      view:last-child {
        margin-top: 8rpx;
        color: $main-color;
        font-size: $font-lg;
      }
    }
  }

  .order {
    height: 140rpx;
    text-align: center;
    font-size: $font-sm;
    display: flex;
    justify-content: space-around;
    align-items: center;
    padding: 0 3%;
    color: #999;

    .order-item {
      position: relative;
      line-height: 2em;
      width: 96rpx;

      :first-child {
        font-size: 48rpx;
        margin-bottom: 10rpx;
      }
    }
  }
}

.box {
  transform: translateY(-30rpx);
}

.user-name {
  font-size: 34rpx;
  color: #ffffff;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.3);
}

.bag {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  margin: 0 auto;
}

.bag1 {
  background: #ff4a48;
}

.bag2 {
  background: #ff992f;
}

.bag3 {
  background: #009ee0;
}

.bag4 {
  background: #00d5d5;
}

.bag5 {
  background: #28ccb0;
}

/* 流星效果 */
.meteor-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}

.meteor {
  position: absolute;
  width: 4rpx;
  height: 100rpx;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.8));
  transform: rotate(-45deg);
  animation: meteor 3s linear infinite;
}

@keyframes meteor {
  0% {
    opacity: 0;
    transform: translateX(0) translateY(0) rotate(-45deg);
  }
  10% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateX(-200rpx) translateY(200rpx) rotate(-45deg);
  }
}
</style>
