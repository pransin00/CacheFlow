import React, { useEffect, useState, useRef } from 'react';
import { supabase } from './supabaseClient';

export default function AdminDashboard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [usersCount, setUsersCount] = useState(0);
  const [accountsCount, setAccountsCount] = useState(0);
  const [transactionsCount, setTransactionsCount] = useState(0);
  const [topTransactions, setTopTransactions] = useState([]); // [{name, count}]
  const [monthsLabels, setMonthsLabels] = useState([]);
  const [monthlyTxCounts, setMonthlyTxCounts] = useState([]);
  const [monthlyUserCounts, setMonthlyUserCounts] = useState([]);

  useEffect(() => {
    loadMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMetrics() {
    setLoading(true);
    setError('');
    try {
      // users count
      const { data: users } = await supabase.from('users').select('id');
      setUsersCount(users ? users.length : 0);

  // accounts count (we're not showing total balance per request)
  const { data: accounts } = await supabase.from('accounts').select('id');
  setAccountsCount(accounts ? accounts.length : 0);

  // transactions count and top transaction types (uses transaction_types relation when available)
  const { data: txRaw } = await supabase.from('transactions').select('id, type, type_id, transaction_types(name), date');
  const txs = txRaw || [];
  setTransactionsCount(txs.length);

      // build counts by normalized label (lowercase) so we can show only the desired types
      const counts = {};
      for (const tx of txs) {
        const raw = tx.transaction_types?.name || tx.type || (tx.type_id ? String(tx.type_id) : 'Unknown');
        const label = (raw || '').toString().toLowerCase();
        counts[label] = (counts[label] || 0) + 1;
      }
      // Only show these four, in this order, mapping to display names
      const desired = [
        { key: 'fund transfer', label: 'Fund Transfer' },
        { key: 'bank transfer', label: 'Bank Transfer' },
        { key: 'bill payment', label: 'Pay Bills' },
        { key: 'withdrawal', label: 'Withdrawal' },
      ];
      const limited = desired.map(d => ({ name: d.label, count: counts[d.key] || 0 }));
      setTopTransactions(limited);

      // --- monthly aggregates for the last 12 months ---
      // build list of last 12 month labels (e.g., "2025-11") and human labels
      const now = new Date();
      const months = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; // YYYY-MM
        const label = d.toLocaleString(undefined, { month: 'short', year: 'numeric' });
        months.push({ key, label });
      }
      setMonthsLabels(months.map(m => m.label));

      // helper to bucket by YYYY-MM
      const bucket = (iso) => {
        if (!iso) return null;
        const d = new Date(iso);
        if (isNaN(d)) return null;
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      };

      const txCountsMap = {};
      for (const tx of txs) {
        const k = bucket(tx.date);
        if (!k) continue;
        txCountsMap[k] = (txCountsMap[k] || 0) + 1;
      }

      // fetch accounts.created_at for monthly new accounts
      const { data: accountsDates } = await supabase.from('accounts').select('created_at');
      const acctDates = accountsDates || [];
      const acctCountsMap = {};
      for (const a of acctDates) {
        const k = bucket(a.created_at);
        if (!k) continue;
        acctCountsMap[k] = (acctCountsMap[k] || 0) + 1;
      }

      // produce arrays aligned to months
      const txArr = months.map(m => txCountsMap[m.key] || 0);
      const userArr = months.map(m => acctCountsMap[m.key] || 0);
      setMonthlyTxCounts(txArr);
      setMonthlyUserCounts(userArr);
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
      setError('Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p>Welcome to the admin dashboard. Use the sidebar to access transaction logs and user management.</p>

      {error && <div style={{ color: '#d32f2f' }}>{error}</div>}

      <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
        {/* Users count card */}
        <div style={{ flex: '1 1 220px', minWidth: 220, background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 6px 18px rgba(10,40,120,0.04)' }}>
          <div style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>Users</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#0a3cff' }}>{loading ? '…' : usersCount}</div>
          <div style={{ color: '#666', marginTop: 8 }}>Total registered users</div>
        </div>

        {/* System usage card */}
        <div style={{ flex: '1 1 320px', minWidth: 220, background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 6px 18px rgba(10,40,120,0.04)' }}>
          <div style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>System Usage</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0a3cff' }}>{loading ? '…' : transactionsCount}</div>
            <div style={{ color: '#666' }}>
              <div style={{ fontWeight: 700 }}>Total Transactions</div>
              <div style={{ fontSize: 13 }}>All time</div>
            </div>
          </div>
          <div style={{ marginTop: 12, color: '#666' }}><strong>Accounts:</strong> {loading ? '…' : accountsCount}</div>
        </div>

        {/* Most used transactions */}
        <div style={{ flex: '1 1 360px', minWidth: 260, background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 6px 18px rgba(10,40,120,0.04)' }}>
          <div style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>Most Used Transactions</div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {(topTransactions.length === 0 && !loading) ? (
              <li style={{ color: '#666' }}>No transaction data</li>
            ) : (
              topTransactions.map((t, i) => (
                <li key={t.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < topTransactions.length - 1 ? '1px dashed #f0f4ff' : 'none' }}>
                  <span>{t.name}</span>
                  <strong>{t.count}</strong>
                </li>
              ))
            )}
          </ul>
          <div style={{ marginTop: 10, color: '#666', fontSize: 13 }}>{loading ? 'Loading...' : 'Counts reflect transactions table grouped by type.'}</div>
        </div>
      </div>

      {/* monthly trends chart */}
      <div style={{ marginTop: 22, width: '100%' }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 18, boxShadow: '0 6px 18px rgba(10,40,120,0.04)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ color: '#888', fontSize: 13 }}>Monthly trends</div>
            <div style={{ color: '#666', fontSize: 13 }}>Last 12 months</div>
          </div>

          <div style={{ marginTop: 12 }}>
            {/* simple dual-line SVG chart */}
            <MonthlyDualLineChart labels={monthsLabels} seriesA={monthlyTxCounts} seriesB={monthlyUserCounts} seriesALabel="Transactions" seriesBLabel="New users" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MonthlyDualLineChart({ labels = [], seriesA = [], seriesB = [], seriesALabel = 'A', seriesBLabel = 'B' }) {
  // width responsive via viewBox
  const width = 920;
  const height = 220;
  const padding = { top: 12, right: 18, bottom: 36, left: 36 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const maxVal = Math.max(...(seriesA.concat(seriesB)), 1);
  const points = (series) => series.map((v, i) => {
    const x = padding.left + (i / Math.max(1, labels.length - 1)) * innerW;
    const y = padding.top + innerH - (v / maxVal) * innerH;
    return [x, y];
  });

  const ptsA = points(seriesA);
  const ptsB = points(seriesB);

  // tooltip state for hover
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, text: '' });
  const containerRef = useRef(null);

  function showTip(e, label, value) {
    const rect = containerRef.current?.getBoundingClientRect();
    const x = e.clientX - (rect?.left || 0);
    const y = e.clientY - (rect?.top || 0);
    setTooltip({ visible: true, x, y, text: `${label}: ${value}` });
  }

  function hideTip() {
    setTooltip({ visible: false, x: 0, y: 0, text: '' });
  }

  const pathD = (pts) => pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ');

  return (
    <div ref={containerRef} style={{ width: '100%', overflowX: 'auto', position: 'relative' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 240 }}>
        {/* grid lines + y-axis labels */}
        {(() => {
          const ticksCount = 5;
          return Array.from({ length: ticksCount }).map((_, i) => {
            const t = i / (ticksCount - 1); // 0..1 top->bottom
            const y = padding.top + innerH * t;
            const val = Math.round(maxVal * (1 - t));
            return (
              <g key={`tick-${i}`}>
                <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#eef3ff" strokeWidth={1} />
                <text x={padding.left - 8} y={y + 4} fontSize={11} fill="#666" textAnchor="end">{val.toLocaleString()}</text>
              </g>
            );
          });
        })()}

        {/* series B (users) area faint */}
        {ptsB.length > 0 && (
          <path d={`${pathD(ptsB)} L ${padding.left + innerW} ${padding.top + innerH} L ${padding.left} ${padding.top + innerH} Z`} fill="rgba(10,60,255,0.06)" stroke="none" />
        )}

        {/* series A (transactions) area faint */}
        {ptsA.length > 0 && (
          <path d={`${pathD(ptsA)} L ${padding.left + innerW} ${padding.top + innerH} L ${padding.left} ${padding.top + innerH} Z`} fill="rgba(14,165,233,0.06)" stroke="none" />
        )}

        {/* series lines */}
        {ptsA.length > 0 && <path d={pathD(ptsA)} fill="none" stroke="#0ea5e9" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />}
        {ptsB.length > 0 && <path d={pathD(ptsB)} fill="none" stroke="#0a3cff" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />}

        {/* points */}
        {ptsA.map((p, i) => (
          <circle key={`a-${i}`} cx={p[0]} cy={p[1]} r={3.2} fill="#0ea5e9"
            onMouseEnter={(e) => showTip(e, `${labels[i]} • ${seriesALabel}`, seriesA[i])}
            onMouseMove={(e) => showTip(e, `${labels[i]} • ${seriesALabel}`, seriesA[i])}
            onMouseLeave={hideTip}
          />
        ))}
        {ptsB.map((p, i) => (
          <circle key={`b-${i}`} cx={p[0]} cy={p[1]} r={3.2} fill="#0a3cff"
            onMouseEnter={(e) => showTip(e, `${labels[i]} • ${seriesBLabel}`, seriesB[i])}
            onMouseMove={(e) => showTip(e, `${labels[i]} • ${seriesBLabel}`, seriesB[i])}
            onMouseLeave={hideTip}
          />
        ))}

        {/* x labels */}
        {labels.map((lab, i) => {
          const x = padding.left + (i / Math.max(1, labels.length - 1)) * innerW;
          return <text key={i} x={x} y={height - 10} fontSize={11} fill="#666" textAnchor="middle">{lab.split(' ')[0]}</text>;
        })}
      </svg>

      {/* tooltip */}
      {tooltip.visible && (
        <div style={{ position: 'absolute', left: tooltip.x + 8, top: Math.max(8, tooltip.y - 36), background: 'rgba(0,0,0,0.8)', color: '#fff', padding: '6px 8px', borderRadius: 6, fontSize: 12, pointerEvents: 'none', whiteSpace: 'nowrap' }}>{tooltip.text}</div>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 8, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ width: 12, height: 12, background: '#0a3cff', display: 'inline-block', borderRadius: 3 }} /> <span style={{ color: '#333' }}>{seriesBLabel}</span></div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><span style={{ width: 12, height: 12, background: '#0ea5e9', display: 'inline-block', borderRadius: 3 }} /> <span style={{ color: '#333' }}>{seriesALabel}</span></div>
      </div>
    </div>
  );
}
