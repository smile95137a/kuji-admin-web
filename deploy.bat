@echo off
chcp 65001 >nul
cls

echo ========================================
echo   Kuji Admin Web - Deploy to EC2
echo ========================================
echo.

set PEM=C:\Users\user\OneDrive\Desktop\dream\ourkuji\ourkuji.pem
set HOST=ec2-user@18.179.187.129
set PROJECT=%~dp0

echo [1/5] Building...
cd /d "%PROJECT%"
if exist dist rd /s /q dist
if exist dist.zip del /f /q dist.zip
call npx vite build --mode production
if errorlevel 1 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)

echo [2/5] Creating ZIP...
powershell -Command "Compress-Archive -Path dist -DestinationPath dist.zip -Force"

echo [3/5] Uploading to EC2...
scp -i "%PEM%" "%PROJECT%dist.zip" %HOST%:/tmp/

echo [4/5] Deploying on EC2...
ssh -i "%PEM%" %HOST% "cd /tmp && rm -rf dist && unzip -q -o dist.zip && sudo rm -rf /var/www/kuji-admin/* && sudo cp -r /tmp/dist/* /var/www/kuji-admin/ && sudo chown -R nginx:nginx /var/www/kuji-admin"

echo [5/5] Restarting Nginx...
ssh -i "%PEM%" %HOST% "sudo systemctl restart nginx"

echo.
echo ========================================
echo   Deploy Complete!
echo ========================================
echo   URL: http://18.179.187.129/kuji/
echo ========================================
echo.
echo Press Ctrl+Shift+R in browser to refresh
echo.
pause
