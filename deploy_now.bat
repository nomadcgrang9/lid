@echo off
cd /d C:\PRODUCT\LID
echo STARTING_BUILD > deploy_status.txt
call npx vite build >> deploy_status.txt 2>&1
if exist dist\index.html (
    echo BUILD_SUCCESS >> deploy_status.txt
    call npx firebase deploy --only hosting >> deploy_status.txt 2>&1
    echo DEPLOY_COMPLETE >> deploy_status.txt
) else (
    echo BUILD_FAILED >> deploy_status.txt
)
