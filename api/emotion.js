import { http, getOrGenerateDeviceId } from '@/common/js/http.js'

/**
 * 获取情感分析历史记录
 * @param {Number} page 当前页码
 * @param {Number} pageSize 每页条数
 * @param {Function} successCallback 成功回调
 * @param {Function} failCallback 失败回调
 */
export function getEmotionHistory(page, pageSize, successCallback, failCallback) {
  const deviceId = getOrGenerateDeviceId()

  uni.request({
    url: `${getApp().globalData.url}/speech/emotion/history`,
    method: 'GET',
    data: {
      page,
      page_size: pageSize
    },
    header: {
      'content-type': 'application/json',
      'Authorization': uni.getStorageSync('token') || '',
      'X-Anonymous-ID': deviceId
    },
    success: handleResponse,
    fail: failCallback
  })

  function handleResponse(res) {
    try {
      if (!res) throw new Error('响应数据为空')
      
      let responseData = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
      
      if (responseData.code === 200) {
        successCallback(responseData)
      } else {
        throw new Error(responseData.message || '获取历史记录失败')
      }
    } catch (error) {
      failCallback(new Error('解析响应数据失败：' + error.message))
    }
  }
}

/**
 * 点赞操作
 * @param {String} emotionId 情感记录ID
 * @param {Function} successCallback 成功回调
 * @param {Function} failCallback 失败回调
 */
export function likeEmotion(emotionId, successCallback, failCallback) {
  uni.request({
    url: `${getApp().globalData.url}/speech/emotion/${emotionId}/like`,
    method: 'POST',
    header: {
      'content-type': 'application/json',
      'Authorization': uni.getStorageSync('token') || '',
      'X-Anonymous-ID': uni.getStorageSync('device_unique_id') || ''
    },
    success: handleResponse,
    fail: failCallback
  })

  function handleResponse(res) {
    try {
      if (!res) throw new Error('响应数据为空')
      
      let responseData = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
      
      if (responseData.code === 200) {
        successCallback(responseData)
      } else {
        throw new Error(responseData.message || '点赞失败')
      }
    } catch (error) {
      failCallback(new Error('解析响应数据失败：' + error.message))
    }
  }
}

/**
 * 反对操作
 * @param {String} emotionId 情感记录ID
 * @param {Function} successCallback 成功回调
 * @param {Function} failCallback 失败回调
 */
export function dislikeEmotion(emotionId, successCallback, failCallback) {
  uni.request({
    url: `${getApp().globalData.url}/speech/emotion/${emotionId}/dislike`,
    method: 'POST',
    header: {
      'content-type': 'application/json',
      'Authorization': uni.getStorageSync('token') || '',
      'X-Anonymous-ID': uni.getStorageSync('device_unique_id') || ''
    },
    success: handleResponse,
    fail: failCallback
  })

  function handleResponse(res) {
    try {
      if (!res) throw new Error('响应数据为空')
      
      let responseData = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
      
      if (responseData.code === 200) {
        successCallback(responseData)
      } else {
        throw new Error(responseData.message || '反对失败')
      }
    } catch (error) {
      failCallback(new Error('解析响应数据失败：' + error.message))
    }
  }
}

/**
 * 切换公开状态
 * @param {String} emotionId 情感记录ID
 * @param {Function} successCallback 成功回调
 * @param {Function} failCallback 失败回调
 */
export function toggleEmotionPublic(emotionId, successCallback, failCallback) {
  uni.request({
    url: `${getApp().globalData.url}/speech/emotion/${emotionId}/toggle_public`,
    method: 'POST',
    header: {
      'content-type': 'application/json',
      'Authorization': uni.getStorageSync('token') || '',
      'X-Anonymous-ID': uni.getStorageSync('device_unique_id') || ''
    },
    success: handleResponse,
    fail: failCallback
  })

  function handleResponse(res) {
    try {
      if (!res) throw new Error('响应数据为空')
      
      let responseData = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
      
      if (responseData.code === 200) {
        successCallback(responseData)
      } else {
        throw new Error(responseData.message || '切换公开状态失败')
      }
    } catch (error) {
      failCallback(new Error('解析响应数据失败：' + error.message))
    }
  }
}

/**
 * 删除情感记录
 * @param {String} emotionId 情感记录ID
 * @param {Function} successCallback 成功回调
 * @param {Function} failCallback 失败回调
 */
export function deleteEmotion(emotionId, successCallback, failCallback) {
  uni.request({
    url: `${getApp().globalData.url}/speech/emotion/${emotionId}`,
    method: 'DELETE',
    header: {
      'content-type': 'application/json',
      'Authorization': uni.getStorageSync('token') || '',
      'X-Anonymous-ID': uni.getStorageSync('device_unique_id') || ''
    },
    success: handleResponse,
    fail: failCallback
  })

  function handleResponse(res) {
    try {
      if (!res) throw new Error('响应数据为空')
      
      let responseData = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
      
      if (responseData.code === 200) {
        successCallback(responseData)
      } else {
        throw new Error(responseData.message || '删除失败')
      }
    } catch (error) {
      failCallback(new Error('解析响应数据失败：' + error.message))
    }
  }
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

  uni.request({
    url: `${getApp().globalData.url}/speech/emotion/${emotionId}/comment`,
    method: 'POST',
    data: {
      content: content
    },
    header: {
      'content-type': 'application/json',
      'Authorization': uni.getStorageSync('token') || '',
      'X-Anonymous-ID': deviceId
    },
    success: (res) => {
      if (res.data.code === 200) {
        successCallback(res.data)
      } else {
        failCallback(new Error(res.data.message || '评论失败'))
      }
    },
    fail: failCallback
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
  
  uni.request({
    url: `${getApp().globalData.url}/speech/emotion/${emotionId}/interactions`,
    method: 'GET',
    data: {
      type: 'comment',
      page,
      page_size: pageSize
    },
    header: {
      'content-type': 'application/json',
      'Authorization': uni.getStorageSync('token') || '',
      'X-Anonymous-ID': deviceId
    },
    success: (res) => {
      if (res.data.code === 200) {
        successCallback(res.data)
      } else {
        failCallback(new Error(res.data.message || '获取评论失败'))
      }
    },
    fail: failCallback
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
  
  uni.request({
    url: `${getApp().globalData.url}/speech/emotion/${emotionId}/toggle-like`,
    method: 'POST',
    header: {
      'content-type': 'application/json',
      'Authorization': uni.getStorageSync('token') || '',
      'X-Anonymous-ID': deviceId
    },
    success: (res) => {
      if (res.data.code === 200) {
        successCallback && successCallback(res.data)
      } else {
        failCallback && failCallback(new Error(res.data.message || '操作失败'))
      }
    },
    fail: failCallback
  })
} 