-- Syzr Database Schema for Supabase (PostgreSQL)
-- Run this in your Supabase SQL Editor

-- ============================================
-- MERCHANTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopify_domain TEXT UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  shop_name TEXT,
  email TEXT,
  currency TEXT DEFAULT 'USD',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_merchants_shopify_domain ON merchants(shopify_domain);

-- ============================================
-- ORDERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  shopify_order_id TEXT UNIQUE NOT NULL,
  order_number TEXT,
  total_price DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',
  customer_email TEXT,
  line_items JSONB,
  financial_status TEXT,
  fulfillment_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_orders_merchant ON orders(merchant_id);
CREATE INDEX idx_orders_shopify_id ON orders(shopify_order_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- ============================================
-- REFUNDS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  shopify_order_id TEXT NOT NULL,
  shopify_refund_id TEXT UNIQUE NOT NULL,
  amount DECIMAL(10, 2),
  note TEXT,
  refund_line_items JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_refunds_merchant ON refunds(merchant_id);
CREATE INDEX idx_refunds_order ON refunds(shopify_order_id);
CREATE INDEX idx_refunds_created_at ON refunds(created_at DESC);

-- ============================================
-- INSIGHTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID REFERENCES merchants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- 'fit', 'quality', 'success'
  impact TEXT NOT NULL, -- 'critical', 'high', 'medium', 'positive'
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  financial_impact INTEGER DEFAULT 0,
  description TEXT,
  affected_skus TEXT[],
  specific_fit_issue TEXT,
  action TEXT,
  manufacturing_note TEXT,
  status TEXT DEFAULT 'open', -- 'open', 'investigating', 'addressed'
  orders_affected INTEGER DEFAULT 0,
  returns_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_insights_merchant ON insights(merchant_id);
CREATE INDEX idx_insights_status ON insights(status);
CREATE INDEX idx_insights_impact ON insights(financial_impact DESC);
CREATE INDEX idx_insights_created_at ON insights(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Enable if using Supabase auth
-- ============================================

-- Enable RLS on all tables
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth setup)
-- For now, allow service role full access

CREATE POLICY "Service role has full access to merchants"
  ON merchants
  FOR ALL
  USING (true);

CREATE POLICY "Service role has full access to orders"
  ON orders
  FOR ALL
  USING (true);

CREATE POLICY "Service role has full access to refunds"
  ON refunds
  FOR ALL
  USING (true);

CREATE POLICY "Service role has full access to insights"
  ON insights
  FOR ALL
  USING (true);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to auto-update updated_at
CREATE TRIGGER update_merchants_updated_at
  BEFORE UPDATE ON merchants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_refunds_updated_at
  BEFORE UPDATE ON refunds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insights_updated_at
  BEFORE UPDATE ON insights
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SAMPLE DATA FOR TESTING (OPTIONAL)
-- ============================================

-- Uncomment to insert test data
/*
INSERT INTO merchants (shopify_domain, access_token, shop_name, email, currency)
VALUES ('test-store.myshopify.com', 'test_token_123', 'Test Store', 'test@example.com', 'USD');

-- Get the merchant ID
DO $$
DECLARE
  test_merchant_id UUID;
BEGIN
  SELECT id INTO test_merchant_id FROM merchants WHERE shopify_domain = 'test-store.myshopify.com';
  
  -- Insert sample insight
  INSERT INTO insights (
    merchant_id, title, category, impact, confidence, financial_impact,
    description, affected_skus, specific_fit_issue, action, manufacturing_note,
    status, orders_affected, returns_count
  ) VALUES (
    test_merchant_id,
    'SLIM-DNM-001 size 32x30: Thigh measurement 0.75" too narrow',
    'fit',
    'critical',
    96,
    14850,
    'Size 32x30 returning at 42% (4.2x your baseline). Analysis shows thigh measurement is 0.75" narrower than industry standard.',
    ARRAY['SLIM-DNM-001'],
    'Thigh circumference: Current 22.5" → Should be 23.25" minimum',
    'DESIGN ACTION: Expand thigh measurement by 0.75" on size 32x30.',
    'Talk to factory about mid-season adjustment or flag for FW26 production',
    'open',
    89,
    37
  );
END $$;
*/

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('merchants', 'orders', 'refunds', 'insights');

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('merchants', 'orders', 'refunds', 'insights');
