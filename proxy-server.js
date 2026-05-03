const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3456;
const TIMEOUT = 60000;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: '仅支持 POST 请求' }));
    return;
  }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try {
      const parsed = JSON.parse(body);
      const { targetUrl, apiKey, body: requestBody } = parsed;

      if (!targetUrl) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '缺少 targetUrl 参数' }));
        return;
      }

      console.log(`→ ${new Date().toLocaleTimeString()} 转发请求: ${targetUrl}`);
      console.log(`  消息长度: ${requestBody.length} 字符`);

      const parsedUrl = url.parse(targetUrl);
      const isHttps = parsedUrl.protocol === 'https:';

      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.path,
        method: 'POST',
        timeout: TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(requestBody)
        }
      };

      const proxyReq = (isHttps ? https : http).request(options, (proxyRes) => {
        let data = '';
        proxyRes.on('data', chunk => data += chunk);
        proxyRes.on('end', () => {
          console.log(`← ${proxyRes.statusCode} ${data.substring(0, 150)}...`);
          res.writeHead(proxyRes.statusCode, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(data);
        });
        proxyRes.on('error', (err) => {
          console.error('响应流错误:', err.message);
          if (!res.headersSent) {
            res.writeHead(502, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `上游响应错误: ${err.message}` }));
          }
        });
      });

      proxyReq.on('timeout', () => {
        console.error('请求超时');
        proxyReq.destroy();
        if (!res.headersSent) {
          res.writeHead(504, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'API 请求超时 (60s)' }));
        }
      });

      proxyReq.on('error', (err) => {
        console.error('代理请求失败:', err.message);
        if (!res.headersSent) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: `代理请求失败: ${err.message}` }));
        }
      });

      proxyReq.write(requestBody);
      proxyReq.end();

    } catch (err) {
      console.error('请求解析失败:', err.message);
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `请求解析失败: ${err.message}` }));
    }
  });
});

server.on('error', (err) => {
  console.error('服务器错误:', err.message);
});

server.listen(PORT, () => {
  console.log(`\n  🔑 AI 代理服务器已启动: http://localhost:${PORT}`);
  console.log(`  ⏱️  超时时间: ${TIMEOUT / 1000}s\n`);
  console.log('  现在可以打开 ai-chat.html 使用了\n');
  console.log('  按 Ctrl+C 停止服务器\n');
});

process.on('uncaughtException', (err) => {
  console.error('未捕获异常:', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('未处理的 Promise 拒绝:', reason);
});
