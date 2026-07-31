import React, { useState } from 'react';
import { Bookmark, Trash2, Play, Star, Plus } from 'lucide-react';

const INIT_BOOKMARKS = [
  {
    id:1, name:'Hunt: Encoded Execution',
    query:'commandLine contains EncodedCommand AND rule.level >= 12',
    hits:3, savedAt:'2024-01-15 10:30', pinned:true,
  },
  {
    id:2, name:'Hunt: LSASS Access (Critical)',
    query:'targetImage contains lsass.exe AND rule.level >= 15',
    hits:1, savedAt:'2024-01-15 09:00', pinned:true,
  },
  {
    id:3, name:'Hunt: Outbound Port 4444',
    query:'data.dstip:* AND rule.mitre.id contains T1071',
    hits:2, savedAt:'2024-01-14 16:20', pinned:false,
  },
  {
    id:4, name:'Hunt: New Admin Accounts',
    query:'rule.id:100009 OR rule.id:100010',
    hits:1, savedAt:'2024-01-14 14:05', pinned:false,
  },
];

export default function Bookmarks({ onLoad }) {
  const [bookmarks, setBookmarks] = useState(INIT_BOOKMARKS);

  const togglePin  = (id) => setBookmarks(p =>
    p.map(b => b.id===id ? {...b, pinned:!b.pinned} : b));
  const deleteB    = (id) => setBookmarks(p => p.filter(b => b.id!==id));
  const pinned     = bookmarks.filter(b => b.pinned);
  const unpinned   = bookmarks.filter(b => !b.pinned);

  const render = (bm) => (
    <div key={bm.id} style={{
      padding:'10px 12px', borderRadius:8,
      background:'rgba(13,21,48,0.65)',
      border:'1px solid #1a2744', marginBottom:7,
      transition:'border-color 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor='#243660'}
      onMouseLeave={e => e.currentTarget.style.borderColor='#1a2744'}
    >
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
        <button onClick={() => togglePin(bm.id)} style={{
          background:'none', border:'none', cursor:'pointer',
          color: bm.pinned ? '#ffd600' : '#3d5080', padding:2,
        }}>
          <Star size={12} fill={bm.pinned ? '#ffd600' : 'none'} />
        </button>
        <span style={{ fontSize:13, color:'#e8f4ff', fontWeight:500, flex:1 }}>
          {bm.name}
        </span>
        <span style={{
          fontFamily:'JetBrains Mono,monospace',
          fontSize:11, color:'#00e5ff',
          background:'rgba(0,229,255,0.08)',
          border:'1px solid rgba(0,229,255,0.18)',
          borderRadius:4, padding:'1px 6px',
        }}>{bm.hits} hits</span>
      </div>

      <div style={{
        fontFamily:'JetBrains Mono,monospace',
        fontSize:11, color:'#6b7fa3', marginBottom:8,
        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
      }}>
        {bm.query}
      </div>

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:10.5, color:'#3d5080' }}>Saved: {bm.savedAt}</span>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={() => onLoad?.(bm.query)} style={{
            background:'rgba(0,229,255,0.10)',
            border:'1px solid rgba(0,229,255,0.22)',
            borderRadius:5, padding:'3px 10px',
            cursor:'pointer', color:'#00e5ff', fontSize:11,
            display:'flex', alignItems:'center', gap:4,
          }}>
            <Play size={10}/> Load
          </button>
          <button onClick={() => deleteB(bm.id)} style={{
            background:'none', border:'none', cursor:'pointer',
            color:'#3d5080', padding:4, borderRadius:5,
          }}
            onMouseEnter={e => e.currentTarget.style.color='#ff2d6d'}
            onMouseLeave={e => e.currentTarget.style.color='#3d5080'}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ fontSize:13, fontWeight:600, color:'#e8f4ff',
        display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
        <Bookmark size={14} color="#00e5ff" />
        Saved Hunts
        <span style={{
          fontFamily:'JetBrains Mono,monospace', fontSize:11,
          color:'#6b7fa3', marginLeft:4,
        }}>{bookmarks.length} saved</span>
      </div>

      {pinned.length > 0 && (
        <div>
          <div style={{ fontSize:10, color:'#3d5080', marginBottom:6,
            fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em',
            fontFamily:'JetBrains Mono,monospace' }}>⭐ Pinned</div>
          {pinned.map(render)}
        </div>
      )}

      {unpinned.length > 0 && (
        <div>
          <div style={{ fontSize:10, color:'#3d5080', marginBottom:6,
            marginTop:pinned.length ? 10 : 0,
            fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em',
            fontFamily:'JetBrains Mono,monospace' }}>Recent</div>
          {unpinned.map(render)}
        </div>
      )}
    </div>
  );
}