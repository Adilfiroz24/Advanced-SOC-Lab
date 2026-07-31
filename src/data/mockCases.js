// ============================================================
// Advanced SOC Lab — mockCases.js
// Realistic TheHive 5 case objects for offline UI development.
// ============================================================

export const mockCases = [
  // ── 1. Credential Dumping — Mimikatz ─────────────────────
  {
    id:           'CASE-2024-0047',
    title:        'Credential Dumping — win10-victim (Mimikatz / LSASS)',
    severity:     4,
    severity_label: 'Critical',
    status:       'InProgress',
    priority:     'P1',
    assigned_to:  'analyst-chen',
    created_at:   new Date(Date.now() - 2 * 60_000).toISOString(),
    updated_at:   new Date(Date.now() - 1 * 60_000).toISOString(),
    tags:         ['T1003.001', 'credential-access', 'windows', 'wazuh-auto'],
    alert_count:  1,
    tasks_total:  6,
    tasks_done:   2,
    mitre:        ['T1003.001'],
    summary:      'Wazuh rule 100013 detected LSASS process memory access consistent with Mimikatz credential dumping. AbuseIPDB shows source IP (203.0.113.45) with 94% malicious confidence score. Host isolation pending approval from IR team lead.',
    observables: [
      { type: 'ip',   value: '203.0.113.45',
        ioc: true, score: 94 },
      { type: 'hash', value: '5f1d8aa80a4463a86e0c2df4e3fd9d15',
        ioc: true, score: 87 },
      { type: 'process', value: 'lsass.exe (PID 784)',
        ioc: false, score: null },
    ],
  },

  // ── 2. Ransomware Pre-Attack ──────────────────────────────
  {
    id:           'CASE-2024-0046',
    title:        'Ransomware Pre-Attack — Shadow Copy Deletion Detected',
    severity:     4,
    severity_label: 'Critical',
    status:       'InProgress',
    priority:     'P1',
    assigned_to:  'analyst-patel',
    created_at:   new Date(Date.now() - 15 * 60_000).toISOString(),
    updated_at:   new Date(Date.now() - 8 * 60_000).toISOString(),
    tags:         ['T1490', 'ransomware', 'impact', 'wazuh-auto'],
    alert_count:  1,
    tasks_total:  7,
    tasks_done:   1,
    mitre:        ['T1490', 'T1486'],
    summary:      'vssadmin.exe executed with "delete shadows /all /quiet" arguments on win10-victim. This is a classic ransomware pre-execution technique. Immediate host isolation recommended. No evidence of file encryption yet — caught in pre-attack phase.',
    observables: [
      { type: 'process', value: 'vssadmin.exe /delete shadows /all /quiet',
        ioc: true, score: 95 },
    ],
  },

  // ── 3. Cowrie Honeypot — External Attacker ───────────────
  {
    id:           'CASE-2024-0045',
    title:        'Honeypot Hit — External Attacker at 198.51.100.23',
    severity:     3,
    severity_label: 'High',
    status:       'InProgress',
    priority:     'P2',
    assigned_to:  'analyst-kim',
    created_at:   new Date(Date.now() - 62 * 60_000).toISOString(),
    updated_at:   new Date(Date.now() - 40 * 60_000).toISOString(),
    tags:         ['honeypot', 'cowrie', 'T1110', 'attacker-intel'],
    alert_count:  7,
    tasks_total:  5,
    tasks_done:   3,
    mitre:        ['T1110', 'T1133'],
    summary:      'Cowrie SSH honeypot captured attacker session from Romanian IP. Commands observed: uname -a, cat /etc/passwd, wget payload URL. IP geo: Romania. AbuseIPDB: 78% confidence malicious. Payload URL submitted to VirusTotal — 12/72 engines flagged.',
    observables: [
      { type: 'ip',  value: '198.51.100.23',
        ioc: true,  score: 78 },
      { type: 'url', value: 'http://malware.example.com/payload.sh',
        ioc: true,  score: 100 },
      { type: 'domain', value: 'malware.example.com',
        ioc: true,  score: 85 },
    ],
  },

  // ── 4. Log4Shell — Resolved ───────────────────────────────
  {
    id:           'CASE-2024-0044',
    title:        'Log4Shell Exploitation Attempt — Apache Web Server',
    severity:     4,
    severity_label: 'Critical',
    status:       'Resolved',
    priority:     'P1',
    assigned_to:  'analyst-chen',
    created_at:   new Date(Date.now() - 5 * 3_600_000).toISOString(),
    updated_at:   new Date(Date.now() - 2 * 3_600_000).toISOString(),
    tags:         ['T1190', 'log4shell', 'CVE-2021-44228', 'web'],
    alert_count:  1,
    tasks_total:  5,
    tasks_done:   5,
    mitre:        ['T1190'],
    summary:      'JNDI LDAP callback detected in User-Agent and X-Api-Version headers. Apache version patched to 2.4.54, WAF block rule added. Callback destination (198.51.100.99) blocked via iptables and pfSense. Confirmed no successful exploitation — payload did not reach JNDI endpoint.',
    observables: [
      { type: 'ip', value: '198.51.100.99',
        ioc: true, score: 99 },
    ],
  },

  // ── 5. SSH Brute Force — Resolved ────────────────────────
  {
    id:           'CASE-2024-0043',
    title:        'SSH Brute Force — 47 Failed Attempts from 203.0.113.45',
    severity:     3,
    severity_label: 'High',
    status:       'Resolved',
    priority:     'P2',
    assigned_to:  'analyst-patel',
    created_at:   new Date(Date.now() - 8 * 3_600_000).toISOString(),
    updated_at:   new Date(Date.now() - 6 * 3_600_000).toISOString(),
    tags:         ['T1110.001', 'brute-force', 'ssh', 'wazuh-auto'],
    alert_count:  47,
    tasks_total:  4,
    tasks_done:   4,
    mitre:        ['T1110.001'],
    summary:      '47 failed SSH authentication attempts from Russian-geolocated IP within 60 seconds. IP blocked via block_ip.py (iptables + pfSense rule). Fail2ban rule updated with lower threshold. No successful authentication confirmed via auth.log review.',
    observables: [
      { type: 'ip', value: '203.0.113.45',
        ioc: true, score: 94 },
    ],
  },

  // ── 6. False Positive — Nmap Internal Scan ───────────────
  {
    id:           'CASE-2024-0042',
    title:        'FALSE POSITIVE — Internal Nmap Scan by Security Team',
    severity:     2,
    severity_label: 'Medium',
    status:       'FalsePositive',
    priority:     'P3',
    assigned_to:  'analyst-kim',
    created_at:   new Date(Date.now() - 24 * 3_600_000).toISOString(),
    updated_at:   new Date(Date.now() - 23 * 3_600_000).toISOString(),
    tags:         ['false-positive', 'T1046', 'internal-scan'],
    alert_count:  1,
    tasks_total:  2,
    tasks_done:   2,
    mitre:        ['T1046'],
    summary:      'Suricata SID 9000001 and Wazuh rule 100014 triggered for Nmap scan from Kali VM. Confirmed as authorized purple-team exercise scheduled for this window. Rule 100014 threshold will be adjusted to exclude the Kali VM IP. Added to suppression list.',
    observables: [
      { type: 'ip', value: '192.168.56.20',
        ioc: false, score: 0 },
    ],
  },
];

// ── Derived stats ──────────────────────────────────────────
export const caseStats = {
  total:    mockCases.length,
  critical: mockCases.filter(c => c.severity === 4).length,
  open:     mockCases.filter(c => c.status === 'InProgress').length,
  resolved: mockCases.filter(c => c.status === 'Resolved').length,
  fp:       mockCases.filter(c => c.status === 'FalsePositive').length,
  avg_tasks_completion: Math.round(
    mockCases.reduce((sum, c) => sum + (c.tasks_done / c.tasks_total) * 100, 0)
    / mockCases.length
  ),
};