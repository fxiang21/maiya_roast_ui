function showLoadingHttp() {
	uni.showLoading({
		title: '加载中',
		mask: true
	});
}

function hideLoadingHttp() {
	uni.hideLoading();
}

function checkSecurityContent(requestData, sucessCallBack, failCallBack) {
	const appId = getApp().globalData.appId;
	uni.request({
		url: getApp().globalData.url + 'ai/checkSecurityContent',
		method: 'POST',
		header: {
			'content-type': 'application/json',
			'authU': uni.getStorageSync(getApp().globalData.openIdCacheName),
			'auth': appId,
		},
		data: {
			...requestData,
			appId,
		},
		success: (res) => {
			if (checkHttpOk(res)) {
				sucessCallBack(res);
			} else {
				failCallBack(res);
			}
		},
		fail: (res) => {
			failCallBack(res);
		}
	})
}

function updateNameAndImg(requestData, sucessCallBack) {
	const appId = getApp().globalData.appId;
	uni.request({
		url: getApp().globalData.url + 'ai/updateNameAndImg',
		method: 'POST',
		header: {
			'content-type': 'application/json',
			'authU': uni.getStorageSync(getApp().globalData.openIdCacheName),
			'auth': appId,
		},
		data: {
			...requestData,
			appId,
		},
		success: (res) => {
			if (checkHttpOk(res)) {
				console.log("login_req_success1", res);
				uni.setStorageSync(getApp().globalData.openIdCacheName, res.data.data
					.openId);
				uni.setStorageSync(getApp().globalData.avatarUrlCacheName, res.data
					.data.imgUrl);
				uni.setStorageSync(getApp().globalData.nickNameCacheName, res.data.data
					.name);
				//提示
				uni.showModal({
					title: '提示',
					content: '操作成功',
					showCancel: false,
					success: function(res) {
						if (res.confirm) {
							sucessCallBack();
						}
					}
				});
			} else {
				uni.showModal({
					content: res.data.msg,
					showCancel: false
				});
			}
		},
		fail: (res) => {
			//登陆失败
			console.log("login_req_fail", res);
			uni.showModal({
				content: res.errMsg,
				showCancel: false
			});
		}
	})
}

function streamWx(that, requestData, successCallBack, failCallBack, completeCallBack, onHeadersReceivedCallBack,
	onChunkReceivedCallBack) {
	const appId = getApp().globalData.appId;
	const temperatureObj = uni.getStorageSync(getApp().globalData.temperatureNameCacheName);
	const modelObj = uni.getStorageSync(getApp().globalData.modeNameCacheName);
	const requestTask = wx.request({
		url: getApp().globalData.chatUrl + 'api/application/chat_message/9b6d87d2-937c-11ef-8c6d-0242ac120003',
		responseType: "arraybuffer",
		// responseType: "text",
		method: 'POST',
		enableChunked: true,
		header: {
			'sslVerify': false,
			'content-type': 'application/json',
			'authU': uni.getStorageSync(getApp().globalData.openIdCacheName),
			'auth': appId,
		},
		data: {
			...requestData,
			appId: getApp().globalData.appId,
			openId: uni.getStorageSync(getApp().globalData.openIdCacheName),
			temperatureStr: getApp().globalData.isBlank(temperatureObj) ? '' : temperatureObj.value,
			model: getApp().globalData.isBlank(modelObj) ? '' : modelObj.model,
		},
		success: (res) => {
			successCallBack(res);
		},
		complete: (res) => {
			completeCallBack(res);
		},
		fail: (err) => {
			failCallBack(err);
		}
	});
	requestTask.onHeadersReceived(function(r) {
		onHeadersReceivedCallBack(r);
	});
	requestTask.onChunkReceived(function(r) {
		onChunkReceivedCallBack(r);
	});
	return requestTask;
}


function streamFetch(that, requestData, successCallBack, failCallBack, completeCallBack, onChunkReceivedCallBack){
	
	const url = getApp().globalData.chatUrl + 'api/application/chat_message/9b6d87d2-937c-11ef-8c6d-0242ac120003'
	const appId = getApp().globalData.appId;
	const temperatureObj = uni.getStorageSync(getApp().globalData.temperatureNameCacheName);
	const modelObj = uni.getStorageSync(getApp().globalData.modeNameCacheName);
	// fetch(url, {
	//   method: 'POST',
	//   headers: {
	// 	  'sslVerify': false,
	// 	  'content-type': 'application/json',
	// 	  'authU': uni.getStorageSync(getApp().globalData.openIdCacheName),
	// 	  'auth': appId,
	//   },
	//   body: JSON.stringify({
	//     ...requestData,
	//     appId: getApp().globalData.appId,
	//     openId: uni.getStorageSync(getApp().globalData.openIdCacheName),
	//     temperatureStr: getApp().globalData.isBlank(temperatureObj) ? '' : temperatureObj.value,
	//     model: getApp().globalData.isBlank(modelObj) ? '' : modelObj.model,
	//   })
	// })
	// .then(response => {
	//   if (!response.ok) {
	//     throw new Error('Network response was not ok');
	//   }
	//   // 处理响应头
	//   const headers = response.headers;
	//   // 调用 onHeadersReceived 回调
	//   onHeadersReceivedCallBack(headers);
	
	//   // 以流的形式处理数据
	//   const reader = response.body.getReader();
	//   let receivedLength = 0; // 接收到的字节数
	//   let chunks = []; // 数组，用于存储接收到的 chunk 数据
	
	//   return new ReadableStream({
	//     start(controller) {
	//       function push() {
	//         // 读取一个 chunk
	//         reader.read().then(({done, value}) => {
	//           if (done) {
	//             // 流已经读取完毕
	//             controller.close();
	//             return;
	//           }
	//           // 将 chunk 数据添加到数组中
	//           chunks.push(value);
	//           receivedLength += value.length;
	//           // 调用 onChunkReceived 回调
	//           onChunkReceivedCallBack(value);
	//           // 将 chunk 数据推送到流中
	//           controller.enqueue(value);
	//           push();
	//         }).catch(error => {
	//           console.error('Error reading stream:', error);
	//           controller.error(error);
	//         });
	//       }
	//       push();
	//     }
	//   });
	// })
	// .then(stream => new Response(stream))
	// .then(response => response.arrayBuffer())
	// .then(data => {
	//   // 数据处理
	//   console.log('Data received:', data);
	//   successCallBack(data);
	// })
	// .catch(error => {
	//   console.error('Error:', error);
	//   failCallBack(error);
	// })
	// .finally(() => {
	//   // 完成回调
	//   completeCallBack();
	// });
	
}






function streamDy(that, requestData, successCallBack, failCallBack, completeCallBack) {
	const appId = getApp().globalData.appId;
	const requestTask = uni.request({
		url: getApp().globalData.url + 'api/application/chat_message/9b6d87d2-937c-11ef-8c6d-0242ac120003',
		responseType: 'text',
		method: 'POST',
		header: {
			'content-type': 'application/json',
			'authU': uni.getStorageSync(getApp().globalData.openIdCacheName),
			'auth': appId,
		},
		data: {
			...requestData,
			"appId": getApp().globalData.appId
		},
		success: (res) => {
			successCallBack(res);
		},
		complete: (res) => {
			completeCallBack(res);
		},
		fail: (err) => {
			failCallBack(err);
		}
	});
	return requestTask;
}

function userLogin(requestData, successCallback, failCallBack) {
	const appId = getApp().globalData.appId;
	uni.request({
		url: getApp().globalData.url + 'ai/login',
		method: 'POST',
		header: {
			'content-type': 'application/json',
			'auth': appId,
		},
		data: {
			openId: uni.getStorageSync(getApp().globalData.openIdCacheName),
			appId,
			...requestData,
		},
		success: (res) => {
			if (checkHttpOk(res)) {
				successCallback(res);
			} else {
				failCallBack(res);
			}
		},
		fail: (res) => {
			failCallBack(res);
		},
		complete: () => {}
	})
}

/** 
 * 卡密兑换
 * @param {Object} requestData
 * @param {Object} successCallback
 * @param {Object} failCallBack
 */
function cardCodeChange(requestData, successCallback, failCallBack) {
	const appId = getApp().globalData.appId;
	showLoadingHttp();
	uni.request({
		url: getApp().globalData.url + 'ai/card-code',
		method: 'POST',
		header: {
			'content-type': 'application/json',
			'authU': uni.getStorageSync(getApp().globalData.openIdCacheName),
			'auth': appId,
		},
		data: {
			openId: uni.getStorageSync(getApp().globalData.openIdCacheName),
			appId,
			appType: getApp().globalData.appType,
			...requestData,
		},
		success: (res) => {
			if (checkHttpOk(res)) {
				successCallback(res);
			} else {
				uni.showModal({
					content: res.data.msg,
					showCancel: false
				});
			}
		},
		fail: (res) => {
			console.log("login_fail", res);
			uni.showModal({
				content: '网络异常，请稍后重试',
				showCancel: false
			});
		},
		complete: () => {
			hideLoadingHttp();
		}
	})
}

/**
 * 获取创作tabbar信息
 * @param {Object} openId
 * @param {Object} appId
 * @param {Object} callback
 */
function guide(infoId, callback) {
	const appId = getApp().globalData.appId;
	uni.request({
		url: getApp().globalData.url + 'ai/guide',
		method: 'POST',
		header: {
			'content-type': 'application/json',
			'authU': uni.getStorageSync(getApp().globalData.openIdCacheName),
			'auth': appId,
		},
		data: {
			openId: uni.getStorageSync(getApp().globalData.openIdCacheName),
			appId,
			categoryInfoId: infoId,
		},
		success: (res) => {
			if (checkHttpOk(res)) {
				callback(res);
			}
		},
		fail: (res) => {},
		complete: () => {}
	})
}


/**
 * 获取创作tabbar信息
 * @param {Object} openId
 * @param {Object} appId
 * @param {Object} callback
 */
function getProduceCategory(openId, appId, callback) {
	// showLoadingHttp();
	uni.request({
		url: getApp().globalData.url + 'ai/produceCategory',
		method: 'POST',
		header: {
			'content-type': 'application/json',
			'authU': uni.getStorageSync(getApp().globalData.openIdCacheName),
			'auth': appId,
		},
		data: {
			openId,
			appId
		},
		success: (res) => {
			callback(res, checkHttpOk(res));
		},
		fail: (res) => {},
		complete: () => {
			// hideLoadingHttp();
		}
	})
}

/**
 * 获取用户会员到期时间
 * @param {Object} openId
 * @param {Object} appId
 * @param {Object} callback
 */
function getUserValidTime(callback) {
	const appId = getApp().globalData.appId;
	uni.request({
		url: getApp().globalData.url + 'ai/validTime',
		method: 'POST',
		header: {
			'content-type': 'application/json',
			'authU': uni.getStorageSync(getApp().globalData.openIdCacheName),
			'auth': appId,
		},
		data: {
			openId: uni.getStorageSync(getApp().globalData.openIdCacheName),
			appId,
		},
		success: (res) => {
			callback(res, checkHttpOk(res));
		},
		fail: (res) => {}
	})
}

/**
 * 增加用户会员时间
 * @param {Object} callback
 */
function addValidTime(callback) {
	const adType = getApp().globalData.adTypePlay;
	const appId = getApp().globalData.appId;
	uni.request({
		url: getApp().globalData.url + 'ai/addValidTime',
		method: 'POST',
		header: {
			'content-type': 'application/json',
			'authU': uni.getStorageSync(getApp().globalData.openIdCacheName),
			'auth': appId,
		},
		data: {
			openId: uni.getStorageSync(getApp().globalData.openIdCacheName),
			appId,
			adType
		},
		success: (res) => {
			if (checkHttpOk(res)) {
				const title = "您成功获得" + res.data.data.timeStr;
				console.log("addValidTime", title);
				uni.showToast({
					title: title,
					icon: "none",
					position: "top",
					duration: 2000
				});
				callback(res, checkHttpOk(res));
			} else {
				uni.showToast({
					title: res.data,
					icon: "error",
					position: "top",
					duration: 2000
				});
			}
		},
		fail: (res) => {}
	})
}

function checkHttpOk(res) {
	if (res.data.code == '000000') {
		return true;
	}
	return false;
}

//返回值
function adShowBefore(callBack) {
	//	查看广告提示消息
	setTimeout(() => {
		uni.showModal({
			title: '提示',
			content: '每观看一次视频可以获取1小时的无限次使用，每天第三次观看视频可以获取1整天的无限次使用哦。',
			success: function(res) {
				if (res.confirm) {
					callBack();
				} else if (res.cancel) {
					console.log('用户点击取消');
				}
			}
		});
	}, 10);
}


//返回值
function number(a, b) {
	return a * b;
}

/**
 * 情感分析上传
 * @param {Object} tempFilePath 录音文件路径，文字模式时为 null
 * @param {Function} successCallback 成功回调
 * @param {Function} failCallback 失败回调
 * @param {Object} extraData 额外数据，包含文字内容等
 */
function uploadEmotionAudio(tempFilePath, successCallback, failCallback, extraData = {}) {
	const app = getApp();
	const uploadData = {
		is_public: 'true',
		...extraData
	};
	
	if (tempFilePath) {
		// 语音上传
		uni.uploadFile({
			url: `${app.globalData.url}/emotion/analysis`,
			filePath: tempFilePath,
			name: 'file',
			formData: {
				...uploadData,
				// 添加音频相关参数
				timestamp: new Date().getTime().toString(),
				language: 'zh',
				format: 'mp3',
				sample_rate: '16000',
				channels: '1',
				bit_rate: '48000'
			},
			header: {
				'content-type': 'multipart/form-data',
				'Authorization': uni.getStorageSync('token')
			},
			success: handleResponse,
			fail: failCallback
		});
	} else {
		// 文字提交
		uni.request({
			url: `${app.globalData.url}/emotion/analysis`,
			method: 'POST',
			data: uploadData,
			header: {
				'content-type': 'application/json',
				'Authorization': uni.getStorageSync('token')
			},
			success: handleResponse,
			fail: failCallback
		});
	}
	
	function handleResponse(res) {
		try {
			// 检查 res 是否存在
			if (!res) {
				throw new Error('响应数据为空');
			}

			// 解析响应数据
			let responseData;
			if (typeof res.data === 'string') {
				responseData = JSON.parse(res.data);
			} else {
				responseData = res.data;
			}

			// 检查数据结构
			if (!responseData || !responseData.data || !responseData.data.emotion) {
				throw new Error('响应数据格式错误');
			}

			// 检查状态码
			if (responseData.code === 200) {
				// 确保 encourage 字段存在
				if (responseData.data.emotion.encourage) {
					successCallback(responseData);
				} else {
					throw new Error('缺少鼓励语数据');
				}
			} else {
				throw new Error(responseData.message || '分析失败');
			}
		} catch (error) {
			console.log("parseError", error);
			failCallback(new Error('解析响应数据失败：' + error.message));
		}
	}
}

export {
	updateNameAndImg,
	streamDy,
	streamWx,
	streamFetch,
	userLogin,
	getProduceCategory,
	getUserValidTime,
	addValidTime,
	adShowBefore,
	guide,
	cardCodeChange,
	number,
	uploadEmotionAudio,
}