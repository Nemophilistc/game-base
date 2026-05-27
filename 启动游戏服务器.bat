@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════╗
echo ║     MIMO 游戏合集 - HTTP 服务器      ║
echo ╠══════════════════════════════════════╣
echo ║  启动后请打开浏览器访问:             ║
echo ║  http://localhost:8000               ║
echo ║                                      ║
echo ║  按 Ctrl+C 停止服务器                ║
echo ╚══════════════════════════════════════╝
echo.
cd /d "%~dp0"
python -m http.server 8000
if %errorlevel% neq 0 (
    echo.
    echo [错误] Python 未安装或不在 PATH 中
    echo 请安装 Python: https://python.org
    echo.
    pause
)
