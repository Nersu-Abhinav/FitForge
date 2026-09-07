@echo off
set "JAVA_HOME=C:\Program Files\Java\jdk-21"
set "ANDROID_HOME=C:\Users\hp\AppData\Local\Android\Sdk"
set "PATH=C:\Program Files\Java\jdk-21\bin;%PATH%"

cd /d "c:\Users\hp\Desktop\FitForge\android"
call gradlew.bat assembleDebug > "c:\Users\hp\Desktop\FitForge\build.log" 2>&1
echo BUILD_FINISHED_WITH_CODE_%ERRORLEVEL% >> "c:\Users\hp\Desktop\FitForge\build.log"
