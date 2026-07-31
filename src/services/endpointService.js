const delay = (ms = 120) => new Promise(r => setTimeout(r, ms));

const ENDPOINTS = [
  {
    id:'EP-001', hostname:'win10-victim',      ip:'192.168.56.30',
    os:'Windows', osVersion:'10 22H2',
    status:'critical', criticality:'high',
    department:'Finance', wazuhAgent:true, agentId:'001',
    enrolled:'2024-01-01', mac:'08:00:27:AB:CD:01',
    cpu:'Intel Core i5-8400', memory:'8 GB DDR4', disk:'256 GB SSD (67% used)',
    lastSeen:'2m ago', alertCount:5,
    vulns:3, patchStatus:'Outdated', compliance:'Non-compliant',
    tags:['sysmon','winlogbeat','critical-asset','finance'],
  },
  {
    id:'EP-002', hostname:'ubuntu-webserver',  ip:'192.168.56.40',
    os:'Linux', osVersion:'Ubuntu 22.04 LTS',
    status:'active', criticality:'high',
    department:'Engineering', wazuhAgent:true, agentId:'002',
    enrolled:'2024-01-01', mac:'08:00:27:AB:CD:02',
    cpu:'2x vCPU', memory:'4 GB RAM', disk:'80 GB SSD (45% used)',
    lastSeen:'1m ago', alertCount:2,
    vulns:2, patchStatus:'Current', compliance:'Compliant',
    tags:['apache','filebeat','web-server','public-facing'],
  },
  {
    id:'EP-003', hostname:'siem-server',       ip:'192.168.56.10',
    os:'Linux', osVersion:'Ubuntu 22.04 LTS',
    status:'active', criticality:'critical',
    department:'Security', wazuhAgent:false, agentId:'manager',
    enrolled:'2024-01-01', mac:'08:00:27:AB:CD:10',
    cpu:'4x vCPU', memory:'8 GB RAM', disk:'200 GB SSD (38% used)',
    lastSeen:'Just now', alertCount:0,
    vulns:0, patchStatus:'Current', compliance:'Compliant',
    tags:['wazuh','thehive','misp','suricata','soc-platform'],
  },
  {
    id:'EP-004', hostname:'kali-attacker',     ip:'192.168.56.20',
    os:'Linux', osVersion:'Kali 2024.1',
    status:'active', criticality:'medium',
    department:'Security', wazuhAgent:false, agentId:'—',
    enrolled:'—', mac:'08:00:27:AB:CD:20',
    cpu:'2x vCPU', memory:'4 GB RAM', disk:'80 GB SSD (22% used)',
    lastSeen:'5m ago', alertCount:0,
    vulns:0, patchStatus:'Current', compliance:'Exempt',
    tags:['pentest','authorized','lab-only'],
  },
  {
    id:'EP-005', hostname:'dc01-corp',         ip:'10.0.1.10',
    os:'Windows', osVersion:'Server 2022',
    status:'active', criticality:'critical',
    department:'IT Infrastructure', wazuhAgent:true, agentId:'003',
    enrolled:'2024-01-05', mac:'00:1A:2B:3C:4D:5E',
    cpu:'8x vCPU', memory:'32 GB RAM', disk:'500 GB SSD (55% used)',
    lastSeen:'30s ago', alertCount:0,
    vulns:1, patchStatus:'Current', compliance:'Compliant',
    tags:['domain-controller','active-directory','critical-infra'],
  },
  {
    id:'EP-006', hostname:'workstation-finance-01', ip:'10.0.2.45',
    os:'Windows', osVersion:'11 23H2',
    status:'disconnected', criticality:'medium',
    department:'Finance', wazuhAgent:true, agentId:'004',
    enrolled:'2024-01-10', mac:'00:1B:2C:3D:4E:5F',
    cpu:'Intel Core i7-1165G7', memory:'16 GB DDR4', disk:'512 GB SSD (30% used)',
    lastSeen:'3h ago', alertCount:0,
    vulns:0, patchStatus:'Current', compliance:'Compliant',
    tags:['workstation','finance','sysmon'],
  },
];

let endpointStore = [...ENDPOINTS];

export const endpointService = {

  async getAll({ status, criticality, department, search, limit=50 } = {}) {
    await delay();
    let results = [...endpointStore];
    if (status      && status      !== 'all') results = results.filter(e => e.status      === status);
    if (criticality && criticality !== 'all') results = results.filter(e => e.criticality === criticality);
    if (department  && department  !== 'all') results = results.filter(e => e.department  === department);
    if (search) {
      const q = search.toLowerCase();
      results = results.filter(e =>
        e.hostname.toLowerCase().includes(q) ||
        e.ip.includes(q) ||
        e.department.toLowerCase().includes(q)
      );
    }
    return results.slice(0, limit);
  },

  async getById(id) {
    await delay();
    const ep = endpointStore.find(e => e.id === id);
    if (!ep) throw new Error(`Endpoint ${id} not found`);
    return ep;
  },

  async getByHostname(hostname) {
    await delay();
    const ep = endpointStore.find(e =>
      e.hostname.toLowerCase() === hostname.toLowerCase()
    );
    if (!ep) throw new Error(`Endpoint "${hostname}" not found`);
    return ep;
  },

  async getStats() {
    await delay();
    const eps = endpointStore;
    return {
      total:        eps.length,
      active:       eps.filter(e => e.status === 'active').length,
      critical:     eps.filter(e => e.status === 'critical').length,
      disconnected: eps.filter(e => e.status === 'disconnected').length,
      wazuhCoverage:eps.filter(e => e.wazuhAgent).length,
      withAlerts:   eps.filter(e => e.alertCount > 0).length,
      totalAlerts:  eps.reduce((s,e) => s+e.alertCount, 0),
      totalVulns:   eps.reduce((s,e) => s+e.vulns, 0),
      departments:  [...new Set(eps.map(e => e.department))],
    };
  },

  async updateCriticality(id, criticality) {
    await delay();
    const valid = ['critical','high','medium','low','minimal'];
    if (!valid.includes(criticality))
      throw new Error(`Invalid criticality: ${criticality}`);
    endpointStore = endpointStore.map(e =>
      e.id === id ? { ...e, criticality } : e
    );
    return endpointStore.find(e => e.id === id);
  },

  async updateStatus(id, status) {
    await delay();
    const valid = ['active','disconnected','critical','pending'];
    if (!valid.includes(status)) throw new Error(`Invalid status: ${status}`);
    endpointStore = endpointStore.map(e =>
      e.id === id ? { ...e, status } : e
    );
    return endpointStore.find(e => e.id === id);
  },

  async getAlerts(endpointId) {
    await delay();
    const ep = await this.getById(endpointId);
    const { mockAlerts } = await import('../data/mockAlerts');
    return (mockAlerts || []).filter(a =>
      (a.agent_name||'').toLowerCase() === ep.hostname.toLowerCase()
    );
  },

  async getCriticalAssets() {
    await delay();
    return endpointStore.filter(e => e.criticality === 'critical');
  },

  async exportCSV() {
    await delay();
    const header = 'id,hostname,ip,os,status,criticality,department,alertCount,vulns,patchStatus,wazuhAgent';
    const rows   = endpointStore.map(e =>
      `${e.id},${e.hostname},${e.ip},${e.os},${e.status},${e.criticality},${e.department},${e.alertCount},${e.vulns},${e.patchStatus},${e.wazuhAgent}`
    );
    return [header,...rows].join('\n');
  },
};