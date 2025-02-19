import {getOrGenerateDeviceId } from '@/common/js/http.js'
import {
	http,
	Method
} from '@/utils/request.js';
/**
 * 获取情感分析历史记录
 * @param {Number} page 当前页码
 * @param {Number} pageSize 每页条数
 * @param {Function} successCallback 成功回调
 * @param {Function} failCallback 失败回调
 */
export function getEmotionHistory(page, pageSize, successCallback, failCallback) {
  const deviceId = getOrGenerateDeviceId()

  return http.request({
    url: `speech/emotion/history`,
    method: Method.GET,
    needToken: true,
    data: {
      page,
      page_size: pageSize
    },
    header: {
      'content-type': 'application/json',
      'Authorization': uni.getStorageSync('token') || '',
      'X-Anonymous-ID': deviceId
    },
  }).then((res) => {
    if (res.data.code === 200) {
      successCallback && successCallback(res.data)
    } else {
      failCallback && failCallback(new Error(res.message || '获取历史记录失败'))
    }
  }).catch((error) => {
    failCallback && failCallback(new Error('请求失败：' + error.message))
  })
}

/**
 * 点赞操作
 * @param {String} emotionId 情感记录ID
 * @param {Function} successCallback 成功回调
 * @param {Function} failCallback 失败回调
 */
export function likeEmotion(emotionId, successCallback, failCallback) {
  return http.request({
    url: `speech/emotion/${emotionId}/like`,
    method: Method.POST,
    needToken: true,
    data: {},
    header: {
      'content-type': 'application/json',
      'Authorization': uni.getStorageSync('token') || '',
      'X-Anonymous-ID': uni.getStorageSync('device_unique_id') || ''
    },
  }).then((res) => {
    if (res.data.code === 200) {
      successCallback && successCallback(res.data)
    } else {
      failCallback && failCallback(new Error(res.message || '点赞失败'))
    }
  }).catch((error) => {
    failCallback && failCallback(new Error('请求失败：' + error.message))
  })
}

/**
 * 反对操作
 * @param {String} emotionId 情感记录ID
 * @param {Function} successCallback 成功回调
 * @param {Function} failCallback 失败回调
 */
export function dislikeEmotion(emotionId, successCallback, failCallback) {
  return http.request({
    url: `speech/emotion/${emotionId}/dislike`,
    method: Method.POST,
    needToken: true,
    data: {},
    header: {
      'content-type': 'application/json',
      'Authorization': uni.getStorageSync('token') || '',
      'X-Anonymous-ID': uni.getStorageSync('device_unique_id') || ''
    },
  }).then((res) => {
    if (res.code === 200) {
      successCallback && successCallback(res.data)
    } else {
      failCallback && failCallback(new Error(res.message || '反对失败'))
    }
  }).catch((error) => {
    failCallback && failCallback(new Error('请求失败：' + error.message))
  })
}

/**
 * 切换公开状态
 * @param {String} emotionId 情感记录ID
 * @param {Function} successCallback 成功回调
 * @param {Function} failCallback 失败回调
 */
export function toggleEmotionPublic(emotionId, successCallback, failCallback) {
  return http.request({
    url: `speech/emotion/${emotionId}/toggle_public`,
    method: Method.POST,
    needToken: true,
    data: {},
    header: {
      'content-type': 'application/json',
      'X-Anonymous-ID': uni.getStorageSync('device_unique_id') || ''
    },
  }).then((res) => {
    if (res.data.code === 200) {
      successCallback && successCallback(res.data)
    } else {
      failCallback && failCallback(new Error(res.message || '切换公开状态失败'))
    }
  }).catch((error) => {
    failCallback && failCallback(new Error('请求失败：' + error.message))
  })
}

/**
 * 删除情感记录
 * @param {String} emotionId 情感记录ID
 * @param {Function} successCallback 成功回调
 * @param {Function} failCallback 失败回调
 */
export function deleteEmotion(emotionId, successCallback, failCallback) {
  return http.request({
    url: `speech/emotion/${emotionId}`,
    method: Method.DELETE,
    needToken: true,
    data: {},
    header: {
      'content-type': 'application/json',
      'X-Anonymous-ID': uni.getStorageSync('device_unique_id') || ''
    },
  }).then((res) => {
    if (res.data.code === 200) {
      successCallback && successCallback(res.data)
    } else {
      failCallback && failCallback(new Error(res.message || '删除失败'))
    }
  }).catch((error) => {
    failCallback && failCallback(new Error('请求失败：' + error.message))
  })
}

/**
 * 发送评论
 * @param {String} emotionId 情感记录ID
 * @param {String} content 评论内容
 * @param {Function} successCallback 成功回调
 * @param {Function} failCallback 失败回调
 */
export function addComment(emotionId, content, successCallback, failCallback) {
  const deviceId = getOrGenerateDeviceId()

  return http.request({
    url: `speech/emotion/${emotionId}/comment`,
    method: Method.POST,
    needToken: true,
    data: {
      content: content
    },
    header: {
      'content-type': 'application/json',
      'Authorization': uni.getStorageSync('token') || '',
      'X-Anonymous-ID': deviceId
    },
  }).then((res) => {
    if (res.data.code === 200) {
      successCallback && successCallback(res.data)
    } else {
      failCallback && failCallback(new Error(res.message || '评论失败'))
    }
  }).catch((error) => {
    failCallback && failCallback(new Error('请求失败：' + error.message))
  })
}

/**
 * 获取评论列表
 * @param {String} emotionId 情感记录ID
 * @param {Number} page 页码
 * @param {Number} pageSize 每页条数
 * @param {Function} successCallback 成功回调
 * @param {Function} failCallback 失败回调
 */
export function getCommentList(emotionId, page, pageSize, successCallback, failCallback) {
  const deviceId = getOrGenerateDeviceId()

  return http.request({
    url: `speech/emotion/${emotionId}/interactions`,
    method: Method.GET,
    needToken: true,
    data: {
      type: 'comment',
      page,
      page_size: pageSize
    },
    header: {
      'content-type': 'application/json',
      'X-Anonymous-ID': deviceId
    },
  }).then((res) => {
    if (res.data.code === 200) {
      successCallback && successCallback(res.data)
    } else {
      failCallback && failCallback(new Error(res.message || '获取评论失败'))
    }
  }).catch((error) => {
    failCallback && failCallback(new Error('请求失败：' + error.message))
  })
}

/**
 * 切换点赞状态
 * @param {String} emotionId 情感记录ID
 * @param {Function} successCallback 成功回调
 * @param {Function} failCallback 失败回调
 */
export function toggleLike(emotionId, successCallback, failCallback) {
  const deviceId = getOrGenerateDeviceId()
  
  return http.request({
    url: `speech/emotion/${emotionId}/toggle-like`,
    method: Method.POST,
    needToken: true,
    data: {},
    header: {
      'content-type': 'application/json',
      'Authorization': uni.getStorageSync('token') || '',
      'X-Anonymous-ID': deviceId
    },
  }).then((res) => {
    if (res.data.code === 200) {
      successCallback && successCallback(res.data)
    } else {
      failCallback && failCallback(new Error(res.message || '操作失败'))
    }
  }).catch((error) => {
    failCallback && failCallback(new Error('请求失败：' + error.message))
  })
}

/**
 * 获取情感统计数据
 * @param {String} period 统计周期 (daily/weekly/monthly)
 * @param {Function} successCallback 成功回调
 * @param {Function} failCallback 失败回调
 */
export function getEmotionStats(period, successCallback, failCallback) {
  const deviceId = getOrGenerateDeviceId()
  if (period === 'week' || period === 'weekly') {
    period = 'daily'
  } else if (period === 'month' || period === 'monthly') {
    period = 'weekly'
  } else if (period === 'year' || period === 'yearly') {
    period = 'monthly'
  }

  return http.request({
    url: `speech/emotion/statistics`,
    method: Method.GET,
    needToken: true,
    data: {
      period
    },
    header: {
      'content-type': 'application/json',
      'Authorization': uni.getStorageSync('token') || '',
      'X-Anonymous-ID': deviceId
    },
  }).then((res) => {
    if (res.data.code === 200) {
      successCallback && successCallback(res.data)
    } else {
      failCallback && failCallback(new Error(res.message || '获取统计数据失败'))
    }
  }).catch((error) => {
    failCallback && failCallback(new Error('请求失败：' + error.message))
  })
} 


/**
 * 获取情感周期统计数据
 * @param {String} period 统计周期 (week/month/year/all)
 * @param {Function} successCallback 成功回调
 * @param {Function} failCallback 失败回调
 */
export function getPeriodEmotionStats(period, successCallback, failCallback) {
  const deviceId = getOrGenerateDeviceId()

  return http.request({
    url: `speech/emotion/period_statistics`,
    method: Method.GET,
    needToken: true,
    data: {
      period
    },
    header: {
      'content-type': 'application/json',
      'Authorization': uni.getStorageSync('token') || '',
      'X-Anonymous-ID': deviceId
    },
  }).then((res) => {
    if (res.data.code === 200) {
      successCallback && successCallback(res.data)
    } else {
      failCallback && failCallback(new Error(res.message || '获取统计数据失败'))
    }
  }).catch((error) => {
    failCallback && failCallback(new Error('请求失败：' + error.message))
  })
} 