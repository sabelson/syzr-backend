// server.js - Main backend server for Syzr
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Shopify API Configuration
const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY;
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET;
const SHOPIFY_SCOPES = 'read_orders,read_products,read_customers';
const APP_URL = process.env.APP_URL || 'http://localhost:3001';

// ============================================
// HELPER FUNCTIONS
// ============================================

// Generate nonce for OAuth
function generateNonce() {
  return crypto.randomBytes(16).toString('hex');
}

// Verify Shopify HMAC
function verifyShopifyHmac(query, hmac) {
  const message = Object.keys(query)
    .filter(key => key !== 'hmac' && key !== 'signature')
    .sort()
    .map(key => `${key}=${query[key]}`)
    .join('&');
  
  const hash = crypto
    .createHmac('sha256', SHOPIFY_API_SECRET)
    .update(message)
    .digest('hex');
  
  return hash === hmac;
}

// Make Shopify API request
async function shopifyAPI(shop, accessToken, endpoint, method = 'GET', data = null) {
  const url = `https://${shop}/admin/api/2024-01/${endpoint}`;
  
  try {
    const response = await axios({
      method,
      url,
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      },
      data
    });
    return response.data;
  } catch (error) {
    console.error('Shopify API Error:', error.response?.data || error.message);
    throw error;
  }
}

// ============================================
// AUTHENTICATION ROUTES
// ============================================

// Step 1: Install - Redirect to Shopify OAuth
app.get('/auth/shopify', (req, res) => {
  const { shop } = req.query;
  
  if (!shop) {
    return res.status(400).json({ error: 'Missing shop parameter' });
  }
  
  // Validate shop format
  const shopRegex = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/;
  if (!shopRegex.test(shop)) {
    return res.status(400).json({ error: 'Invalid shop format' });
  }
  
  const nonce = generateNonce();
  const redirectUri = `${APP_URL}/auth/shopify/callback`;
  
  const authUrl = `https://${shop}/admin/oauth/authorize?` +
    `client_id=${SHOPIFY_API_KEY}&` +
    `scope=${SHOPIFY_SCOPES}&` +
    `redirect_uri=${redirectUri}&` +
    `state=${nonce}`;
  
  res.redirect(authUrl);
});

// Step 2: Callback - Exchange code for access token
app.get('/auth/shopify/callback', async (req, res) => {
  const { shop, code, hmac, state } = req.query;
  
  // Verify HMAC
  if (!verifyShopifyHmac(req.query, hmac)) {
    return res.status(403).json({ error: 'HMAC validation failed' });
  }
  
  try {
    // Exchange code for access token
    const tokenUrl = `https://${shop}/admin/oauth/access_token`;
    const response = await axios.post(tokenUrl, {
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code
    });
    
    const { access_token } = response.data;
    
    // Get shop info
    const shopData = await shopifyAPI(shop, access_token, 'shop.json');
    
    // Store merchant in database
    const { data: merchant, error } = await supabase
      .from('merchants')
      .upsert({
        shopify_domain: shop,
        access_token: access_token,
        shop_name: shopData.shop.name,
        email: shopData.shop.email,
        currency: shopData.shop.currency,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'shopify_domain'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Database error:', error);
      throw error;
    }
    
    // Redirect to frontend with success
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/dashboard?shop=${shop}&installed=true`);
    
  } catch (error) {
    console.error('OAuth error:', error);
    res.status(500).json({ error: 'Failed to complete OAuth' });
  }
});

// ============================================
// DATA SYNC ROUTES
// ============================================

// Sync orders and refunds for a merchant
app.post('/sync/:shop', async (req, res) => {
  const { shop } = req.params;
  
  try {
    // Get merchant from database
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('*')
      .eq('shopify_domain', shop)
      .single();
    
    if (merchantError || !merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }
    
    // Fetch orders from last 90 days
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 90);
    
    const ordersData = await shopifyAPI(
      shop,
      merchant.access_token,
      `orders.json?status=any&created_at_min=${sinceDate.toISOString()}&limit=250`
    );
    
    console.log(`Fetched ${ordersData.orders.length} orders for ${shop}`);
    
    // Process and store orders
    for (const order of ordersData.orders) {
      // Store order
      await supabase
        .from('orders')
        .upsert({
          merchant_id: merchant.id,
          shopify_order_id: order.id.toString(),
          order_number: order.order_number,
          total_price: parseFloat(order.total_price),
          currency: order.currency,
          customer_email: order.email,
          line_items: order.line_items,
          created_at: order.created_at,
          financial_status: order.financial_status,
          fulfillment_status: order.fulfillment_status
        }, {
          onConflict: 'shopify_order_id'
        });
      
      // Check for refunds
      if (order.refunds && order.refunds.length > 0) {
        for (const refund of order.refunds) {
          await supabase
            .from('refunds')
            .upsert({
              merchant_id: merchant.id,
              shopify_order_id: order.id.toString(),
              shopify_refund_id: refund.id.toString(),
              amount: parseFloat(refund.transactions[0]?.amount || 0),
              note: refund.note || '',
              refund_line_items: refund.refund_line_items,
              created_at: refund.created_at
            }, {
              onConflict: 'shopify_refund_id'
            });
        }
      }
    }
    
    // Update last sync time
    await supabase
      .from('merchants')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', merchant.id);
    
    res.json({
      success: true,
      orders_synced: ordersData.orders.length,
      message: 'Sync completed successfully'
    });
    
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Failed to sync data' });
  }
});

// ============================================
// INSIGHTS API ROUTES
// ============================================

// Get all insights for a merchant
app.get('/api/insights/:shop', async (req, res) => {
  const { shop } = req.params;
  const { status } = req.query;
  
  try {
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('shopify_domain', shop)
      .single();
    
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }
    
    let query = supabase
      .from('insights')
      .select('*')
      .eq('merchant_id', merchant.id)
      .order('financial_impact', { ascending: false });
    
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    const { data: insights, error } = await query;
    
    if (error) throw error;
    
    res.json({ insights });
    
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

// Get metrics for dashboard
app.get('/api/metrics/:shop', async (req, res) => {
  const { shop } = req.params;
  
  try {
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('shopify_domain', shop)
      .single();
    
    if (!merchant) {
      return res.status(404).json({ error: 'Merchant not found' });
    }
    
    // Get orders count
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchant.id);
    
    // Get refunds count
    const { count: totalReturns } = await supabase
      .from('refunds')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchant.id);
    
    // Calculate return rate
    const returnRate = totalOrders > 0 ? ((totalReturns / totalOrders) * 100).toFixed(1) : 0;
    
    // Get potential savings from insights
    const { data: insights } = await supabase
      .from('insights')
      .select('financial_impact')
      .eq('merchant_id', merchant.id)
      .eq('status', 'open')
      .limit(3);
    
    const potentialSavings = insights?.reduce((sum, i) => sum + (i.financial_impact || 0), 0) || 0;
    
    // Get average order value
    const { data: orders } = await supabase
      .from('orders')
      .select('total_price')
      .eq('merchant_id', merchant.id);
    
    const avgOrderValue = orders?.length > 0
      ? orders.reduce((sum, o) => sum + o.total_price, 0) / orders.length
      : 0;
    
    res.json({
      totalOrders,
      totalReturns,
      returnRate: parseFloat(returnRate),
      potentialSavings: Math.round(potentialSavings),
      avgOrderValue: Math.round(avgOrderValue),
      trendsLastWeek: -2.3 // TODO: Calculate actual trend
    });
    
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// Update insight status
app.patch('/api/insights/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    const { data, error } = await supabase
      .from('insights')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ insight: data });
    
  } catch (error) {
    console.error('Error updating insight:', error);
    res.status(500).json({ error: 'Failed to update insight' });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`🚀 Syzr backend running on port ${PORT}`);
  console.log(`📍 OAuth endpoint: ${APP_URL}/auth/shopify`);
});

module.exports = app;
