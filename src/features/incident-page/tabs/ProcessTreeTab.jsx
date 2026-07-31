import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal, ChevronRight, ChevronDown, AlertTriangle } from 'lucide-react';

const PROCESS_TREE = {
  pid: 4, name: 'System', suspicious: false, children: [
    {
      pid: 1234, name: 'services.exe', suspicious: false, children: [
        {
          pid: 2345, name: 'svchost.exe', suspicious: false, children: [
            {
              pid: 3456, name: 'powershell.exe',
              cmd: 'powershell.exe -EncodedCommand SQBFAF...',
              suspicious: true, children: [
                {
                  pid: 4567, name: 'net.exe',
                  cmd: 'net user backdooruser P@ss123! /add',
                  suspicious: true, children: [],
                },
                {
                  pid: 4568, name: 'vssadmin.exe',
                  cmd: 'vssadmin.exe delete shadows /all /quiet',
                  suspicious: true, children: [],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      pid: 892, name: 'lsass.exe', suspicious: false, children: [],
    },
  ],
};

function ProcessNode({ node, depth = 0 }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children?.length > 0;

  return (
    <div style={{ marginLeft: depth === 0 ? 0 : 24 }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          display: 'flex', alignItems: 'flex-start', gap: 8,
          padding: '7px 10px', borderRadius: 7, marginBottom: 4,
          cursor: hasChildren ? 'pointer' : 'default',
          background: node.suspicious
            ? 'rgba(255,45,109,0.07)'
            : 'rgba(0,229,255,0.03)',
          border: `1px solid ${node.suspicious
            ? 'rgba(255,45,109,0.20)'
            : '#1a2744'}`,
        }}
        onClick={() => hasChildren && setExpanded(p => !p)}
      >
        {/* Expand toggle */}
        <div style={{ color:'#3d5080', flexShrink:0, marginTop:1 }}>
          {hasChildren
            ? (expanded ? <ChevronDown size={13}/> : <ChevronRight size={13}/>)
            : <span style={{ display:'inline-block', width:13 }} />
          }
        </div>

        {/* Icon */}
        {node.suspicious
          ? <AlertTriangle size={13} color="#ff2d6d" style={{ flexShrink:0, marginTop:1 }} />
          : <Terminal      size={13} color="#00e5ff" style={{ flexShrink:0, marginTop:1 }} />
        }

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{
            fontSize:13, fontWeight:600,
            color: node.suspicious ? '#ff2d6d' : '#e8f4ff',
            fontFamily:'JetBrains Mono,monospace',
          }}>
            {node.name}
            <span style={{ fontSize:10.5, color:'#3d5080', marginLeft:8, fontWeight:400 }}>
              PID: {node.pid}
            </span>
            {node.suspicious && (
              <span style={{
                fontSize:9.5, color:'#ff2d6d',
                background:'rgba(255,45,109,0.12)',
                border:'1px solid rgba(255,45,109,0.25)',
                borderRadius:4, padding:'1px 6px',
                marginLeft:8, fontWeight:700,
              }}>SUSPICIOUS</span>
            )}
          </div>
          {node.cmd && (
            <div style={{
              fontSize:11, color:'#6b7fa3', marginTop:3,
              fontFamily:'JetBrains Mono,monospace',
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
            }}>
              {node.cmd}
            </div>
          )}
        </div>
      </motion.div>

      {hasChildren && expanded && (
        <div style={{
          borderLeft:'1px solid #1a2744', marginLeft:16, paddingLeft:8,
        }}>
          {node.children.map(child => (
            <ProcessNode key={child.pid} node={child} depth={depth+1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProcessTreeTab() {
  return (
    <div>
      <div style={{ fontSize:11.5, color:'#3d5080', marginBottom:14 }}>
        Process execution tree — red nodes indicate suspicious activity
      </div>
      <ProcessNode node={PROCESS_TREE} />
    </div>
  );
}