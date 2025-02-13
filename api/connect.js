/**
 * 信任登录相关 API
 */

import { http, Method } from '@/utils/request.js';

/**
 * Web 第三方登录
 * @param {String} code 登录 code
 * @param {Function} successCallback 成功回调
 * @param {Function} failCallback 失败回调
 */
export function webConnect(code, successCallback, failCallback) {
  return http.request({
    url: `passport/connect/connect/login/web/${code}`,
    method: Method.GET,
    needToken: true,
    data: {},
    header: {
      "clientType": "H5",
      'content-type': 'application/json'
    }
  }).then(res => {
    if (res.code === 200) {
      successCallback && successCallback(res);
    } else {
      failCallback && failCallback(new Error(res.message || 'Web 第三方登录失败'));
    }
  }).catch(error => {
    failCallback && failCallback(error);
  });
}

/**
 * App 第三方登录（openId 登录）
 * @param {Object} params 登录参数
 * @param {String} clientType 客户端类型
 * @param {Function} successCallback 成功回调
 * @param {Function} failCallback 失败回调
 */
export function openIdLogin(params, clientType, successCallback, failCallback) {
  return http.request({
    url: `passport/connect/connect/app/login`,
    method: Method.POST,
    needToken: true,
    data: params,
    header: {
      "clientType": clientType,
      'content-type': 'application/json'
    }
  }).then(res => {
    if (res.code === 200) {
      successCallback && successCallback(res);
    } else {
      failCallback && failCallback(new Error(res.message || 'App 第三方登录失败'));
    }
  }).catch(error => {
    failCallback && failCallback(error);
  });
}

/**
 * 第三方登录成功回调
 * @param {String} state 回调状态
 * @param {Function} successCallback 成功回调
 * @param {Function} failCallback 失败回调
 */
export function loginCallback(state, successCallback, failCallback) {
  return http.request({
    url: `passport/connect/connect/result?state=${state}`,
    method: Method.GET,
    needToken: false,
    data: {},
    header: {
      'content-type': 'application/json'
    }
  }).then(res => {
    if (res.code === 200) {
      successCallback && successCallback(res);
    } else {
      failCallback && failCallback(new Error(res.message || '登录回调失败'));
    }
  }).catch(error => {
    failCallback && failCallback(error);
  });
}

/**
 * 小程序自动登录
 * @param {Object} params 登录参数
 * @param {Function} successCallback 成功回调
 * @param {Function} failCallback 失败回调
 */
export function mpAutoLogin(params, successCallback, failCallback) {
  return http.request({
    url: `auth/wechat_login`,
    method: Method.POST,
    needToken: true,
    data: params,
    header: {
      'content-type': 'application/json'
    }
  }).then(res => {
    console.log("res:", res)
    if (res.data.code === 200) {
      console.log("mpAutoLogin:", res.data)
      successCallback && successCallback(res.data);
      return res.data;
    } else {
      failCallback && failCallback(new Error(res.message || '小程序自动登录失败'));
    }
  }).catch(error => {
    failCallback && failCallback(error);
    throw error;
  });
}
