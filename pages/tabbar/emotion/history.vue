<template>
    <view class="container">
      <!-- 添加状态栏占位 -->
      <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
      
      <!-- 历史记录列表 -->
      <view class="history-list">
        <view v-for="item in historyData" 
              :key="item.id" 
              :class="['history-item', getItemEmotionClass(item)]">
          <!-- 头部：显示时间和公开/隐藏状态 -->
          <view class="item-header">
            <view class="time">{{ formatDate(item.created_at) }}</view>
            <view class="toggle-public" 
                  @click="togglePublic(item.id)"
                  :class="{'public': item.is_public}">
              <text class="iconfont icon-public" v-if="item.is_public"></text>
              <text class="iconfont icon-private" v-else></text>
            </view>
          </view>
          
          <!-- 内容区域 -->
          <view class="item-content" @click="showCommentDialog(item)">
            <text class="original-text">{{ item.original_text }}</text>
            
            <!-- 情感分析结果 -->
            <view class="emotion-analysis">
              <view 
                v-for="(value, emotion) in item.emotion_result.percentage" 
                :key="emotion" 
                class="emotion-item"
              >
                <text class="emotion-name">{{ emotion }}</text>
                <view class="emotion-bar">
                  <view 
                    class="emotion-progress" 
                    :style="{ width: value + '%' }"
                  ></view>
                </view>
              </view>
            </view>
            
            <view :class="['emotion-tag', getItemEmotionClass(item)]">
              {{ item.emotion_result.category }}
            </view>
          </view>

          <!-- 交互区域 -->
          <view class="interaction">
            <!-- 新增锁定状态图标，位于最左侧 -->
            <view class="action-btn lock-icon" @click.stop="togglePublic(item.id)">
              <text class="iconfont" :class="{ 'icon-unlock': item.is_public, 'icon-lock': !item.is_public }"></text>
            </view>
            
            <!-- 点赞按钮 -->
            <view 
              class="action-btn" 
              :class="{'active': item.liked}"
              @click.stop="handleLike(item)"
            >
              <text class="iconfont icon-like like-icon">&#xe601;</text>
              <text class="count">{{ item.like_count }}</text>
            </view>
            
            <!-- 评论按钮 -->
            <view 
              class="action-btn" 
              @click.stop="showCommentDialog(item)"
            >
              <text class="iconfont icon-pinglun"></text>
              <text class="count comment-count">{{ item.comment_count }}</text>
            </view>
          </view>
        </view>
      </view>
      <!-- 加载更多组件 -->
      <uni-load-more :status="loadMoreStatus" @clickLoadMore="loadMore" />

      <!-- 评论弹窗 -->
      <uni-popup ref="commentPopup" type="bottom">
        <view class="comment-popup">
          <view class="comment-header">
            <text>评论列表</text>
            <text class="close-btn" @click="closeCommentDialog">×</text>
          </view>
          
          <!-- 评论列表 -->
          <scroll-view 
            class="comment-list" 
            scroll-y 
            @scrolltolower="loadMoreComments"
          >
            <view v-if="commentList.length > 0">
              <view 
                v-for="comment in commentList" 
                :key="comment.id" 
                class="comment-item"
              >
                <view class="comment-user">
                  <view class="user-avatar">
                    <image 
                      v-if="comment.user && comment.user.avatar" 
                      :src="comment.user.avatar" 
                      mode="aspectFill"
                    />
                    <text v-else class="iconfont default-avatar">&#xe83e;</text>
                  </view>
                  <view class="user-info">
                    <view class="user-header">
                      <text class="user-name">
                        {{ comment.user ? comment.user.nickname : '匿名用户' }}
                        <text v-if="comment.user && comment.user.is_anonymous" class="anonymous-tag">
                          匿名
                        </text>
                      </text>
                      <text class="comment-time">{{ formatTime(comment.created_at) }}</text>
                    </view>
                    <view class="comment-content">{{ comment.content }}</view>
                  </view>
                </view>
              </view>
            </view>
            <view v-else class="no-comment">
              暂无评论
            </view>
            <view v-if="isLoadingMore" class="loading-more">
              加载中...
            </view>
          </scroll-view>
          
          <!-- 评论输入区域 -->
          <view class="comment-input-area">
            <textarea 
              v-model="commentContent"
              placeholder="请输入评论内容"
              :maxlength="200"
              class="comment-textarea"
              auto-height
            />
            <view class="comment-footer">
              <text class="word-count">{{ commentContent.length }}/200</text>
              <button 
                class="submit-btn" 
                @click="submitComment" 
                :disabled="!commentContent.trim()"
              >
                发送
              </button>
            </view>
          </view>
        </view>
      </uni-popup>
    </view>
  </template>
  
  <script>
  import { 
    getEmotionHistory, 
    toggleLike,
    toggleEmotionPublic, 
    deleteEmotion,
    addComment,
    getCommentList
  } from "@/api/emotion";
  export default {
    data() {
      return {
        statusBarHeight: 0, // 添加状态栏高度变量
        historyData: [], // 吐槽记录数组
        page: 1,
        pageSize: 10,
        totalPages: 1,
        loadMoreStatus: "more", // 控制加载状态：more-加载前，loading-加载中，noMore-没有更多
        emotionCategories: {
          "快乐": "积极",
          "期待": "积极",
          "信任": "积极",
          "爱": "积极",
          "骄傲": "积极",
          "希望": "积极",
          "兴奋": "积极",
          "满足": "积极",
          "惊讶": "中性",
          "平静": "中性",
          "好奇": "中性",
          "淡定": "中性",
          "困惑": "中性",
          "悲伤": "消极",
          "愤怒": "消极",
          "恐惧": "消极",
          "厌恶": "消极",
          "焦虑": "消极",
          "失望": "消极",
          "嫉妒": "消极",
          "羞愧": "消极",
          "内疚": "消极",
          "孤独": "消极"
        },
        commentContent: '',
        currentEmotionId: null,
        commentList: [],
        commentPage: 1,
        commentPageSize: 10,
        totalCommentPages: 1,
        isLoadingMore: false
      };
    },
    computed: {
      getItemEmotionClass() {
        return (item) => {
          const mainEmotion = Object.entries(item.emotion_result.percentage)
            .sort(([,a], [,b]) => b - a)[0][0];
          const category = this.emotionCategories[mainEmotion];
          
          switch(category) {
            case "积极": return "positive";
            case "消极": return "negative";
            default: return "neutral";
          }
        }
      },
      lockIconClass() {
        return (isPublic) => ({
          'icon-unlock': isPublic,
          'icon-lock': !isPublic
        });
      }
    },
    created() {
      // 获取系统状态栏高度
      const systemInfo = uni.getSystemInfoSync();
      this.statusBarHeight = systemInfo.statusBarHeight || 20;
    },
    onShow() {
      this.init();
    },
    methods: {
      // 初始化页面
      init() {
        this.page = 1;
        this.historyData = [];
        this.fetchHistory();
      },
      // 调用后端接口获取历史记录
      fetchHistory() {
        getEmotionHistory(
          this.page, 
          this.pageSize,
          (res) => {
            const data = res.data;
            this.totalPages = data.total_pages;
            this.historyData = this.historyData.concat(data.data);
            this.historyData.sort((a, b) => b.created_at - a.created_at);
            
            // 更新加载状态
            if (this.page >= this.totalPages) {
              this.loadMoreStatus = "noMore";
            } else {
              this.loadMoreStatus = "more";
            }
          },
          (error) => {
            this.$u.toast(error.message || "获取历史记录失败");
            this.loadMoreStatus = "more";
          }
        );
      },
      // 上拉加载更多
      loadMore() {
        if (this.loadMoreStatus === "loading") return;
        
        if (this.page < this.totalPages) {
          this.loadMoreStatus = "loading";
          this.page += 1;
          this.fetchHistory();
        } else {
          this.loadMoreStatus = "noMore";
        }
      },
      // 处理点赞
      handleLike(item) {
        toggleLike(
          item.id,
          (res) => {
            // 刷新当前页数据
            this.refreshCurrentPage()
          },
          (error) => {
            this.$u.toast(error.message || "操作失败")
          }
        )
      },
      // 显示评论弹窗
      showCommentDialog(item) {
        this.currentEmotionId = item.id
        this.commentContent = ''
        this.commentList = []
        this.commentPage = 1
        this.loadComments()
        this.$refs.commentPopup.open()
      },
      // 关闭评论弹窗
      closeCommentDialog() {
        this.$refs.commentPopup.close()
        this.commentContent = ''
        this.currentEmotionId = null
      },
      // 加载评论
      loadComments() {
        if (this.isLoadingMore) return
        
        this.isLoadingMore = true
        getCommentList(
          this.currentEmotionId,
          this.commentPage,
          this.commentPageSize,
          (res) => {
            const data = res.data
            if (this.commentPage === 1) {
              this.commentList = data.data
            } else {
              this.commentList = [...this.commentList, ...data.data]
            }
            this.totalCommentPages = data.total_pages
            this.isLoadingMore = false
          },
          (error) => {
            this.$u.toast(error.message)
            this.isLoadingMore = false
          }
        )
      },
      // 加载更多评论
      loadMoreComments() {
        if (this.commentPage >= this.totalCommentPages) return
        this.commentPage++
        this.loadComments()
      },
      // 提交评论
      submitComment() {
        if (!this.commentContent.trim()) return
        
        addComment(
          this.currentEmotionId,
          this.commentContent,
          () => {
            this.$u.toast('评论成功')
            this.commentContent = ''
            this.commentPage = 1
            this.loadComments()
            this.refreshCurrentPage()
          },
          (error) => {
            this.$u.toast(error.message)
          }
        )
      },
      // 刷新当前页数据
      refreshCurrentPage() {
        getEmotionHistory(
          this.page,
          this.pageSize,
          (res) => {
            const data = res.data
            // 更新当前页数据
            this.historyData = data.data
            this.totalPages = data.total_pages
          },
          (error) => {
            this.$u.toast(error.message || "刷新数据失败")
          }
        )
      },
      // 切换公开/隐藏状态
      togglePublic(id) {
        toggleEmotionPublic(
          id,
          (res) => {
            const item = this.historyData.find((item) => item.id === id);
            if (item) {
              item.is_public = !item.is_public;
            }
          },
          (error) => {
            this.$u.toast(error.message || "操作失败");
          }
        );
      },
      // 删除记录
      deleteItem(id) {
        uni.showModal({
          title: "确认删除",
          content: "确定要删除这条吐槽吗？",
          success: (res) => {
            if (res.confirm) {
              deleteEmotion(
                id,
                (res) => {
                  this.historyData = this.historyData.filter((item) => item.id !== id);
                  this.$u.toast("删除成功");
                },
                (error) => {
                  this.$u.toast(error.message || "删除失败");
                }
              );
            }
          },
        });
      },
      // 格式化时间戳（接口返回的 created_at 单位为秒）
      formatDate(timestamp) {
        const date = new Date(timestamp * 1000);
        const Y = date.getFullYear();
        const M = ('0' + (date.getMonth() + 1)).slice(-2);
        const D = ('0' + date.getDate()).slice(-2);
        const h = ('0' + date.getHours()).slice(-2);
        const m = ('0' + date.getMinutes()).slice(-2);
        const s = ('0' + date.getSeconds()).slice(-2);
        return `${Y}-${M}-${D} ${h}:${m}:${s}`;
      },
      // 格式化时间
      formatTime(timestamp) {
        const date = new Date(timestamp * 1000)
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
      }
    },
  };
  </script>
  
  <style lang="scss" scoped>
  /* 在线链接服务仅供平台体验和调试使用，平台不承诺服务的稳定性，企业客户需下载字体包自行发布使用并做好备份。 */
  @font-face {
    font-family: 'iconfont';  /* Project id 4812679 */
    src: url('//at.alicdn.com/t/c/font_4812679_566p0028xv6.woff2?t=1738932749046') format('woff2'),
        url('//at.alicdn.com/t/c/font_4812679_566p0028xv6.woff?t=1738932749046') format('woff'),
        url('//at.alicdn.com/t/c/font_4812679_566p0028xv6.ttf?t=1738932749046') format('truetype');
  }
  .container {
    min-height: 100vh;
    background: linear-gradient(180deg, #2c2c4c 0%, #1a1b2f 100%);
    color: #fff;
  }

  // 添加状态栏样式
  .status-bar {
    width: 100%;
    background: transparent;
  }

  .history-list {
    padding: 20rpx;
  }

  .history-item {
    margin-bottom: 30rpx;
    border-radius: 16rpx;
    padding: 24rpx;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    
    &.positive {
      background: rgba(255, 166, 0, 0.1);
      border-left: 6rpx solid #ffa600;
      
      .emotion-progress {
        background: #ffa600;
      }
    }
    
    &.negative {
      background: rgba(100, 149, 237, 0.1);
      border-left: 6rpx solid #6495ed;
      
      .emotion-progress {
        background: #6495ed;
      }
    }
    
    &.neutral {
      background: rgba(255, 255, 255, 0.1);
      border-left: 6rpx solid #999;
      
      .emotion-progress {
        background: #999;
      }
    }
  }

  .item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16rpx;
    
    .time {
      font-size: 24rpx;
      color: rgba(255, 255, 255, 0.6);
    }
    
    .toggle-public {
      padding: 4rpx 12rpx;
      border-radius: 20rpx;
      font-size: 24rpx;
      color: rgba(255, 255, 255, 0.6);
      
      &.public {
        color: #ffa600;
      }
    }
  }

  .item-content {
    margin-bottom: 20rpx;
    
    .original-text {
      font-size: 28rpx;
      color: #fff;
      line-height: 1.6;
      margin-bottom: 16rpx;
    }
    
    .emotion-analysis {
      margin: 16rpx 0;
      
      .emotion-item {
        display: flex;
        align-items: center;
        margin-bottom: 8rpx;
        
        .emotion-name {
          width: 80rpx;
          font-size: 24rpx;
          color: rgba(255, 255, 255, 0.8);
        }
        
        .emotion-bar {
          flex: 1;
          height: 6rpx;
          background: rgba(255, 255, 255, 0.1);
          margin-left: 16rpx;
          border-radius: 3rpx;
          overflow: hidden;
          
          .emotion-progress {
            height: 100%;
            transition: width 0.3s ease;
          }
        }
      }
    }
    
    .emotion-tag {
      display: inline-block;
      padding: 4rpx 16rpx;
      border-radius: 20rpx;
      font-size: 24rpx;
      
      &.positive {
        background: rgba(255, 166, 0, 0.2);
        color: #ffa600;
      }
      
      &.negative {
        background: rgba(100, 149, 237, 0.2);
        color: #6495ed;
      }
      
      &.neutral {
        background: rgba(255, 255, 255, 0.1);
        color: #999;
      }
    }
  }

  .interaction {
    display: flex;
    padding-top: 16rpx;
    margin-top: 16rpx;
    border-top: 1rpx solid rgba(255, 255, 255, 0.1);
    
    .action-btn {
      display: flex;
      align-items: center;
      margin-right: 32rpx;
      padding: 4rpx 8rpx;
      border-radius: 8rpx;
      transition: all 0.2s;
      
      .like-icon {
        font-size: 32rpx;
        margin-right: 8rpx;
        color: #ff5151 !important;
        opacity: 0.6;
      }
      
      .iconfont {
        font-size: 32rpx;
        margin-right: 12rpx;
      }
      
      .count {
        font-size: 24rpx;
        color: #8a8a8a;
        
        &.comment-count {
          margin-left: 4rpx;
        }
      }
      
      &.active {
        .like-icon {
          opacity: 1;
        }
        .count {
          color: #ff5151;
        }
      }
      
      &:active {
        opacity: 0.8;
      }
    }
  }

  .icon-dianzan:before {
    content: "\e651";
  }

  .icon-cai:before {
    content: "\e61d";
  }

  .icon-pinglun:before {
    content: "\e62c";
  }

  .icon-shanchu:before {
    content: "\e6b4";
  }

  .comment-popup {
    background-color: #fff;
    border-radius: 24rpx 24rpx 0 0;
    padding: 30rpx;
    height: 80vh;
    display: flex;
    flex-direction: column;
    
    .comment-header {
      padding-bottom: 20rpx;
      border-bottom: 1rpx solid #eee;
      font-size: 32rpx;
      font-weight: 500;
    }
    
    .comment-list {
      flex: 1;
      padding: 20rpx 0;
      
      .comment-item {
        padding: 20rpx;
        border-bottom: 1rpx solid #f5f5f5;
        
        .comment-user {
          display: flex;
          align-items: flex-start;
          
          .user-avatar {
            width: 64rpx;
            height: 64rpx;
            border-radius: 50%;
            margin-right: 16rpx;
            background-color: #f5f5f5;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
            
            image {
              width: 100%;
              height: 100%;
            }
            
            .default-avatar {
              font-size: 40rpx;
              color: #999;
            }
          }
          
          .user-info {
            flex: 1;
            
            .user-header {
              display: flex;
              align-items: center;
              margin-bottom: 8rpx;
              
              .user-name {
                font-size: 28rpx;
                color: #333;
                margin-right: 12rpx;
                
                .anonymous-tag {
                  font-size: 20rpx;
                  color: #999;
                  background-color: #f5f5f5;
                  padding: 2rpx 8rpx;
                  border-radius: 4rpx;
                  margin-left: 8rpx;
                }
              }
              
              .comment-time {
                font-size: 24rpx;
                color: #999;
              }
            }
            
            .comment-content {
              font-size: 28rpx;
              color: #333;
              line-height: 1.5;
              word-break: break-all;
            }
          }
        }
      }
      
      .no-comment {
        text-align: center;
        color: #999;
        padding: 40rpx 0;
      }
      
      .loading-more {
        text-align: center;
        color: #999;
        padding: 20rpx 0;
      }
    }
    
    .comment-input-area {
      border-top: 1rpx solid #eee;
      padding: 20rpx 0;
      
      .comment-textarea {
        width: 100%;
        min-height: 80rpx;
        background: #f8f8f8;
        border-radius: 12rpx;
        padding: 16rpx 20rpx;
        font-size: 28rpx;
        color: #333;
        margin-bottom: 16rpx;
      }
      
      .comment-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 10rpx;
        
        .word-count {
          color: #999;
          font-size: 24rpx;
        }
        
        .submit-btn {
          margin: 0;
          padding: 0 30rpx;
          height: 64rpx;
          line-height: 64rpx;
          font-size: 28rpx;
          color: #fff;
          background: #007AFF;
          border-radius: 32rpx;
          border: none;
          
          &:disabled {
            background: #ccc;
          }
          
          &::after {
            border: none;
          }
          
          &:active {
            opacity: 0.8;
          }
        }
      }
    }
  }

  .iconfont {
    font-family: "iconfont" !important;
  }

  /* 修正图标样式 */
  .icon-lock:before {
    content: "\e602"; // 锁定图标编码
  }

  .icon-unlock:before {
    content: "\e882"; // 解锁图标编码
  }
  </style>