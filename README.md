# 🚀 Syzr - Returns Intelligence Platform

**Automatically tells fashion brands why products are being returned and what to fix next—using fit and returns intelligence, not dashboards.**

## What You Have

This is a **complete, working system** ready to deploy:

- ✅ **Backend API** - Node.js + Express
- ✅ **Shopify Integration** - OAuth + data sync
- ✅ **Insight Engine** - Automated analysis
- ✅ **Database Schema** - PostgreSQL (Supabase)
- ✅ **Frontend** - Beautiful React UI
- ✅ **Deployment Ready** - Railway + Vercel

---

## 🎯 Quick Start (3 Steps)

### 1. Set Up Database (5 minutes)

```bash
# Go to https://supabase.com
# Create new project
# Run schema.sql in SQL Editor
# Copy API keys
```

### 2. Deploy Backend (10 minutes)

```bash
# Push to GitHub
git init
git add .
git commit -m "Initial commit"
git push

# Deploy on Railway
# Connect GitHub repo
# Add environment variables from .env.example
# Deploy
```

### 3. Deploy Frontend (5 minutes)

```bash
# Deploy on Vercel
# Connect GitHub repo
# Add REACT_APP_API_URL environment variable
# Deploy
```

**Total time: ~20 minutes to live**

---

## 📁 Project Structure

```
syzr/
├── syzr-backend/
│   ├── server.js           # Main API server
│   ├── insight-engine.js   # Intelligence generation
│   ├── schema.sql          # Database setup
│   ├── package.json        # Dependencies
│   └── .env.example        # Config template
│
├── syzr-app.jsx           # React frontend
├── DEPLOYMENT_GUIDE.md    # Complete setup guide
└── README.md              # This file
```

---

## 🔑 Key Features

### **Zero Exploration Burden**
- Insights auto-generated and prioritized
- 30 seconds to actionable information
- No dashboard digging required

### **Backward-Looking Fit Intelligence**
- Specific measurements: "Thigh 22.5\" → Should be 23.25\""
- Manufacturing notes for factory
- Design actions with exact specs

### **Differentiation from Competitors**
- Returns apps: Only say "poor fit" ❌
- Fit rec tools: Only work forward ❌
- Analytics dashboards: Require manual exploration ❌
- **Syzr: Automatic backward analysis with specific fixes** ✅

---

## 🛠️ Tech Stack

| Component | Technology | Why |
|-----------|-----------|-----|
| Frontend | React | Fast, modern, component-based |
| Backend | Node.js + Express | Simple, scalable API |
| Database | PostgreSQL (Supabase) | Relational, real-time, built-in auth |
| Hosting | Railway + Vercel | Easy deploy, auto-scaling |
| Auth | Shopify OAuth | Native integration |
| Payments | Stripe | Industry standard |

---

## 📊 API Endpoints

```
# Authentication
GET  /auth/shopify              # Start OAuth flow
GET  /auth/shopify/callback     # OAuth callback

# Data Sync
POST /sync/:shop                # Sync orders & refunds

# Insights
GET  /api/insights/:shop        # Get all insights
GET  /api/metrics/:shop         # Get dashboard metrics
PATCH /api/insights/:id/status  # Update insight status

# Health
GET  /health                    # Server health check
```

---

## 🎨 Frontend Features

- **Live Metrics Dashboard** - Return rate, savings, active insights
- **Priority Insight Feed** - Sorted by financial impact
- **Detailed Insight Modals** - Full analysis with actions
- **Status Filtering** - Open, Investigating, Addressed
- **Responsive Design** - Works on desktop and mobile
- **Beautiful Animations** - Smooth, professional UX

---

## 📦 Dependencies

### Backend
```json
{
  "@supabase/supabase-js": "^2.39.0",
  "axios": "^1.6.2",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "express": "^4.18.2"
}
```

### Frontend
```json
{
  "react": "^18.2.0",
  "lucide-react": "^0.263.1"
}
```

---

## 🚀 Deployment Platforms

### Recommended Stack (Free to Start)

| Service | Purpose | Cost | Limits |
|---------|---------|------|--------|
| **Railway** | Backend hosting | $5-20/mo | 500MB RAM, 1GB disk |
| **Supabase** | Database | Free | 500MB storage, 2GB bandwidth |
| **Vercel** | Frontend hosting | Free | 100GB bandwidth |
| **Total** | | **~$5-20/mo** | Good for 0-50 customers |

### Scale Path

- **10 customers**: $20/month → $1,490 MRR
- **50 customers**: $70/month → $7,450 MRR
- **100 customers**: $150/month → $14,900 MRR

**Profit margins: 95%+**

---

## 📖 Documentation

- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Complete setup walkthrough
- **[COMPETITIVE_EDGE.md](COMPETITIVE_EDGE.md)** - Market positioning
- **schema.sql** - Database documentation
- **server.js** - API documentation (inline comments)

---

## 🧪 Testing Locally

### 1. Install Dependencies

```bash
cd syzr-backend
npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Run Backend

```bash
npm run dev
```

Backend runs on `http://localhost:3001`

### 4. Run Frontend

```bash
# In separate terminal
# Open syzr-app.jsx in browser or deploy to Vercel
```

### 5. Test Shopify OAuth

```
http://localhost:3001/auth/shopify?shop=your-dev-store.myshopify.com
```

---

## 🎯 Getting First Customers

### Week 1: Manual MVP

1. **Find 1 beta customer** (DTC brand, 200-2000 orders/month)
2. **Export their Shopify data** manually
3. **Generate insights** using the engine
4. **Present in UI** with real data
5. **Charge $99-199/month**

### Week 2-4: Automate

1. Install app on customer store
2. Auto-sync daily
3. Auto-generate insights
4. Email alerts

### Target Customers

- DTC fashion brands (jeans, pants, activewear)
- On Shopify
- 200-5,000 orders/month
- 15-30% return rates
- Pain: Know returns are high but don't know why

---

## 💰 Pricing Model

```
Starter:  $49/month  (0-500 orders/month)
Growth:   $149/month (501-2,000 orders/month)
Pro:      $299/month (2,001-5,000 orders/month)
```

**Expansion Revenue:**
- Additional stores: +$30/store
- Benchmarking: +$100/month
- Enterprise: Custom pricing

---

## 🔐 Security

- ✅ Shopify OAuth (industry standard)
- ✅ HTTPS everywhere (Railway/Vercel auto)
- ✅ Environment variables (never commit secrets)
- ✅ Row Level Security (Supabase RLS)
- ✅ HMAC verification (Shopify webhooks)
- ✅ Input validation (Express middleware)

---

## 📈 Roadmap

### Stage 1 - MVP (NOW)
- ✅ Shopify integration
- ✅ Basic insights
- ✅ Dashboard UI
- ✅ Manual ops acceptable

### Stage 2 - Automation (Months 2-3)
- Automated daily sync
- Email alerts
- Improved insights
- Weekly summaries

### Stage 3 - Intelligence (Months 4-6)
- Trend detection
- Benchmarking
- ML confidence scoring
- Multi-brand support

### Stage 4 - Platform (Months 7-12)
- Designer tools
- Manufacturer integration
- Shopper-facing features

---

## 🐛 Common Issues

**"OAuth failed"**
- Check Shopify app URLs match deployed URLs
- Verify API credentials

**"No data syncing"**
- Test with: `curl -X POST your-url/sync/shop.myshopify.com`
- Check Railway logs

**"No insights generated"**
- Run: `node insight-engine.js`
- Check if orders/refunds exist in database

**"CORS errors"**
- Verify FRONTEND_URL in backend environment variables

---

## 📞 Support

- Check DEPLOYMENT_GUIDE.md first
- View Railway logs for backend issues
- View Supabase logs for database issues
- Test with curl commands (see guide)

---

## 📄 License

MIT License - Use commercially, modify freely

---

## 🎉 You're Ready!

1. Follow DEPLOYMENT_GUIDE.md
2. Get live in 20 minutes
3. Get first customer in Week 1
4. Scale to $10k MRR in 6 months

**Let's build this! 🚀**
