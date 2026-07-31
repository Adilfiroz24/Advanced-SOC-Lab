import React from 'react';
import { mockAlerts, alertStats } from '../../data/mockAlerts';
import { mockCases,  caseStats  } from '../../data/mockCases';

export default function ReportTemplate({ config, caseData }) {
  const now = new Date();

  const critical = (mockAlerts || []).filter(a => a.severity === 'critical');
  const mitreTechniques = [
    ...new Set((mockAlerts || []).flatMap(a => a.mitre || [])),
  ];

  const sevMap = { 4:'Critical', 3:'High', 2:'Medium', 1:'Low' };
  const sevColor = { Critical:'#ff2d6d', High:'#ff8c00', Medium:'#ffd600', Low:'#00ff88' };

  return (
    <div style={{
      background: '#0a0f1e', color: '#c8d8f0',
      fontFamily: 'Inter, sans-serif', padding: '32px',
      maxWidth: 800, margin: '0 auto', lineHeight: 1.7,
    }}>
      {/* ── Cover page ──────────────────────────────── */}
      <div style={{
        borderBottom: '2px solid #00e5ff',
        paddingBottom: 28, marginBottom: 28,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}>
          <div>
            <div style={{
              fontSize: 10, color: '#00e5ff',
              fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: '0.14em', textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              {config.classification || 'CONFIDENTIAL'}
            </div>
            <h1 style={{
              fontSize: 26, fontWeight: 700, color: '#e8f4ff',
              margin: '0 0 6px', lineHeight: 1.2,
            }}>
              {config.title || 'SOC Incident Report'}
            </h1>
            {config.subtitle && (
              <div style={{ fontSize: 14, color: '#6b7fa3' }}>
                {config.subtitle}
              </div>
            )}
          </div>
          <div style={{
            textAlign: 'right', fontSize: 12,
            color: '#6b7fa3', fontFamily: 'JetBrains Mono, monospace',
          }}>
            <div style={{ color: '#e8f4ff', fontWeight: 600, marginBottom: 4 }}>
              Advanced SOC Lab
            </div>
            <div>Generated: {now.toLocaleDateString()}</div>
            <div>Time: {now.toLocaleTimeString()} UTC</div>
            <div style={{ marginTop: 8 }}>
              Analyst: {config.analyst || 'analyst-chen'}
            </div>
          </div>
        </div>
      </div>

      {/* ── Executive Summary ────────────────────────── */}
      {config.sections?.includes('executive') && (
        <section style={{ marginBottom: 28 }}>
          <h2 style={{
            fontSize: 16, fontWeight: 700, color: '#00e5ff',
            borderBottom: '1px solid #1a2744', paddingBottom: 6, marginBottom: 14,
          }}>
            1. Executive Summary
          </h2>
          <div style={{
            background: 'rgba(255,45,109,0.06)',
            border: '1px solid rgba(255,45,109,0.20)',
            borderRadius: 8, padding: '14px 16px', marginBottom: 14,
          }}>
            <div style={{
              fontSize: 11.5, color: '#ff2d6d', fontWeight: 600,
              marginBottom: 6,
            }}>
              CLASSIFICATION: {config.classification || 'CONFIDENTIAL'}
            </div>
            <div style={{ fontSize: 13, color: '#c8d8f0', lineHeight: 1.7 }}>
              {config.summary ||
                `This report documents a security incident detected by the Advanced SOC Lab on
                ${now.toLocaleDateString()}. A multi-stage attack was identified involving
                credential brute-forcing, lateral movement, credential dumping (Mimikatz),
                and ransomware pre-staging (shadow copy deletion). The attack was contained
                within ${Math.round(Math.random() * 30 + 20)} minutes of initial detection.`
              }
            </div>
          </div>

          {/* KPI summary */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10,
          }}>
            {[
              { label: 'Total Alerts',     value: (alertStats?.total || 12),    color: '#00e5ff' },
              { label: 'Critical',         value: (alertStats?.critical || 5),   color: '#ff2d6d' },
              { label: 'Cases Created',    value: (caseStats?.total || 6),      color: '#ff8c00' },
              { label: 'IPs Blocked',      value: 3,                            color: '#00ff88' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(0,0,0,0.2)', border: '1px solid #1a2744',
                borderRadius: 7, padding: '10px 12px', textAlign: 'center',
              }}>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 22, fontWeight: 700, color: s.color,
                }}>{s.value}</div>
                <div style={{ fontSize: 10.5, color: '#3d5080', marginTop: 2 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Timeline ─────────────────────────────────── */}
      {config.sections?.includes('timeline') && (
        <section style={{ marginBottom: 28 }}>
          <h2 style={{
            fontSize: 16, fontWeight: 700, color: '#00e5ff',
            borderBottom: '1px solid #1a2744', paddingBottom: 6, marginBottom: 14,
          }}>
            2. Attack Timeline
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { time:'-95m', event:'Nmap SYN scan detected from 192.168.56.20', sev:'medium'   },
              { time:'-88m', event:'SSH brute force (47 attempts) from 203.0.113.45', sev:'high' },
              { time:'-75m', event:'RDP brute force (12 attempts) from 203.0.113.78', sev:'high' },
              { time:'-62m', event:'PowerShell encoded command executed on win10-victim', sev:'high' },
              { time:'-48m', event:'LSASS memory access — Mimikatz pattern detected', sev:'critical' },
              { time:'-40m', event:'Backdoor user account "backdooruser" created', sev:'critical' },
              { time:'-28m', event:'Shadow copy deletion — vssadmin.exe delete shadows', sev:'critical' },
              { time:'-20m', event:'TheHive P1 case auto-created, Slack alert sent', sev:'info' },
              { time:'-15m', event:'Source IPs blocked via iptables + pfSense', sev:'info' },
            ].map((t, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '8px 12px', borderRadius: 6,
                background: 'rgba(0,0,0,0.15)',
                border: '1px solid #1a2744',
              }}>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 11, color: '#3d5080', flexShrink: 0, width: 40,
                }}>{t.time}</span>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: {critical:'#ff2d6d',high:'#ff8c00',
                    medium:'#ffd600',info:'#00e5ff'}[t.sev] || '#6b7fa3',
                }} />
                <span style={{ fontSize: 12.5, color: '#c8d8f0' }}>{t.event}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── MITRE ────────────────────────────────────── */}
      {config.sections?.includes('mitre') && (
        <section style={{ marginBottom: 28 }}>
          <h2 style={{
            fontSize: 16, fontWeight: 700, color: '#00e5ff',
            borderBottom: '1px solid #1a2744', paddingBottom: 6, marginBottom: 14,
          }}>
            3. MITRE ATT&CK Mapping
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
            {mitreTechniques.map(t => (
              <span key={t} style={{
                fontSize: 11.5,
                fontFamily: 'JetBrains Mono, monospace',
                color: '#a855f7',
                background: 'rgba(168,85,247,0.10)',
                border: '1px solid rgba(168,85,247,0.25)',
                borderRadius: 5, padding: '3px 9px',
              }}>{t}</span>
            ))}
          </div>
        </section>
      )}

      {/* ── IOC list ─────────────────────────────────── */}
      {config.sections?.includes('iocs') && (
        <section style={{ marginBottom: 28 }}>
          <h2 style={{
            fontSize: 16, fontWeight: 700, color: '#00e5ff',
            borderBottom: '1px solid #1a2744', paddingBottom: 6, marginBottom: 14,
          }}>
            4. Indicators of Compromise (IOCs)
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.3)' }}>
                {['Type','Value','Confidence','Source','Action'].map(h => (
                  <th key={h} style={{
                    padding: '8px 10px', textAlign: 'left',
                    color: '#3d5080', fontSize: 10.5,
                    fontWeight: 700, textTransform: 'uppercase',
                    letterSpacing: '0.07em', borderBottom: '1px solid #1a2744',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { type:'IP',     value:'203.0.113.45',     conf:'94%', src:'AbuseIPDB', action:'Blocked' },
                { type:'IP',     value:'198.51.100.99',    conf:'99%', src:'VirusTotal',action:'Blocked' },
                { type:'IP',     value:'203.0.113.78',     conf:'71%', src:'AbuseIPDB', action:'Blocked' },
                { type:'Hash',   value:'5f1d8aa80a44…',   conf:'87%', src:'VirusTotal',action:'Quarantined' },
                { type:'Domain', value:'evil-c2.xyz',      conf:'82%', src:'MISP',     action:'DNS Block' },
                { type:'URL',    value:'http://malware.ex…',conf:'100%',src:'Cowrie',   action:'Blocked' },
              ].map((ioc, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #1a2744' }}>
                  {[ioc.type, ioc.value, ioc.conf, ioc.src, ioc.action].map((v, j) => (
                    <td key={j} style={{
                      padding: '8px 10px', color:
                        j === 4 ? '#ff2d6d'
                        : j === 2 ? '#ff8c00'
                        : '#c8d8f0',
                      fontFamily: j <= 1 ? 'JetBrains Mono, monospace' : 'inherit',
                    }}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* ── Recommendations ──────────────────────────── */}
      {config.sections?.includes('recommendations') && (
        <section style={{ marginBottom: 28 }}>
          <h2 style={{
            fontSize: 16, fontWeight: 700, color: '#00e5ff',
            borderBottom: '1px solid #1a2744', paddingBottom: 6, marginBottom: 14,
          }}>
            5. Recommendations
          </h2>
          {[
            'Implement MFA on all admin accounts — backdoor account was created without MFA check.',
            'Deploy EDR solution on all Windows endpoints to catch LSASS access earlier.',
            'Enable Windows Defender Credential Guard to protect against credential dumping.',
            'Increase Suricata threshold for port scan detection — current rule fires at 200 SYN packets.',
            'Schedule weekly Caldera adversary emulation exercises to verify detection coverage.',
            'Rotate all credentials on win10-victim — potential credential dump by attacker.',
          ].map((rec, i) => (
            <div key={i} style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              padding: '8px 0', borderBottom: '1px solid #1a2744',
            }}>
              <span style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11, color: '#00e5ff', flexShrink: 0, width: 20,
                marginTop: 2,
              }}>
                R{i+1}
              </span>
              <span style={{ fontSize: 13, color: '#c8d8f0' }}>{rec}</span>
            </div>
          ))}
        </section>
      )}

      {/* ── Footer ───────────────────────────────────── */}
      <div style={{
        borderTop: '1px solid #1a2744', paddingTop: 16,
        display: 'flex', justifyContent: 'space-between',
        fontSize: 11, color: '#3d5080',
        fontFamily: 'JetBrains Mono, monospace',
      }}>
        <span>{config.classification || 'CONFIDENTIAL'} — Advanced SOC Lab</span>
        <span>Generated: {now.toISOString()}</span>
      </div>
    </div>
  );
}