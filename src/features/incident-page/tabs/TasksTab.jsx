import React, { useState } from 'react';
import { CheckSquare, Square, Plus, Clock } from 'lucide-react';

const INIT_TASKS = [
  { id:1, title:'Triage — confirm true positive vs false positive', group:'Triage',        status:'done',    assignee:'analyst-chen'  },
  { id:2, title:'Block source IP 203.0.113.45 via block_ip.py',    group:'Containment',   status:'done',    assignee:'analyst-chen'  },
  { id:3, title:'Identify all affected assets and users',           group:'Investigation', status:'done',    assignee:'analyst-patel' },
  { id:4, title:'Collect memory dump from win10-victim',            group:'Forensics',     status:'done',    assignee:'analyst-patel' },
  { id:5, title:'Reset all passwords for compromised accounts',     group:'Remediation',   status:'waiting', assignee:'analyst-chen'  },
  { id:6, title:'Patch systems against T1190 (Log4Shell)',          group:'Remediation',   status:'waiting', assignee:'—'             },
  { id:7, title:'Document findings and close case',                 group:'Closure',       status:'waiting', assignee:'—'             },
];

export default function TasksTab() {
  const [tasks,    setTasks]    = useState(INIT_TASKS);
  const [newTask,  setNewTask]  = useState('');
  const done = tasks.filter(t => t.status === 'done').length;

  const toggle = (id) => setTasks(p =>
    p.map(t => t.id===id
      ? {...t, status: t.status==='done' ? 'waiting' : 'done'}
      : t)
  );
  const add = () => {
    if (!newTask.trim()) return;
    setTasks(p => [...p, {
      id: Date.now(), title: newTask.trim(),
      group:'General', status:'waiting', assignee:'—',
    }]);
    setNewTask('');
  };

  const groups = [...new Set(tasks.map(t => t.group))];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div style={{ fontSize:14, fontWeight:600, color:'#e8f4ff',
          display:'flex', alignItems:'center', gap:8 }}>
          <CheckSquare size={15} color="#00e5ff" />
          Tasks
          <span style={{
            fontFamily:'JetBrains Mono,monospace', fontSize:11,
            color: done===tasks.length ? '#00ff88' : '#ff8c00',
          }}>{done}/{tasks.length}</span>
        </div>
      </div>

      {/* Progress */}
      <div className="progress-bar">
        <div className="progress-fill" style={{
          width: `${(done/tasks.length)*100}%`,
          background: done===tasks.length ? '#00ff88' : '#00e5ff',
          transition:'width 0.5s',
        }} />
      </div>

      {groups.map(group => (
        <div key={group}>
          <div style={{ fontSize:11, color:'#3d5080', fontWeight:700,
            textTransform:'uppercase', letterSpacing:'0.08em',
            fontFamily:'JetBrains Mono,monospace', marginBottom:6 }}>
            {group}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            {tasks.filter(t=>t.group===group).map(task => (
              <div key={task.id}
                onClick={() => toggle(task.id)}
                style={{
                  display:'flex', alignItems:'flex-start', gap:10,
                  padding:'10px 12px', borderRadius:7, cursor:'pointer',
                  background: task.status==='done'
                    ? 'rgba(0,255,136,0.05)'
                    : 'rgba(13,21,48,0.65)',
                  border:`1px solid ${task.status==='done'
                    ? 'rgba(0,255,136,0.15)'
                    : '#1a2744'}`,
                  transition:'all 0.15s',
                }}
              >
                {task.status==='done'
                  ? <CheckSquare size={14} color="#00ff88" style={{ flexShrink:0, marginTop:1 }} />
                  : <Square      size={14} color="#3d5080" style={{ flexShrink:0, marginTop:1 }} />
                }
                <div style={{ flex:1 }}>
                  <div style={{
                    fontSize:13, color: task.status==='done' ? '#6b7fa3' : '#c8d8f0',
                    textDecoration: task.status==='done' ? 'line-through' : 'none',
                  }}>{task.title}</div>
                  <div style={{ fontSize:11, color:'#3d5080', marginTop:3 }}>
                    {task.assignee}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Add task */}
      <div style={{ display:'flex', gap:8, marginTop:4 }}>
        <input className="soc-input" value={newTask}
          onChange={e => setNewTask(e.target.value)}
          placeholder="Add new task…"
          onKeyDown={e => e.key==='Enter' && add()}
          style={{ flex:1 }}
        />
        <button className="btn-cyber btn-primary"
          style={{ padding:'7px 14px' }} onClick={add}>
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}