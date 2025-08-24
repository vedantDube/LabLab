#!/bin/bash

# CarbonTwin Deployment Script
echo "🚀 Starting CarbonTwin deployment preparation..."

# Check if required tools are installed
echo "📋 Checking prerequisites..."

# Check if git is available
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if python is available
if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
    echo "❌ Python is not installed. Please install Python first."
    exit 1
fi

echo "✅ Prerequisites check passed!"

# Build frontend
echo "🔨 Building frontend..."
cd frontend
npm install
npm run build
cd ..

echo "✅ Frontend build completed!"

# Check backend dependencies
echo "🔨 Installing backend dependencies..."
cd backend
pip install -r requirements.txt
cd ..

echo "✅ Backend dependencies installed!"

# Git operations
echo "📦 Preparing Git repository..."
git add .
git commit -m "Deployment preparation: $(date)"

echo "🎉 Deployment preparation complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Push to GitHub: git push origin main"
echo "2. Deploy backend to Railway/Render"
echo "3. Deploy frontend to Vercel"
echo "4. Configure environment variables"
echo "5. Update domain settings in Clerk"
echo ""
echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions"
