@echo off
echo ========================================
echo    ArchTrack - Auto Upload to GitHub
echo ========================================
echo.

echo Step 1: Checking current status...
git status
echo.

echo Step 2: Attempting to create repository via GitHub API...
echo This will open GitHub in your browser to create the repository.
echo.

echo Step 3: Opening GitHub repository creation page...
start https://github.com/new

echo.
echo Step 4: Please follow these steps:
echo 1. Repository name: ArchTrack
echo 2. Description: ArchTrack - Architecture Tracking Application
echo 3. Make it Public
echo 4. DO NOT check "Add a README file"
echo 5. DO NOT check "Add .gitignore"
echo 6. Click "Create repository"
echo.

echo Step 5: After creating the repository, press any key to continue...
pause

echo.
echo Step 6: Attempting to push to GitHub...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo    SUCCESS! Repository uploaded!
    echo ========================================
    echo Your repository is now available at:
    echo https://github.com/relaya17/ArchTrack
    echo.
) else (
    echo.
    echo ========================================
    echo    ERROR: Failed to upload
    echo ========================================
    echo Please check:
    echo 1. Did you create the repository on GitHub?
    echo 2. Are you logged in to GitHub?
    echo 3. Do you have the correct permissions?
    echo.
)

echo Press any key to exit...
pause
