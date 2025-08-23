@echo off
REM CarbonTwin Development Setup Script for Windows

echo 🌍 Setting up CarbonTwin - AI-Powered Carbon Management Platform
echo ==================================================

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python is not installed. Please install Python 3.8+ first.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ first.
    pause
    exit /b 1
)

echo ✅ Prerequisites check passed

REM Backend Setup
echo.
echo 🔧 Setting up Backend...
cd backend

REM Create virtual environment
python -m venv venv
call venv\Scripts\activate

REM Install Python dependencies
pip install -r requirements.txt

REM Create .env file if it doesn't exist
if not exist .env (
    copy .env.example .env
    echo 📝 Created .env file. Please update it with your API keys.
)

echo ✅ Backend setup complete

REM Frontend Setup
echo.
echo 🎨 Setting up Frontend...
cd ..\frontend

REM Install Node.js dependencies
npm install

REM Create .env file if it doesn't exist
if not exist .env (
    copy .env.example .env
    echo 📝 Created frontend .env file. Please update it with your configuration.
)

echo ✅ Frontend setup complete

REM Final instructions
echo.
echo 🚀 Setup Complete!
echo ==================================================
echo.
echo Next steps:
echo 1. Update backend\.env with your ChatGPT-5 API key
echo 2. Update frontend\.env with your configuration
echo 3. Start the backend: cd backend ^&^& python app.py
echo 4. Start the frontend: cd frontend ^&^& npm start
echo.
echo 📚 Documentation: README.md
echo 🐛 Issues: https://github.com/your-repo/issues
echo.
echo Happy coding! 🌱
pause
