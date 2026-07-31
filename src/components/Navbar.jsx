// ============================================================
// Advanced SOC Lab — Navbar.jsx
// Top bar: breadcrumb, live alert ticker, search, clock,
// refresh button, notification bell with dropdown, avatar
// ============================================================

import React, { useState, useEffect, useContext, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, Bell, Search, RefreshCw, Shield,
  AlertTriangle, AlertCircle, Info, X,
} from 'lucide-react';
import { AppContext } from '../App';

// Page title map — matches route paths defined in App.js
const PAGE_LABELS = {
  '/dashboard':    'Dashboard',
  '/alerts':       'Alert Management',
  '/cases':        'Case Management',
  '/threat-intel': 'Threat Intelligence',
  '/performance':  'SOC Performance',
};

// Static notification items — in a real deployment these would
// come from the auto_investigate.py websocket or polling
const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    msg:   'LSASS memory access on win10-victim',
    time:  '2m ago',
    sev:   'critical',
    rule:  '100013',
    read:  false,
  },
  {
    id: 2,
    msg:   'SSH brute force from 203.0.113.45',
    time:  '8m ago',
    sev:   'high',
    rule:  '100001',
    read:  false,
  },
  {
    id: 3,
    msg:   'Log4Shell attempt on web server',
    time:  '5m ago',
    sev:   'critical',
    rule:  '100019',
    read:  false,
  },
  {
    id: 4,
    msg:   'Shadow copy deletion detected',
    time:  '12m ago',
    sev:   'critical',
    rule:  '100012',
    read:  true,
  },
  {
    id: 5,
    msg:   'Nmap SYN scan from 192.168.56.20',
    time:  '18m ago',
    sev:   'medium',
    rule:  '100014',
    read:  true,
  },
];

const SEV_COLOR = {
  critical: '#ff2d6d',
  high:     '#ff8c00',
  medium:   '#ffd600',
  low:      '#00ff88',
  info:     '#00e5ff',
};

const SEV_ICON = {
  critical: <AlertTriangle size={13} />,
  high:     <AlertCircle  size={13} />,
  medium:   <Info         size={13} />,
  low:      <Info         size={13} />,
};

export default function Navbar() {
  const { liveAlertCount, notifications: notifCount, setNotifications }
    = useContext(AppContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [time,         setTime]         = useState(new Date());
  const [showNotif,    setShowNotif]    = useState(false);
  const [notifItems,   setNotifItems]   = useState(INITIAL_NOTIFICATIONS);
  const [searchValue,  setSearchValue]  = useState('');
  const [refreshSpin,  setRefreshSpin]  = useState(false);

  const notifRef = useRef(null);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Close notification dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const pageLabel = PAGE_LABELS[location.pathname] || 'Advanced SOC Lab';
  const unread    = notifItems.filter(n => !n.read).length;

  const handleBellClick = () => {
    setShowNotif(prev => !prev);
    // Mark all as read when opening
    if (!showNotif) {
      setNotifItems(prev => prev.map(n => ({ ...n, read: true })));
      setNotifications(0);
    }
  };

  const handleDismiss = (id) => {
    setNotifItems(prev => prev.filter(n => n.id !== id));
  };

  const handleRefresh = () => {
    setRefreshSpin(true);
    setTimeout(() => setRefreshSpin(false), 900);
  };

  const handleNotifClick = (item) => {
    setShowNotif(false);
    navigate('/alerts');
  };

  return (
    <header style={{
      height: 52,
      background: 'rgba(13, 21, 48, 0.97)',
      borderBottom: '1px solid #1a2744',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 18px',
      gap: 14,
      flexShrink: 0,
      position: 'relative',
      zIndex: 50,
    }}>

      {/* ── Breadcrumb ────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0,
      }}>
        <Shield size={13} color="#3d5080" />
        <span style={{
          fontSize: 11, color: '#3d5080',
          fontFamily: 'JetBrains Mono, monospace',
          letterSpacing: '0.05em',
        }}>
          SOC-LAB
        </span>
        <ChevronRight size={11} color="#3d5080" />
        <span style={{
          fontSize: 13.5, color: '#e8f4ff', fontWeight: 600,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {pageLabel}
        </span>

        {/* Live alert ticker */}
        <div style={{
          marginLeft: 10,
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(0,229,255,0.06)',
          border: '1px solid rgba(0,229,255,0.15)',
          borderRadius: 6,
          padding: '3px 10px',
          fontSize: 11.5,
          color: '#00e5ff',
          fontFamily: 'JetBrains Mono, monospace',
          flexShrink: 0,
        }}>
          <span className="live-dot cyan"
            style={{ width: 6, height: 6 }} />
          {liveAlertCount} alerts today
        </div>
      </div>

      {/* ── Search bar ────────────────────────────────── */}
      <div style={{ position: 'relative', width: 200, flexShrink: 0 }}>
        <Search size={12} color="#4a6090" style={{
          position: 'absolute', left: 9,
          top: '50%', transform: 'translateY(-50%)',
          pointerEvents: 'none',
        }} />
        <input
          className="soc-input"
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
          placeholder="Search alerts, IPs…"
          style={{ paddingLeft: 27, height: 30, fontSize: 12 }}
        />
      </div>

      {/* ── UTC Clock ─────────────────────────────────── */}
      <div style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 11.5,
        color: '#4a6090',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}>
        {time.toISOString().slice(0, 19).replace('T', ' ')} UTC
      </div>

      {/* ── Refresh button ────────────────────────────── */}
      <button
        className="btn-cyber btn-ghost"
        style={{ padding: '5px 10px', fontSize: 11.5 }}
        onClick={handleRefresh}
        title="Refresh"
      >
        <motion.div
          animate={{ rotate: refreshSpin ? 360 : 0 }}
          transition={{ duration: 0.7, ease: 'linear' }}
        >
          <RefreshCw size={13} />
        </motion.div>
      </button>

      {/* ── Notification bell ─────────────────────────── */}
      <div style={{ position: 'relative', flexShrink: 0 }} ref={notifRef}>
        <button
          className="btn-cyber"
          style={{
            padding: '5px 10px',
            fontSize: 11.5,
            background: unread > 0
              ? 'rgba(255,45,109,0.12)'
              : 'rgba(255,255,255,0.04)',
            color: unread > 0 ? '#ff2d6d' : '#6b7fa3',
            border: `1px solid ${unread > 0
              ? 'rgba(255,45,109,0.32)'
              : '#1a2744'}`,
            position: 'relative',
          }}
          onClick={handleBellClick}
          title="Notifications"
        >
          <Bell size={14} />

          {/* Unread count badge */}
          <AnimatePresence>
            {unread > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                style={{
                  position: 'absolute', top: -5, right: -5,
                  background: '#ff2d6d',
                  color: '#fff',
                  borderRadius: 9999,
                  fontSize: 9,
                  fontWeight: 700,
                  minWidth: 16,
                  height: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 3px',
                  fontFamily: 'JetBrains Mono, monospace',
                  boxShadow: '0 0 8px rgba(255,45,109,0.5)',
                }}
              >
                {unread > 9 ? '9+' : unread}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* ── Notification dropdown ──────────────────── */}
        <AnimatePresence>
          {showNotif && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0,  scale: 1 }}
              exit={{  opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 320,
                background: 'rgba(13,21,48,0.98)',
                border: '1px solid #1a2744',
                borderRadius: 10,
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.55)',
                zIndex: 200,
              }}
            >
              {/* Header */}
              <div style={{
                padding: '10px 14px',
                borderBottom: '1px solid #1a2744',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{
                  fontSize: 12, fontWeight: 600, color: '#e8f4ff',
                }}>
                  Recent Alerts
                </span>
                <span style={{
                  fontSize: 10.5, color: '#3d5080',
                  fontFamily: 'JetBrains Mono, monospace',
                }}>
                  {notifItems.length} items
                </span>
              </div>

              {/* Items */}
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {notifItems.length === 0 ? (
                  <div style={{
                    padding: '24px 0', textAlign: 'center',
                    color: '#3d5080', fontSize: 12,
                  }}>
                    No notifications
                  </div>
                ) : (
                  notifItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleNotifClick(item)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        padding: '10px 14px',
                        borderBottom: '1px solid #1a2744',
                        cursor: 'pointer',
                        background: item.read
                          ? 'transparent'
                          : 'rgba(0,229,255,0.025)',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={e =>
                        e.currentTarget.style.background = 'rgba(0,229,255,0.045)'}
                      onMouseLeave={e =>
                        e.currentTarget.style.background = item.read
                          ? 'transparent'
                          : 'rgba(0,229,255,0.025)'}
                    >
                      {/* Severity icon */}
                      <div style={{
                        color: SEV_COLOR[item.sev] || '#6b7fa3',
                        marginTop: 1,
                        flexShrink: 0,
                      }}>
                        {SEV_ICON[item.sev] || <Info size={13} />}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 12.5,
                          color: item.read ? '#6b7fa3' : '#c8d8f0',
                          fontWeight: item.read ? 400 : 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {item.msg}
                        </div>
                        <div style={{
                          display: 'flex', gap: 8, marginTop: 3,
                          alignItems: 'center',
                        }}>
                          <span style={{
                            fontSize: 10.5, color: '#3d5080',
                          }}>
                            {item.time}
                          </span>
                          <span style={{
                            fontSize: 9.5,
                            fontFamily: 'JetBrains Mono, monospace',
                            color: SEV_COLOR[item.sev] || '#6b7fa3',
                            background: `${SEV_COLOR[item.sev]}18`,
                            border: `1px solid ${SEV_COLOR[item.sev]}35`,
                            borderRadius: 3,
                            padding: '0px 5px',
                          }}>
                            Rule {item.rule}
                          </span>
                        </div>
                      </div>

                      {/* Dismiss button */}
                      <button
                        onClick={e => { e.stopPropagation(); handleDismiss(item.id); }}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#3d5080', padding: 2, flexShrink: 0,
                          borderRadius: 4,
                          transition: 'color 0.12s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ff2d6d'}
                        onMouseLeave={e => e.currentTarget.style.color = '#3d5080'}
                        title="Dismiss"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div style={{
                padding: '9px 14px',
                borderTop: '1px solid #1a2744',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <button
                  onClick={() => navigate('/alerts')}
                  style={{
                    background: 'none', border: 'none',
                    color: '#00e5ff', fontSize: 12,
                    cursor: 'pointer', padding: 0,
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  View all alerts →
                </button>
                <button
                  onClick={() => setNotifItems([])}
                  style={{
                    background: 'none', border: 'none',
                    color: '#3d5080', fontSize: 11.5,
                    cursor: 'pointer', padding: 0,
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  Clear all
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Analyst Avatar ────────────────────────────── */}
      <div
        title="SOC Analyst"
        style={{
          width: 30, height: 30,
          borderRadius: '50%',
          background: 'rgba(0,229,255,0.12)',
          border: '1px solid rgba(0,229,255,0.28)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11.5, fontWeight: 700, color: '#00e5ff',
          cursor: 'pointer',
          flexShrink: 0,
          transition: 'box-shadow 0.15s',
        }}
        onMouseEnter={e =>
          e.currentTarget.style.boxShadow = '0 0 12px rgba(0,229,255,0.3)'}
        onMouseLeave={e =>
          e.currentTarget.style.boxShadow = 'none'}
      >
        SA
      </div>

    </header>
  );
}