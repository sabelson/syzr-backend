import React, { useState, useEffect } from 'react';
import { TrendingDown, DollarSign, Package, Target, X, ChevronRight, Zap, CheckCircle, Archive } from 'lucide-react';

const mockInsights = [
  {
    id: 1,
    title: "SLIM-DNM-001 size 32x30: Thigh measurement 0.75\" too narrow",
    category: "fit",
    impact: "critical",
    confidence: 96,
    financialImpact: 14850,
    description: "Size 32x30 returning at 42% (4.2x your baseline). 34 of 37 returns cite 'too tight in thighs' or 'couldn't get past hips'. Analysis shows thigh measurement is 0.75\" narrower than industry standard for athletic builds ordering this size.",
    affectedSKUs: ["SLIM-DNM-001"],
    specificFitIssue: "Thigh circumference: Current 22.5\" → Should be 23.25\" minimum",
    action: "DESIGN ACTION: Expand thigh measurement by 0.75\" on size 32x30. Pattern exists in SLIM-DNM-003 (same fit, no complaints). Copy thigh specs from that pattern.",
    manufacturingNote: "Talk to factory about mid-season adjustment or flag for FW26 production",
    status: "open",
    ordersAffected: 89,
    returnsCount: 37
  },
  {
    id: 2,
    title: "STRCH-SEL-004/006/008: Fabric loses elasticity after first wash",
    category: "quality",
    impact: "critical",
    confidence: 91,
    financialImpact: 11240,
    description: "Your Stretch Selvedge collection shows 31% return rate (3.1x baseline). 43 of 48 returns mention 'stretched out', 'baggy after one wear', or 'lost shape'. This is a fabric recovery issue, not a fit issue.",
    affectedSKUs: ["STRCH-SEL-004", "STRCH-SEL-006", "STRCH-SEL-008"],
    specificFitIssue: "Fabric elastane recovery rate failing. Likely <85% recovery vs 92%+ standard",
    action: "SOURCING ACTION: Contact Kaihara mill re: lot #KH-2409. Test elastane percentage (spec says 2% but may be degraded). Request fabric testing report or switch to proven supplier.",
    manufacturingNote: "Compare to SS23 Stretch Selvedge (0 complaints) — same mill, different lot",
    status: "open",
    ordersAffected: 156,
    returnsCount: 48
  },
  {
    id: 3,
    title: "SLIM-BLK-001: Perfect fit profile — scale this pattern",
    category: "success",
    impact: "positive",
    confidence: 94,
    financialImpact: 0,
    description: "Black slim-fit has 6.2% return rate vs 24% across other SKUs. Customer feedback mentions 'perfect fit' 3x more frequently. This is your gold standard fit profile.",
    affectedSKUs: ["SLIM-BLK-001", "REG-BLK-002"],
    specificFitIssue: "No issues — this is the benchmark",
    action: "MERCHANDISING ACTION: Increase black denim inventory by 40% next order. DESIGN ACTION: Use SLIM-BLK-001 fit specs as template for new colorways and styles.",
    manufacturingNote: "Document exact pattern specs for SLIM-BLK-001 as fit reference library",
    status: "open",
    ordersAffected: 203,
    returnsCount: 12
  },
  {
    id: 4,
    title: "Short inseam (28\") styles: Rise measurement creating 'wedgie' effect",
    category: "fit",
    impact: "medium",
    confidence: 83,
    financialImpact: 4140,
    description: "28\" inseam SKUs returning at 28% despite customers ordering short intentionally. 16 of 18 returns mention 'rides up' or 'uncomfortable crotch'. Current 10\" front rise is correct for 30\"+ inseams but too long for petite proportions.",
    affectedSKUs: ["SLIM-DNM-001-28", "REG-DNM-002-28"],
    specificFitIssue: "Front rise: Current 10\" → Should be 9.25\" for short inseam cuts",
    action: "DESIGN ACTION: Create dedicated petite grading with 9.25\" front rise and 14\" back rise (vs current 10\"/14.5\"). Don't just shorten inseam — adjust rise proportionally.",
    manufacturingNote: "Requires new pattern blocks for 28\" inseam family",
    status: "investigating",
    ordersAffected: 47,
    returnsCount: 18
  },
  {
    id: 5,
    title: "REG-DNM-005 size 36x32: Waist gapping at back (athletic builds)",
    category: "fit",
    impact: "high",
    confidence: 89,
    financialImpact: 6890,
    description: "Size 36x32 returning at 34%. 23 of 29 returns from customers with larger thigh measurements (>25\") mentioning 'waist too big' or 'gaps in back'. This is the classic athletic build problem: your grading doesn't account for thigh/waist ratio variation.",
    affectedSKUs: ["REG-DNM-005"],
    specificFitIssue: "Need athletic vs standard fit grading. Waist-to-thigh ratio off by 2.5\"",
    action: "DESIGN ACTION: Introduce 'Athletic Fit' designation with proportional grading (keep thigh room, reduce waist by 1-1.5\"). Survey shows 40% of size 34-38 customers have this build.",
    manufacturingNote: "Consider adding 4-way stretch to regular fit for better body conforming",
    status: "open",
    ordersAffected: 86,
    returnsCount: 29
  }
];

const mockMetrics = {
  totalOrders: 2847,
  totalReturns: 412,
  returnRate: 14.5,
  potentialSavings: 24610,
  avgOrderValue: 145,
  trendsLastWeek: -2.3
};

export default function SyzrApp() {
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  const getImpactColor = (impact) => {
    switch(impact) {
      case 'critical': return 'rgb(239, 68, 68)';
      case 'high': return 'rgb(251, 146, 60)';
      case 'medium': return 'rgb(234, 179, 8)';
      case 'positive': return 'rgb(34, 197, 94)';
      default: return 'rgb(148, 163, 184)';
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      open: { text: 'Open', color: 'rgb(59, 130, 246)', bg: 'rgba(59, 130, 246, 0.1)' },
      investigating: { text: 'Investigating', color: 'rgb(251, 146, 60)', bg: 'rgba(251, 146, 60, 0.1)' },
      addressed: { text: 'Addressed', color: 'rgb(34, 197, 94)', bg: 'rgba(34, 197, 94, 0.1)' }
    };
    return badges[status] || badges.open;
  };

  const filteredInsights = filterStatus === 'all' 
    ? mockInsights 
    : mockInsights.filter(i => i.status === filterStatus);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      color: '#e5e7eb',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -30px) scale(1.1); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .insight-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .insight-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }
        .metric-card {
          animation: slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) backwards;
        }
        .insight-item {
          animation: slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) backwards;
        }
      `}</style>

      {/* Animated background */}
      <div style={{
        position: 'absolute',
        top: '10%',
        right: '15%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        animation: 'float 20s ease-in-out infinite',
        pointerEvents: 'none'
      }} />

      {/* Header */}
      <header style={{
        padding: '2rem 3rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px)',
        background: 'rgba(15, 15, 26, 0.7)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.3)'
            }}>
              <Zap size={28} color="white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 style={{
                fontFamily: 'monospace',
                fontSize: '2rem',
                fontWeight: 700,
                margin: 0,
                background: 'linear-gradient(135deg, #fff 0%, #a5b4fc 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em'
              }}>SYZR</h1>
              <p style={{
                margin: '0.25rem 0 0 0',
                fontSize: '0.875rem',
                color: '#6366f1',
                letterSpacing: '0.05em',
                fontWeight: 600
              }}>Fit intelligence that tells you exactly what's wrong and how to fix it</p>
            </div>
          </div>
        </div>
      </header>

      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '3rem',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginBottom: '3rem'
        }}>
          <div className="metric-card" style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(59, 130, 246, 0.08) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: '16px',
            padding: '1.75rem',
            animationDelay: '0.1s'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Return Rate</p>
                <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '2.5rem', fontWeight: 700, color: '#fff' }}>
                  {mockMetrics.returnRate}%
                </h2>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'rgba(99, 102, 241, 0.2)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrendingDown size={24} color="#6366f1" />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#22c55e', fontSize: '0.875rem', fontWeight: 600 }}>↓ {Math.abs(mockMetrics.trendsLastWeek)}%</span>
              <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.875rem' }}>vs last week</span>
            </div>
          </div>

          <div className="metric-card" style={{
            background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(219, 39, 119, 0.08) 100%)',
            border: '1px solid rgba(236, 72, 153, 0.2)',
            borderRadius: '16px',
            padding: '1.75rem',
            animationDelay: '0.2s'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Potential Savings</p>
                <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '2.5rem', fontWeight: 700, color: '#fff' }}>
                  ${mockMetrics.potentialSavings.toLocaleString()}
                </h2>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'rgba(236, 72, 153, 0.2)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <DollarSign size={24} color="#ec4899" />
              </div>
            </div>
            <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)' }}>if top 3 issues fixed</div>
          </div>

          <div className="metric-card" style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(22, 163, 74, 0.08) 100%)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            borderRadius: '16px',
            padding: '1.75rem',
            animationDelay: '0.3s'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Insights</p>
                <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '2.5rem', fontWeight: 700, color: '#fff' }}>
                  {mockInsights.filter(i => i.status === 'open').length}
                </h2>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'rgba(34, 197, 94, 0.2)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Target size={24} color="#22c55e" />
              </div>
            </div>
            <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)' }}>requiring action</div>
          </div>

          <div className="metric-card" style={{
            background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.15) 0%, rgba(249, 115, 22, 0.08) 100%)',
            border: '1px solid rgba(251, 146, 60, 0.2)',
            borderRadius: '16px',
            padding: '1.75rem',
            animationDelay: '0.4s'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
              <div>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Orders</p>
                <h2 style={{ margin: '0.5rem 0 0 0', fontSize: '2.5rem', fontWeight: 700, color: '#fff' }}>
                  {mockMetrics.totalOrders.toLocaleString()}
                </h2>
              </div>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'rgba(251, 146, 60, 0.2)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Package size={24} color="#fb923c" />
              </div>
            </div>
            <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)' }}>last 30 days</div>
          </div>
        </div>

        {/* Filter Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '1rem 1.5rem'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: '#fff' }}>Priority Insights</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['all', 'open', 'investigating', 'addressed'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                style={{
                  padding: '0.5rem 1rem',
                  background: filterStatus === status ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                  border: filterStatus === status ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: filterStatus === status ? '#a5b4fc' : 'rgba(255, 255, 255, 0.6)',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.2s'
                }}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>
        </div>

        {/* Insights Feed */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredInsights.map((insight, index) => {
            const statusBadge = getStatusBadge(insight.status);
            return (
              <div
                key={insight.id}
                className="insight-card insight-item"
                onClick={() => setSelectedInsight(insight)}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: `1px solid ${getImpactColor(insight.impact)}40`,
                  borderRadius: '16px',
                  padding: '1.75rem',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  animationDelay: `${index * 0.1}s`
                }}
              >
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '4px',
                  background: getImpactColor(insight.impact)
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '2rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        background: statusBadge.bg,
                        color: statusBadge.color,
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        {statusBadge.text}
                      </span>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'rgba(255, 255, 255, 0.6)',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        textTransform: 'uppercase'
                      }}>
                        {insight.confidence}% confidence
                      </span>
                    </div>

                    <h4 style={{
                      margin: '0 0 0.75rem 0',
                      fontSize: '1.25rem',
                      fontWeight: 600,
                      color: '#fff',
                      lineHeight: 1.3
                    }}>
                      {insight.title}
                    </h4>

                    <p style={{
                      margin: '0 0 1rem 0',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '0.938rem',
                      lineHeight: 1.6
                    }}>
                      {insight.description}
                    </p>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem',
                      background: 'rgba(99, 102, 241, 0.08)',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                      borderRadius: '8px',
                      marginTop: '1rem'
                    }}>
                      <Zap size={16} color="#6366f1" />
                      <span style={{ fontSize: '0.875rem', color: '#a5b4fc', fontWeight: 500 }}>
                        Recommended: {insight.action}
                      </span>
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '1rem',
                    minWidth: '180px'
                  }}>
                    {insight.financialImpact > 0 && (
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Financial Impact
                        </p>
                        <p style={{
                          margin: '0.25rem 0 0 0',
                          fontSize: '1.75rem',
                          fontWeight: 700,
                          color: getImpactColor(insight.impact)
                        }}>
                          ${insight.financialImpact.toLocaleString()}
                        </p>
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      gap: '1.5rem',
                      padding: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '8px',
                      fontSize: '0.813rem'
                    }}>
                      <div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Orders</div>
                        <div style={{ color: '#fff', fontWeight: 600, fontSize: '1rem' }}>{insight.ordersAffected}</div>
                      </div>
                      <div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Returns</div>
                        <div style={{ color: '#fff', fontWeight: 600, fontSize: '1rem' }}>{insight.returnsCount}</div>
                      </div>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      background: 'rgba(99, 102, 241, 0.1)',
                      borderRadius: '8px',
                      color: '#a5b4fc',
                      fontSize: '0.875rem',
                      fontWeight: 500
                    }}>
                      View Details
                      <ChevronRight size={16} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Detail Modal */}
      {selectedInsight && (
        <div
          onClick={() => setSelectedInsight(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '2rem',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: '2.5rem',
              position: 'relative',
              boxShadow: '0 25px 80px rgba(0, 0, 0, 0.6)',
              animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          >
            <button
              onClick={() => setSelectedInsight(null)}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                width: '40px',
                height: '40px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{
                width: '4px',
                height: '48px',
                background: getImpactColor(selectedInsight.impact),
                borderRadius: '2px'
              }} />
              <div>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    background: getStatusBadge(selectedInsight.status).bg,
                    color: getStatusBadge(selectedInsight.status).color,
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase'
                  }}>
                    {getStatusBadge(selectedInsight.status).text}
                  </span>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    color: 'rgba(255, 255, 255, 0.6)',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 500
                  }}>
                    {selectedInsight.confidence}% confidence
                  </span>
                </div>
                <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>
                  {selectedInsight.title}
                </h2>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '1.25rem',
                textAlign: 'center'
              }}>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase' }}>
                  Orders Affected
                </p>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', fontWeight: 700, color: '#fff' }}>
                  {selectedInsight.ordersAffected}
                </p>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '1.25rem',
                textAlign: 'center'
              }}>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase' }}>
                  Returns Count
                </p>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', fontWeight: 700, color: '#fff' }}>
                  {selectedInsight.returnsCount}
                </p>
              </div>
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '1.25rem',
                textAlign: 'center'
              }}>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase' }}>
                  Financial Impact
                </p>
                <p style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', fontWeight: 700, color: getImpactColor(selectedInsight.impact) }}>
                  ${selectedInsight.financialImpact.toLocaleString()}
                </p>
              </div>
            </div>

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 600, color: '#fff', textTransform: 'uppercase' }}>
                Analysis
              </h3>
              <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.938rem', lineHeight: 1.7 }}>
                {selectedInsight.description}
              </p>
            </div>

            {selectedInsight.specificFitIssue && !selectedInsight.specificFitIssue.includes('N/A') && !selectedInsight.specificFitIssue.includes('No issues') && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase' }}>
                  ⚠️ Specific Fit Issue
                </h3>
                <p style={{ margin: 0, color: '#22c55e', fontSize: '1rem', fontWeight: 600, fontFamily: 'monospace' }}>
                  {selectedInsight.specificFitIssue}
                </p>
              </div>
            )}

            {selectedInsight.affectedSKUs && selectedInsight.affectedSKUs.length > 0 && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '1.5rem'
              }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase' }}>
                  Affected SKUs
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {selectedInsight.affectedSKUs.map(sku => (
                    <span key={sku} style={{
                      padding: '0.5rem 1rem',
                      background: 'rgba(99, 102, 241, 0.1)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: '8px',
                      color: '#a5b4fc',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      fontFamily: 'monospace'
                    }}>
                      {sku}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedInsight.manufacturingNote && !selectedInsight.manufacturingNote.includes('N/A') && (
              <div style={{
                background: 'rgba(251, 146, 60, 0.08)',
                border: '1px solid rgba(251, 146, 60, 0.2)',
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: 'rgba(251, 146, 60, 0.2)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Package size={16} color="#fb923c" />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#fff', textTransform: 'uppercase' }}>
                      Manufacturing Note
                    </h4>
                    <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                      {selectedInsight.manufacturingNote}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'rgba(99, 102, 241, 0.2)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Zap size={20} color="#6366f1" />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 600, color: '#fff' }}>
                    Recommended Action
                  </h3>
                  <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.938rem', lineHeight: 1.6 }}>
                    {selectedInsight.action}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button style={{
                flex: 1,
                padding: '1rem',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                <CheckCircle size={20} />
                Mark as Investigating
              </button>
              <button style={{
                flex: 1,
                padding: '1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                <Archive size={20} />
                Archive Insight
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}