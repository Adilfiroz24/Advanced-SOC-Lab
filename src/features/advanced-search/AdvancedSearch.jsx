import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, SlidersHorizontal, BookOpen,
  Clock, AlertTriangle, FolderOpen, Globe,
  X, Download, ChevronDown, ChevronUp, Loader,
} from 'lucide-react';
import SearchFilters from './SearchFilters';
import SavedQueries  from './SavedQueries';
import { mockAlerts }       from '../../data/mockAlerts';
import { mockCases }        from '../../data/mockCases';
import { mockThreatIntel }  from '../../data/mockThreatIntel';

// ── Searchable corpus ─────────────────────────────────────
function buildCorpus() {
  const results = [];

  (mockAlerts || []).forEach(a => results.push({
    id:        a.id,
    type:      'alert',
    title:     a.description,
    subtitle:  `Rule ${a.rule_id} · ${a.agent_name}`,
    severity:  a.severity,
    status:    a.status,
    timestamp: a.timestamp,
    src_ip:    a.src_ip,
    mitre:     a.mitre || [],
    source:    'wazuh',
    rule_id:   a.rule_id,
    agent:     a.agent_name,
    raw:       a,
  }));

  (mockCases || []).forEach(c => results.push({
    id:        c.id,
    type:      'case',
    title:     c.title,
    subtitle:  `${c.id} · ${c.assigned_to}`,
    severity:  ['','low','medium','high','critical'][c.severity] || 'medium',
    status:    c.status,
    timestamp: c.created_at,
    mitre:     c.mitre || [],
    source:    'thehive',
    agent:     '',
    raw:       c,
  }));

  (mockThreatIntel || []).forEach(ioc => results.push({
    id:        ioc.id,
    type:      'ioc',
    title:     ioc.value,
    subtitle:  `${ioc.type?.toUpperCase()} · ${ioc.threat_type} · ${ioc.country || '?'}`,
    severity:  ioc.confidence >= 90 ? 'critical'
             : ioc.confidence >= 70 ? 'high'
             : ioc.confidence >= 50 ? 'medium' : 'low',
    status:    ioc.blocked ? 'blocked' : 'active',
    timestamp: ioc.last_seen,
    mitre:     ioc.mitre || [],
    source:    ioc.source?.toLowerCase().includes('abuse') ? 'virustotal' : 'misp',
    agent:     '',
    raw:       ioc,
  }));

  return results;
}

const CORPUS = buildCorpus();

const DEFAULT_FILTERS = {
  timeRange: '24h',
  severity:  [],
  status:    [],
  source:    [],
  mitre:     [],
  agent:     '',
  ruleId:    '',
};

// ── Type icon/color map ───────────────────────────────────
const TYPE_CONFIG = {
  alert: { icon: AlertTriangle, color: '#ff8c00', label: 'ALERT' },
  case:  { icon: FolderOpen,   color: '#00e5ff', label: 'CASE'  },
  ioc:   { icon: Globe,        color: '#a855f7', label: 'IOC'   },
};

const SEV_COLOR = {
  critical: '#ff2d6d', high: '#ff8c00',
  medium:   '#ffd600', low: '#00ff88',
};

function matchesTimeRange(timestamp, range) {
  if (!range || range === 'all') return true;
  const now = Date.now();
  const ms  = {
    '15m': 15*60_000,  '1h': 3_600_000,
    '6h':  6*3_600_000,'24h': 24*3_600_000,
    '7d':  7*24*3_600_000, '30d': 30*24*3_600_000,
  }[range];
  if (!ms) return true;
  return (now - new Date(timestamp).getTime()) < ms;
}

// ── Result card ───────────────────────────────────────────
function ResultCard({ result, index }) {
  const [expanded, setExpanded] = useState(false);
  const cfg   = TYPE_CONFIG[result.type] || TYPE_CONFIG.alert;
  const Icon  = cfg.icon;
  const color = SEV_COLOR[result.severity] || '#6b7fa3';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.14, delay: index * 0.025 }}
      style={{
        background: 'rgba(13,21,48,0.65)',
        border: '1px solid #1a2744', borderRadius: 8,
        overflow: 'hidden', cursor: 'pointer',
        transition: 'border-color 0.15s',
      }}
      onClick={() => setExpanded(p => !p)}
      whileHover={{ borderColor: '#243660' }}
    >
      {/* Main row */}
      <div style={{
        display: 'flex', alignItems: 'center',
        gap: 10, padding: '11px 14px',
      }}>
        {/* Type badge */}
        <div style={{
          width: 32, height: 32, borderRadius: 7, flexShrink: 0,
          background: `${cfg.color}12`,
          border: `1px solid ${cfg.color}25`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={13} color={cfg.color} />
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3,
          }}>
            <span style={{
              fontSize: 9.5, fontWeight: 700, color: cfg.color,
              fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: '0.07em',
            }}>{cfg.label}</span>
            <span className={`badge badge-${result.severity}`}>
              {result.severity}
            </span>
            {result.source && (
              <span style={{
                fontSize: 9.5, color: '#3d5080',
                fontFamily: 'JetBrains Mono, monospace',
              }}>{result.source}</span>
            )}
          </div>
          <div style={{
            fontSize: 13, color: '#e8f4ff', fontWeight: 500,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {result.title}
          </div>
          <div style={{ fontSize: 11, color: '#6b7fa3', marginTop: 2 }}>
            {result.subtitle}
          </div>
        </div>

        {/* Right */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: '#3d5080', marginBottom: 3,
            fontFamily: 'JetBrains Mono, monospace' }}>
            {result.timestamp
              ? new Date(result.timestamp).toLocaleTimeString()
              : '—'}
          </div>
          {result.mitre?.slice(0,2).map(t => (
            <span key={t} className="mitre-tag" style={{ fontSize: 9, marginLeft: 4 }}>
              {t}
            </span>
          ))}
        </div>

        <div style={{ color: '#3d5080', flexShrink: 0 }}>
          {expanded ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '12px 14px',
              borderTop: '1px solid #1a2744',
              background: 'rgba(0,0,0,0.2)',
            }}>
              <pre style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11, color: '#00e5ff',
                margin: 0, lineHeight: 1.7,
                whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                maxHeight: 200, overflow: 'auto',
              }}>
                {JSON.stringify(result.raw, null, 2)}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────
export default function AdvancedSearch() {
  const [query,       setQuery]       = useState('');
  const [filters,     setFilters]     = useState(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [showSaved,   setShowSaved]   = useState(false);
  const [searching,   setSearching]   = useState(false);
  const [searched,    setSearched]    = useState(false);
  const [page,        setPage]        = useState(1);
  const PER_PAGE = 15;

  // ── Search logic ──────────────────────────────────────
  const results = useMemo(() => {
    if (!searched && !query.trim()) return [];

    const q   = query.toLowerCase().trim();
    const qOr = q.split(' OR ').map(s => s.trim()).filter(Boolean);
    const qAnd= q.includes(' AND ')
      ? q.split(' AND ').map(s => s.trim()).filter(Boolean)
      : null;

    return CORPUS.filter(item => {
      // ── Text match ──────────────────────────────────
      const haystack = [
        item.title, item.subtitle, item.src_ip || '',
        item.agent || '', item.rule_id || '',
        ...(item.mitre || []),
      ].join(' ').toLowerCase();

      let textMatch = true;
      if (q) {
        if (qAnd) {
          textMatch = qAnd.every(term => haystack.includes(term));
        } else {
          textMatch = qOr.length > 0
            ? qOr.some(term => haystack.includes(term))
            : true;
        }
      }
      if (!textMatch) return false;

      // ── Filter: time ─────────────────────────────────
      if (!matchesTimeRange(item.timestamp, filters.timeRange)) return false;

      // ── Filter: severity ─────────────────────────────
      if (filters.severity?.length > 0 &&
          !filters.severity.includes(item.severity)) return false;

      // ── Filter: status ────────────────────────────────
      if (filters.status?.length > 0 &&
          !filters.status.includes(item.status?.toLowerCase())) return false;

      // ── Filter: source ────────────────────────────────
      if (filters.source?.length > 0 &&
          !filters.source.includes(item.source)) return false;

      // ── Filter: mitre ─────────────────────────────────
      if (filters.mitre?.length > 0 &&
          !filters.mitre.some(t => item.mitre?.includes(t))) return false;

      // ── Filter: agent ─────────────────────────────────
      if (filters.agent && !item.agent?.toLowerCase()
          .includes(filters.agent.toLowerCase())) return false;

      // ── Filter: rule_id ───────────────────────────────
      if (filters.ruleId && !item.rule_id?.includes(filters.ruleId)) return false;

      return true;
    });
  }, [query, filters, searched]);

  const paginated = results.slice(0, page * PER_PAGE);
  const hasMore   = paginated.length < results.length;

  const handleSearch = useCallback(() => {
    setSearching(true);
    setPage(1);
    setTimeout(() => {
      setSearched(true);
      setSearching(false);
    }, 300);
  }, []);

  const handleReset = () => {
    setFilters(DEFAULT_FILTERS);
    setQuery('');
    setSearched(false);
    setPage(1);
  };

  const exportResults = () => {
    const blob = new Blob(
      [JSON.stringify(results.map(r => r.raw), null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href = url; a.download = 'search_results.json';
    a.click(); URL.revokeObjectURL(url);
  };

  // ── Active filter count ───────────────────────────────
  const activeFilterCount = [
    ...(filters.severity || []),
    ...(filters.status   || []),
    ...(filters.source   || []),
    ...(filters.mitre    || []),
    filters.agent  ? [1] : [],
    filters.ruleId ? [1] : [],
    filters.timeRange !== '24h' ? [1] : [],
  ].flat().length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Page title ──────────────────────────────── */}
      <div>
        <h1 style={{
          fontSize: 22, fontWeight: 700, color: '#e8f4ff',
          margin: 0, display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Search size={20} color="#00e5ff" />
          Advanced Search
        </h1>
        <div style={{ fontSize: 13, color: '#3d5080', marginTop: 4 }}>
          {CORPUS.length.toLocaleString()} searchable records
          across alerts, cases, and threat intel
        </div>
      </div>

      {/* ── Search bar ──────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {/* Main input */}
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} color="#4a6090" style={{
            position: 'absolute', left: 12,
            top: '50%', transform: 'translateY(-50%)',
            pointerEvents: 'none',
          }} />
          <input
            className="soc-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder='Search alerts, cases, IOCs… (supports AND / OR operators)'
            style={{
              paddingLeft: 36, height: 40, fontSize: 13.5,
              fontFamily: query ? 'JetBrains Mono, monospace' : 'Inter, sans-serif',
            }}
          />
          {query && (
            <button onClick={() => { setQuery(''); setSearched(false); }}
              style={{
                position: 'absolute', right: 10,
                top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#3d5080', padding: 2,
              }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Search button */}
        <button
          className="btn-cyber btn-primary"
          style={{ padding: '9px 20px', fontSize: 13, height: 40 }}
          onClick={handleSearch}
          disabled={searching}
        >
          {searching
            ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
            : <Search size={14} />
          }
          {searching ? 'Searching…' : 'Search'}
        </button>

        {/* Filter toggle */}
        <button
          className="btn-cyber btn-ghost"
          style={{ height: 40, padding: '0 14px', position: 'relative' }}
          onClick={() => setShowFilters(p => !p)}
        >
          <SlidersHorizontal size={14} />
          Filters
          {activeFilterCount > 0 && (
            <span style={{
              position: 'absolute', top: -5, right: -5,
              background: '#00e5ff', color: '#0a0f1e',
              borderRadius: 9999, fontSize: 9, fontWeight: 700,
              width: 16, height: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{activeFilterCount}</span>
          )}
        </button>

        {/* Saved queries toggle */}
        <button
          className="btn-cyber btn-ghost"
          style={{ height: 40, padding: '0 14px' }}
          onClick={() => setShowSaved(p => !p)}
        >
          <BookOpen size={14} /> Saved
        </button>

        {/* Export */}
        {results.length > 0 && (
          <button
            className="btn-cyber btn-ghost"
            style={{ height: 40, padding: '0 14px' }}
            onClick={exportResults}
          >
            <Download size={14} />
          </button>
        )}
      </div>

      {/* ── Query syntax hints ───────────────────────── */}
      <div style={{
        display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 11.5,
      }}>
        {[
          { hint: 'severity:critical', desc: 'by severity'  },
          { hint: 'rule_id:100001',    desc: 'by rule'       },
          { hint: 'ssh AND brute',     desc: 'AND operator'  },
          { hint: 'mimikatz OR lsass', desc: 'OR operator'   },
          { hint: 'T1059.001',         desc: 'MITRE tech'    },
        ].map(({ hint, desc }) => (
          <button key={hint}
            onClick={() => { setQuery(hint); }}
            style={{
              background: 'rgba(0,229,255,0.05)',
              border: '1px solid rgba(0,229,255,0.12)',
              borderRadius: 6, padding: '3px 10px',
              cursor: 'pointer', color: '#6b7fa3', fontSize: 11,
              display: 'flex', alignItems: 'center', gap: 5,
              transition: 'all 0.14s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#00e5ff'}
            onMouseLeave={e => e.currentTarget.style.color = '#6b7fa3'}
          >
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              color: '#00e5ff', fontSize: 11,
            }}>{hint}</span>
            <span>{desc}</span>
          </button>
        ))}
      </div>

      {/* ── Main content area ────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 14 }}>

        {/* Filters panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              <SearchFilters
                filters={filters}
                onChange={setFilters}
                onReset={() => setFilters(DEFAULT_FILTERS)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Saved queries panel */}
        <AnimatePresence>
          {showSaved && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              <div className="glass-card" style={{ padding: '16px 18px' }}>
                <SavedQueries
                  onRun={(q) => { setQuery(q); handleSearch(); setShowSaved(false); }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Results ──────────────────────────────── */}
        <div>
          {/* Results header */}
          {searched && (
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 12,
            }}>
              <div style={{ fontSize: 12.5, color: '#6b7fa3' }}>
                {results.length === 0
                  ? 'No results found'
                  : <>
                      <span style={{
                        color: '#00e5ff', fontWeight: 600,
                        fontFamily: 'JetBrains Mono, monospace',
                      }}>
                        {results.length.toLocaleString()}
                      </span>
                      {' '}results
                      {' '}across{' '}
                      {[
                        results.filter(r=>r.type==='alert').length &&
                          `${results.filter(r=>r.type==='alert').length} alerts`,
                        results.filter(r=>r.type==='case').length &&
                          `${results.filter(r=>r.type==='case').length} cases`,
                        results.filter(r=>r.type==='ioc').length &&
                          `${results.filter(r=>r.type==='ioc').length} IOCs`,
                      ].filter(Boolean).join(' · ')}
                    </>
                }
              </div>

              {results.length > 0 && (
                <div style={{ display: 'flex', gap: 8 }}>
                  {/* Type breakdown */}
                  {[
                    { type:'alert', color:'#ff8c00' },
                    { type:'case',  color:'#00e5ff' },
                    { type:'ioc',   color:'#a855f7' },
                  ].map(({ type, color }) => {
                    const cnt = results.filter(r=>r.type===type).length;
                    if (!cnt) return null;
                    return (
                      <span key={type} style={{
                        fontSize:11, color,
                        background:`${color}12`,
                        border:`1px solid ${color}28`,
                        borderRadius:5, padding:'2px 8px',
                        fontFamily:'JetBrains Mono,monospace',
                      }}>
                        {cnt} {type}s
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {!searched && (
            <div style={{
              textAlign: 'center', padding: '56px 0', color: '#3d5080',
            }}>
              <Search size={40} style={{ opacity: 0.18, margin: '0 auto 14px' }} />
              <div style={{ fontSize: 15, color: '#4a6090', marginBottom: 6 }}>
                Search across all SOC data
              </div>
              <div style={{ fontSize: 12.5, lineHeight: 1.7 }}>
                Alerts · Cases · IOCs · Threat Intel<br />
                Use AND / OR operators · Filter by severity, MITRE, agent, and more
              </div>
            </div>
          )}

          {/* No results */}
          {searched && results.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '40px 0', color: '#3d5080',
            }}>
              <Search size={32} style={{ opacity: 0.2, margin: '0 auto 10px' }} />
              <div style={{ fontSize: 14, color: '#4a6090', marginBottom: 8 }}>
                No results for "{query}"
              </div>
              <div style={{ fontSize: 12 }}>
                Try broadening your search or adjusting the filters
              </div>
              <button className="btn-cyber btn-ghost"
                style={{ marginTop: 12, fontSize: 12 }}
                onClick={handleReset}>
                <X size={12} /> Clear all filters
              </button>
            </div>
          )}

          {/* Results list */}
          {searched && results.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <AnimatePresence>
                {paginated.map((result, i) => (
                  <ResultCard key={result.id} result={result} index={i} />
                ))}
              </AnimatePresence>

              {/* Load more */}
              {hasMore && (
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <button className="btn-cyber btn-ghost"
                    style={{ fontSize: 12.5, padding: '8px 20px' }}
                    onClick={() => setPage(p => p + 1)}>
                    Load more ({results.length - paginated.length} remaining)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}