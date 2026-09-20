@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo ============================================
echo  Astral Blaze Client - Production Build
echo  Minecraft Fabric 1.21.11
echo ============================================
echo.

where java >nul 2>&1
if errorlevel 1 (
    echo ERROR: Java was not found on PATH.
    echo Install Temurin or Oracle JDK 21+, then retry.
    exit /b 1
)

echo [1/5] Java
java -version
echo.

echo [2/5] Gradle build
call gradlew.bat build --no-daemon
if errorlevel 1 (
    echo.
    echo BUILD FAILED. Compilation errors are listed above.
    exit /b 1
)

echo.
echo [3/5] Locate release JAR
set "JAR="
for %%F in (build\libs\Astral-Blaze-Client-1.0.0+1.21.11.jar) do set "JAR=%%F"
if not exist "%JAR%" (
    echo ERROR: Expected JAR was not produced: build\libs\Astral-Blaze-Client-1.0.0+1.21.11.jar
    echo Contents of build\libs:
    dir /b build\libs
    exit /b 1
)

echo Found %JAR%

echo.
echo [4/5] Stage release folder
if exist release rmdir /s /q release
mkdir release
copy /y "%JAR%" "release\Astral-Blaze-Client-1.0.0+1.21.11.jar" >nul
(
    echo Astral Blaze Client 1.0.0
    echo Minecraft 1.21.11 / Fabric
    echo.
    echo Place the JAR into .minecraft\mods together with Fabric API.
    echo Open the client with Right Shift. See README.md for details.
) > release\README.txt

echo.
echo [5/5] Create Astral-Blaze-Client-1.21.11.zip
if exist Astral-Blaze-Client-1.21.11.zip del /f /q Astral-Blaze-Client-1.21.11.zip
powershell -NoProfile -Command "Compress-Archive -Path 'release\Astral-Blaze-Client-1.0.0+1.21.11.jar','release\README.txt' -DestinationPath 'Astral-Blaze-Client-1.21.11.zip' -Force"
if errorlevel 1 (
    echo ERROR: Failed to create the release ZIP.
    exit /b 1
)

echo.
echo Done.
echo   JAR : release\Astral-Blaze-Client-1.0.0+1.21.11.jar
echo   ZIP : Astral-Blaze-Client-1.21.11.zip
echo.
exit /b 0
