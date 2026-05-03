@echo off
chcp 65001 >nul
title AI Chat - MiMo & DeepSeek

echo.
echo   ╔══════════════════════════════════╗
echo   ║   🤖 AI 聊天网站启动中...      ║
echo   ╚══════════════════════════════════╝
echo.
echo   📡 正在启动代理服务器...

start "AI-Proxy" cmd /c "node proxy-server.js"

timeout /t 2 /nobreak >nul

echo   🌐 正在打开网站...
start "" "ai-chat.html"

echo.
echo   ✅ 启动完成！现在可以开始聊天了
echo.
echo   💡 提示：
echo      - 点击右上角 ⚙️ 设置 API Key
echo      - 顶部切换 MiMo / DeepSeek V4
echo      - 关闭此窗口不会影响使用
echo.
pause
