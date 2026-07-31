import React, { useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';

const INIT = [
  { id:1, author:'analyst-chen',  avatar:'AC', time:'2m ago',   msg:'Escalated to IR team. Awaiting approval for host isolation.' },
  { id:2, author:'analyst-patel', avatar:'AP', time:'15m ago',  msg:'AbuseIPDB score 94% confirms malicious. Blocking now via block_ip.py.' },
  { id:3, author:'manager-kim',   avatar:'MK', time:'28m ago',  msg:'P1 assigned. All hands on deck. Update every 15 minutes please.' },
];

export default function CommentsTab() {
  const [comments, setComments] = useState(INIT);
  const [msg,      setMsg]      = useState('');

  const send = () => {
    if (!msg.trim()) return;
    setComments(p => [{
      id: Date.now(), author: 'you',
      avatar: 'YO', time: 'just now',
      msg: msg.trim(),
    }, ...p]);
    setMsg('');
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ fontSize:14, fontWeight:600, color:'#e8f4ff',
        display:'flex', alignItems:'center', gap:8 }}>
        <MessageCircle size={15} color="#00e5ff" /> Team Comments
      </div>

      <div style={{ display:'flex', gap:10 }}>
        <input className="soc-input" value={msg}
          onChange={e => setMsg(e.target.value)}
          placeholder="Write a comment…"
          onKeyDown={e => e.key==='Enter' && send()}
          style={{ flex:1 }}
        />
        <button className="btn-cyber btn-primary"
          style={{ padding:'7px 14px' }} onClick={send}>
          <Send size={13} />
        </button>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {comments.map(c => (
          <div key={c.id} style={{
            display:'flex', gap:10, alignItems:'flex-start',
            padding:'10px 12px', background:'rgba(13,21,48,0.65)',
            border:'1px solid #1a2744', borderRadius:8,
          }}>
            <div style={{
              width:30, height:30, borderRadius:'50%', flexShrink:0,
              background:'rgba(0,229,255,0.12)',
              border:'1px solid rgba(0,229,255,0.25)',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:10, fontWeight:700, color:'#00e5ff',
            }}>{c.avatar}</div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:5 }}>
                <span style={{ fontSize:12.5, fontWeight:600, color:'#e8f4ff' }}>
                  {c.author}
                </span>
                <span style={{ fontSize:11, color:'#3d5080' }}>{c.time}</span>
              </div>
              <div style={{ fontSize:13, color:'#c8d8f0', lineHeight:1.6 }}>{c.msg}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}