@echo off
chcp 65001 >nul
title ساخت نسخه ویندوزی - سامانه ارزیابی ریسک
cd /d "%~dp0"

echo ============================================================
echo   ساخت نسخه ویندوزی سامانه پیشنهادات ارزیابی ریسک
echo ============================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [خطا] Node.js روی این سیستم نصب نیست.
  echo لطفا نسخه LTS را از https://nodejs.org نصب کنید و دوباره اجرا کنید.
  echo.
  pause
  exit /b 1
)

echo [1/3] نصب پیش‌نیازها...
call npm install
if errorlevel 1 goto fail

echo.
echo [2/3] ساخت فایل اجرایی ویندوز...
call npm run dist
if errorlevel 1 goto fail

echo.
echo [3/3] پایان.
echo فایل‌های خروجی در پوشه release ساخته شدند:
echo   - RiskSuggestions Setup 1.0.0.exe   (نصب‌کننده)
echo   - RiskSuggestions-Portable-1.0.0.exe (نسخه پرتابل، بدون نصب)
echo.
start "" "%~dp0release"
pause
exit /b 0

:fail
echo.
echo [خطا] ساخت برنامه با مشکل مواجه شد. متن خطای بالا را بررسی کنید.
echo.
pause
exit /b 1
