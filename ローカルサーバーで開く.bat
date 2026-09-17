@echo off
chcp 65001 >nul
cd /d "%~dp0"
set PORT=8777

echo タルコフ クエストマップ - ローカルサーバー
echo -------------------------------------------

where py >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:%PORT%/index.html"
  py -m http.server %PORT%
  goto :eof
)

where python >nul 2>nul
if %errorlevel%==0 (
  start "" "http://localhost:%PORT%/index.html"
  python -m http.server %PORT%
  goto :eof
)

echo.
echo Python が見つかりませんでした。
echo 代わりに index.html を直接ブラウザで開きます。
echo （ほとんどの場合これで動きます。データが読めない時だけ Python が必要です）
echo.
start "" "index.html"
pause
