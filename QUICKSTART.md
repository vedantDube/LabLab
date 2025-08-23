# 🚀 CarbonTwin Quick Start Guide

## Prerequisites

- Python 3.8+
- Node.js 16+
- ChatGPT-5 API Key
- Git

## 1. Setup Instructions

### Option A: Automated Setup (Recommended)

```bash
# For Windows
./setup.bat

# For macOS/Linux
chmod +x setup.sh
./setup.sh
```

### Option B: Manual Setup

#### Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

#### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
```

## 2. Configuration

### Backend Configuration (backend/.env)

```env
CHATGPT5_API_KEY=your_chatgpt5_api_key_here
SECRET_KEY=your_secret_key_here
DATABASE_URL=sqlite:///carbontwin.db
```

### Frontend Configuration (frontend/.env)

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_CHATGPT5_API_KEY=your_chatgpt5_api_key_here
```

## 3. Launch Application

### Terminal 1 - Backend

```bash
cd backend
python app.py
```

### Terminal 2 - Frontend

```bash
cd frontend
npm start
```

## 4. Access Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 5. Key Features to Test

### 🌍 Emission Tracker

1. Go to "Emissions" tab
2. Fill out emission report form
3. Submit for ChatGPT-5 verification
4. View AI analysis results

### 🔗 Digital Twin

1. Go to "Digital Twin" tab
2. Create facility digital twin
3. Run carbon optimization scenarios
4. View AI-powered simulation results

### 📊 Dashboard

- View real-time platform statistics
- Monitor AI verification metrics
- Track environmental impact

## 6. Troubleshooting

### Common Issues

**Import errors in React:**

```bash
cd frontend
npm install --force
```

**Python module not found:**

```bash
cd backend
pip install -r requirements.txt
```

**Database errors:**

```bash
cd backend
rm carbontwin.db  # Reset database
python app.py     # Recreate database
```

## 7. Architecture Overview

```
CarbonTwin/
├── backend/          # Python Flask API
│   ├── app.py       # Main application
│   └── .env         # Configuration
├── frontend/        # React TypeScript app
│   ├── src/         # Source code
│   └── .env         # Configuration
├── contracts/       # Smart contracts
│   └── CarbonTracker.sol
└── README.md
```

## 8. Key Technologies

- **AI**: ChatGPT-5 API for verification & analysis
- **Backend**: Python Flask + SQLite
- **Frontend**: React + TypeScript + Tailwind CSS
- **Blockchain**: Ethereum smart contracts
- **Real-time**: Socket.IO for live updates

## 9. API Endpoints

- `POST /api/verify-emission` - AI emission verification
- `POST /api/create-twin` - Create digital twin
- `POST /api/simulate/{twin_id}` - Run scenarios
- `GET /api/dashboard/{twin_id}` - Dashboard data
- `GET /api/reports/summary` - Platform summary

## 10. Next Steps

1. **Add your ChatGPT-5 API key** in both .env files
2. **Test emission verification** with sample data
3. **Create digital twin** for your facility
4. **Run optimization scenarios** to see AI recommendations
5. **Explore blockchain integration** for immutable records

## 📞 Support

- **Documentation**: README.md
- **Issues**: Create GitHub issue
- **Discord**: [Join our community]

---

**Built with ❤️ for a sustainable future** 🌱
