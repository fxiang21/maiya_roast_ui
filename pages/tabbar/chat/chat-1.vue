<template>
  <view class="content">
	  <customHeader/>
    <scroll-view class="scroll-view" :style="{height:scrollViewHeight +'px'}" :scroll-y="true"
      :scroll-top="scrollTop" :scroll-with-animation="true">
      <view id="scroll-view-content" class="msg-list">
        <view v-for="(item,index) in msgList" :key="index" class="msg-item">
          <img v-if="item.type == 1" class="img_1" src="/static/img/maiya.png" />
          <view :style="{ 'margin-left': (item.type == 2 ? 'auto' : '0') }" class="msg" v-html="item.msg">
          </view>
          <img v-if="item.type == 2" class="img_2" src="/static/img/me.png" />
        </view>
      </view>
    </scroll-view>
    <view class="footer" ref="footer">
      <input type="text" v-model="keyword" class="txt" :disabled="isSend" placeholder="请输入关键词......" />
      <button type="primary" class="btn" @click="sendMessage()">{{btnTxt}}</button>
    </view>
  </view>
</template>

<script>
	import tpl_header from '@/pages/tabbar/home/template/tpl_header.vue';
	
  var _this;
  export default {
    data() {
      return {
        scrollTop: 0, //滚动条位置        
        scrollViewHeight: 0, //容器高度初始化为0
        msgList: [],
        keyword: '',
        btnTxt: '发送',
        isSend: false
      }
    },
	components:{
		customHeader: tpl_header
	},
    onLoad() {
      _this = this;
    },
    mounted: function() {
      _this.calculateHeight();

      //当浏览器窗口大小发生变化时，重新计算容器高度
      window.addEventListener('resize', () => {
        _this.calculateHeight();
      });
    },
	
    methods: {
      // 计算容器高度
      calculateHeight() {
        // 获取底部元素
        let _footer = _this.$refs.footer;
        if (_footer) {
          _this.scrollViewHeight = document.documentElement.clientHeight - _footer.$el.offsetHeight - 44;
        }
      },
      //发送信息
      sendMessage() {
        if (_this.isSend) {
          // _this.showToast('请等待上一次对话结束！');
          return;
        }
        const _keyword = _this.keyword;
        if (!_keyword) {
          _this.showToast('请输入关键词！');
          return;
        }

        _this.keyword = '';
        _this.btnTxt = '加载中';
        _this.isSend = true;
        _this.msgList.push({
          type: 2,
          msg: _keyword
        });

        //延迟0.5秒执行
        setTimeout(function() {
          _this.msgList.push({
            type: 1,
            msg: '🤖机器人正在思考🤔中...'
          });
        }, 500);

        //延迟1秒执行
        setTimeout(function() {
          _this.sendRequest(_keyword);
        }, 1000);
      },
      //发起请求
      sendRequest(keyword) {
        uni.showLoading({
          title: '请稍后...'
        });
        uni.request({
          url: 'http://localhost:3000/chat',
          method: 'POST',
          data: {
            keyword: keyword
          },
          success: (res) => {
            // console.log('success', res.data);
            let d = res.data;
            if (d.code == 0 && d.data) {
              let text = d.data.replace(/\n\n/g, '<br>').replace(/\n/g, '<br>');
              _this.msgList.push({
                type: 1,
                msg: ''
              });
              //实现打字机效果
              let index = 0;
              let timer = setInterval(function() {
                if (text.length < index) {
                  clearInterval(timer);
                }
                _this.msgList[_this.msgList.length - 1].msg += text.substr(index, 1);
                _this.scrollToBottom();
                index++;
              }, 100);
            } else {
              _this.showToast(d.msg);
            }
          },
          complete: (res) => {
            // console.log('complete', res);
            uni.hideLoading();
            _this.btnTxt = '发送';
            _this.isSend = false;
          }
        });
      },
      //通用提示封装
      showToast(title) {
        uni.showToast({
          title: title,
          icon: 'none',
          duration: 2000
        });
      },
      //实现自动滚动到最底部
      scrollToBottom() {
        _this.$nextTick(() => {
          uni.createSelectorQuery().in(_this).select('#scroll-view-content').
          boundingClientRect(res => {
            let top = res.height - _this.scrollViewHeight;
            if (top > 0) {
              _this.scrollTop = top;
            }
          }).exec();
        })
      }
    }
  }
</script>

<style lang="scss">
  .content {
    .msg-list {
      padding: 0px 12px;

      .msg-item:last-child {
        padding-bottom: 10px;
      }

      .msg-item {
        padding-top: 10px;
        text-align: left;
        display: flex;

        .img_1 {
          width: 36px;
          height: 36px;
          margin-right: 8px;
        }

        .img_2 {
          width: 36px;
          height: 36px;
          margin-left: 8px;
        }

        .msg {
          padding: 8px 15px;
          font-size: 14px;
          color: #303133;
          border-radius: 10rpx;
          box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
        }
      }
    }

    .footer {
      width: 100%;
      border-top: 1px solid #ddd;
      background-color: #F5F5F5;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      box-sizing: border-box;

      .txt {
        flex: 1;
        height: 40px;
        padding: 5px;
        border-radius: 5px;
        box-sizing: border-box;
        border: none;
        outline: none;
      }

      .btn {
        width: 82px;
        height: 40px;
        line-height: 40px;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
      }
    }
  }
</style>