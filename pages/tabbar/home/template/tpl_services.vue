<template>
  <view class="content">
    <!-- 咨询区域 -->
    <u-row :gutter="0">
      <u-col :span="6">
        <u-card :show-head="false" :border-radius="18" box-shadow="7rpx 8rpx 20rpx #ddd">
          <view slot="body">
            <view>
              <text class="consult">文字咨询</text>
            </view>
            <view>
              <u-row :gutter="0">
                <u-col :span="9" style="margin:0;padding:0;margin-bottom:20rpx;">
                  <text class="consult-sub">29.0元/60分钟</text>
                </u-col>
                <u-col :span="2" style="margin:0;padding:0">
                  <view style="position:absolute;right:5rpx;bottom:5rpx">
                    <image src="/static/images/chat_consult.png" mode="widthFix" style="width:110rpx;"></image>
                  </view>
                </u-col>
              </u-row>

            </view>
          </view>

        </u-card>
      </u-col>
      <u-col :span="6">
        <u-card :show-head="false" :border-radius="18" box-shadow="7rpx 8rpx 20rpx #ddd">
          <view slot="body">
            <view>
              <text class="consult">电话咨询</text>
            </view>
            <view>
              <u-row :gutter="0">
                <u-col :span="9" style="margin:0;padding:0;margin-bottom:20rpx">
                  <text class="consult-sub">98.0元/45分钟</text>
                </u-col>
                <u-col :span="2" style="margin:0;padding:0;">
                  <view style="position:absolute;right:5rpx;bottom:5rpx">
                    <image src="/static/images/phone_consult.png" mode="widthFix" style="width:110rpx;"></image>
                  </view>
                </u-col>
              </u-row>

            </view>
          </view>

        </u-card>
      </u-col>
    </u-row>


    <!-- 免费咨询 -->
    <view style="margin-top:30rpx;">
      <u-row>
        <u-col :span="12">
          <u-section font-size="35" lineColor="#5b80f6" title="免费咨询" sub-title="我要提问"></u-section>
        </u-col>
      </u-row>
    </view>
    <view style="margin-left:2%;margin-right:2%;margin-top:20rpx;">
      <u-cell-group>
        <u-cell-item title="法律问题"></u-cell-item>
        <u-cell-item title="法律问题"></u-cell-item>
      </u-cell-group>
    </view>

    <!-- 法律知识 -->
    <view style="margin-top:30rpx;">
      <u-row>
        <u-col :span="12">
          <u-section font-size="35" lineColor="#5b80f6" title="法律知识" sub-title="查看更多"></u-section>
        </u-col>
      </u-row>
    </view>
    <view style="margin-left:2%;margin-right:2%;margin-top:20rpx;">
      <u-cell-group>
        <u-cell-item title="法律知识"></u-cell-item>
        <u-cell-item title="法律知识"></u-cell-item>
      </u-cell-group>
    </view>

  </view>
</template>

<script>
export default {
  name: "tpl_service",
  data() {
    return {
      title: '法律咨询',
      caseTypeList: [{
        id: 1,
        caseTypeName: "婚姻家庭",
        caseTypeIcon: "/static/images/casetype/married&family.png"
      },
        {
          id: 2,
          caseTypeName: "刑事案件",
          caseTypeIcon: "/static/images/casetype/married&family.png"
        },
        {
          id: 3,
          caseTypeName: "劳动工伤",
          caseTypeIcon: "/static/images/casetype/married&family.png"
        },
        {
          id: 4,
          caseTypeName: "债权债务",
          caseTypeIcon: "/static/images/casetype/married&family.png"
        },
        {
          id: 5,
          caseTypeName: "医疗赔偿",
          caseTypeIcon: "/static/images/casetype/married&family.png"
        },
        {
          id: 5,
          caseTypeName: "更多",
          caseTypeIcon: "/static/images/casetype/moreCaseType.png"
        }
      ]
    }
  },
  onLoad() {

  },
  methods: {

  }
}
</script>

<style lang="scss" scoped>
$consultTitleRpx:40rpx;
$consultTitleWeight:700;

$consultSubTitleRpx:25rpx;
$consultSubTitleColor:#888;

.consult {
  font-size: $consultTitleRpx;
  font-weight: $consultTitleWeight;
}

.consult-sub {
  font-size: $consultSubTitleRpx;
  color: $consultSubTitleColor;
  margin-left: 0;
}

.card {
  margin-left: 5%;
  margin-right: 5%;
  width: 90%;
  box-shadow: 7rpx 8rpx 20rpx #eee;
}



.case-type {
  text-align: center;
  border: 1rpx solid transparent;
  background-color: #f8f8fa;
  padding-top: 30rpx;
  padding-bottom: 30rpx;
  border-radius: 10rpx;
  color: #555;
  width: 90%;
  margin-top: 20rpx;
  font-size: 25rpx;
}
</style>
