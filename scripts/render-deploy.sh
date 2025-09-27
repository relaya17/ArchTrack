#!/bin/bash

# Render Deployment Script for ArchTrack
# This script helps deploy the application to Render

echo "🚀 Starting ArchTrack deployment to Render..."

# Check if git is clean
if [[ -n $(git status -s) ]]; then
    echo "⚠️  Warning: You have uncommitted changes. Please commit them first."
    git status -s
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled."
        exit 1
    fi
fi

# Check if we're on main branch
current_branch=$(git branch --show-current)
if [[ "$current_branch" != "main" ]]; then
    echo "⚠️  Warning: You're not on the main branch (currently on: $current_branch)"
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled."
        exit 1
    fi
fi

# Test build locally first
echo "🔨 Testing build locally..."
if ! pnpm build; then
    echo "❌ Build failed locally. Please fix the issues before deploying."
    exit 1
fi

echo "✅ Local build successful!"

# Push to main branch
echo "📤 Pushing to main branch..."
git push origin main

if [[ $? -eq 0 ]]; then
    echo "✅ Successfully pushed to main branch!"
    echo "🌐 Render will automatically deploy your changes."
    echo "📊 You can monitor the deployment at: https://dashboard.render.com"
    echo ""
    echo "🔗 Your services will be available at:"
    echo "   Backend: https://archtrack-backend.onrender.com"
    echo "   Frontend: https://archtrack-frontend.onrender.com"
    echo ""
    echo "📋 Health check endpoints:"
    echo "   Backend: https://archtrack-backend.onrender.com/api/health"
    echo "   Frontend: https://archtrack-frontend.onrender.com/api/health"
else
    echo "❌ Failed to push to main branch."
    exit 1
fi
