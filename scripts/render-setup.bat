@echo off
REM ArchTrack Render Setup Script for Windows
REM This script helps set up the project for Render deployment

echo 🚀 ArchTrack Render Setup
echo =========================

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the project root directory
    pause
    exit /b 1
)

REM Check if pnpm is installed
pnpm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: pnpm is not installed. Please install pnpm first.
    echo    npm install -g pnpm@8.15.0
    pause
    exit /b 1
)

echo ✅ Project structure verified

REM Install dependencies
echo 📦 Installing dependencies...
pnpm install

REM Build the project
echo 🔨 Building project...
pnpm build

if errorlevel 1 (
    echo ❌ Build failed. Please check the errors above.
    pause
    exit /b 1
)

echo ✅ Build successful

REM Check if render.yaml exists
if not exist "render.yaml" (
    echo ❌ Error: render.yaml not found. Please ensure it's in the project root.
    pause
    exit /b 1
)

echo ✅ render.yaml found

REM Check if environment file exists
if not exist "env.render" (
    echo ❌ Error: env.render not found. Please ensure it's in the project root.
    pause
    exit /b 1
)

echo ✅ env.render found

REM Display next steps
echo.
echo 🎉 Setup completed successfully!
echo.
echo Next steps:
echo 1. Push your code to GitHub:
echo    git add .
echo    git commit -m "Add Render deployment configuration"
echo    git push origin main
echo.
echo 2. Go to Render Dashboard:
echo    https://dashboard.render.com
echo.
echo 3. Create a new Blueprint:
echo    - Click "New Blueprint"
echo    - Connect your GitHub repository
echo    - Render will automatically create all services
echo.
echo 4. Configure environment variables:
echo    - Copy variables from env.render
echo    - Set them in Render dashboard
echo.
echo 5. Deploy:
echo    - Render will automatically deploy on push to main
echo.
echo 📚 For detailed instructions, see RENDER_DEPLOYMENT.md
echo.
echo 🔗 Useful links:
echo    - Render Dashboard: https://dashboard.render.com
echo    - Render Docs: https://render.com/docs
echo    - ArchTrack Repository: https://github.com/your-username/ArchTrack

pause
