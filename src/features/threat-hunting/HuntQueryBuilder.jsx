import React, { useState } from 'react';
import { Play, Plus, X, Save, Code } from 'lucide-react';

const FIELD_OPTIONS = [
  'rule.id', 'rule.level', 'rule.description', 'agent.name', 'agent.ip',
  'data.srcip', 'data.dstip', 'rule.mitre.id', 'rule.mitre.tactic',
  'data.win.eventdata.commandLine', 'data.win.eventdata.image',
  'data.win.eventdata.targetImage', 'syscheck.path', 'location',
  'timestamp', 'rule.groups',
];

const OPERATOR_OPTIONS = ['is', 'is not', 'contains', 'does not contain',
  'starts with', 'ends with', '>', '<', '>=', '<='];

const PRESET_QUERIES = [
  {
    name: 'Encoded PowerShell Execution',
    description: 'Hunt for PowerShell commands with encoded payloads',
    conditions: [
      { field: 'data.win.eventdata.commandLine', operator: 'contains', value: 'EncodedCommand' },
      { field: 'data.win.eventdata.commandLine', operator: 'contains', value: 'powershell' },
    ],
    logic: 'AND',
  },
  {
    name: 'LSASS Memory Access',
    description: 'Detect processes accessing LSASS memory',
    conditions: [
      { field: 'data.win.eventdata.targetImage', operator: 'contains', value: 'lsass.exe' },
      { field: 'rule.level', operator: '>=', value: '12' },
    ],
    logic: 'AND',
  },
  {
    name: 'Lateral Movement via WMI',
    description: 'WMI remote execution patterns',
    conditions: [
      { field: 'data.win.eventdata.commandLine', operator: 'contains', value: 'wmic' },
      { field: 'rule.mitre.id', operator: 'contains', value: 'T1047' },
    ],
    logic: 'AND',
  },
  {
    name: 'Outbound DNS Tunneling',
    description: 'High-volume DNS queries indicating tunneling',
    conditions: [
      { field: 'rule.groups', operator: 'contains', value: 'dns' },
      { field: 'rule.level', operator: '>=', value: '10' },
    ],
    logic: 'AND',
  },
];

export default function HuntQueryBuilder({ onRun }) {
  const [conditions, setConditions] = useState([
    { id: 1, field: 'rule.level', operator: '>=', value: '10' },
  ]);
  const [logic,      setLogic]      = useState('AND');
  const [showRaw,    setShowRaw]    = useState(false);
  const [queryName,  setQueryName]  = useState('');

  const addCondition = () => {
    setConditions(prev => [...prev, {
      id: Date.now(),
      field: 'agent.name', operator: 'is', value: '',
    }]);
  };

  const removeCondition = (id) =>
    setConditions(prev => prev.filter(c => c.id !== id));

  const updateCondition = (id, key, value) =>
    setConditions(prev =>
      prev.map(c => c.id === id ? { ...c, [key]: value } : c)
    );

  const loadPreset = (preset) => {
    setConditions(preset.conditions.map((c, i) => ({ ...c, id: i + 1 })));
    setLogic(preset.logic);
    setQueryName(preset.name);
  };

  // Build human-readable query string
  const buildQuery = () =>
    conditions
      .map(c => `${c.field} ${c.operator} "${c.value}"`)
      .join(` ${logic} `);

  const inputStyle = {
    background: 'rgba(10,15,30,0.85)',
    border: '1px solid #1a2744',
    borderRadius: 6, color: '#c8d8f0',
    padding: '6px 8px', fontSize: 12,
    outline: 'none', cursor: 'pointer',
    fontFamily: 'JetBrains Mono, monospace',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Preset queries ──────────────────────────── */}
      <div>
        <div style={{ fontSize: 11.5, color: '#3d5080', marginBottom: 8,
          fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
          fontFamily: 'JetBrains Mono, monospace' }}>
          Preset Hunt Queries
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {PRESET_QUERIES.map(p => (
            <button key={p.name}
              onClick={() => loadPreset(p)}
              title={p.description}
              style={{
                padding: '4px 12px', borderRadius: 7, fontSize: 11.5,
                cursor: 'pointer', border: '1px solid rgba(0,229,255,0.18)',
                background: 'rgba(0,229,255,0.06)', color: '#c8d8f0',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.color='#00e5ff'}
              onMouseLeave={e => e.currentTarget.style.color='#c8d8f0'}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Logic operator ──────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, color: '#6b7fa3' }}>Match conditions using:</span>
        {['AND', 'OR'].map(op => (
          <button key={op} onClick={() => setLogic(op)} style={{
            padding: '3px 14px', borderRadius: 9999, fontSize: 12,
            fontWeight: 600, cursor: 'pointer', border: '1px solid',
            background: logic===op ? 'rgba(0,229,255,0.16)' : 'rgba(255,255,255,0.04)',
            color:      logic===op ? '#00e5ff'               : '#6b7fa3',
            borderColor:logic===op ? 'rgba(0,229,255,0.35)'  : '#1a2744',
            fontFamily: 'JetBrains Mono, monospace',
          }}>{op}</button>
        ))}
      </div>

      {/* ── Conditions ──────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {conditions.map((cond, idx) => (
          <div key={cond.id} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 12px',
            background: 'rgba(0,229,255,0.04)',
            border: '1px solid rgba(0,229,255,0.12)',
            borderRadius: 8,
          }}>
            {/* Index */}
            <span style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10.5, color: '#3d5080', width: 16, flexShrink: 0,
            }}>
              {String(idx + 1).padStart(2, '0')}
            </span>

            {/* Field */}
            <select value={cond.field}
              onChange={e => updateCondition(cond.id, 'field', e.target.value)}
              style={{ ...inputStyle, flex: '0 0 220px' }}>
              {FIELD_OPTIONS.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>

            {/* Operator */}
            <select value={cond.operator}
              onChange={e => updateCondition(cond.id, 'operator', e.target.value)}
              style={{ ...inputStyle, flex: '0 0 150px' }}>
              {OPERATOR_OPTIONS.map(o => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>

            {/* Value */}
            <input
              value={cond.value}
              onChange={e => updateCondition(cond.id, 'value', e.target.value)}
              placeholder="value…"
              style={{
                ...inputStyle, flex: 1,
                border: '1px solid #1a2744', borderRadius: 6,
                padding: '6px 10px',
              }}
              onFocus={e => e.target.style.borderColor='rgba(0,229,255,0.42)'}
              onBlur={e  => e.target.style.borderColor='#1a2744'}
            />

            {/* Logic label between conditions */}
            {idx < conditions.length - 1 && (
              <span style={{
                fontSize: 10, color: '#00e5ff',
                fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 700, flexShrink: 0,
              }}>{logic}</span>
            )}

            {/* Remove */}
            <button onClick={() => removeCondition(cond.id)}
              disabled={conditions.length === 1}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#3d5080', padding: 4, flexShrink: 0,
                opacity: conditions.length === 1 ? 0.3 : 1,
              }}
              onMouseEnter={e => e.currentTarget.style.color='#ff2d6d'}
              onMouseLeave={e => e.currentTarget.style.color='#3d5080'}
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>

      {/* ── Actions ─────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn-cyber btn-ghost"
          style={{ fontSize: 12.5, padding: '7px 14px' }}
          onClick={addCondition}>
          <Plus size={13} /> Add Condition
        </button>

        <button className="btn-cyber btn-ghost"
          style={{ fontSize: 12.5, padding: '7px 14px' }}
          onClick={() => setShowRaw(p => !p)}>
          <Code size={13} /> {showRaw ? 'Hide' : 'Show'} Query
        </button>

        <button
          className="btn-cyber btn-primary"
          style={{
            fontSize: 13, padding: '7px 20px',
            marginLeft: 'auto',
          }}
          onClick={() => onRun?.({ conditions, logic, query: buildQuery() })}
        >
          <Play size={14} /> Run Hunt
        </button>
      </div>

      {/* ── Raw query display ───────────────────────── */}
      {showRaw && (
        <div style={{
          background: 'rgba(0,0,0,0.4)', border: '1px solid #1a2744',
          borderRadius: 8, padding: '12px 14px',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 12, color: '#00e5ff', lineHeight: 1.7,
        }}>
          {buildQuery() || '— no conditions —'}
        </div>
      )}
    </div>
  );
}