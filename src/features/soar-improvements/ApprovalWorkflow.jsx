import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, XCircle, Clock, Shield,
  AlertTriangle, User, MessageSquare,
} from 'lucide-react';

const PENDING_APPROVALS = [
  {
    id:         'APR-001',
    action:     'Isolate Host — win10-victim',
    playbook:   'Credential Dumping Response',
    requestedBy:'auto_investigate',
    requestedAt:'2024-01-15 10:32:00',
    severity:   'critical',
    reason:     'LSASS memory access (Mimikatz) detected on win10-victim. Host isolation recommended to prevent lateral movement.',
    impact:     'Finance analyst will lose network access until investigation completes.',
    riskIfDenied:'Potential credential theft spread to other hosts on 10.0.x subnet.',
    approvers:  ['admin-kim'],
    timeout:    '30m',
    timeLeft:   '18m',
  },
  {
    id:         'APR-002',
    action:     'Block IP Range 203.0.113.0/24',
    playbook:   'SSH Brute Force Response',
    requestedBy:'analyst-chen',
    requestedAt:'2024-01-15 10:18:00',
    severity:   'high',
    reason:     'Entire /24 subnet showing coordinated SSH brute force activity. Block at pfSense WAN.',
    impact:     'Will block all traffic from 203.0.113.0/24. Verify no legitimate business relationships.',
    riskIfDenied:'Continued brute force attempts — risk of eventual credential compromise.',
    approvers:  ['admin-kim','manager-ir'],
    timeout:    '60m',
    timeLeft:   '42m',
  },
];

const DECISION_LOG = [
  { id:'APR-003', action:'Block IP 198.51.100.23',   status:'approved', approver:'admin-kim',    time:'1h ago',  reason:'AbuseIPDB 78% — honeypot attacker confirmed' },
  { id:'APR-004', action:'Delete evidence container',status:'denied',   approver:'admin-kim',    time:'2h ago',  reason:'Evidence must be preserved for forensics' },
  { id:'APR-005', action:'Export case data to S3',   status:'approved', approver:'manager-ir',   time:'3h ago',  reason:'Approved for IR team secure storage' },
];

const STATUS_COLOR = { approved:'#00ff88', denied:'#ff2d6d', pending:'#ffd600' };

export default function ApprovalWorkflow() {
  const [approvals, setApprovals]  = useState(PENDING_APPROVALS);
  const [decisions, setDecisions]  = useState(DECISION_LOG);
  const [selected,  setSelected]   = useState(null);
  const [comment,   setComment]    = useState('');
  const [deciding,  setDeciding]   = useState(null);

  const decide = (id, status) => {
    setDeciding(id);
    setTimeout(() => {
      const item = approvals.find(a => a.id === id);
      setApprovals(prev => prev.filter(a => a.id !== id));
      setDecisions(prev => [{
        id, action:item.action, status,
        approver:'analyst-you',
        time:'just now',
        reason:comment || `${status} by analyst`,
      }, ...prev]);
      setComment('');
      setSelected(null);
      setDeciding(null);
    }, 800);
  };

  return (
    <motion.div
      key="approval"
      initial={{ opacity:0, y:10 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.25 }}
    >
      <div style={{ marginBottom:24 }}>
        <h1 style={{
          fontSize:22, fontWeight:700, color:'#e8f4ff',
          margin:0, display:'flex', alignItems:'center', gap:10,
        }}>
          <Shield size={20} color="#00e5ff"/>
          SOAR Approval Workflow
        </h1>
        <div style={{ fontSize:13, color:'#3d5080', marginTop:4 }}>
          {approvals.length} pending approvals · High-impact SOAR actions require authorisation
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:16 }}>

        {/* Pending */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'#e8f4ff',
            display:'flex', alignItems:'center', gap:8 }}>
            <Clock size={14} color="#ffd600"/>
            Pending Approval
            <span style={{
              fontFamily:'JetBrains Mono,monospace', fontSize:12,
              color:'#ffd600', background:'rgba(255,214,0,0.12)',
              border:'1px solid rgba(255,214,0,0.25)',
              borderRadius:9999, padding:'0 8px',
            }}>{approvals.length}</span>
          </div>

          {approvals.length === 0 && (
            <div style={{
              textAlign:'center', padding:'32px 0', color:'#3d5080',
            }}>
              <CheckCircle size={28} style={{ opacity:0.2, margin:'0 auto 10px' }}/>
              <div style={{ fontSize:13 }}>No pending approvals</div>
            </div>
          )}

          <AnimatePresence>
            {approvals.map(apr => (
              <motion.div key={apr.id}
                initial={{ opacity:0, y:6 }}
                animate={{ opacity:1, y:0 }}
                exit={{ opacity:0, x:-20, height:0 }}
                className="glass-card"
                style={{
                  padding:'14px 16px',
                  borderLeft:`3px solid ${apr.severity==='critical'?'#ff2d6d':'#ff8c00'}`,
                  cursor:'pointer',
                  background:selected===apr.id?'rgba(0,229,255,0.05)':'rgba(13,21,48,0.65)',
                }}
                onClick={() => setSelected(selected===apr.id?null:apr.id)}
              >
                <div style={{ display:'flex', justifyContent:'space-between',
                  alignItems:'flex-start', gap:10, marginBottom:8 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', gap:7, alignItems:'center', marginBottom:5 }}>
                      <span style={{
                        fontFamily:'JetBrains Mono,monospace', fontSize:10.5,
                        color:'#3d5080',
                      }}>{apr.id}</span>
                      <span className={`badge badge-${apr.severity}`}>{apr.severity}</span>
                    </div>
                    <div style={{ fontSize:14, fontWeight:600, color:'#e8f4ff' }}>
                      {apr.action}
                    </div>
                    <div style={{ fontSize:11.5, color:'#6b7fa3', marginTop:3 }}>
                      Playbook: {apr.playbook}
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{
                      fontFamily:'JetBrains Mono,monospace', fontSize:12,
                      color:'#ffd600', fontWeight:600,
                    }}>{apr.timeLeft}</div>
                    <div style={{ fontSize:10, color:'#3d5080' }}>remaining</div>
                  </div>
                </div>

                <div style={{ fontSize:12, color:'#c8d8f0', marginBottom:10, lineHeight:1.6 }}>
                  {apr.reason}
                </div>

                {/* Impact warning */}
                <div style={{
                  padding:'7px 10px', marginBottom:10,
                  background:'rgba(255,140,0,0.07)',
                  border:'1px solid rgba(255,140,0,0.20)',
                  borderRadius:6, fontSize:11.5, color:'#ff8c00',
                }}>
                  ⚠ Impact: {apr.impact}
                </div>

                {/* Comment + actions */}
                <AnimatePresence>
                  {selected === apr.id && (
                    <motion.div
                      initial={{ height:0, opacity:0 }}
                      animate={{ height:'auto', opacity:1 }}
                      exit={{ height:0, opacity:0 }}
                      style={{ overflow:'hidden' }}
                    >
                      <textarea
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="Add approval comment (optional)…"
                        rows={2}
                        style={{
                          width:'100%', background:'rgba(10,15,30,0.85)',
                          border:'1px solid #1a2744', borderRadius:7,
                          color:'#c8d8f0', padding:'8px 10px',
                          fontSize:12, fontFamily:'Inter,sans-serif',
                          resize:'vertical', outline:'none', boxSizing:'border-box',
                          marginBottom:10,
                        }}
                      />
                      <div style={{ display:'flex', gap:8 }}>
                        <button
                          className="btn-cyber"
                          style={{
                            flex:1, padding:'8px 0', justifyContent:'center',
                            fontSize:13,
                            background:'rgba(0,255,136,0.14)',
                            color:'#00ff88',
                            border:'1px solid rgba(0,255,136,0.30)',
                          }}
                          onClick={() => decide(apr.id, 'approved')}
                          disabled={deciding===apr.id}
                        >
                          <CheckCircle size={14}/>
                          {deciding===apr.id ? 'Processing…' : 'Approve'}
                        </button>
                        <button
                          className="btn-cyber"
                          style={{
                            flex:1, padding:'8px 0', justifyContent:'center',
                            fontSize:13,
                            background:'rgba(255,45,109,0.12)',
                            color:'#ff2d6d',
                            border:'1px solid rgba(255,45,109,0.28)',
                          }}
                          onClick={() => decide(apr.id, 'denied')}
                          disabled={deciding===apr.id}
                        >
                          <XCircle size={14}/>
                          Deny
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Requested by */}
                <div style={{
                  display:'flex', justifyContent:'space-between',
                  fontSize:10.5, color:'#3d5080', marginTop:8,
                }}>
                  <span><User size={10}/> {apr.requestedBy}</span>
                  <span>{apr.requestedAt}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Decision log */}
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:'#e8f4ff',
            display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
            <CheckCircle size={14} color="#00e5ff"/>
            Decision Log
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
            {decisions.map(d => (
              <div key={d.id} style={{
                padding:'10px 12px', borderRadius:8,
                background:'rgba(13,21,48,0.65)', border:'1px solid #1a2744',
                borderLeft:`3px solid ${STATUS_COLOR[d.status]||'#6b7fa3'}`,
              }}>
                <div style={{ display:'flex', justifyContent:'space-between',
                  alignItems:'center', marginBottom:5 }}>
                  <span style={{
                    fontFamily:'JetBrains Mono,monospace', fontSize:10,
                    color:STATUS_COLOR[d.status],
                    background:`${STATUS_COLOR[d.status]}15`,
                    border:`1px solid ${STATUS_COLOR[d.status]}30`,
                    borderRadius:4, padding:'1px 6px', textTransform:'uppercase',
                    fontWeight:700,
                  }}>{d.status}</span>
                  <span style={{ fontSize:10.5, color:'#3d5080' }}>{d.time}</span>
                </div>
                <div style={{ fontSize:12.5, color:'#c8d8f0', marginBottom:4 }}>
                  {d.action}
                </div>
                <div style={{ fontSize:11, color:'#6b7fa3' }}>
                  {d.approver} — {d.reason}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}