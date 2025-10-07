#!/bin/bash

# ArchTrack Render Setup Script
# This script helps set up the project for Render deployment

echo "🚀 ArchTrack Render Setup"
echo "========================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ Error: pnpm is not installed. Please install pnpm first."
    echo "   npm install -g pnpm@8.15.0"
    exit 1
fi

echo "✅ Project structure verified"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Build the project
echo "🔨 Building project..."
pnpm build

if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

# Check if render.yaml exists
if [ ! -f "render.yaml" ]; then
    echo "❌ Error: render.yaml not found. Please ensure it's in the project root."
    exit 1
fi

echo "✅ render.yaml found"

# Check if environment file exists
if [ ! -f "env.render" ]; then
    echo "❌ Error: env.render not found. Please ensure it's in the project root."
    exit 1
fi

echo "✅ env.render found"

# Display next steps
echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Push your code to GitHub:"
echo "   git add ."
echo "   git commit -m 'Add Render deployment configuration'"
echo "   git push origin main"
echo ""
echo "2. Go to Render Dashboard:"
echo "   https://dashboard.render.com"
echo ""
echo "3. Create a new Blueprint:"
echo "   - Click 'New Blueprint'"
echo "   - Connect your GitHub repository"
echo "   - Render will automatically create all services"
echo ""
echo "4. Configure environment variables:"
echo "   - Copy variables from env.render"
echo "   - Set them in Render dashboard"
echo ""
echo "5. Deploy:"
echo "   - Render will automatically deploy on push to main"
echo ""
echo "📚 For detailed instructions, see RENDER_DEPLOYMENT.md"
echo ""
echo "🔗 Useful links:"
echo "   - Render Dashboard: https://dashboard.render.com"
echo "   - Render Docs: https://render.com/docs"
echo "   - ArchTrack Repository: https://github.com/your-username/ArchTrack"
