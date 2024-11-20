// @ts-ignore
import io from '@hyoga/uni-socket.io';
import {
	login
} from '@/config/login'
import config from '@/config/request.js'
import store from "../store";;
import Vue from "vue"

class Chat {
	constructor() {
		this.onMessage = () => {
			console.log('未绑定处理消息事件')
		};
		console.log(config)
		console.log(process)
		// http://127.0.0.1:8002
		this.socket = io(process.env.NODE_ENV === 'development' ? 'https://chat.w0b.cn' : config.baseURL, {
			transports: ['websocket', 'polling'],
			timeout: 5000,
		});
		console.log(config.baseURL, process.env)
		this.socket.on('connect', () => {
			const {
				id
			} = this.socket;
			this.socket.on(id, (message) => {
				this.onMessage(message)
			});
		});
		this.socket.on('error', (msg) => {
			console.log('ws error', msg);
		});
	}
	sendMessage(message) {
		if (!this.socket) return;
		this.socket.emit('myEvent', message);
	}
}

export default new Chat();
