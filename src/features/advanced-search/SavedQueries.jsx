import React, { useState } from 'react';
import { BookOpen, Trash2, Play, Plus, Star } from 'lucide-react';

const INITIAL_QUERIES = [
  {
    id: 1, name: 'Critical Alerts — Last 24h',
    query: 'severity:critical AND timestamp:>now-24h',
    tags: ['alerts','critical'], pinned: true,
    lastRun: '2m ago', hits: 5,
  },
  {
    id: 2, name: 'SSH Brute Force IPs',
    query: 'rule_id:100001 AND src_ip:*',
    tags: ['brute-force','ssh'], pinned: false,
    lastRun: '1h ago', hits: 47,
  },
  {
    id: 3, name: 'LSASS Memory Access Events',
    query: 'rule_id:100013 AND agent_name:win10-victim',
    tags: ['credential-access','mimikatz'], pinned: true,
    lastRun: '2h ago', hits: 1,
  },
  {
    id: 4, name: 'All Honeypot Interactions',
    query: 'rule_id:100017 OR groups:honeypot',
    tags: ['honeypot','cowrie'], pinned: false,
    lastRun: '3h ago', hits: 7,
  },
  {
    id: 5, name: 'MITRE T1190 — Exploitation',
    query: 'mitre:T1190 AND severity:critical',
    tags: ['exploit','initial-access'], pinned: false,
    lastRun: '1d ago', hits: 2,
  },
];

export default function SavedQueries({ onRun }) {
  const [queries, setQueries] = useState(INITIAL_QUERIES);
  const [newName, setNewName] = useState('');
  const [adding,  setAdding]  = useState(false);

  const togglePin = (id) =>
    setQueries(p => p.map(q => q.id===id ? {...q, pinned: !q.pinned} : q));

  const deleteQuery = (id) =>
    setQueries(p => p.filter(q => q.id !== id));

  const pinned   = queries.filter(q => q.pinned);
  const unpinned = queries.filter(q => !q.pinned);

  const renderQuery = (q) => (
    <div key={q.id} style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px', borderRadius: 8,
      background: 'rgba(13,21,48,0.65)',
      border: '1px solid #1a2744',
      transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor='#243660'}
      onMouseLeave={e => e.currentTarget.style.borderColor='#1a2744'}
    >
      <button onClick={() => togglePin(q.id)} style={{
        background: 'none', border: 'none', cursor: 'pointer',
        color: q.pinned ? '#ffd600' : '#3d5080', padding: 2, flexShrink: 0,
      }}>
        <Star size={12} fill={q.pinned ? '#ffd600' : 'none'} />
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: '#e8f4ff', fontWeight: 500 }}>
          {q.name}
        </div>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11, color: '#6b7fa3', marginTop: 3,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {q.query}
        </div>
        <div style={{
          display: 'flex', gap: 6, marginTop: 5, flexWrap: 'wrap',
        }}>
          {q.tags.map(t => (
            <span key={t} style={{
              fontSize: 9.5, color: '#6b7fa3',
              background: 'rgba(74,96,144,0.12)',
              border: '1px solid rgba(74,96,144,0.20)',
              borderRadius: 4, padding: '1px 6px',
            }}>#{t}</span>
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0, fontSize: 10.5, color: '#3d5080' }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          color: '#00e5ff', fontWeight: 600, marginBottom: 2,
        }}>
          {q.hits} hits
        </div>
        <div>{q.lastRun}</div>
      </div>

      <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
        <button onClick={() => onRun?.(q.query)} style={{
          background: 'rgba(0,229,255,0.10)',
          border: '1px solid rgba(0,229,255,0.22)',
          borderRadius: 5, padding: '4px 8px',
          cursor: 'pointer', color: '#00e5ff', fontSize: 11,
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <Play size={10} /> Run
        </button>
        <button onClick={() => deleteQuery(q.id)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#3d5080', padding: 4, borderRadius: 5,
        }}
          onMouseEnter={e => e.currentTarget.style.color = '#ff2d6d'}
          onMouseLeave={e => e.currentTarget.style.color = '#3d5080'}
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{
          fontSize: 13, fontWeight: 600, color: '#e8f4ff',
          display: 'flex', alignItems: 'center', gap: 7,
        }}>
          <BookOpen size={14} color="#00e5ff" /> Saved Queries
        </div>
        <button className="btn-cyber btn-ghost"
          style={{ fontSize: 11.5, padding: '4px 10px' }}
          onClick={() => setAdding(p => !p)}>
          <Plus size={12} /> New
        </button>
      </div>

      {adding && (
        <div style={{
          display: 'flex', gap: 8, padding: '10px 12px',
          background: 'rgba(0,229,255,0.05)',
          border: '1px solid rgba(0,229,255,0.18)',
          borderRadius: 8,
        }}>
          <input className="soc-input" value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Query name…" style={{ flex: 1, height: 30, fontSize: 12 }}
          />
          <button className="btn-cyber btn-primary"
            style={{ fontSize: 11.5, padding: '4px 12px' }}
            onClick={() => {
              if (!newName.trim()) return;
              setQueries(p => [...p, {
                id: Date.now(), name: newName.trim(),
                query: '', tags: [], pinned: false,
                lastRun: 'never', hits: 0,
              }]);
              setNewName(''); setAdding(false);
            }}>Save</button>
        </div>
      )}

      {pinned.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: '#3d5080', marginBottom: 6,
            fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
            fontFamily: 'JetBrains Mono, monospace' }}>
            ⭐ Pinned
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {pinned.map(renderQuery)}
          </div>
        </div>
      )}

      {unpinned.length > 0 && (
        <div>
          <div style={{ fontSize: 10, color: '#3d5080', marginBottom: 6,
            fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
            fontFamily: 'JetBrains Mono, monospace' }}>
            Recent
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {unpinned.map(renderQuery)}
          </div>
        </div>
      )}
    </div>
  );
}