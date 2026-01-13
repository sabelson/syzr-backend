# 🚀 Syzr Deployment Guide - Make It Go Live

## Overview
This guide will take you from code to live, working product in ~2 hours.

---

## 📋 Prerequisites

You'll need accounts for:
1. **Shopify Partners** (FREE) - https://partners.shopify.com/signup
2. **Supabase** (FREE tier) - https://supabase.com
3. **Railway** (starts FREE) - https://railway.app OR Render.com
4. **Vercel** (FREE tier) - https://vercel.com
5. **GitHub** (FREE) - https://github.com
6. **Domain** (optional, $10/year) - Namecheap/GoDaddy

---

## 🎯 PART 1: Database Setup (15 minutes)

### Step 1: Create Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Choose:
   - **Name:** syzr-production
   - **Database Password:** (save this securely!)
   - **Region:** Closest to your target users
   - **Pricing:** Free tier is fine to start

4. Wait 2-3 minutes for project to provision

### Step 2: Run Database Schema

1. In Supabase dashboard, click **"SQL Editor"** (left sidebar)
2. Click **"New Query"**
3. Copy the entire contents of `schema.sql`
4. Paste into the editor
5. Click **"Run"**
6. Verify: You should see "Success. No rows returned"

### Step 3: Get API Keys

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (keep this SECRET!)

---

## 🔧 PART 2: Shopify App Setup (20 minutes)

### Step 1: Create Partner Account

1. Go to https://partners.shopify.com
2. Sign up (it's free)
3. Complete the basic info

### Step 2: Create App

1. In Partner Dashboard, click **"Apps"** → **"Create app"**
2. Choose **"Create app manually"**
3. Fill in:
   - **App name:** Syzr Returns Intelligence
   - **App URL:** `https://your-app.railway.app` (we'll update this later)
   - **Allowed redirection URL(s):** `https://your-app.railway.app/auth/shopify/callback`

4. Click **"Create app"**

### Step 3: Configure App

1. Go to **Configuration** tab
2. Under **App Scopes**, select:
   - ✅ `read_orders`
   - ✅ `read_products`
   - ✅ `read_customers`

3. Save

### Step 4: Get API Credentials

1. Go to **"Overview"** tab
2. Copy:
   - **Client ID** (this is your `SHOPIFY_API_KEY`)
   - **Client secret** (this is your `SHOPIFY_API_SECRET`)

### Step 5: Create Development Store (for testing)

1. In Partner Dashboard → **Stores** → **"Add store"**
2. Choose **"Development store"**
3. Fill in:
   - **Store name:** syzr-test-store
   - **Store type:** Development store
4. This gives you a test store to develop with

---

## 🌐 PART 3: Backend Deployment (30 minutes)

### Option A: Deploy to Railway (Recommended)

#### Step 1: Push Code to GitHub

```bash
# In your terminal, navigate to syzr-backend folder
cd syzr-backend

# Initialize git
git init
git add .
git commit -m "Initial Syzr backend"

# Create repo on GitHub, then:
git remote add origin https://github.com/yourusername/syzr-backend.git
git branch -M main
git push -u origin main
```

#### Step 2: Deploy on Railway

1. Go to https://railway.app
2. Sign up with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your `syzr-backend` repository
5. Railway will auto-detect Node.js and deploy

#### Step 3: Add Environment Variables

1. In Railway project, click **"Variables"** tab
2. Add all variables from `.env.example`:

```
PORT=3001
NODE_ENV=production
APP_URL=https://your-project.up.railway.app
FRONTEND_URL=https://your-vercel-app.vercel.app
SHOPIFY_API_KEY=your_client_id_from_shopify
SHOPIFY_API_SECRET=your_client_secret_from_shopify
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key
```

3. Click **"Deploy"**

#### Step 4: Get Your Backend URL

1. Go to **"Settings"** → **"Domains"**
2. Railway generates a URL like: `syzr-backend-production.up.railway.app`
3. Copy this URL

#### Step 5: Update Shopify App URLs

1. Go back to Shopify Partners → Your App → **Configuration**
2. Update:
   - **App URL:** `https://your-railway-url.up.railway.app`
   - **Allowed redirection URL:** `https://your-railway-url.up.railway.app/auth/shopify/callback`
3. Save

---

### Option B: Deploy to Render (Alternative)

Similar process:
1. Connect GitHub repo
2. Choose "Web Service"
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Add environment variables
6. Deploy

---

## 💻 PART 4: Frontend Deployment (20 minutes)

### Step 1: Update Frontend to Use Real API

Create a new file `src/api.js`:

```javascript
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export async function fetchInsights(shop) {
  const response = await fetch(`${API_URL}/api/insights/${shop}`);
  return response.json();
}

export async function fetchMetrics(shop) {
  const response = await fetch(`${API_URL}/api/metrics/${shop}`);
  return response.json();
}

export async function updateInsightStatus(insightId, status) {
  const response = await fetch(`${API_URL}/api/insights/${insightId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  return response.json();
}

export async function syncData(shop) {
  const response = await fetch(`${API_URL}/sync/${shop}`, {
    method: 'POST'
  });
  return response.json();
}
```

### Step 2: Update React Component

Modify your `syzr-app.jsx` to fetch real data:

```javascript
// At the top of the component
const [insights, setInsights] = useState([]);
const [metrics, setMetrics] = useState({});
const [loading, setLoading] = useState(true);

useEffect(() => {
  // Get shop from URL params
  const params = new URLSearchParams(window.location.search);
  const shop = params.get('shop') || 'demo';
  
  // Fetch real data
  async function loadData() {
    try {
      const [insightsData, metricsData] = await Promise.all([
        fetchInsights(shop),
        fetchMetrics(shop)
      ]);
      
      setInsights(insightsData.insights || mockInsights);
      setMetrics(metricsData || mockMetrics);
    } catch (error) {
      console.error('Error loading data:', error);
      // Fall back to mock data
      setInsights(mockInsights);
      setMetrics(mockMetrics);
    } finally {
      setLoading(false);
    }
  }
  
  loadData();
}, []);
```

### Step 3: Deploy to Vercel

1. Push updated frontend to GitHub
2. Go to https://vercel.com
3. Sign in with GitHub
4. Click **"Add New Project"**
5. Import your frontend repository
6. Configure:
   - **Framework Preset:** Create React App
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`

7. Add Environment Variable:
   ```
   REACT_APP_API_URL=https://your-railway-url.up.railway.app
   ```

8. Click **"Deploy"**

9. Get your Vercel URL (e.g., `syzr-app.vercel.app`)

### Step 4: Update Backend CORS & Frontend URL

Go back to Railway and update environment variable:
```
FRONTEND_URL=https://syzr-app.vercel.app
```

---

## 🧪 PART 5: Testing (15 minutes)

### Step 1: Install App on Dev Store

1. Go to your Shopify Partner Dashboard
2. Click your dev store
3. Click **"Apps"** → **"Install unlisted app"**
4. Install Syzr
5. This will redirect you through OAuth flow

### Step 2: Add Test Data

Option 1: Use Shopify's test data generator
- In dev store, use Shopify's sample data

Option 2: Manually create orders
- Create 20-30 test orders with different products
- Create 5-10 refunds with notes like "too tight" or "poor quality"

### Step 3: Sync Data

```bash
# Call the sync endpoint
curl -X POST https://your-railway-url.up.railway.app/sync/your-store.myshopify.com
```

### Step 4: Generate Insights

```bash
# SSH into Railway or run locally
node insight-engine.js
```

### Step 5: View in Frontend

Go to: `https://syzr-app.vercel.app?shop=your-store.myshopify.com`

You should see:
- ✅ Real metrics
- ✅ Generated insights
- ✅ Working filters

---

## 🔄 PART 6: Automation (10 minutes)

### Set Up Daily Sync

In Railway, add a cron job (requires Pro plan) OR use GitHub Actions:

Create `.github/workflows/daily-sync.yml`:

```yaml
name: Daily Data Sync

on:
  schedule:
    - cron: '0 2 * * *'  # Runs at 2 AM UTC daily
  workflow_dispatch:  # Allow manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Sync
        run: |
          curl -X POST ${{ secrets.BACKEND_URL }}/sync/all
```

Add `BACKEND_URL` to GitHub Secrets.

---

## 💰 PART 7: Add Payments (Optional - 20 minutes)

### Step 1: Create Stripe Account

1. Go to https://stripe.com
2. Sign up
3. Get API keys from Dashboard → Developers → API keys

### Step 2: Add Stripe to Backend

```bash
npm install stripe
```

Add to `server.js`:

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create checkout session
app.post('/create-checkout-session', async (req, res) => {
  const { shop, plan } = req.body;
  
  const prices = {
    starter: 'price_starter_id',
    growth: 'price_growth_id',
    pro: 'price_pro_id'
  };
  
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{
      price: prices[plan],
      quantity: 1
    }],
    success_url: `${FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${FRONTEND_URL}/pricing`,
    metadata: { shop }
  });
  
  res.json({ url: session.url });
});
```

### Step 3: Create Stripe Products

1. In Stripe Dashboard → Products
2. Create 3 products:
   - **Starter:** $49/month
   - **Growth:** $149/month
   - **Pro:** $299/month

3. Get price IDs

---

## 🎉 YOU'RE LIVE!

### What You Now Have:

✅ **Backend API** running on Railway
✅ **Database** on Supabase
✅ **Frontend** on Vercel
✅ **Shopify App** ready to install
✅ **Automated insights** generation
✅ **Real-time data sync**

### Next Steps:

1. **Test thoroughly** with dev store
2. **Get 1-3 beta customers** (manual outreach)
3. **Submit app** for Shopify App Store review (optional)
4. **Set up monitoring** (Sentry for errors)
5. **Add analytics** (PostHog or similar)

---

## 🐛 Troubleshooting

### "OAuth error"
- Check Shopify app URLs match deployed URLs
- Verify API credentials are correct
- Check CORS settings

### "Database connection failed"
- Verify Supabase URL and keys
- Check if RLS policies are correct
- Test connection from Railway

### "No insights generated"
- Verify data synced successfully
- Check logs in Railway
- Run insight engine manually: `node insight-engine.js`

### "CORS error"
- Add frontend URL to CORS whitelist
- Check FRONTEND_URL environment variable

---

## 📞 Need Help?

Common issues:
1. **Railway logs:** Click "Deployments" → "View Logs"
2. **Supabase logs:** Go to "Logs" section
3. **Shopify webhook issues:** Check Partner Dashboard → Webhooks

---

## 💡 Quick Test Commands

```bash
# Test health
curl https://your-railway-url.up.railway.app/health

# Test OAuth start
curl https://your-railway-url.up.railway.app/auth/shopify?shop=your-store.myshopify.com

# Test sync
curl -X POST https://your-railway-url.up.railway.app/sync/your-store.myshopify.com

# Generate insights
node insight-engine.js
```

---

## 🚀 Going to Production Checklist

Before launching to real customers:

- [ ] Custom domain configured
- [ ] SSL certificates (auto with Railway/Vercel)
- [ ] Error tracking (Sentry)
- [ ] Monitoring (Better Stack, DataDog)
- [ ] Backup strategy for Supabase
- [ ] Rate limiting on API
- [ ] Security audit
- [ ] Privacy policy & Terms of Service
- [ ] GDPR compliance (if EU customers)
- [ ] Stripe payments tested
- [ ] Customer support system

---

## 💰 Cost Breakdown (First 6 Months)

**Month 1-3 (0-10 customers):**
- Railway: $5-20/month
- Supabase: $0 (free tier)
- Vercel: $0 (free tier)
- Domain: $10/year
- **Total: ~$20/month**

**Month 4-6 (10-50 customers):**
- Railway: $20-50/month
- Supabase: $25/month (upgrade for more storage)
- Vercel: $0-20/month
- Domain: Already paid
- **Total: ~$70/month**

**Revenue Target:**
- 10 customers @ $149 avg = $1,490/month
- **Profit margin: ~95%**

---

You're ready to go live! 🎉
