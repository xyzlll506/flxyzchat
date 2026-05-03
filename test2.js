const axios = require('axios');

const API_KEY = 'd0355c2c-e49b-4012-a36d-4a165a648ccc';
const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/responses';
const MODEL = 'doubao-seed-2-0-lite-260215';

let conversationId = null;

async function chat(message) {
  try {
    const requestData = {
      model: MODEL,
      input: [{
        role: 'user',
        content: [{ type: 'input_text', text: message }],
        status: 'completed'
      }]
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
      console.log('会话ID:', conversationId);
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
    console.log('❌ 错误:', JSON.stringify(error.response?.data || error.message, null, 2));
    return null;
  }
}

async function test() {
  console.log('=== 测试多轮对话 ===\n');
  
  console.log('第一轮...');
  const r1 = await chat('你好');
  console.log('回复:', r1);

  console.log('\n第二轮...');
  const r2 = await chat('你叫什么名字？');
  console.log('回复:', r2);

  console.log('\n第三轮...');
  const r3 = await chat('我是谁？');
  console.log('回复:', r3);
}

test();
