@echo off
cd /d C:\PRODUCT\LID
call npx vite build > build_output.txt 2>&1
if exist dist\index.html (
    echo BUILD_SUCCESS >> build_output.txt
    call npx firebase deploy --only hosting >> build_output.txt 2>&1
    echo DEPLOY_DONE >> build_output.txt
) else (
    echo BUILD_FAILED >> build_output.txt
)
echo ALL_DONE >> build_output.txt
