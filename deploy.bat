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
set NGINX_CONFIG=C:\Users\user\kuji-client\kuji-client\deploy\conf.d\kuji-admin.conf

echo [1/6] Updating Nginx config...
if exist "%NGINX_CONFIG%" (
    scp -i "%PEM%" "%NGINX_CONFIG%" %HOST%:/tmp/
    ssh -i "%PEM%" %HOST% "sudo cp /tmp/kuji-admin.conf /etc/nginx/conf.d/ && sudo nginx -t"
    if errorlevel 1 (
        echo [ERROR] Nginx config test failed!
        pause
        exit /b 1
    )
)

echo [2/6] Building...
cd /d "%PROJECT%"
if exist dist rd /s /q dist
if exist dist.zip del /f /q dist.zip
call npx vite build --mode production
if errorlevel 1 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)

echo [3/6] Creating ZIP...
powershell -Command "Compress-Archive -Path dist -DestinationPath dist.zip -Force"

echo [4/6] Uploading to EC2...
scp -i "%PEM%" "%PROJECT%dist.zip" %HOST%:/tmp/admin-dist.zip

echo [5/6] Deploying on EC2...
ssh -i "%PEM%" %HOST% "cd /tmp && rm -rf admin-dist && unzip -q -o admin-dist.zip -d admin-dist && sudo rm -rf /var/www/kuji-admin/* && sudo cp -r /tmp/admin-dist/dist/* /var/www/kuji-admin/ && sudo chown -R nginx:nginx /var/www/kuji-admin"

echo [6/6] Restarting Nginx...
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
