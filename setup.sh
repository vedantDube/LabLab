#!/bin/bash

# CarbonTwin Development Setup Script

echo "🌍 Setting up CarbonTwin - AI-Powered Carbon Management Platform"
echo "=================================================="

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Backend Setup
echo ""
echo "🔧 Setting up Backend..."
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # For macOS/Linux
# For Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created .env file. Please update it with your API keys."
fi

echo "✅ Backend setup complete"

# Frontend Setup
echo ""
echo "🎨 Setting up Frontend..."
cd ../frontend

# Install Node.js dependencies
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created frontend .env file. Please update it with your configuration."
fi

echo "✅ Frontend setup complete"

# Final instructions
echo ""
echo "🚀 Setup Complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Update backend/.env with your ChatGPT-5 API key"
echo "2. Update frontend/.env with your configuration"
echo "3. Start the backend: cd backend && python app.py"
echo "4. Start the frontend: cd frontend && npm start"
echo ""
echo "📚 Documentation: README.md"
echo "🐛 Issues: https://github.com/your-repo/issues"
echo ""
echo "Happy coding! 🌱"
