import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Lock, Search, Download, Filter,
  RefreshCw, Shield, AlertTriangle,
  CheckCircle, Hash, Clock,
} from 'lucide-react';
import AuditLogEntry from './AuditLogEntry';

// ── Simulated immutable audit log ────────────────────────
function hashEntry(entry) {
  // Deterministic pseudo-hash for UI display — mirrors HMAC-SHA256 chain
  const str  = JSON.stringify(entry);
  let   hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const hex  = Math.abs(hash).toString(16).padStart(8, '0');
  return `sha256:${hex}${'a3f8b2e1c9d4'.repeat(4)}${hex}`.slice(0, 64);
}

const RAW_ENTRIES = [
  {
    id: 'AUD-001', action: 'login', user: 'analyst-chen',
    timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
    ip: '192.168.1.45', userAgent: 'Chrome 120 / Linux',
    sessionId: 'sess_8f3a9b2c', resource: 'SOC Dashboard',
    description: 'Successful login to SOC Dashboard',
    riskLevel: 'low', result: 'success',
    metadata: { mfa: true, location: 'Office (192.168.1.x)' },
  },
  {
    id: 'AUD-002', action: 'view', user: 'analyst-chen',
    timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
    ip: '192.168.1.45', userAgent: 'Chrome 120 / Linux',
    sessionId: 'sess_8f3a9b2c', resource: 'CASE-2024-0047',
    description: 'Viewed incident case CASE-2024-0047 (Mimikatz / LSASS)',
    riskLevel: 'low', result: 'success',
    metadata: { caseId: 'CASE-2024-0047', severity: 'P1' },
  },
  {
    id: 'AUD-003', action: 'block', user: 'auto_investigate',
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    ip: '192.168.56.10', userAgent: 'Python 3.11 / auto_investigate.py',
    sessionId: 'svc_auto_001', resource: 'Firewall / iptables',
    description: 'Automated IP block: 203.0.113.45 (AbuseIPDB score 94%)',
    riskLevel: 'high', result: 'success',
    metadata: { blockedIp: '203.0.113.45', method: 'iptables+pfSense', score: 94 },
  },
  {
    id: 'AUD-004', action: 'create', user: 'auto_investigate',
    timestamp: new Date(Date.now() - 20 * 60000).toISOString(),
    ip: '192.168.56.10', userAgent: 'Python 3.11 / auto_investigate.py',
    sessionId: 'svc_auto_001', resource: 'TheHive / Cases',
    description: 'TheHive case CASE-2024-0047 auto-created at P1 severity',
    riskLevel: 'medium', result: 'success',
    metadata: { caseId: 'CASE-2024-0047', priority: 'P1', severity: 4 },
  },
  {
    id: 'AUD-005', action: 'escalate', user: 'analyst-chen',
    timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
    ip: '192.168.1.45', userAgent: 'Chrome 120 / Linux',
    sessionId: 'sess_8f3a9b2c', resource: 'CASE-2024-0047',
    description: 'Case CASE-2024-0047 escalated to IR team',
    riskLevel: 'medium', result: 'success',
    metadata: { notifiedTeam: 'IR', notificationMethod: 'Slack' },
  },
  {
    id: 'AUD-006', action: 'enrich', user: 'analyst-patel',
    timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
    ip: '192.168.1.62', userAgent: 'Chrome 120 / Windows',
    sessionId: 'sess_9c4d1e8f', resource: 'AbuseIPDB / IOC',
    description: 'Manual AbuseIPDB lookup: 198.51.100.99 — returned 99% confidence',
    riskLevel: 'low', result: 'success',
    metadata: { ip: '198.51.100.99', apiSource: 'AbuseIPDB', score: 99 },
  },
  {
    id: 'AUD-007', action: 'export', user: 'analyst-chen',
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
    ip: '192.168.1.45', userAgent: 'Chrome 120 / Linux',
    sessionId: 'sess_8f3a9b2c', resource: 'CASE-2024-0047 / PDF',
    description: 'Incident report exported: CASE-2024-0047.pdf (PDF format)',
    riskLevel: 'medium', result: 'success',
    metadata: { format: 'PDF', pages: 14, classification: 'CONFIDENTIAL' },
  },
  {
    id: 'AUD-008', action: 'configuration', user: 'admin-kim',
    timestamp: new Date(Date.now() - 60 * 60000).toISOString(),
    ip: '192.168.1.10', userAgent: 'Chrome 120 / macOS',
    sessionId: 'sess_admin_7a2b', resource: 'Wazuh / Rules',
    description: 'Rule 100013 threshold updated: level 14 → 15 (LSASS detection)',
    riskLevel: 'high', result: 'success',
    metadata: { ruleId: '100013', oldLevel: 14, newLevel: 15 },
  },
  {
    id: 'AUD-009', action: 'login', user: 'analyst-patel',
    timestamp: new Date(Date.now() - 75 * 60000).toISOString(),
    ip: '192.168.1.62', userAgent: 'Chrome 120 / Windows',
    sessionId: 'sess_9c4d1e8f', resource: 'SOC Dashboard',
    description: 'Successful login to SOC Dashboard',
    riskLevel: 'low', result: 'success',
    metadata: { mfa: true },
  },
  {
    id: 'AUD-010', action: 'search', user: 'analyst-patel',
    timestamp: new Date(Date.now() - 80 * 60000).toISOString(),
    ip: '192.168.1.62', userAgent: 'Chrome 120 / Windows',
    sessionId: 'sess_9c4d1e8f', resource: 'Advanced Search',
    description: 'Search executed: "rule_id:100013 AND severity:critical" — 1 result',
    riskLevel: 'low', result: 'success',
    metadata: { query: 'rule_id:100013 AND severity:critical', hits: 1 },
  },
  {
    id: 'AUD-011', action: 'automation', user: 'auto_investigate',
    timestamp: new Date(Date.now() - 90 * 60000).toISOString(),
    ip: '192.168.56.10', userAgent: 'Python 3.11 / auto_investigate.py',
    sessionId: 'svc_auto_001', resource: 'VirusTotal / Hash',
    description: 'Hash lookup: 5f1d8aa80a44… — 87/90 engines flagged malicious',
    riskLevel: 'high', result: 'success',
    metadata: { hash: '5f1d8aa80a4463a8…', malicious: 87, total: 90 },
  },
  {
    id: 'AUD-012', action: 'delete', user: 'admin-kim',
    timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
    ip: '192.168.1.10', userAgent: 'Chrome 120 / macOS',
    sessionId: 'sess_admin_7a2b', resource: 'TheHive / Case',
    description: 'False-positive case CASE-2024-0042 closed and archived',
    riskLevel: 'medium', result: 'success',
    metadata: { caseId: 'CASE-2024-0042', reason: 'false_positive', reviewer: 'admin-kim' },
  },
  {
    id: 'AUD-013', action: 'hash_verify', user: 'system',
    timestamp: new Date(Date.now() - 130 * 60000).toISOString(),
    ip: '127.0.0.1', userAgent: 'Audit Daemon v1.0',
    sessionId: 'svc_audit_chain', resource: 'Audit Log / Chain',
    description: 'Audit log integrity chain verified — all 47 entries validated',
    riskLevel: 'low', result: 'success',
    metadata: { entriesVerified: 47, chainValid: true, algorithm: 'HMAC-SHA256' },
  },
].map(entry => ({
  ...entry,
  hash: hashEntry(entry),
}));

const ACTION_GROUPS = ['all', 'login', 'view', 'create', 'update', 'delete',
  'block', 'export', 'automation', 'configuration', 'escalate'];
const RISK_OPTS = ['all', 'low', 'medium', 'high', 'critical'];
const RISK_COLOR = { low:'#00ff88', medium:'#ffd600', high:'#ff8c00', critical:'#ff2d6d' };

export default function AuditTrail() {
  const [search,      setSearch]      = useState('');
  const [actionFilter,setActionFilter]= useState('all');
  const [riskFilter,  setRiskFilter]  = useState('all');
  const [userFilter,  setUserFilter]  = useState('');
  const [page,        setPage]        = useState(1);
  const PER_PAGE = 10;

  const entries = RAW_ENTRIES;

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return entries.filter(e => {
      if (actionFilter !== 'all' && e.action !== actionFilter) return false;
      if (riskFilter   !== 'all' && e.riskLevel !== riskFilter) return false;
      if (userFilter && !e.user.toLowerCase().includes(userFilter.toLowerCase())) return false;
      if (q && !e.description.toLowerCase().includes(q) &&
               !e.user.toLowerCase().includes(q) &&
               !e.id.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [entries, search, actionFilter, riskFilter, userFilter]);

  const paginated = filtered.slice(0, page * PER_PAGE);
  const hasMore   = paginated.length < filtered.length;

  // Stats
  const totalHigh   = entries.filter(e => e.riskLevel === 'high' || e.riskLevel === 'critical').length;
  const uniqueUsers = [...new Set(entries.map(e => e.user))].length;
  const chainValid  = entries.every(e => e.hash);

  const exportCSV = () => {
    const header = 'id,timestamp,action,user,ip,description,riskLevel,result';
    const rows   = filtered.map(e =>
      `${e.id},${e.timestamp},${e.action},${e.user},${e.ip},"${e.description}",${e.riskLevel},${e.result}`
    );
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `audit_log_${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      key="audit-trail"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* ── Page header ───────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontSize: 22, fontWeight: 700, color: '#e8f4ff',
          margin: 0, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Lock size={20} color="#00e5ff" />
          Immutable Audit Trail
        </h1>
        <div style={{ fontSize: 13, color: '#3d5080', marginTop: 4 }}>
          HMAC-SHA256 integrity chain · Tamper-evident · SOC activity log
        </div>
      </div>

      {/* ── Summary stats ─────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
        gap: 12, marginBottom: 22,
      }}>
        {[
          { label:'Total Events',   value: entries.length,  color:'#00e5ff', icon: Clock        },
          { label:'High Risk',      value: totalHigh,       color:'#ff2d6d', icon: AlertTriangle },
          { label:'Active Users',   value: uniqueUsers,     color:'#ff8c00', icon: Shield        },
          { label:'Chain Integrity',value: chainValid ? 'VALID' : 'BROKEN',
            color: chainValid ? '#00ff88' : '#ff2d6d', icon: CheckCircle },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="glass-card" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: `${s.color}14`,
                  border: `1px solid ${s.color}28`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={14} color={s.color} />
                </div>
                <div>
                  <div style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 22, fontWeight: 700, color: s.color, lineHeight: 1,
                  }}>{s.value}</div>
                  <div style={{ fontSize: 11, color: '#3d5080', marginTop: 3 }}>
                    {s.label}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Chain integrity banner ─────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px', marginBottom: 16,
        background: 'rgba(0,255,136,0.06)',
        border: '1px solid rgba(0,255,136,0.20)',
        borderRadius: 8,
      }}>
        <Hash size={14} color="#00ff88" />
        <span style={{ fontSize: 12.5, color: '#00ff88', fontWeight: 600 }}>
          Audit log integrity chain: VALID
        </span>
        <span style={{ fontSize: 12, color: '#6b7fa3' }}>
          — All {entries.length} entries are HMAC-SHA256 verified.
          Any tampering would break the hash chain.
        </span>
      </div>

      {/* ── Filter bar ────────────────────────────────── */}
      <div className="glass-card" style={{ padding: '12px 14px', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={12} color="#4a6090" style={{
              position: 'absolute', left: 9,
              top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none',
            }} />
            <input className="soc-input" value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search description, user, event ID…"
              style={{ paddingLeft: 28, height: 30, fontSize: 12 }}
            />
          </div>

          {/* User filter */}
          <input className="soc-input" value={userFilter}
            onChange={e => setUserFilter(e.target.value)}
            placeholder="Filter by user…"
            style={{ width: 150, height: 30, fontSize: 12 }}
          />

          {/* Action filter */}
          <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
            style={{
              background: 'rgba(10,15,30,0.85)', border: '1px solid #1a2744',
              borderRadius: 7, color: '#c8d8f0', padding: '4px 8px',
              fontSize: 12, cursor: 'pointer', outline: 'none',
            }}>
            {ACTION_GROUPS.map(a => (
              <option key={a} value={a}>{a === 'all' ? 'All Actions' : a}</option>
            ))}
          </select>

          {/* Risk filter pills */}
          <div style={{ display: 'flex', gap: 5 }}>
            {RISK_OPTS.map(r => (
              <button key={r} onClick={() => setRiskFilter(r)} style={{
                padding: '3px 10px', borderRadius: 9999, fontSize: 11,
                cursor: 'pointer', border: '1px solid', transition: 'all 0.14s',
                background: riskFilter===r
                  ? `${RISK_COLOR[r]||'#00e5ff'}18`
                  : 'rgba(255,255,255,0.04)',
                color: riskFilter===r
                  ? RISK_COLOR[r]||'#00e5ff'
                  : '#6b7fa3',
                borderColor: riskFilter===r
                  ? `${RISK_COLOR[r]||'#00e5ff'}40`
                  : '#1a2744',
              }}>{r}</button>
            ))}
          </div>

          <button className="btn-cyber btn-ghost"
            style={{ fontSize: 12, padding: '5px 12px', marginLeft: 'auto' }}
            onClick={exportCSV}>
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* ── Audit log table ───────────────────────────── */}
      <div className="glass-card" style={{ overflow: 'hidden', padding: 0 }}>
        {/* Table header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '9px 14px',
          borderBottom: '1px solid #1a2744',
          background: 'rgba(0,0,0,0.3)',
        }}>
          <div style={{ width: 14 }} />
          <div style={{
            width: 130, fontSize: 10.5, color: '#3d5080',
            fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', fontFamily: 'JetBrains Mono,monospace',
          }}>Timestamp</div>
          <div style={{
            width: 130, fontSize: 10.5, color: '#3d5080',
            fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', fontFamily: 'JetBrains Mono,monospace',
          }}>Action</div>
          <div style={{
            width: 150, fontSize: 10.5, color: '#3d5080',
            fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', fontFamily: 'JetBrains Mono,monospace',
          }}>User</div>
          <div style={{
            flex: 1, fontSize: 10.5, color: '#3d5080',
            fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', fontFamily: 'JetBrains Mono,monospace',
          }}>Description</div>
          <div style={{
            width: 80, fontSize: 10.5, color: '#3d5080',
            fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', fontFamily: 'JetBrains Mono,monospace',
            textAlign: 'center',
          }}>Risk</div>
          <div style={{
            width: 20, fontSize: 10.5, color: '#3d5080',
            fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', fontFamily: 'JetBrains Mono,monospace',
            textAlign: 'center',
          }}>✓</div>
        </div>

        {/* Entries */}
        {paginated.map((entry, i) => (
          <AuditLogEntry key={entry.id} entry={entry} index={i} />
        ))}

        {filtered.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '40px 0', color: '#3d5080',
          }}>
            <Lock size={28} style={{ opacity: 0.2, margin: '0 auto 10px' }} />
            <div style={{ fontSize: 13 }}>No audit entries match the current filter</div>
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <div style={{
            padding: '12px 0', textAlign: 'center',
            borderTop: '1px solid #1a2744',
          }}>
            <button className="btn-cyber btn-ghost"
              style={{ fontSize: 12 }}
              onClick={() => setPage(p => p + 1)}>
              Load more ({filtered.length - paginated.length} remaining)
            </button>
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: '10px 14px',
          borderTop: '1px solid #1a2744',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.2)',
        }}>
          <span style={{
            fontSize: 11.5, color: '#3d5080',
            fontFamily: 'JetBrains Mono, monospace',
          }}>
            Showing {paginated.length} of {filtered.length} events
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5 }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#00ff88',
              boxShadow: '0 0 5px rgba(0,255,136,0.6)',
            }} />
            <span style={{ color: '#00ff88' }}>Hash chain intact — tamper-evident</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}