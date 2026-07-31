// ============================================================
// Advanced SOC Lab — Sidebar.jsx
// All 27 nav items (original 21 + 6 new enterprise pages)
// NavLink with cyan active glow, search filter, live clock
// ============================================================

import React, { useState, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Bell, FolderOpen, Globe,
  BarChart3, Shield, Target, Network, Eye,
  Database, FileText, Bug, AlertTriangle,
  Zap, Activity, Radio, ShieldCheck,
  Lock, Terminal, BookOpen, Settings,
  Search, Clock, Server, FileBarChart,
  Crosshair, Layers,
} from 'lucide-react';
import { AppContext } from '../App';

// ── Complete navigation structure ─────────────────────────
const NAV_ITEMS = [

  // ── MONITORING ──────────────────────────────────────────
  {
    id: 'dashboard',    path: '/dashboard',
    label: 'Dashboard', icon: LayoutDashboard,
    section: 'MONITORING', badge: null, badgeColor: null,
  },
  {
    id: 'alerts',       path: '/alerts',
    label: 'Alerts',    icon: Bell,
    section: null, badge: 'alerts', badgeColor: 'red',
  },
  {
    id: 'cases',        path: '/cases',
    label: 'Case Management', icon: FolderOpen,
    section: null, badge: 'cases', badgeColor: 'orange',
  },
  {
    id: 'threat-intel', path: '/threat-intel',
    label: 'Threat Intelligence', icon: Globe,
    section: null, badge: null, badgeColor: null,
  },
  {
    id: 'performance',  path: '/performance',
    label: 'SOC Performance', icon: BarChart3,
    section: null, badge: null, badgeColor: null,
  },

  // ── INVESTIGATION ───────────────────────────────────────
  {
    id: 'search',       path: '/search',
    label: 'Advanced Search', icon: Search,
    section: 'INVESTIGATION', badge: null, badgeColor: null,
  },
  {
    id: 'incident',     path: '/incident',
    label: 'Incident Workspace', icon: Layers,
    section: null, badge: null, badgeColor: null,
  },
  {
    id: 'threat-hunting',path: '/threat-hunting',
    label: 'Threat Hunting', icon: Crosshair,
    section: null, badge: null, badgeColor: null,
  },

  // ── DETECTION ───────────────────────────────────────────
  {
    id: 'detection-rules', path: '/detection-rules',
    label: 'Detection Rules', icon: Shield,
    section: 'DETECTION', badge: '20', badgeColor: 'cyan',
  },
  {
    id: 'mitre',           path: '/mitre',
    label: 'MITRE ATT&CK', icon: Target,
    section: null, badge: null, badgeColor: null,
  },
  {
    id: 'network-ids',     path: '/network-ids',
    label: 'Network IDS/IPS', icon: Network,
    section: null, badge: null, badgeColor: null,
  },
  {
    id: 'sysmon',          path: '/sysmon',
    label: 'Sysmon Events', icon: Eye,
    section: null, badge: null, badgeColor: null,
  },

  // ── INFRASTRUCTURE ──────────────────────────────────────
  {
    id: 'siem',            path: '/siem',
    label: 'SIEM (Wazuh)', icon: Database,
    section: 'INFRASTRUCTURE', badge: null, badgeColor: null,
  },
  {
    id: 'log-collection',  path: '/log-collection',
    label: 'Log Collection', icon: FileText,
    section: null, badge: null, badgeColor: null,
  },
  {
    id: 'honeypot',        path: '/honeypot',
    label: 'Honeypot', icon: Bug,
    section: null, badge: null, badgeColor: null,
  },
  {
    id: 'vulnerabilities', path: '/vulnerabilities',
    label: 'Vulnerabilities', icon: AlertTriangle,
    section: null, badge: null, badgeColor: null,
  },
  {
    id: 'endpoints',       path: '/endpoints',
    label: 'Endpoint Inventory', icon: Server,
    section: null, badge: null, badgeColor: null,
  },

  // ── AUTOMATION ──────────────────────────────────────────
  {
    id: 'soar',            path: '/soar',
    label: 'SOAR / TheHive', icon: Zap,
    section: 'AUTOMATION', badge: null, badgeColor: null,
  },
  {
    id: 'purple-team',     path: '/purple-team',
    label: 'Purple Team', icon: Activity,
    section: null, badge: null, badgeColor: null,
  },
  {
    id: 'caldera',         path: '/caldera',
    label: 'Caldera Tests', icon: Radio,
    section: null, badge: null, badgeColor: null,
  },
  {
    id: 'compliance',      path: '/compliance',
    label: 'Compliance', icon: ShieldCheck,
    section: null, badge: null, badgeColor: null,
  },

  // ── MANAGEMENT ──────────────────────────────────────────
  {
    id: 'reports',         path: '/reports',
    label: 'Reports', icon: FileBarChart,
    section: 'MANAGEMENT', badge: null, badgeColor: null,
  },
  {
    id: 'audit',           path: '/audit',
    label: 'Audit Trail', icon: Clock,
    section: null, badge: null, badgeColor: null,
  },
  {
    id: 'backup',          path: '/backup',
    label: 'Backup & Recovery', icon: Lock,
    section: null, badge: null, badgeColor: null,
  },
  {
    id: 'attack-simulator',path: '/attack-simulator',
    label: 'Attack Simulator', icon: Terminal,
    section: null, badge: null, badgeColor: null,
  },
  {
    id: 'references',      path: '/references',
    label: 'References', icon: BookOpen,
    section: null, badge: null, badgeColor: null,
  },
  {
    id: 'settings',        path: '/settings',
    label: 'Settings', icon: Settings,
    section: null, badge: null, badgeColor: null,
  },
];

// ── Badge pill ────────────────────────────────────────────
function NavBadge({ value, color }) {
  const C = {
    red:    { bg:'rgba(255,45,109,0.18)',  text:'#ff2d6d', border:'rgba(255,45,109,0.38)' },
    orange: { bg:'rgba(255,140,0,0.15)',   text:'#ff8c00', border:'rgba(255,140,0,0.35)'  },
    cyan:   { bg:'rgba(0,229,255,0.10)',   text:'#00e5ff', border:'rgba(0,229,255,0.28)'  },
    green:  { bg:'rgba(0,255,136,0.10)',   text:'#00ff88', border:'rgba(0,255,136,0.25)'  },
  }[color] || { bg:'rgba(0,229,255,0.10)', text:'#00e5ff', border:'rgba(0,229,255,0.28)' };

  return (
    <span style={{
      background:  C.bg,
      color:       C.text,
      border:      `1px solid ${C.border}`,
      borderRadius:9999,
      fontSize:    10,
      fontWeight:  700,
      padding:     '1px 6px',
      fontFamily:  'JetBrains Mono, monospace',
      lineHeight:  1.6,
      flexShrink:  0,
    }}>
      {value}
    </span>
  );
}

// ── Live UTC clock ────────────────────────────────────────
function LiveClock() {
  const [time, setTime] = React.useState(new Date());
  React.useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{
      fontSize:    10,
      color:       '#3d5080',
      fontFamily:  'JetBrains Mono, monospace',
      marginTop:   2,
    }}>
      {time.toLocaleDateString()} {time.toLocaleTimeString()}
    </div>
  );
}

// ── Main Sidebar ──────────────────────────────────────────
export default function Sidebar() {
  const { liveAlertCount } = useContext(AppContext);
  const [search, setSearch] = useState('');

  const query    = search.toLowerCase().trim();
  const filtered = query
    ? NAV_ITEMS.filter(i => i.label.toLowerCase().includes(query))
    : NAV_ITEMS;

  // Build grouped list preserving section headers
  const grouped = [];
  let lastSection = null;
  filtered.forEach(item => {
    if (item.section && item.section !== lastSection) {
      grouped.push({
        type: 'section',
        label: item.section,
        key: `sec-${item.section}`,
      });
      lastSection = item.section;
    }
    grouped.push({ type: 'item', ...item, key: item.id });
  });

  const getBadgeValue = (item) => {
    if (item.badge === 'alerts') return String(liveAlertCount || 0);
    if (item.badge === 'cases')  return '5';
    return item.badge;
  };

  return (
    <aside className="soc-sidebar">

      {/* ── Logo ──────────────────────────────────────── */}
      <div style={{
        padding:      '18px 14px 14px',
        borderBottom: '1px solid #1a2744',
        flexShrink:   0,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:36, height:36, borderRadius:9,
            background:'rgba(0,229,255,0.10)',
            border:'1px solid rgba(0,229,255,0.28)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 0 14px rgba(0,229,255,0.18)',
            flexShrink:0,
          }}>
            <Shield size={17} color="#00e5ff" />
          </div>
          <div>
            <div style={{
              fontSize:14.5, fontWeight:700,
              color:'#e8f4ff', lineHeight:1.1,
            }}>
              SOC Lab
            </div>
            <div style={{
              fontSize:9.5, color:'#00e5ff',
              fontFamily:'JetBrains Mono, monospace',
              letterSpacing:'0.12em', marginTop:2,
            }}>
              ENTERPRISE v2.0
            </div>
          </div>
        </div>
      </div>

      {/* ── Search ────────────────────────────────────── */}
      <div style={{ padding:'10px 12px 6px', flexShrink:0 }}>
        <div style={{ position:'relative' }}>
          <Search size={12} color="#3d5080" style={{
            position:'absolute', left:9,
            top:'50%', transform:'translateY(-50%)',
            pointerEvents:'none',
          }} />
          <input
            className="soc-input"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search modules…"
            style={{ paddingLeft:27, height:31, fontSize:12 }}
          />
        </div>
      </div>

      {/* ── Navigation ────────────────────────────────── */}
      <nav style={{ flex:1, overflowY:'auto', padding:'4px 10px 12px' }}>
        <AnimatePresence initial={false}>

          {grouped.length === 0 && (
            <div style={{
              textAlign:'center', padding:'24px 0',
              color:'#3d5080', fontSize:12,
            }}>
              No modules found
            </div>
          )}

          {grouped.map((entry, idx) => {

            // Section label
            if (entry.type === 'section') {
              return (
                <div key={entry.key} style={{
                  fontSize:9.5, fontWeight:700,
                  letterSpacing:'0.13em',
                  textTransform:'uppercase',
                  color:'#3d5080',
                  padding:'13px 6px 5px',
                  fontFamily:'JetBrains Mono, monospace',
                }}>
                  {entry.label}
                </div>
              );
            }

            // Nav item
            const Icon  = entry.icon;
            const badge = getBadgeValue(entry);

            return (
              <motion.div
                key={entry.key}
                initial={{ opacity:0, x:-6 }}
                animate={{ opacity:1, x:0 }}
                exit={{ opacity:0, x:-6 }}
                transition={{ duration:0.14, delay: idx * 0.008 }}
                style={{ marginBottom:2 }}
              >
                <NavLink
                  to={entry.path}
                  end={entry.path === '/dashboard'}
                  style={({ isActive }) => ({
                    display:        'flex',
                    alignItems:     'center',
                    gap:            10,
                    padding:        '9px 12px',
                    borderRadius:   8,
                    cursor:         'pointer',
                    textDecoration: 'none',
                    fontSize:       13,
                    fontWeight:     500,
                    lineHeight:     1.3,
                    transition:     'all 0.15s ease',
                    border:         '1px solid',
                    position:       'relative',
                    userSelect:     'none',
                    // Active: cyan glow
                    background:   isActive
                      ? 'rgba(0,229,255,0.10)'
                      : 'transparent',
                    color:        isActive ? '#00e5ff' : '#6b7fa3',
                    borderColor:  isActive
                      ? 'rgba(0,229,255,0.22)'
                      : 'transparent',
                    boxShadow:    isActive
                      ? '0 0 12px rgba(0,229,255,0.14), inset 0 0 12px rgba(0,229,255,0.04)'
                      : 'none',
                  })}
                >
                  {({ isActive }) => (
                    <>
                      {/* Left active accent bar */}
                      {isActive && (
                        <div style={{
                          position:    'absolute',
                          left:        -1,
                          top:         '22%',
                          height:      '56%',
                          width:       2,
                          background:  '#00e5ff',
                          borderRadius:'0 2px 2px 0',
                          boxShadow:   '0 0 8px #00e5ff',
                        }} />
                      )}

                      <Icon
                        size={15}
                        style={{
                          flexShrink:  0,
                          color:       isActive ? '#00e5ff' : '#4a6090',
                          transition:  'color 0.15s',
                        }}
                      />

                      <span style={{ flex:1 }}>
                        {entry.label}
                      </span>

                      {badge && (
                        <NavBadge
                          value={badge}
                          color={entry.badgeColor || 'cyan'}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </nav>

      {/* ── Footer ────────────────────────────────────── */}
      <div style={{
        padding:      '11px 14px 14px',
        borderTop:    '1px solid #1a2744',
        flexShrink:   0,
      }}>
        <div style={{
          display:'flex', alignItems:'center',
          gap:7, marginBottom:5,
        }}>
          <span className="live-dot" />
          <span style={{ fontSize:11.5, color:'#00ff88', fontWeight:600 }}>
            SOC ACTIVE
          </span>
        </div>
        <div style={{
          fontSize:10, color:'#3d5080',
          fontFamily:'JetBrains Mono, monospace',
          lineHeight:1.6,
        }}>
          Wazuh · TheHive · Suricata
        </div>
        <LiveClock />
      </div>
    </aside>
  );
}