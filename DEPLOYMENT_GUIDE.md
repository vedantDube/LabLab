# CarbonTwin Deployment Guide

## 🌐 Deployment Architecture
- **Frontend**: Vercel (React app)
- **Backend**: Railway/Render (Python Flask API)
- **Database**: PostgreSQL (Railway/Render) or SQLite (simple option)
- **Authentication**: Clerk (already configured)
- **Blockchain**: Ethereum via Infura

## 📋 Prerequisites Checklist
- [ ] GitHub repository with latest code
- [ ] Clerk account with publishable and secret keys
- [ ] Infura account for Ethereum connectivity
- [ ] Smart contract deployed (optional for initial deployment)

---

## 🎯 **STEP 1: Deploy Backend (Python API)**

### Option A: Railway (Recommended)
1. **Sign up**: Go to [railway.app](https://railway.app)
2. **Connect GitHub**: Link your repository
3. **Deploy**: Select your repo → Choose `backend` folder
4. **Environment Variables**: Add all backend .env variables in Railway dashboard

### Option B: Render
1. **Sign up**: Go to [render.com](https://render.com)
2. **New Web Service**: Connect GitHub → Select repo
3. **Settings**:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python app.py`
   - Root Directory: `backend`

### Backend Environment Variables (Railway/Render):
```bash
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here
CHATGPT5_API_KEY=7b539a42e26f42e6a62c4f64ae4ded71
SECRET_KEY=your_strong_production_secret_key
JWT_SECRET=your_jwt_secret_key
DATABASE_URL=postgresql://user:pass@host:port/database
FLASK_ENV=production
FLASK_DEBUG=False
PORT=5000
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID
PRIVATE_KEY=your_ethereum_private_key
CONTRACT_ADDRESS=your_deployed_contract_address
```

---

## 🎯 **STEP 2: Deploy Frontend (React App)**

### Vercel Deployment (Recommended)
1. **Sign up**: Go to [vercel.com](https://vercel.com)
2. **Import Project**: Connect GitHub → Select your repository
3. **Framework**: Auto-detected as Create React App
4. **Root Directory**: Set to `frontend`
5. **Build Settings**:
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

### Frontend Environment Variables (Vercel):
```bash
REACT_APP_API_URL=https://your-backend-url.railway.app
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_test_cHJpbWFyeS1zY29ycGlvbi00OC5jbGVyay5hY2NvdW50cy5kZXYk
REACT_APP_CHATGPT5_API_KEY=7b539a42e26f42e6a62c4f64ae4ded71
REACT_APP_VERSION=1.0.0
REACT_APP_ENVIRONMENT=production
REACT_APP_BLOCKCHAIN_NETWORK_ID=1
REACT_APP_CONTRACT_ADDRESS=your_deployed_contract_address_here
```

---

## 🎯 **STEP 3: Configure Domain & SSL**

### Vercel (Frontend)
- Custom domain: Add in Vercel dashboard
- SSL: Automatically provided

### Railway/Render (Backend)
- Custom domain: Available in dashboard
- SSL: Automatically provided

---

## 🎯 **STEP 4: Database Setup**

### Option A: Railway PostgreSQL
1. Add PostgreSQL service in Railway
2. Copy connection string to `DATABASE_URL`

### Option B: Keep SQLite (Simple)
- No changes needed
- Database file will be created automatically

---

## 🎯 **STEP 5: Post-Deployment Setup**

### 1. Update CORS Settings
Ensure backend allows your frontend domain:
```python
CORS(app, origins=["https://your-frontend-domain.vercel.app"])
```

### 2. Update Clerk Settings
- Add your production domains to Clerk dashboard
- Update redirect URLs

### 3. Test Authentication
- Sign up/Sign in flow
- API connectivity
- Blockchain features (if implemented)

---

## 🔧 **Deployment Commands**

### Local Development
```bash
# Backend
cd backend
python app.py

# Frontend  
cd frontend
npm start
```

### Production Build Test
```bash
# Frontend
cd frontend
npm run build
npx serve -s build
```

---

## 🚨 **Important Security Notes**

1. **Never commit sensitive keys** to GitHub
2. **Use environment variables** for all secrets
3. **Set strong SECRET_KEY** for production
4. **Enable HTTPS** everywhere
5. **Rotate API keys** regularly

---

## 📊 **Cost Estimates**

### Free Tier Limits:
- **Vercel**: 100GB bandwidth/month
- **Railway**: $5/month for starter plan
- **Render**: Free tier available
- **Clerk**: 5,000 MAU free
- **Infura**: 100,000 requests/day free

---

## 🐛 **Troubleshooting**

### Common Issues:
1. **CORS errors**: Check backend CORS configuration
2. **Build failures**: Check package.json and dependencies
3. **Environment variables**: Ensure all required vars are set
4. **Database connections**: Verify DATABASE_URL format
5. **Authentication issues**: Check Clerk domain settings

### Debugging Steps:
1. Check deployment logs in platform dashboards
2. Test API endpoints directly
3. Verify environment variables are loaded
4. Check network requests in browser dev tools

---

## 📞 **Support Resources**

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [Clerk Documentation](https://clerk.com/docs)
- [Render Documentation](https://render.com/docs)

---

## ✅ **Deployment Checklist**

- [ ] Backend deployed and running
- [ ] Frontend deployed and accessible
- [ ] Environment variables configured
- [ ] Database connected
- [ ] Authentication working
- [ ] Custom domains configured (optional)
- [ ] SSL certificates active
- [ ] Error monitoring setup (optional)
