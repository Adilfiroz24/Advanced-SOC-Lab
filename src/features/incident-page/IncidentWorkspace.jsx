import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Clock, Target, FileText, Terminal,
  Network, Package, Database, Globe, StickyNote,
  MessageCircle, CheckSquare, Zap, History,
  Download, ChevronLeft,
} from 'lucide-react';

import SummaryTab     from './tabs/SummaryTab';
import TimelineTab    from './tabs/TimelineTab';
import MITRETab       from './tabs/MITRETab';
import RawLogsTab     from './tabs/RawLogsTab';
import ProcessTreeTab from './tabs/ProcessTreeTab';
import NetworkTab     from './tabs/NetworkTab';
import ArtifactsTab   from './tabs/ArtifactsTab';
import EvidenceTab    from './tabs/EvidenceTab';
import ThreatIntelTab from './tabs/ThreatIntelTab';
import NotesTab       from './tabs/NotesTab';
import CommentsTab    from './tabs/CommentsTab';
import TasksTab       from './tabs/TasksTab';
import SOARTab        from './tabs/SOARTab';
import CaseHistoryTab from './tabs/CaseHistoryTab';
import ExportTab      from './tabs/ExportTab';

import { mockCases } from '../../data/mockCases';

const TABS = [
  { id:'summary',    label:'Summary',      icon:Shield,         Component: SummaryTab     },
  { id:'timeline',   label:'Timeline',     icon:Clock,          Component: TimelineTab    },
  { id:'mitre',      label:'MITRE',        icon:Target,         Component: MITRETab       },
  { id:'rawlogs',    label:'Raw Logs',     icon:FileText,       Component: RawLogsTab     },
  { id:'process',    label:'Process Tree', icon:Terminal,       Component: ProcessTreeTab },
  { id:'network',    label:'Network',      icon:Network,        Component: NetworkTab     },
  { id:'artifacts',  label:'Artifacts',   icon:Package,        Component: ArtifactsTab   },
  { id:'evidence',   label:'Evidence',     icon:Database,       Component: EvidenceTab    },
  { id:'threatintel',label:'Threat Intel', icon:Globe,          Component: ThreatIntelTab },
  { id:'notes',      label:'Notes',        icon:StickyNote,     Component: NotesTab       },
  { id:'comments',   label:'Comments',     icon:MessageCircle,  Component: CommentsTab    },
  { id:'tasks',      label:'Tasks',        icon:CheckSquare,    Component: TasksTab       },
  { id:'soar',       label:'SOAR',         icon:Zap,            Component: SOARTab        },
  { id:'history',    label:'History',      icon:History,        Component: CaseHistoryTab },
  { id:'export',     label:'Export',       icon:Download,       Component: ExportTab      },
];

const SEV = {
  4: { label:'Critical', color:'#ff2d6d' },
  3: { label:'High',     color:'#ff8c00' },
  2: { label:'Medium',   color:'#ffd600' },
  1: { label:'Low',      color:'#00ff88' },
};

export default function IncidentWorkspace({ caseId, onBack }) {
  const [activeTab, setActiveTab] = useState('summary');

  // Use first mock case or find by id
  const caseData = (caseId
    ? mockCases.find(c => c.id === caseId)
    : null) || mockCases[0];

  const sev      = SEV[caseData.severity] || SEV[2];
  const ActiveTab = TABS.find(t => t.id === activeTab)?.Component || SummaryTab;

  return (
    <motion.div
      key="incident-workspace"
      initial={{ opacity:0, y:10 }}
      animate={{ opacity:1, y:0 }}
      exit={{ opacity:0 }}
      transition={{ duration:0.25 }}
    >
      {/* ── Case header ───────────────────────────── */}
      <div style={{
        background:'rgba(13,21,48,0.90)',
        border:'1px solid #1a2744',
        borderLeft:`4px solid ${sev.color}`,
        borderRadius:12, padding:'16px 20px',
        marginBottom:16,
      }}>
        <div style={{ display:'flex', alignItems:'flex-start',
          justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
          <div style={{ flex:1, minWidth:0 }}>
            {/* Back button */}
            {onBack && (
              <button onClick={onBack}
                style={{
                  background:'none', border:'none', cursor:'pointer',
                  color:'#6b7fa3', fontSize:12, padding:0,
                  display:'flex', alignItems:'center', gap:5,
                  marginBottom:8,
                }}>
                <ChevronLeft size={14} /> Back to Cases
              </button>
            )}

            <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
              <span style={{
                fontFamily:'JetBrains Mono,monospace', fontSize:11.5,
                color: sev.color,
                background:`${sev.color}18`,
                border:`1px solid ${sev.color}35`,
                borderRadius:4, padding:'2px 8px',
              }}>{caseData.id}</span>
              <span style={{
                fontSize:11, fontWeight:700, color:sev.color,
                textTransform:'uppercase', letterSpacing:'0.06em',
              }}>{sev.label}</span>
              <span style={{
                fontSize:11, color:'#ff2d6d',
                background:'rgba(255,45,109,0.10)',
                border:'1px solid rgba(255,45,109,0.22)',
                borderRadius:4, padding:'1px 7px',
              }}>{caseData.priority || 'P1'}</span>
            </div>

            <div style={{
              fontSize:17, fontWeight:700, color:'#e8f4ff',
              marginTop:8, lineHeight:1.3,
            }}>
              {caseData.title}
            </div>

            {/* Meta */}
            <div style={{
              display:'flex', gap:16, marginTop:8,
              fontSize:12, color:'#6b7fa3', flexWrap:'wrap',
            }}>
              <span>Assigned: <span style={{ color:'#c8d8f0' }}>
                {caseData.assigned_to || '—'}
              </span></span>
              <span>Status: <span style={{
                color: caseData.status==='Resolved' ? '#00ff88' : '#ff8c00',
              }}>{caseData.status}</span></span>
              <span>Tasks: <span style={{ color:'#00e5ff',
                fontFamily:'JetBrains Mono,monospace' }}>
                {caseData.tasks_done}/{caseData.tasks_total}
              </span></span>
              <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11.5 }}>
                {new Date(caseData.created_at).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Progress donut */}
          <div style={{ textAlign:'center', flexShrink:0 }}>
            <div style={{
              fontFamily:'JetBrains Mono,monospace',
              fontSize:22, fontWeight:700, color:'#00e5ff',
            }}>
              {Math.round((caseData.tasks_done/caseData.tasks_total)*100)}%
            </div>
            <div style={{ fontSize:10.5, color:'#3d5080', marginTop:2 }}>
              Tasks Complete
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab bar ───────────────────────────────── */}
      <div style={{
        display:'flex', gap:4, overflowX:'auto',
        paddingBottom:2, marginBottom:14,
        msOverflowStyle:'none', scrollbarWidth:'none',
      }}>
        {TABS.map(tab => {
          const Icon     = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'7px 12px', borderRadius:8,
                border:'1px solid',
                cursor:'pointer', whiteSpace:'nowrap',
                fontSize:12, fontWeight:500,
                transition:'all 0.15s',
                flexShrink:0,
                background: isActive ? 'rgba(0,229,255,0.12)' : 'rgba(255,255,255,0.03)',
                color:      isActive ? '#00e5ff'               : '#6b7fa3',
                borderColor:isActive ? 'rgba(0,229,255,0.30)'  : '#1a2744',
                boxShadow:  isActive ? '0 0 10px rgba(0,229,255,0.15)' : 'none',
              }}
            >
              <Icon size={13} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ───────────────────────────── */}
      <div style={{
        background:'rgba(13,21,48,0.65)',
        border:'1px solid #1a2744', borderRadius:12,
        padding:'20px 22px', minHeight:400,
      }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity:0, y:8 }}
            animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:-8 }}
            transition={{ duration:0.18 }}
          >
            <ActiveTab caseData={caseData} />
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}