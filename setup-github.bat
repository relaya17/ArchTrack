@echo off
echo ========================================
echo    ArchTrack - GitHub Setup Script
echo ========================================
echo.

echo Step 1: Checking Git status...
git status
echo.

echo Step 2: Current remote configuration...
git remote -v
echo.

echo Step 3: Please follow these steps manually:
echo.
echo 1. Go to https://github.com/new
echo 2. Create a new repository named "ArchTrack"
echo 3. DO NOT initialize with README (we already have files)
echo 4. Copy the repository URL (it will look like: https://github.com/YOUR_USERNAME/ArchTrack.git)
echo 5. Come back here and press any key to continue
echo.
pause

echo.
echo Step 4: Please enter your GitHub username:
set /p GITHUB_USERNAME=Username: 

echo.
echo Step 5: Setting up remote repository...
git remote remove origin 2>nul
git remote add origin https://github.com/%GITHUB_USERNAME%/ArchTrack.git

echo.
echo Step 6: Pushing to GitHub...
git push -u origin main

echo.
echo ========================================
echo    Setup Complete!
echo ========================================
echo Your repository is now available at:
echo https://github.com/%GITHUB_USERNAME%/ArchTrack
echo.
pause
