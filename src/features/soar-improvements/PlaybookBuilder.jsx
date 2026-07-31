import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Plus, Save, Play, Trash2,
  ChevronDown, ChevronRight, Copy,
} from 'lucide-react';
import PlaybookNode from './PlaybookNode';

const NODE_TEMPLATES = [
  { type:'trigger',   title:'Alert Trigger',      description:'Fires on Wazuh rule match' },
  { type:'condition', title:'Check Severity',      description:'If severity >= critical'  },
  { type:'enrichment',title:'AbuseIPDB Lookup',    description:'Enrich source IP'         },
  { type:'approval',  title:'Manager Approval',   description:'Require authorisation'    },
  { type:'block',     title:'Block IP',            description:'iptables + pfSense'       },
  { type:'action',    title:'Create TheHive Case', description:'Auto case creation'       },
  { type:'notify',    title:'Slack Alert',         description:'Send to #soc-alerts'     },
  { type:'email',     title:'Email IR Team',       description:'Send incident email'     },
  { type:'delay',     title:'Wait 5 minutes',      description:'Pause before next step'  },
  { type:'end',       title:'End Playbook',        description:'Execution complete'       },
];

const DEFAULT_PLAYBOOKS = [
  {
    id:'PB-001', name:'SSH Brute Force Response', enabled:true,
    trigger:'rule.id:100001 AND rule.level >= 10',
    nodes:[
      { id:'n1', type:'trigger',   title:'SSH Brute Force Detected', description:'Rule 100001 level 10+', status:'completed' },
      { id:'n2', type:'enrichment',title:'AbuseIPDB IP Lookup',      description:'Enrich source IP',       status:'completed' },
      { id:'n3', type:'condition', title:'Score >= 50%?',             description:'Check malicious confidence', result:'pass', status:'completed' },
      { id:'n4', type:'block',     title:'Block Source IP',           description:'iptables + pfSense',     status:'completed' },
      { id:'n5', type:'action',    title:'Create TheHive Case',       description:'P2 severity case',       status:'completed' },
      { id:'n6', type:'notify',    title:'Slack Notification',        description:'#soc-alerts channel',    status:'completed' },
      { id:'n7', type:'end',       title:'Playbook Complete',         description:'',                        status:'completed' },
    ],
  },
  {
    id:'PB-002', name:'Credential Dumping Response', enabled:true,
    trigger:'rule.id:100013 AND rule.level:15',
    nodes:[
      { id:'n1', type:'trigger',   title:'LSASS Access Detected',  description:'Rule 100013 level 15',    status:'completed' },
      { id:'n2', type:'action',    title:'Create P1 TheHive Case', description:'Critical severity',       status:'completed' },
      { id:'n3', type:'notify',    title:'Slack @here Alert',      description:'#soc-critical',           status:'completed' },
      { id:'n4', type:'approval',  title:'Approval: Isolate Host', description:'Requires admin-kim sign-off', status:'pending_approval' },
      { id:'n5', type:'action',    title:'Isolate Endpoint',       description:'Wazuh active response',   status:null },
      { id:'n6', type:'email',     title:'Email IR Team',          description:'Incident notification',   status:null },
      { id:'n7', type:'end',       title:'Playbook Complete',      description:'',                         status:null },
    ],
  },
];

let nodeId = 100;

export default function PlaybookBuilder() {
  const [playbooks,  setPlaybooks]  = useState(DEFAULT_PLAYBOOKS);
  const [activeId,   setActiveId]   = useState('PB-001');
  const [selected,   setSelected]   = useState(null);
  const [showLib,    setShowLib]     = useState(true);
  const [saved,      setSaved]       = useState(false);
  const [running,    setRunning]     = useState(false);

  const active = playbooks.find(p => p.id === activeId);

  const addNode = (template) => {
    if (!active) return;
    const newNode = { ...template, id: `n${nodeId++}`, status: null };
    setPlaybooks(prev => prev.map(p =>
      p.id === activeId
        ? { ...p, nodes: [...p.nodes.slice(0,-1), newNode, p.nodes[p.nodes.length-1]] }
        : p
    ));
  };

  const removeNode = (nodeId) => {
    setPlaybooks(prev => prev.map(p =>
      p.id === activeId
        ? { ...p, nodes: p.nodes.filter(n => n.id !== nodeId) }
        : p
    ));
    setSelected(null);
  };

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2200); };

  const runTest = () => {
    setRunning(true);
    setTimeout(() => setRunning(false), 2000);
  };

  const newPlaybook = () => {
    const id = `PB-${Date.now()}`;
    setPlaybooks(prev => [...prev, {
      id, name:'New Playbook', enabled:false,
      trigger:'rule.level >= 10',
      nodes:[
        { id:'n1', type:'trigger', title:'Alert Trigger', description:'Configure trigger', status:null },
        { id:'n2', type:'end',     title:'End',           description:'', status:null },
      ],
    }]);
    setActiveId(id);
  };

  return (
    <motion.div
      key="playbook-builder"
      initial={{ opacity:0, y:10 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.25 }}
    >
      {/* Header */}
      <div style={{ marginBottom:22, display:'flex',
        justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:'#e8f4ff',
            margin:0, display:'flex', alignItems:'center', gap:10 }}>
            <Zap size={20} color="#00e5ff"/>
            SOAR Playbook Builder
          </h1>
          <div style={{ fontSize:13, color:'#3d5080', marginTop:4 }}>
            Visual playbook editor · Drag nodes · Test execution
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn-cyber btn-ghost"
            style={{ fontSize:12.5, padding:'7px 14px' }}
            onClick={runTest} disabled={running}>
            <Play size={13}/> {running?'Running…':'Test Run'}
          </button>
          <button className="btn-cyber btn-primary"
            style={{ fontSize:12.5, padding:'7px 16px' }}
            onClick={save}>
            <Save size={13}/> {saved?'Saved!':'Save'}
          </button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'200px 1fr 240px', gap:14 }}>

        {/* Playbook list */}
        <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
          <button className="btn-cyber btn-ghost"
            style={{ fontSize:11.5, padding:'7px 0', width:'100%',
              justifyContent:'center' }}
            onClick={newPlaybook}>
            <Plus size={13}/> New Playbook
          </button>
          {playbooks.map(p => (
            <div key={p.id}
              onClick={() => setActiveId(p.id)}
              style={{
                padding:'10px 12px', borderRadius:8, cursor:'pointer',
                background:activeId===p.id?'rgba(0,229,255,0.10)':'rgba(13,21,48,0.65)',
                border:`1px solid ${activeId===p.id?'rgba(0,229,255,0.28)':'#1a2744'}`,
                transition:'all 0.15s',
              }}
            >
              <div style={{ display:'flex', justifyContent:'space-between',
                alignItems:'center', marginBottom:3 }}>
                <span style={{ fontSize:12.5, color:'#e8f4ff', fontWeight:500 }}>
                  {p.name}
                </span>
                <div style={{
                  width:8, height:8, borderRadius:'50%', flexShrink:0,
                  background:p.enabled?'#00ff88':'#3d5080',
                }}/>
              </div>
              <div style={{ fontSize:10.5, color:'#3d5080' }}>
                {p.nodes.length} nodes
              </div>
            </div>
          ))}
        </div>

        {/* Canvas */}
        <div style={{
          background:'rgba(5,9,22,0.85)',
          border:'1px solid #1a2744', borderRadius:12,
          padding:'20px 16px', minHeight:520,
          position:'relative', overflowY:'auto',
        }}>
          {active ? (
            <>
              {/* Playbook meta */}
              <div style={{ marginBottom:16 }}>
                <input
                  value={active.name}
                  onChange={e => setPlaybooks(prev => prev.map(p =>
                    p.id===activeId ? {...p, name:e.target.value} : p
                  ))}
                  style={{
                    background:'transparent', border:'none',
                    borderBottom:'1px solid #1a2744',
                    color:'#e8f4ff', fontSize:15, fontWeight:600,
                    outline:'none', width:'100%', marginBottom:6,
                    padding:'4px 0',
                  }}
                />
                <div style={{
                  fontSize:11, color:'#3d5080',
                  fontFamily:'JetBrains Mono,monospace', marginBottom:4,
                }}>Trigger:</div>
                <input
                  value={active.trigger}
                  onChange={e => setPlaybooks(prev => prev.map(p =>
                    p.id===activeId ? {...p, trigger:e.target.value} : p
                  ))}
                  style={{
                    background:'rgba(0,0,0,0.3)',
                    border:'1px solid #1a2744', borderRadius:6,
                    color:'#00e5ff', fontSize:11.5, padding:'5px 10px',
                    outline:'none', width:'100%',
                    fontFamily:'JetBrains Mono,monospace',
                    boxSizing:'border-box',
                  }}
                />
              </div>

              {/* Node chain */}
              <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                {active.nodes.map((node, i) => (
                  <div key={node.id}>
                    <PlaybookNode
                      node={node}
                      isSelected={selected===node.id}
                      onClick={(n) => setSelected(selected===n.id?null:n.id)}
                    />
                    {/* Connector */}
                    {i < active.nodes.length - 1 && (
                      <div style={{
                        width:2, height:16, background:'#1a2744',
                        margin:'0 auto',
                      }}/>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign:'center', padding:'60px 0', color:'#3d5080' }}>
              <Zap size={32} style={{ opacity:0.2, margin:'0 auto 12px' }}/>
              <div>Select or create a playbook</div>
            </div>
          )}
        </div>

        {/* Node library */}
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:'#e8f4ff',
            display:'flex', alignItems:'center', gap:7, marginBottom:10,
            cursor:'pointer' }} onClick={() => setShowLib(p=>!p)}>
            <Plus size={14} color="#00e5ff"/>
            Node Library
            {showLib ? <ChevronDown size={13} style={{ marginLeft:'auto' }}/> :
              <ChevronRight size={13} style={{ marginLeft:'auto' }}/>}
          </div>

          <AnimatePresence>
            {showLib && (
              <motion.div
                initial={{ height:0, opacity:0 }}
                animate={{ height:'auto', opacity:1 }}
                exit={{ height:0, opacity:0 }}
                style={{ overflow:'hidden' }}
              >
                <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                  {NODE_TEMPLATES.map(t => (
                    <button key={t.type+t.title}
                      onClick={() => addNode(t)}
                      style={{
                        background:'rgba(13,21,48,0.65)',
                        border:'1px solid #1a2744',
                        borderRadius:7, padding:'8px 10px',
                        cursor:'pointer', textAlign:'left',
                        transition:'all 0.14s', width:'100%',
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor='rgba(0,229,255,0.25)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor='#1a2744'}
                    >
                      <div style={{ fontSize:12.5, color:'#c8d8f0', fontWeight:500 }}>
                        {t.title}
                      </div>
                      <div style={{ fontSize:10.5, color:'#3d5080', marginTop:2 }}>
                        {t.description}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Selected node actions */}
          {selected && active && (
            <div style={{ marginTop:14 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'#e8f4ff', marginBottom:8 }}>
                Selected Node
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <button className="btn-cyber btn-ghost"
                  style={{ flex:1, fontSize:11, padding:'6px 0', justifyContent:'center' }}
                  onClick={() => removeNode(selected)}>
                  <Trash2 size={12}/> Remove
                </button>
                <button className="btn-cyber btn-ghost"
                  style={{ flex:1, fontSize:11, padding:'6px 0', justifyContent:'center' }}
                  onClick={() => {
                    const node = active.nodes.find(n=>n.id===selected);
                    if (node) addNode({ type:node.type, title:node.title+' (copy)', description:node.description });
                  }}>
                  <Copy size={12}/> Duplicate
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}