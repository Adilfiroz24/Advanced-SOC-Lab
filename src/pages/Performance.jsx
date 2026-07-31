// ============================================================
// Advanced SOC Lab — Performance.jsx
// SOC KPI page: MTTD, MTTR, false-positive rate, coverage
// ============================================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingDown, Award,
  Shield, CheckCircle, Clock,
  AlertCircle, Activity,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
  ReferenceLine,
} from 'recharts';

// ── Chart data ────────────────────────────────────────────
const MTTD_DATA = [
  { sev: 'Critical', actual: 4.2,  benchmark: 5,    fill: '#ff2d6d' },
  { sev: 'High',     actual: 12.8, benchmark: 15,   fill: '#ff8c00' },
  { sev: 'Medium',   actual: 45.3, benchmark: 60,   fill: '#ffd600' },
  { sev: 'Low',      actual: 98.7, benchmark: 120,  fill: '#00e5ff' },
];

const MTTR_DATA = [
  { sev: 'Critical', actual: 48,  benchmark: 60,   fill: '#ff2d6d' },
  { sev: 'High',     actual: 195, benchmark: 240,  fill: '#ff8c00' },
  { sev: 'Medium',   actual: 380, benchmark: 480,  fill: '#ffd600' },
  { sev: 'Low',      actual: 980, benchmark: 1440, fill: '#00e5ff' },
];

const WEEKLY_TREND = [
  { day: 'Mon', mttd: 6.2,  mttr: 65,  alerts: 18 },
  { day: 'Tue', mttd: 5.8,  mttr: 58,  alerts: 22 },
  { day: 'Wed', mttd: 4.9,  mttr: 52,  alerts: 15 },
  { day: 'Thu', mttd: 5.5,  mttr: 61,  alerts: 27 },
  { day: 'Fri', mttd: 4.2,  mttr: 48,  alerts: 19 },
  { day: 'Sat', mttd: 3.8,  mttr: 42,  alerts: 8  },
  { day: 'Sun', mttd: 4.1,  mttr: 45,  alerts: 11 },
];

const MONTHLY_TREND = [
  { week: 'W1', mttd: 7.2,  mttr: 72,  fp_rate: 22 },
  { week: 'W2', mttd: 6.1,  mttr: 63,  fp_rate: 19 },
  { week: 'W3', mttd: 5.4,  mttr: 55,  fp_rate: 17 },
  { week: 'W4', mttd: 4.2,  mttr: 48,  fp_rate: 16 },
];

const COVERAGE_DATA = [
  { tactic: 'Credential',   covered: 4, total: 5  },
  { tactic: 'Execution',    covered: 2, total: 4  },
  { tactic: 'Persistence',  covered: 3, total: 5  },
  { tactic: 'Priv. Esc.',   covered: 1, total: 3  },
  { tactic: 'Defense Eva.', covered: 2, total: 6  },
  { tactic: 'Discovery',    covered: 1, total: 2  },
  { tactic: 'Impact',       covered: 2, total: 3  },
  { tactic: 'Initial Acc.', covered: 2, total: 5  },
];

// ── KPI config ────────────────────────────────────────────
const KPIS = [
  {
    label:     'MTTD Critical',
    value:     '4.2m',
    benchmark: '≤ 5m',
    pass:      true,
    icon:      TrendingDown,
    color:     '#00ff88',
    sub:       'Mean Time to Detect — P1',
  },
  {
    label:     'MTTR Critical',
    value:     '48m',
    benchmark: '≤ 60m',
    pass:      true,
    icon:      Clock,
    color:     '#00ff88',
    sub:       'Mean Time to Respond — P1',
  },
  {
    label:     'False Positive Rate',
    value:     '16%',
    benchmark: '≤ 20%',
    pass:      true,
    icon:      Award,
    color:     '#00ff88',
    sub:       'Alerts confirmed as FP',
  },
  {
    label:     'MTTD High',
    value:     '12.8m',
    benchmark: '≤ 15m',
    pass:      true,
    icon:      TrendingDown,
    color:     '#00ff88',
    sub:       'Mean Time to Detect — P2',
  },
  {
    label:     'Detection Rate',
    value:     '90%',
    benchmark: '≥ 90%',
    pass:      true,
    icon:      Shield,
    color:     '#00ff88',
    sub:       '9/10 purple team scenarios',
  },
  {
    label:     'Rule Coverage',
    value:     '74%',
    benchmark: '≥ 70%',
    pass:      true,
    icon:      CheckCircle,
    color:     '#00ff88',
    sub:       '21/28 ATT&CK techniques',
  },
];

// ── Custom tooltip ────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(10,15,30,0.97)',
      border: '1px solid #1a2744',
      borderRadius: 8,
      padding: '10px 14px',
      fontSize: 12,
      color: '#c8d8f0',
    }}>
      <div style={{
        marginBottom: 7, color: '#6b7fa3',
        fontWeight: 600, fontSize: 11,
      }}>
        {label}
      </div>
      {payload.map(p => (
        <div key={p.dataKey} style={{
          display: 'flex', alignItems: 'center',
          gap: 7, marginBottom: 3,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: 2,
            background: p.color, flexShrink: 0,
          }} />
          <span style={{ color: '#c8d8f0' }}>{p.name}:</span>
          <span style={{
            color: p.color,
            fontFamily: 'JetBrains Mono, monospace',
            fontWeight: 600,
          }}>
            {p.value}
            {p.name?.toLowerCase().includes('mttd') ||
             p.name?.toLowerCase().includes('mttr') ? 'm' : ''}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Period selector ───────────────────────────────────────
function PeriodPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 12px',
        borderRadius: 9999,
        fontSize: 11.5,
        fontWeight: 500,
        cursor: 'pointer',
        border: '1px solid',
        outline: 'none',
        transition: 'all 0.14s',
        background:  active ? 'rgba(0,229,255,0.14)' : 'rgba(255,255,255,0.04)',
        color:       active ? '#00e5ff'               : '#6b7fa3',
        borderColor: active ? 'rgba(0,229,255,0.35)'  : '#1a2744',
      }}
    >
      {label}
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────
export default function Performance() {
  const [period, setPeriod] = useState('7d');
  const trendData = period === '7d' ? WEEKLY_TREND : MONTHLY_TREND;
  const trendKey  = period === '7d' ? 'day' : 'week';

  return (
    <motion.div
      key="performance"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28 }}
    >
      {/* ── Page header ───────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontSize: 22, fontWeight: 700, color: '#e8f4ff',
          margin: 0, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <BarChart3 size={20} color="#00e5ff" />
          SOC Performance Metrics
        </h1>
        <div style={{ fontSize: 13, color: '#3d5080', marginTop: 4 }}>
          MTTD &nbsp;·&nbsp; MTTR &nbsp;·&nbsp;
          False Positive Rate &nbsp;·&nbsp; Rule Coverage &nbsp;·&nbsp;
          Last 30 days
        </div>
      </div>

      {/* ── KPI cards ─────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12, marginBottom: 24,
      }}>
        {KPIS.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              className="glass-card"
              style={{ padding: '16px 18px' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ borderColor: '#243660' }}
            >
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'flex-start', marginBottom: 12,
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 8,
                  background: 'rgba(0,255,136,0.08)',
                  border: '1px solid rgba(0,255,136,0.20)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={15} color="#00ff88" />
                </div>
                <span style={{
                  fontSize: 10.5, color: '#00ff88',
                  background: 'rgba(0,255,136,0.08)',
                  border: '1px solid rgba(0,255,136,0.22)',
                  borderRadius: 5, padding: '2px 8px',
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <CheckCircle size={10} /> PASS
                </span>
              </div>

              <div style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 26, fontWeight: 700,
                color: '#00e5ff', marginBottom: 5,
                lineHeight: 1,
              }}>
                {kpi.value}
              </div>
              <div style={{
                fontSize: 13, color: '#c8d8f0',
                fontWeight: 600, marginBottom: 3,
              }}>
                {kpi.label}
              </div>
              <div style={{ fontSize: 11, color: '#3d5080' }}>
                {kpi.sub}
              </div>
              <div style={{
                marginTop: 6, fontSize: 11,
                color: '#3d5080',
              }}>
                Benchmark:&nbsp;
                <span style={{
                  color: '#6b7fa3',
                  fontFamily: 'JetBrains Mono, monospace',
                }}>
                  {kpi.benchmark}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── MTTD + MTTR bar charts ─────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 16, marginBottom: 16,
      }}>
        {/* MTTD */}
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 14, fontWeight: 600, color: '#e8f4ff',
            }}>
              MTTD by Severity
            </div>
            <div style={{ fontSize: 11.5, color: '#3d5080', marginTop: 2 }}>
              Mean Time to Detect (minutes) vs. benchmark
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={MTTD_DATA} margin={{ left: -22 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1a2744" vertical={false}
              />
              <XAxis
                dataKey="sev"
                tick={{ fontSize: 11, fill: '#6b7fa3' }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#3d5080' }}
                axisLine={false} tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar
                dataKey="actual"
                name="Actual (min)"
                radius={[4, 4, 0, 0]}
              >
                {MTTD_DATA.map((e, i) => (
                  <Cell key={i} fill={e.fill} fillOpacity={0.78} />
                ))}
              </Bar>
              <Bar
                dataKey="benchmark"
                name="Benchmark"
                fill="#1a2744"
                radius={[4, 4, 0, 0]}
                fillOpacity={0.9}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* MTTR */}
        <div className="glass-card" style={{ padding: '18px 20px' }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 14, fontWeight: 600, color: '#e8f4ff',
            }}>
              MTTR by Severity
            </div>
            <div style={{ fontSize: 11.5, color: '#3d5080', marginTop: 2 }}>
              Mean Time to Respond (minutes) vs. benchmark
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={MTTR_DATA} margin={{ left: -22 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1a2744" vertical={false}
              />
              <XAxis
                dataKey="sev"
                tick={{ fontSize: 11, fill: '#6b7fa3' }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#3d5080' }}
                axisLine={false} tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar
                dataKey="actual"
                name="Actual (min)"
                radius={[4, 4, 0, 0]}
              >
                {MTTR_DATA.map((e, i) => (
                  <Cell key={i} fill={e.fill} fillOpacity={0.78} />
                ))}
              </Bar>
              <Bar
                dataKey="benchmark"
                name="Benchmark"
                fill="#1a2744"
                radius={[4, 4, 0, 0]}
                fillOpacity={0.9}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Trend line chart ──────────────────────────── */}
      <div className="glass-card" style={{
        padding: '18px 20px', marginBottom: 16,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', marginBottom: 16,
        }}>
          <div>
            <div style={{
              fontSize: 14, fontWeight: 600, color: '#e8f4ff',
            }}>
              MTTD / MTTR Trend
            </div>
            <div style={{ fontSize: 11.5, color: '#3d5080', marginTop: 2 }}>
              Rolling average — Critical severity
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['7d', '30d'].map(p => (
              <PeriodPill
                key={p}
                label={p}
                active={period === p}
                onClick={() => setPeriod(p)}
              />
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <LineChart
            data={trendData}
            margin={{ left: -18, right: 8 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1a2744" vertical={false}
            />
            <XAxis
              dataKey={trendKey}
              tick={{ fontSize: 11, fill: '#6b7fa3' }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#3d5080' }}
              axisLine={false} tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11.5, color: '#6b7fa3', paddingTop: 12 }}
            />
            {/* Benchmark reference line for MTTD */}
            <ReferenceLine
              y={5}
              stroke="#00e5ff"
              strokeDasharray="4 4"
              strokeOpacity={0.35}
              label={{
                value: 'MTTD SLA',
                fill: '#00e5ff',
                fontSize: 9,
                position: 'right',
              }}
            />
            <ReferenceLine
              y={60}
              stroke="#ff8c00"
              strokeDasharray="4 4"
              strokeOpacity={0.35}
              label={{
                value: 'MTTR SLA',
                fill: '#ff8c00',
                fontSize: 9,
                position: 'right',
              }}
            />
            <Line
              type="monotone"
              dataKey="mttd"
              name="MTTD (min)"
              stroke="#00e5ff"
              strokeWidth={2.5}
              dot={{ fill: '#00e5ff', r: 3.5, strokeWidth: 0 }}
              activeDot={{ r: 5, stroke: '#00e5ff', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="mttr"
              name="MTTR (min)"
              stroke="#ff8c00"
              strokeWidth={2.5}
              dot={{ fill: '#ff8c00', r: 3.5, strokeWidth: 0 }}
              activeDot={{ r: 5, stroke: '#ff8c00', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Rule coverage by tactic ───────────────────── */}
      <div className="glass-card" style={{ padding: '18px 20px' }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: 14, fontWeight: 600, color: '#e8f4ff',
          }}>
            Detection Rule Coverage by Tactic
          </div>
          <div style={{ fontSize: 11.5, color: '#3d5080', marginTop: 2 }}>
            Rules covering each ATT&CK tactic
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={COVERAGE_DATA}
            margin={{ left: -22 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#1a2744" vertical={false}
            />
            <XAxis
              dataKey="tactic"
              tick={{ fontSize: 10.5, fill: '#6b7fa3' }}
              axisLine={false} tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#3d5080' }}
              axisLine={false} tickLine={false}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11.5, color: '#6b7fa3', paddingTop: 12 }}
            />
            <Bar
              dataKey="covered"
              name="Covered"
              fill="#00e5ff"
              fillOpacity={0.72}
              radius={[3, 3, 0, 0]}
              stackId="a"
            />
            <Bar
              dataKey="total"
              name="Total techniques"
              fill="#1a2744"
              fillOpacity={0.9}
              radius={[3, 3, 0, 0]}
              stackId="b"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}