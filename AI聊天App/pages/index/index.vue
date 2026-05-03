<template>
	<view class="container">
		<view class="chat-header">
			<text class="title">{{ aiName }}</text>
			<text class="settings-btn" @click="showSettings = true">⚙️</text>
		</view>
		
		<scroll-view class="chat-messages" scroll-y :scroll-into-view="scrollInto">
			<view v-for="(msg, index) in messages" :key="index" 
				  :class="['message', msg.role === 'user' ? 'user' : 'assistant']">
				<text class="avatar">{{ msg.role === 'user' ? '👤' : '🤖' }}</text>
				<text class="content">{{ msg.content }}</text>
			</view>
			<view v-if="loading" class="message assistant">
				<text class="avatar">🤖</text>
				<text class="content typing">正在思考中...</text>
			</view>
			<view id="bottom"></view>
		</scroll-view>
		
		<view class="input-area">
			<input v-model="inputText" @confirm="sendMessage" 
				   placeholder="输入消息..." :disabled="loading" />
			<button @click="sendMessage" :disabled="loading || !inputText.trim()">发送</button>
		</view>
		
		<!-- 设置弹窗 -->
		<view v-if="showSettings" class="modal">
			<view class="modal-content">
				<text class="modal-title">⚙️ 设置</text>
				<view class="form-group">
					<text>AI名字</text>
					<input v-model="config.aiName" placeholder="例如：小爱" />
				</view>
				<view class="form-group">
					<text>你的名字</text>
					<input v-model="config.userName" placeholder="例如：张三" />
				</view>
				<view class="form-group">
					<text>API Key</text>
					<input v-model="config.apiKey" type="text" password placeholder="豆包API Key" />
				</view>
				<view class="modal-buttons">
					<button class="save-btn" @click="saveConfig">保存</button>
					<button class="cancel-btn" @click="showSettings = false">取消</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
const API_KEY = 'd0355c2c-e49b-4012-a36d-4a165a648ccc';
const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/responses';
const MODEL = 'doubao-seed-2-0-lite-260215';

export default {
	data() {
		return {
			inputText: '',
			loading: false,
			showSettings: false,
			conversationId: null,
			scrollInto: '',
			messages: [],
			config: {
				aiName: '豆包',
				userName: '',
				apiKey: API_KEY
			}
		}
	},
	onLoad() {
		try {
			const saved = uni.getStorageSync('aiChatConfig');
			if (saved) {
				this.config = JSON.parse(saved);
			}
		} catch(e) {}
		
		this.messages.push({
			role: 'assistant',
			content: `你好！我是${this.config.aiName}，有什么我可以帮你的吗？`
		});
	},
	methods: {
		async sendMessage() {
			if (!this.inputText.trim() || this.loading) return;
			
			const userMsg = this.inputText.trim();
			this.inputText = '';
			
			this.messages.push({
				role: 'user',
				content: userMsg
			});
			
			this.loading = true;
			this.scrollToBottom();
			
			try {
				const systemPrompt = `你叫${this.config.aiName}，是由字节跳动开发的人工智能助手。` + 
					(this.config.userName ? `当前用户叫${this.config.userName}。` : '');
				
				const requestData = {
					model: MODEL,
					input: [
						{ role: 'system', content: [{ type: 'input_text', text: systemPrompt }], status: 'completed' },
						{ role: 'user', content: [{ type: 'input_text', text: userMsg }], status: 'completed' }
					]
				};
				
				if (this.conversationId) {
					requestData.conversation_id = this.conversationId;
				}
				
				const response = await uni.request({
					url: API_URL,
					method: 'POST',
					data: requestData,
					header: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${this.config.apiKey}`
					},
					timeout: 60000
				});
				
				const data = response.data;
				
				if (!this.conversationId && data.conversation_id) {
					this.conversationId = data.conversation_id;
				}
				
				let assistantMessage = '';
				for (const item of data.output) {
					if (item.type === 'message' && item.content) {
						for (const content of item.content) {
							if (content.type === 'output_text') {
								assistantMessage = content.text;
							}
						}
					}
				}
				
				this.messages.push({
					role: 'assistant',
					content: assistantMessage
				});
			} catch (error) {
				console.error(error);
				this.messages.push({
					role: 'assistant',
					content: '抱歉，出错了: ' + (error.response?.data?.error?.message || error.message)
				});
			}
			
			this.loading = false;
			this.scrollToBottom();
		},
		scrollToBottom() {
			this.$nextTick(() => {
				this.scrollInto = 'bottom';
			});
		},
		saveConfig() {
			try {
				uni.setStorageSync('aiChatConfig', JSON.stringify(this.config));
				this.showSettings = false;
				
				this.messages = [{
					role: 'assistant',
					content: `你好！我是${this.config.aiName}，有什么我可以帮你的吗？`
				}];
				this.conversationId = null;
				uni.showToast({ title: '保存成功', icon: 'success' });
			} catch(e) {
				uni.showToast({ title: '保存失败', icon: 'none' });
			}
		}
	}
}
</script>

<style>
.container {
	display: flex;
	flex-direction: column;
	height: 100vh;
	background: #fff;
}

.chat-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 40px 20px 15px;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: white;
}

.title {
	font-size: 18px;
	font-weight: bold;
}

.settings-btn {
	font-size: 20px;
}

.chat-messages {
	flex: 1;
	overflow-y: auto;
	padding: 15px;
}

.message {
	display: flex;
	margin-bottom: 15px;
	align-items: flex-start;
}

.message.user {
	flex-direction: row-reverse;
}

.avatar {
	width: 36px;
	height: 36px;
	line-height: 36px;
	text-align: center;
	border-radius: 50%;
	background: #e0e0e0;
	margin: 0 10px;
	font-size: 18px;
	flex-shrink: 0;
}

.message.user .avatar {
	background: #667eea;
}

.message.assistant .avatar {
	background: #4caf50;
}

.content {
	max-width: 70%;
	padding: 12px 16px;
	border-radius: 18px;
	line-height: 1.5;
	word-wrap: break-word;
	font-size: 14px;
}

.message.user .content {
	background: #667eea;
	color: white;
	border-bottom-right-radius: 4px;
}

.message.assistant .content {
	background: #f0f0f0;
	color: #333;
	border-bottom-left-radius: 4px;
}

.typing {
	color: #999;
	font-style: italic;
}

.input-area {
	display: flex;
	padding: 15px;
	background: #fff;
	border-top: 1px solid #eee;
}

.input-area input {
	flex: 1;
	padding: 12px 16px;
	border: 1px solid #ddd;
	border-radius: 25px;
	font-size: 14px;
}

.input-area button {
	margin-left: 10px;
	padding: 12px 24px;
	background: #667eea;
	color: white;
	border: none;
	border-radius: 25px;
	font-size: 14px;
}

.input-area button[disabled] {
	background: #ccc;
}

.modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
}

.modal-content {
	background: white;
	border-radius: 16px;
	padding: 24px;
	width: 90%;
	max-width: 400px;
}

.modal-title {
	display: block;
	text-align: center;
	font-size: 18px;
	font-weight: bold;
	margin-bottom: 20px;
}

.form-group {
	margin-bottom: 16px;
}

.form-group text {
	display: block;
	margin-bottom: 8px;
	font-weight: 500;
}

.form-group input {
	width: 100%;
	padding: 12px;
	border: 1px solid #ddd;
	border-radius: 8px;
	font-size: 14px;
}

.modal-buttons {
	display: flex;
	gap: 10px;
	margin-top: 20px;
}

.save-btn, .cancel-btn {
	flex: 1;
	padding: 12px;
	border: none;
	border-radius: 8px;
	font-size: 14px;
}

.save-btn {
	background: #667eea;
	color: white;
}

.cancel-btn {
	background: #f0f0f0;
}
</style>
