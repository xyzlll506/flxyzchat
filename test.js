const axios = require('axios');

const API_KEY = 'd0355c2c-e49b-4012-a36d-4a165a648ccc';
const API_URL = 'https://ark.cn-beijing.volces.com/api/v3/responses';
const MODEL = 'doubao-seed-2-0-lite-260215';

async function test() {
  try {
    const response = await axios.post(API_URL, {
      model: MODEL,
      input: [{ role: 'user', content: [{ type: 'input_text', text: '你好' }] }]
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      timeout: 30000
    });

    console.log('✅ 成功！');
    console.log('完整返回:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ 失败:');
    if (error.response) {
      console.log(JSON.stringify(error.response.data, null, 2));
    } else {
      console.log(error.message);
    }
  }
}

test();
