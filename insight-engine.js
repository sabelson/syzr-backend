// insight-engine.js - Generate insights from returns data
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ============================================
// INSIGHT GENERATION ENGINE
// ============================================

class InsightEngine {
  constructor(merchantId) {
    this.merchantId = merchantId;
    this.insights = [];
  }

  // Main function to generate all insights
  async generateInsights() {
    console.log(`🔍 Generating insights for merchant ${this.merchantId}...`);
    
    // Clear old insights
    await supabase
      .from('insights')
      .delete()
      .eq('merchant_id', this.merchantId);
    
    // Run all insight generators
    await this.detectSizeIssues();
    await this.detectProductQualityIssues();
    await this.detectSuccessfulProducts();
    await this.detectFitPatterns();
    
    // Save insights to database
    if (this.insights.length > 0) {
      const { error } = await supabase
        .from('insights')
        .insert(this.insights);
      
      if (error) {
        console.error('Error saving insights:', error);
      } else {
        console.log(`✅ Generated ${this.insights.length} insights`);
      }
    }
    
    return this.insights;
  }

  // Detect size-specific return issues
  async detectSizeIssues() {
    try {
      // Get all orders with line items
      const { data: orders } = await supabase
        .from('orders')
        .select('*, line_items')
        .eq('merchant_id', this.merchantId);
      
      // Get all refunds
      const { data: refunds } = await supabase
        .from('refunds')
        .select('*, refund_line_items')
        .eq('merchant_id', this.merchantId);
      
      if (!orders || !refunds) return;
      
      // Build size/SKU return map
      const sizeStats = {};
      
      // Count orders by size/SKU
      orders.forEach(order => {
        if (!order.line_items) return;
        
        order.line_items.forEach(item => {
          const sku = item.sku || item.variant_id?.toString();
          const size = item.variant_title || 'Unknown';
          const key = `${sku}-${size}`;
          
          if (!sizeStats[key]) {
            sizeStats[key] = {
              sku,
              size,
              title: item.title,
              orders: 0,
              returns: 0,
              returnReasons: []
            };
          }
          
          sizeStats[key].orders++;
        });
      });
      
      // Count returns by size/SKU
      refunds.forEach(refund => {
        if (!refund.refund_line_items) return;
        
        refund.refund_line_items.forEach(item => {
          const lineItem = item.line_item;
          if (!lineItem) return;
          
          const sku = lineItem.sku || lineItem.variant_id?.toString();
          const size = lineItem.variant_title || 'Unknown';
          const key = `${sku}-${size}`;
          
          if (sizeStats[key]) {
            sizeStats[key].returns++;
            if (refund.note) {
              sizeStats[key].returnReasons.push(refund.note.toLowerCase());
            }
          }
        });
      });
      
      // Calculate baseline return rate
      const totalOrders = orders.length;
      const totalReturns = refunds.length;
      const baselineReturnRate = totalReturns / totalOrders;
      
      // Analyze each size
      Object.values(sizeStats).forEach(stat => {
        if (stat.orders < 10) return; // Need minimum sample size
        
        const returnRate = stat.returns / stat.orders;
        const multiplier = returnRate / baselineReturnRate;
        
        // High return rate detected
        if (multiplier > 2 && returnRate > 0.15) {
          // Analyze return reasons
          const reasonCounts = {};
          stat.returnReasons.forEach(reason => {
            // Simple keyword matching
            if (reason.includes('tight') || reason.includes('small')) {
              reasonCounts['too_tight'] = (reasonCounts['too_tight'] || 0) + 1;
            }
            if (reason.includes('loose') || reason.includes('big') || reason.includes('large')) {
              reasonCounts['too_loose'] = (reasonCounts['too_loose'] || 0) + 1;
            }
            if (reason.includes('long')) {
              reasonCounts['too_long'] = (reasonCounts['too_long'] || 0) + 1;
            }
            if (reason.includes('short')) {
              reasonCounts['too_short'] = (reasonCounts['too_short'] || 0) + 1;
            }
          });
          
          const topReason = Object.keys(reasonCounts).sort((a, b) => reasonCounts[b] - reasonCounts[a])[0];
          
          let specificIssue = '';
          let action = '';
          let manufacturingNote = '';
          
          if (topReason === 'too_tight') {
            specificIssue = `Garment running small. ${reasonCounts[topReason]} of ${stat.returns} returns cite "too tight" or "too small"`;
            action = `DESIGN ACTION: Review measurements for ${stat.size}. Consider expanding by 0.5-1" in problem areas (likely thighs/waist). Check if grading is consistent with other sizes.`;
            manufacturingNote = 'Compare pattern specs to successful sizes. May need adjustment in next production run.';
          } else if (topReason === 'too_loose') {
            specificIssue = `Garment running large. ${reasonCounts[topReason]} of ${stat.returns} returns cite "too loose" or "too big"`;
            action = `DESIGN ACTION: Review measurements for ${stat.size}. Consider reducing by 0.5-1" in problem areas. Check if fabric has excessive stretch.`;
            manufacturingNote = 'Verify fabric specs and pattern accuracy with manufacturer.';
          }
          
          const financialImpact = Math.round(stat.returns * 150 * 0.7); // Assume $150 AOV, 70% loss per return
          
          this.insights.push({
            merchant_id: this.merchantId,
            title: `${stat.title} size ${stat.size}: Returning at ${(returnRate * 100).toFixed(0)}% (${multiplier.toFixed(1)}x baseline)`,
            category: 'fit',
            impact: multiplier > 3 ? 'critical' : 'high',
            confidence: stat.orders > 30 ? 92 : 78,
            financial_impact: financialImpact,
            description: `Size ${stat.size} is returning at ${(returnRate * 100).toFixed(0)}% vs your ${(baselineReturnRate * 100).toFixed(0)}% baseline (${multiplier.toFixed(1)}x). ${stat.returns} of ${stat.orders} orders returned. ${topReason ? `Primary reason: "${topReason.replace('_', ' ')}"` : 'Check return reasons for patterns.'}`,
            affected_skus: [stat.sku],
            specific_fit_issue: specificIssue || `Return rate significantly elevated for this size`,
            action: action || `Review fit and measurements for size ${stat.size}. Analyze customer feedback for specific issues.`,
            manufacturing_note: manufacturingNote || 'Requires investigation',
            status: 'open',
            orders_affected: stat.orders,
            returns_count: stat.returns,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
        
        // Successful sizes (low return rate)
        if (multiplier < 0.5 && stat.orders > 20 && returnRate < 0.10) {
          this.insights.push({
            merchant_id: this.merchantId,
            title: `${stat.title} size ${stat.size}: Excellent fit profile (${(returnRate * 100).toFixed(1)}% return rate)`,
            category: 'success',
            impact: 'positive',
            confidence: 88,
            financial_impact: 0,
            description: `Size ${stat.size} has only ${(returnRate * 100).toFixed(1)}% return rate vs ${(baselineReturnRate * 100).toFixed(0)}% baseline. This is your benchmark fit. ${stat.orders} orders with just ${stat.returns} returns.`,
            affected_skus: [stat.sku],
            specific_fit_issue: 'No issues — this is the benchmark',
            action: `MERCHANDISING ACTION: Prioritize inventory for size ${stat.size}. DESIGN ACTION: Use this size's fit specs as template for other products.`,
            manufacturing_note: 'Document exact pattern specs as reference library',
            status: 'open',
            orders_affected: stat.orders,
            returns_count: stat.returns,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      });
      
    } catch (error) {
      console.error('Error detecting size issues:', error);
    }
  }

  // Detect product quality issues
  async detectProductQualityIssues() {
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('*')
        .eq('merchant_id', this.merchantId);
      
      const { data: refunds } = await supabase
        .from('refunds')
        .select('*')
        .eq('merchant_id', this.merchantId);
      
      if (!orders || !refunds) return;
      
      // Group refunds by product
      const productReturns = {};
      
      refunds.forEach(refund => {
        const reasons = (refund.note || '').toLowerCase();
        
        // Quality-related keywords
        const qualityKeywords = [
          'stretched', 'shrunk', 'faded', 'pilled', 'torn', 'ripped',
          'poor quality', 'cheap', 'loose threads', 'seam', 'fabric',
          'baggy', 'lost shape', 'wear'
        ];
        
        const hasQualityIssue = qualityKeywords.some(keyword => reasons.includes(keyword));
        
        if (hasQualityIssue) {
          if (!productReturns[refund.shopify_order_id]) {
            productReturns[refund.shopify_order_id] = {
              count: 0,
              reasons: []
            };
          }
          productReturns[refund.shopify_order_id].count++;
          productReturns[refund.shopify_order_id].reasons.push(reasons);
        }
      });
      
      // If multiple quality complaints, create insight
      if (Object.keys(productReturns).length > 5) {
        const totalQualityReturns = Object.values(productReturns).reduce((sum, p) => sum + p.count, 0);
        const allReasons = Object.values(productReturns).flatMap(p => p.reasons);
        
        const hasStretchIssue = allReasons.filter(r => r.includes('stretch') || r.includes('baggy')).length;
        
        if (hasStretchIssue > 3) {
          this.insights.push({
            merchant_id: this.merchantId,
            title: `Multiple products showing fabric recovery issues`,
            category: 'quality',
            impact: 'critical',
            confidence: 85,
            financial_impact: Math.round(totalQualityReturns * 150 * 0.7),
            description: `${totalQualityReturns} returns cite fabric issues like "stretched out", "lost shape", or "baggy after wear". This suggests fabric quality or elastane recovery problems.`,
            affected_skus: [],
            specific_fit_issue: 'Fabric elastane recovery rate failing. Likely <85% recovery vs 92%+ standard',
            action: 'SOURCING ACTION: Test fabric recovery rate. Contact mill about elastane percentage and quality. Request fabric testing reports.',
            manufacturing_note: 'Compare current fabric lot to previous successful batches',
            status: 'open',
            orders_affected: Object.keys(productReturns).length,
            returns_count: totalQualityReturns,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      }
      
    } catch (error) {
      console.error('Error detecting quality issues:', error);
    }
  }

  // Detect successful products
  async detectSuccessfulProducts() {
    // Already covered in detectSizeIssues for individual sizes
    // Could add product-level analysis here
  }

  // Detect fit patterns
  async detectFitPatterns() {
    // Could add more sophisticated pattern detection
    // e.g., rise issues, inseam issues, body type mismatches
  }
}

// ============================================
// EXPORT & RUN
// ============================================

async function generateInsightsForMerchant(merchantId) {
  const engine = new InsightEngine(merchantId);
  return await engine.generateInsights();
}

// Run for all merchants (called by cron job)
async function generateInsightsForAll() {
  const { data: merchants } = await supabase
    .from('merchants')
    .select('id, shop_name');
  
  if (!merchants) {
    console.log('No merchants found');
    return;
  }
  
  for (const merchant of merchants) {
    console.log(`\n📊 Processing ${merchant.shop_name}...`);
    await generateInsightsForMerchant(merchant.id);
  }
  
  console.log('\n✅ All insights generated');
}

module.exports = {
  generateInsightsForMerchant,
  generateInsightsForAll
};

// Allow running directly
if (require.main === module) {
  require('dotenv').config();
  generateInsightsForAll().then(() => process.exit(0));
}
