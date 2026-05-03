const axios = require('axios');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, 'config.json');

const API_KEY = 'd0355c2c-e49b-4012-a36d-4a165a648ccc';
const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/responses';
const MODEL = 'doubao-seed-2-0-lite-260215';

let config = loadConfig();

function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  }
  return {
    aiName: '豆包',
    userName: '',
    firstMessage: ''
  };
}

function saveConfig() {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let conversationId = null;

function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

function getSystemPrompt() {
  let prompt = `你叫${config.aiName}，是由字节跳动开发的人工智能助手。`;
  if (config.userName) {
    prompt += ` 当前对话的用户叫${config.userName}。`;
  }
  if (config.firstMessage) {
    prompt += ` ${config.firstMessage}`;
  }
  return prompt;
}

async function chatWithAI(userMessage) {
  try {
    const systemPrompt = getSystemPrompt();
    
    const requestData = {
      model: MODEL,
      input: [
        { role: 'system', content: [{ type: 'input_text', text: systemPrompt }], status: 'completed' },
        { role: 'user', content: [{ type: 'input_text', text: userMessage }], status: 'completed' }
      ]
    };

    if (conversationId) {
      requestData.conversation_id = conversationId;
    }

    const response = await axios.post(API_URL, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      timeout: 60000
    });

    if (!conversationId && response.data.conversation_id) {
      conversationId = response.data.conversation_id;
    }

    const output = response.data.output;
    let assistantMessage = '';
    
    for (const item of output) {
      if (item.type === 'message' && item.content) {
        for (const content of item.content) {
          if (content.type === 'output_text') {
            assistantMessage = content.text;
          }
        }
      }
    }

    return assistantMessage;
  } catch (error) {
    if (error.response) {
      console.log('\n❌ API错误:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('\n❌ 网络错误：请检查网络连接');
    } else {
      console.log('\n❌ 错误:', error.message);
    }
    return null;
  }
}

async function showMenu() {
  console.log('\n========== 设置菜单 ==========');
  console.log('1. 设置AI名字（当前: ' + config.aiName + '）');
  console.log('2. 设置你的名字（当前: ' + (config.userName || '未设置') + '）');
  console.log('3. 设置开场白');
  console.log('4. 查看当前设置');
  console.log('5. 清空所有设置');
  console.log('0. 开始对话');
  console.log('================================\n');
}

async function handleSettings() {
  while (true) {
    await showMenu();
    const choice = await ask('请选择 (0-5): ');
    
    switch (choice) {
      case '1':
        const aiName = await ask('请输入AI的新名字: ');
        if (aiName.trim()) {
          config.aiName = aiName.trim();
          saveConfig();
          console.log('✅ AI名字已设置为: ' + config.aiName);
        }
        break;
      case '2':
        const userName = await ask('请输入你的名字: ');
        if (userName.trim()) {
          config.userName = userName.trim();
          saveConfig();
          console.log('✅ 你的名字已设置为: ' + config.userName);
        }
        break;
      case '3':
        const firstMsg = await ask('请输入开场白（直接回车清空）: ');
        config.firstMessage = firstMsg.trim();
        saveConfig();
        console.log('✅ 开场白已更新');
        break;
      case '4':
        console.log('\n========== 当前设置 ==========');
        console.log('AI名字: ' + config.aiName);
        console.log('你的名字: ' + (config.userName || '未设置'));
        console.log('开场白: ' + (config.firstMessage || '无'));
        console.log('================================\n');
        break;
      case '5':
        config = { aiName: '豆包', userName: '', firstMessage: '' };
        saveConfig();
        console.log('✅ 已清空所有设置');
        break;
      case '0':
        return;
      default:
        console.log('无效选择，请重试');
    }
  }
}

async function chat() {
  console.log('\n🤖 ' + config.aiName + 'AI对话终端');
  console.log('==================');
  console.log('输入你的问题，按回车发送');
  console.log('输入 "exit" 或 "再见" 退出对话');
  console.log('输入 "set" 进入设置菜单\n');

  while (true) {
    const userInput = await ask('\n👤 ' + (config.userName || '你') + ': ');

    if (!userInput.trim()) continue;
    if (userInput.toLowerCase() === 'set') {
      await handleSettings();
      continue;
    }
    if (userInput.toLowerCase() === 'exit'|| userInput.toLowerCase() === '再见') {
      console.log('\n👋 再见！');
      rl.close();
      break;
    }

    process.stdout.write('\n🤖 ' + config.aiName + ': ');
    const response = await chatWithAI(userInput);

    if (response) {
      console.log(response);
    } else {
      console.log('（回复失败，请重试）');
    }
  }
}

async function main() {
  console.log('\n欢迎使用AI对话终端！\n');
  await handleSettings();
  await chat();
}

main();
