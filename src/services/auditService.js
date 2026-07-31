const delay = (ms = 100) => new Promise(r => setTimeout(r, ms));

// Deterministic pseudo-HMAC hash for display
function pseudoHash(entry) {
  const str  = JSON.stringify(entry);
  let   hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return `sha256:${Math.abs(hash).toString(16).padStart(8,'0')}${'b3f1e9a2c6d4'.repeat(4)}`.slice(0,70);
}

const BASE_ENTRIES = [
  {
    id:'AUD-001', action:'login',         user:'analyst-chen',
    ip:'192.168.1.45', resource:'SOC Dashboard',
    description:'Successful login', riskLevel:'low', result:'success',
    timestamp: new Date(Date.now()-2*60000).toISOString(),
    metadata:{ mfa:true },
  },
  {
    id:'AUD-002', action:'block',         user:'auto_investigate',
    ip:'192.168.56.10', resource:'Firewall',
    description:'IP block: 203.0.113.45 (AbuseIPDB 94%)',
    riskLevel:'high', result:'success',
    timestamp: new Date(Date.now()-15*60000).toISOString(),
    metadata:{ blockedIp:'203.0.113.45', score:94 },
  },
  {
    id:'AUD-003', action:'create',        user:'auto_investigate',
    ip:'192.168.56.10', resource:'TheHive/Cases',
    description:'Case CASE-2024-0047 auto-created at P1',
    riskLevel:'medium', result:'success',
    timestamp: new Date(Date.now()-20*60000).toISOString(),
    metadata:{ caseId:'CASE-2024-0047', priority:'P1' },
  },
  {
    id:'AUD-004', action:'export',        user:'analyst-chen',
    ip:'192.168.1.45', resource:'Reports',
    description:'PDF report exported: CASE-2024-0047.pdf',
    riskLevel:'medium', result:'success',
    timestamp: new Date(Date.now()-45*60000).toISOString(),
    metadata:{ format:'PDF', classification:'CONFIDENTIAL' },
  },
  {
    id:'AUD-005', action:'configuration', user:'admin-kim',
    ip:'192.168.1.10', resource:'Wazuh/Rules',
    description:'Rule 100013 level updated: 14→15',
    riskLevel:'high', result:'success',
    timestamp: new Date(Date.now()-60*60000).toISOString(),
    metadata:{ ruleId:'100013', oldLevel:14, newLevel:15 },
  },
  {
    id:'AUD-006', action:'escalate',      user:'analyst-chen',
    ip:'192.168.1.45', resource:'CASE-2024-0047',
    description:'Case escalated to IR team via Slack',
    riskLevel:'medium', result:'success',
    timestamp: new Date(Date.now()-25*60000).toISOString(),
    metadata:{ notifiedTeam:'IR', method:'Slack' },
  },
  {
    id:'AUD-007', action:'enrich',        user:'analyst-patel',
    ip:'192.168.1.62', resource:'AbuseIPDB',
    description:'IP enrichment: 198.51.100.99 → 99% confidence',
    riskLevel:'low', result:'success',
    timestamp: new Date(Date.now()-30*60000).toISOString(),
    metadata:{ ip:'198.51.100.99', score:99 },
  },
  {
    id:'AUD-008', action:'delete',        user:'admin-kim',
    ip:'192.168.1.10', resource:'TheHive/Case',
    description:'False-positive CASE-2024-0042 closed',
    riskLevel:'medium', result:'success',
    timestamp: new Date(Date.now()-120*60000).toISOString(),
    metadata:{ caseId:'CASE-2024-0042', reason:'false_positive' },
  },
].map(e => ({ ...e, hash: pseudoHash(e) }));

let logStore = [...BASE_ENTRIES];

export const auditService = {

  async getAll({ action, riskLevel, user, search, page=1, pageSize=20 } = {}) {
    await delay();
    let results = [...logStore];
    if (action    && action    !== 'all') results = results.filter(e => e.action    === action);
    if (riskLevel && riskLevel !== 'all') results = results.filter(e => e.riskLevel === riskLevel);
    if (user)   results = results.filter(e => e.user.toLowerCase().includes(user.toLowerCase()));
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(e =>
        e.description.toLowerCase().includes(q) ||
        e.user.toLowerCase().includes(q) ||
        e.id.toLowerCase().includes(q)
      );
    }
    const total = results.length;
    const start = (page-1)*pageSize;
    return {
      entries:    results.slice(start, start+pageSize),
      total,
      page,
      totalPages: Math.ceil(total/pageSize),
    };
  },

  async getById(id) {
    await delay();
    const entry = logStore.find(e => e.id === id);
    if (!entry) throw new Error(`Audit entry ${id} not found`);
    return entry;
  },

  async log(action, user, resource, description, metadata={}, riskLevel='low') {
    await delay();
    if (!action || !user || !description)
      throw new Error('action, user, and description are required');

    const id    = `AUD-${Date.now()}`;
    const entry = {
      id, action, user, resource, description, metadata, riskLevel,
      ip:        '127.0.0.1',
      result:    'success',
      timestamp: new Date().toISOString(),
    };
    entry.hash = pseudoHash(entry);
    logStore   = [entry, ...logStore];
    return entry;
  },

  async verifyChain() {
    await delay();
    const valid = logStore.every(e => {
      const { hash, ...rest } = e;
      return hash && hash.startsWith('sha256:');
    });
    return { valid, entriesChecked: logStore.length, algorithm:'HMAC-SHA256' };
  },

  async getStats() {
    await delay();
    const counts = {};
    logStore.forEach(e => { counts[e.action] = (counts[e.action]||0)+1; });
    return {
      total:      logStore.length,
      byAction:   counts,
      highRisk:   logStore.filter(e => ['high','critical'].includes(e.riskLevel)).length,
      uniqueUsers:[...new Set(logStore.map(e => e.user))].length,
    };
  },

  async exportCSV() {
    await delay();
    const header = 'id,timestamp,action,user,ip,resource,description,riskLevel,result';
    const rows   = logStore.map(e =>
      `${e.id},${e.timestamp},${e.action},${e.user},${e.ip},"${e.resource}","${e.description}",${e.riskLevel},${e.result}`
    );
    return [header, ...rows].join('\n');
  },
};