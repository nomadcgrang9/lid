@echo off
cd /d C:\PRODUCT\LID
call npx vite build
if exist dist\index.html (
    echo BUILD_SUCCESS
    call npx firebase deploy --only hosting
) else (
    echo BUILD_FAILED
)
