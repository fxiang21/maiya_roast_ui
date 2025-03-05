<template>
    <view class="container">
      <!-- 添加状态栏占位 -->
      <view class="status-bar" :style="{ height: statusBarHeight + 'px' }"></view>
      
      <!-- 空状态提示 -->
      <view v-if="showEmptyState" class="empty-state">
        <view class="empty-content">
          <!-- 图标和主要提示文字 -->
          <view class="main-empty">
            <!-- <view class="iconfont icon-empty"></view> -->
            <view class="empty-text">
              <text class="highlight">好</text>与<text class="highlight">不好</text>，
              <text class="brand-text">黑洞吐槽</text>
            </view>
          </view>
          
          <!-- 添加鼓励性的随机提示语 -->
          <view class="encouragement">
            <text class="tip">{{ randomTip }}</text>
          </view>
          
          <!-- 操作按钮 -->
          <button class="goto-emotion-btn" @tap="navigateToEmotion">
            <text class="iconfont icon-edit"></text>
            去吐槽
          </button>
        </view>
      </view>
      
      <!-- 历史记录列表 -->
      <view v-else class="history-list">
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
              <text class="count">{{ item.likes_count }}</text>
            </view>
            
            <!-- 评论按钮 -->
            <view 
              class="action-btn" 
              @click.stop="showCommentDialog(item)"
            >
              <text class="iconfont icon-pinglun"></text>
              <text class="count comment-count">{{ item.comments_count }}</text>
            </view>
          </view>
        </view>
      </view>
      <!-- 加载更多组件 -->
      <uni-load-more 
        v-if="!showEmptyState && historyData.length > 0"
        :status="loadMoreStatus" 
        @clickLoadMore="loadMore" 
      />

      <!-- 评论弹窗 - 使用遮罩层阻止事件穿透 -->
      <view class="comment-overlay" v-if="showCommentPopup" @tap.stop="closeCommentDialog" @touchmove.stop.prevent>
        <view class="comment-container" @tap.stop="onCommentContainerTap">
          <view class="comment-header">
            <text class="header-title">评论列表 ({{ totalComments || 0 }})</text>
            <text class="close-btn" @tap="closeCommentDialog">×</text>
          </view>
          
          <!-- 评论列表 -->
          <scroll-view 
            class="comment-list" 
            scroll-y 
            @scrolltolower="loadMoreComments"
            :scroll-top="scrollTop"
            @touchmove.stop
          >
            <view v-if="commentList && commentList.length > 0">
              <view 
                v-for="(comment, index) in commentList" 
                :key="index" 
                class="comment-item"
              >
                <!-- 头像 -->
                <view class="avatar-container">
                  <image 
                    v-if="comment.user && comment.user.avatar" 
                    :src="comment.user.avatar" 
                    class="user-avatar"
                    mode="aspectFill"
                  />
                  <view v-else class="default-avatar">
                    <text class="avatar-text">匿</text>
                  </view>
                </view>
                
                <!-- 评论内容区 -->
                <view class="comment-content-container">
                  <!-- 用户信息行 -->
                  <view class="user-info-row">
                    <text class="user-name">{{ comment.user ? comment.user.nickname || '匿名用户' : '匿名用户' }}</text>
                    <view class="comment-meta">
                      <text class="comment-time" v-if="comment.created_at">{{ formatTimeAgo(comment.created_at * 1000) }}</text>
                      <text class="user-location" v-if="comment.user && comment.user.location">{{ comment.user.location }}</text>
                    </view>
                  </view>
                  
                  <!-- 评论内容 -->
                  <view class="comment-text">{{ comment.content }}</view>
                  
                  <!-- 操作按钮 -->
                  <!-- <view class="comment-actions">
                    <view class="action-btn">
                      <text class="action-text">回复</text>
                    </view>
                    <view class="like-btn">
                      <text class="iconfont icon-like"></text>
                      <text class="like-count" v-if="comment.like_count">{{ comment.like_count }}</text>
                    </view>
                  </view> -->
                </view>
              </view>
            </view>
            <view v-else class="no-comment">
              暂无评论
            </view>
            <view v-if="isLoadingMore && !isAllLoaded" class="loading-more">
              加载中...
            </view>
            <view v-if="isAllLoaded && commentList.length > 0" class="all-loaded">
              已加载全部评论
            </view>
          </scroll-view>
          
          <!-- 评论输入区域 -->
          <view class="comment-input-area" :class="{ 'expanded': isInputFocused }">
            <view class="input-wrapper" @tap.stop="onInputTap">
              <input
                class="comment-input"
                v-model="commentText"
                placeholder="添加评论..."
                :maxlength="200"
                @focus="onInputFocus"
                @blur="onInputBlur"
                confirm-type="send"
                @confirm="submitComment"
              />
              
              <view class="comment-footer" v-if="isInputFocused">
                <text class="word-count">{{ commentText.length }}/200</text>
                <button 
                  class="submit-btn" 
                  :disabled="!commentText.trim() || isSubmitting" 
                  @tap="submitComment"
                >
                  {{ isSubmitting ? '发送中...' : '发送' }}
                </button>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </template>
  
  <script>
  import { 
    getEmotionHistory, 
    toggleLike,
    toggleEmotionPublic, 
    deleteEmotion,
    getCommentList,
    addComment
  } from "@/api/emotion";
  export default {
    data() {
      return {
        statusBarHeight: 0, // 添加状态栏高度变量
        historyData: [], // 历史数据数组
        page: 1,
        pageSize: 10,
        totalPages: 1,
        loadMoreStatus: "more",
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
        commentText: '',
        currentEmotionId: null,
        commentList: [],
        commentPage: 1,
        commentPageSize: 20,
        totalCommentPages: 1,
        isLoadingMore: false,
        isLoading: false, // 添加加载状态标记
        tips: [
          "今天想说点什么呢？",
          "有什么开心或不开心的事要分享吗？",
          "倾诉是一种治愈，书写是一种释放",
          "记录下此刻的心情吧",
          "让黑洞听听你的故事"
        ],
        currentRequest: null,
        isSubmitting: false,
        isInputFocused: false,
        currentComplaintId: null,
        totalComments: 0,
        scrollTop: 0,
        showCommentPopup: false,
        isAllLoaded: false,
        inputFocusTimer: null, // 添加一个计时器变量
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
      },
      showEmptyState() {
        return Array.isArray(this.historyData) && this.historyData.length === 0 && !this.isLoading
      },
      randomTip() {
        return this.tips[Math.floor(Math.random() * this.tips.length)];
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
        this.abortRequests();
        this.page = 1
        this.historyData = []
        this.loadMoreStatus = "more"
        this.isLoading = false
        this.fetchHistory()
      },
      // 获取历史数据
      async fetchHistory() {
        if (this.isLoading) return
        
        this.isLoading = true
        this.loadMoreStatus = "loading"

        getEmotionHistory(
          this.page,
          this.pageSize,
          async (res) => {
            try {
              const data = res.data

              if (this.page === 1) {
                this.historyData = data.data || []
              } else {
                this.historyData = [...this.historyData, ...(data.data || [])]
              }
              
              this.totalPages = data.total_pages
              this.loadMoreStatus = this.page >= this.totalPages ? "noMore" : "more"
              this.isLoading = false
            } catch (error) {
              this.$u.toast("处理历史记录数据失败")
              this.isLoading = false
            }
          },
          (error) => {
            console.error('Error fetching history:', error)
            this.loadMoreStatus = "more"
            this.isLoading = false
            // 只在错误时显示提示
            this.$u.toast(error.message || "获取历史记录失败")
          }
        )
      },
      // 加载更多
      loadMore() {
        if (this.loadMoreStatus === "loading" || this.loadMoreStatus === "noMore") {
          return
        }
        
        if (this.page < this.totalPages) {
          this.page += 1
          this.fetchHistory()
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
        this.commentText = ''
        this.commentList = []
        this.commentPage = 1
        this.loadComments()
        this.showCommentPopup = true
      },
      // 关闭评论弹窗
      closeCommentDialog() {
        this.showCommentPopup = false
        this.commentText = ''
        this.isInputFocused = false
        this.preventBlur = false
        
        // 清除计时器
        if (this.inputFocusTimer) {
          clearTimeout(this.inputFocusTimer)
          this.inputFocusTimer = null
        }
      },
      // 加载评论
      loadComments() {
        if (this.isLoading || !this.currentEmotionId) return;
        
        this.isLoading = true;
        console.log("加载评论，ID：", this.currentEmotionId, "页码：", this.commentPage);
        
        getCommentList(
          this.currentEmotionId,
          this.commentPage,
          this.commentPageSize,
          (response) => {
            console.log("评论加载成功，原始数据:", response);
            
            // 正确处理返回数据
            if (response && response.data) {
              // 检查数据结构
              let commentData = response.data.data || response.data || [];
              let total = response.data.total || 0;
              let totalPages = response.data.total_pages || 1;
              
              console.log("处理后的评论数据:", commentData);
              
              if (Array.isArray(commentData)) {
                if (this.commentPage === 1) {
                  this.commentList = commentData;
                } else {
                  this.commentList = [...this.commentList, ...commentData];
                }
                
                this.totalComments = total;
                this.totalCommentPages = totalPages;
                this.isAllLoaded = this.commentPage >= this.totalCommentPages;
              } else {
                console.error("评论数据格式不正确:", commentData);
              }
            }
            
            this.isLoading = false;
            this.isLoadingMore = false;
          },
          (error) => {
            console.error("加载评论失败:", error);
            uni.showToast({
              title: '加载评论失败',
              icon: 'none'
            });
            
            this.isLoading = false;
            this.isLoadingMore = false;
          }
        );
      },
      // 加载更多评论
      loadMoreComments() {
        if (this.isLoading || this.isAllLoaded) return;
        
        console.log("加载更多评论，当前页码：", this.commentPage, "总页数：", this.totalCommentPages);
        if (this.commentPage < this.totalCommentPages) {
          this.commentPage++;
          this.isLoadingMore = true;
          this.loadComments();
        }
      },
      // 提交评论
      submitComment() {
        if (!this.commentText.trim() || this.isSubmitting || !this.currentEmotionId) return;
        
        this.isSubmitting = true;
        this.preventBlur = true; // 防止提交过程中失焦
        
        console.log("提交评论，ID：", this.currentEmotionId, "内容：", this.commentText);
        
        addComment(
          this.currentEmotionId,
          this.commentText.trim(),
          (response) => {
            console.log("评论提交成功:", response);
            
            uni.showToast({
              title: '评论发送成功',
              icon: 'success'
            });
            
            // 清空输入框并重新加载评论列表
            this.commentText = '';
            this.commentPage = 1;
            this.isAllLoaded = false;
            this.scrollTop = 0; // 滚动到顶部
            this.loadComments();
            
            this.isSubmitting = false;
          },
          (error) => {
            console.error("提交评论失败:", error);
            uni.showToast({
              title: '提交评论失败: ' + (error.message || '未知错误'),
              icon: 'none'
            });
            
            this.isSubmitting = false;
          }
        );
      },
      // 重置输入框焦点
      resetInputFocus() {
        if (this.isInputFocused && !this.commentText.trim()) {
          this.isInputFocused = false;
          console.log('重置输入框状态');
        }
      },
      // 修复时间格式化函数
      formatTimeAgo(timestamp) {
        if (!timestamp) return '';
        
        try {
          const now = new Date();
          const commentTime = new Date(timestamp);
          
          // 检查时间戳是否有效
          if (isNaN(commentTime.getTime())) {
            console.log('无效的时间戳:', timestamp);
            return '';
          }
          
          const diffMs = now - commentTime;
          
          // 将毫秒转换为秒
          const diffSec = Math.floor(diffMs / 1000);
          
          if (diffSec < 60) return '刚刚';
          if (diffSec < 3600) return Math.floor(diffSec / 60) + '分钟前';
          if (diffSec < 86400) return Math.floor(diffSec / 3600) + '小时前';
          if (diffSec < 2592000) return Math.floor(diffSec / 86400) + '天前';
          if (diffSec < 31536000) return Math.floor(diffSec / 2592000) + '个月前';
          return Math.floor(diffSec / 31536000) + '年前';
        } catch (error) {
          console.error('格式化时间出错:', error);
          return '';
        }
      },
      // 刷新方法
      refresh() {
        this.init()
      },
      // 跳转到吐槽页面
      navigateToEmotion() {
        uni.switchTab({
          url: '/pages/tabbar/emotion/home'
        })
      },
      abortRequests() {
        if (this.currentRequest) {
          this.currentRequest.abort();
          this.currentRequest = null;
        }
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
      // 重写输入框点击方法，简化逻辑
      onInputTap() {
        console.log('点击输入框');
        this.isInputFocused = true;
        
        // 延迟执行，确保状态已更新
        setTimeout(() => {
          // 使用微信小程序原生API直接聚焦
          const query = uni.createSelectorQuery().in(this);
          query.select('.comment-input').context((res) => {
            if (res && res.context) {
              console.log('获取输入框成功，设置焦点');
              res.context.focus();
            }
          }).exec();
        }, 50);
      },
      // 简化输入框焦点事件处理
      onInputFocus(e) {
        console.log('输入框获得焦点');
        this.isInputFocused = true;
        this.preventBlur = true; // 阻止立即失焦
      },
      
      onInputBlur(e) {
        console.log('输入框失去焦点');
        
        // 如果是由于提交或其他操作导致的失焦，不处理
        if (this.preventBlur) {
          console.log('阻止失焦操作');
          // 设置短暂延时后重置阻止标志
          setTimeout(() => {
            this.preventBlur = false;
          }, 300);
          return;
        }
        
        // 延迟处理失焦事件
        setTimeout(() => {
          if (!this.isSubmitting) {
            this.isInputFocused = false;
          }
        }, 200);
      },
      // 在模板中点击评论区容器时
      onCommentContainerTap() {
        // 点击评论容器时，不关闭评论框
        console.log('点击评论容器');
      },
      // 修复上拉加载更多方法
      onReachBottom() {
        console.log('触发上拉加载更多');
        
        // 如果已经加载所有页或正在加载中，则不处理
        if (this.isLoading || this.page >= this.totalPages) {
          console.log('已加载全部数据或正在加载中，跳过请求');
          return;
        }
        
        // 设置加载状态
        this.isLoading = true;
        
        // 页码加1
        this.page++;
        
        console.log(`加载第${this.page}页数据`);
        
        // 调用API获取更多数据
        getEmotionHistory(
          this.page,
          this.pageSize,
          (res) => {
            const data = res.data;
            
            // 将新数据添加到现有数据中
            this.historyData = [...this.historyData, ...data.data];
            this.totalPages = data.total_pages;
            
            // 如果当前页 >= 总页数，标记为已加载所有数据
            if (this.page >= this.totalPages) {
              this.isAllLoaded = true;
            }
            
            this.isLoading = false;
            console.log(`成功加载第${this.page}页数据`);
          },
          (error) => {
            console.error('加载更多数据失败:', error);
            this.$u.toast(error.message || "加载更多失败");
            this.isLoading = false;
            // 页码回退，以便下次重试
            this.page--;
          }
        );
      },
      // 添加滚动到底部事件处理(可能需要这个作为备用方案)
      onScrollToLower() {
        console.log('滚动到底部');
        this.onReachBottom();
      },
    },
  };
  </script>
  
  <style lang="scss" scoped>
// /* 在线链接服务仅供平台体验和调试使用，平台不承诺服务的稳定性，企业客户需下载字体包自行发布使用并做好备份。 */
// @font-face {
//   font-family: 'iconfont';  /* Project id 4812679 */
//   src: url('//at.alicdn.com/t/c/font_4812679_5fx7dxqo6ur.woff2?t=1739504210268') format('woff2'),
//        url('//at.alicdn.com/t/c/font_4812679_5fx7dxqo6ur.woff?t=1739504210268') format('woff'),
//        url('//at.alicdn.com/t/c/font_4812679_5fx7dxqo6ur.ttf?t=1739504210268') format('truetype');
// }
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

  .comment-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.7);
    z-index: 9999;
    display: flex;
    justify-content: center;
    align-items: flex-end;
  }

  .comment-container {
    width: 100%;
    height: 60vh;
    background-color: #1a1a1a;
    border-radius: 24rpx 24rpx 0 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    box-shadow: 0 -4rpx 24rpx rgba(0, 0, 0, 0.3);
  }

  .comment-header {
    padding: 24rpx 30rpx;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1rpx solid rgba(255, 255, 255, 0.1);
  }

  .header-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #ffffff;
    letter-spacing: 1rpx;
  }

  .close-btn {
    font-size: 48rpx;
    color: rgba(255, 255, 255, 0.8);
    line-height: 1;
    padding: 0 20rpx;
  }

  .comment-list {
    flex: 1;
    overflow-y: scroll;
    padding: 0 30rpx;
  }

  .comment-item {
    display: flex;
    padding: 24rpx 0;
    /* 移除评论之间的分隔线 */
  }

  .avatar-container {
    margin-right: 20rpx;
    flex-shrink: 0;
  }

  .user-avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background-color: #f0f0f0;
    border: 2rpx solid rgba(255, 255, 255, 0.2);
  }

  .default-avatar {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
  }

  .avatar-text {
    color: #ffffff;
    font-size: 32rpx;
    font-weight: 500;
  }

  .comment-content-container {
    flex: 1;
    overflow: hidden;
  }

  .user-info-row {
    display: flex;
    align-items: baseline;
    flex-wrap: wrap;
    margin-bottom: 8rpx;
  }

  .user-name {
    font-size: 24rpx;  /* 减小用户名字体 */
    color: rgba(255, 255, 255, 0.7);  /* 降低亮度 */
    font-weight: normal;  /* 移除粗体 */
    margin-right: 12rpx;
  }

  .comment-meta {
    font-size: 22rpx;  /* 减小元数据字体 */
    color: rgba(255, 255, 255, 0.5);  /* 进一步降低亮度 */
    display: flex;
    align-items: center;
  }

  .comment-time {
    margin-right: 12rpx;
  }

  .user-location {
    margin-left: 6rpx;
    font-style: italic;
  }

  .comment-text {
    font-size: 28rpx;  /* 保持评论内容字体大小 */
    color: rgba(255, 255, 255, 0.95);  /* 提高亮度，突出内容 */
    line-height: 1.6;
    margin-bottom: 12rpx;
    word-break: break-all;
    letter-spacing: 0.5rpx;
    font-weight: 400;  /* 适当加粗，提高可读性 */
  }

  .comment-actions {
    display: flex;
    align-items: center;
    margin-top: 8rpx;
  }

  .action-btn, .like-btn {
    margin-right: 32rpx;
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.6);
    display: flex;
    align-items: center;
  }

  .action-text {
    font-size: 26rpx;
  }

  .like-btn {
    display: flex;
    align-items: center;
  }

  .icon-like {
    font-size: 28rpx;
    margin-right: 8rpx;
  }

  .like-count {
    font-size: 26rpx;
  }

  .no-comment {
    text-align: center;
    padding: 60rpx 0;
    color: rgba(255, 255, 255, 0.5);
    font-size: 28rpx;
    font-style: italic;
  }

  .loading-more, .all-loaded {
    text-align: center;
    padding: 20rpx 0;
    color: rgba(255, 255, 255, 0.4);
    font-size: 24rpx;
  }

  /* 输入框样式优化 */
  .comment-input-area {
    padding: 20rpx 30rpx;
    /* 移除评论区和输入框之间的分隔线 */
    background-color: rgba(30, 30, 30, 0.95);
  }

  .input-wrapper {
    background-color: rgba(255, 255, 255, 0.1);
    border-radius: 36rpx;
    padding: 16rpx 24rpx;
    transition: all 0.3s ease;
  }

  .comment-input {
    width: 100%;
    height: 72rpx;
    line-height: 1.5;
    font-size: 28rpx;
    color: #fff;
    background: transparent;
  }

  .comment-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16rpx;
    padding-top: 16rpx;
    /* 保留这个分隔线，它是输入框内部的 */
    border-top: 1rpx solid rgba(255, 255, 255, 0.1);
    animation: fadeIn 0.3s ease;
  }

  .word-count {
    font-size: 24rpx;
    color: rgba(255, 255, 255, 0.5);
  }

  .submit-btn {
    margin: 0;
    padding: 0 30rpx;
    height: 64rpx;
    line-height: 64rpx;
    font-size: 28rpx;
    color: #fff;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 32rpx;
    border: none;
    font-weight: 500;
    letter-spacing: 1rpx;
  }

  .submit-btn:disabled {
    opacity: 0.5;
  }

  .submit-btn::after {
    border: none;
  }

  .submit-btn:active {
    opacity: 0.8;
  }

  .expanded .input-wrapper {
    background: rgba(255, 255, 255, 0.15);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10rpx);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  </style>