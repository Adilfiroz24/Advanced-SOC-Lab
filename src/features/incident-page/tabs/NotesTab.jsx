import React, { useState } from 'react';
import { FileText, Plus, Trash2 } from 'lucide-react';

const INITIAL = [
  { id:1, author:'analyst-chen',  time:'2024-01-15 10:30', content:'Initial triage complete. Confirmed true positive. Source IP 203.0.113.45 blocked.' },
  { id:2, author:'analyst-patel', time:'2024-01-15 10:45', content:'Dumped lsass.exe memory. Sent to forensics for credential extraction analysis.' },
];

export default function NotesTab() {
  const [notes,    setNotes]    = useState(INITIAL);
  const [newNote,  setNewNote]  = useState('');

  const add = () => {
    if (!newNote.trim()) return;
    setNotes(p => [...p, {
      id: Date.now(),
      author: 'analyst-you',
      time: new Date().toLocaleString(),
      content: newNote.trim(),
    }]);
    setNewNote('');
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ fontSize:14, fontWeight:600, color:'#e8f4ff',
        display:'flex', alignItems:'center', gap:8 }}>
        <FileText size={15} color="#00e5ff" /> Analyst Notes
      </div>

      {/* Existing notes */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {notes.map(n => (
          <div key={n.id} style={{
            background:'rgba(0,229,255,0.04)', border:'1px solid rgba(0,229,255,0.12)',
            borderRadius:8, padding:'12px 14px',
          }}>
            <div style={{ display:'flex', justifyContent:'space-between',
              alignItems:'center', marginBottom:8 }}>
              <div style={{ display:'flex', gap:8, fontSize:11.5 }}>
                <span style={{ color:'#00e5ff', fontWeight:600 }}>{n.author}</span>
                <span style={{ color:'#3d5080' }}>{n.time}</span>
              </div>
              <button onClick={() => setNotes(p => p.filter(x => x.id !== n.id))}
                style={{ background:'none', border:'none', cursor:'pointer',
                  color:'#3d5080', padding:2 }}>
                <Trash2 size={12} />
              </button>
            </div>
            <div style={{ fontSize:13, color:'#c8d8f0', lineHeight:1.6 }}>{n.content}</div>
          </div>
        ))}
      </div>

      {/* New note */}
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        <textarea
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          placeholder="Add investigation note…"
          rows={4}
          style={{
            background:'rgba(10,15,30,0.85)', border:'1px solid #1a2744',
            borderRadius:8, color:'#c8d8f0', padding:'10px 12px',
            fontSize:13, fontFamily:'Inter,sans-serif',
            resize:'vertical', outline:'none',
            transition:'border-color 0.18s',
          }}
          onFocus={e => e.target.style.borderColor='rgba(0,229,255,0.42)'}
          onBlur={e  => e.target.style.borderColor='#1a2744'}
        />
        <button className="btn-cyber btn-primary"
          style={{ alignSelf:'flex-end', fontSize:12, padding:'6px 16px' }}
          onClick={add}>
          <Plus size={13} /> Add Note
        </button>
      </div>
    </div>
  );
}