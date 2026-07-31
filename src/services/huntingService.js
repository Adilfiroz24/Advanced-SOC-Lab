import { mockAlerts } from '../data/mockAlerts';

const delay = (ms = 280) => new Promise(r => setTimeout(r, ms));

const PRESETS = [
  {
    id:'hunt-ps-encoded',
    name:'Encoded PowerShell',
    description:'Detect base64-encoded PowerShell execution',
    conditions:[
      { field:'data.win.eventdata.commandLine', operator:'contains', value:'EncodedCommand' },
      { field:'rule.level', operator:'>=', value:'10' },
    ],
    logic:'AND',
    mitre:['T1059.001','T1027'],
  },
  {
    id:'hunt-lsass',
    name:'LSASS Memory Access',
    description:'Detect credential dumping via LSASS access',
    conditions:[
      { field:'data.win.eventdata.targetImage', operator:'contains', value:'lsass.exe' },
      { field:'rule.level', operator:'>=', value:'12' },
    ],
    logic:'AND',
    mitre:['T1003.001'],
  },
  {
    id:'hunt-lateral-wmi',
    name:'WMI Lateral Movement',
    description:'Detect WMI-based remote process execution',
    conditions:[
      { field:'data.win.eventdata.commandLine', operator:'contains', value:'wmic' },
      { field:'rule.mitre.id', operator:'contains', value:'T1047' },
    ],
    logic:'AND',
    mitre:['T1047'],
  },
  {
    id:'hunt-dns-tunnel',
    name:'DNS Tunneling',
    description:'High-volume DNS queries suggesting data exfiltration',
    conditions:[
      { field:'rule.groups', operator:'contains', value:'dns' },
      { field:'rule.level', operator:'>=', value:'10' },
    ],
    logic:'AND',
    mitre:['T1048.001'],
  },
];

let savedHunts = [
  { id:'bookmark-1', name:'Hunt: LSASS Critical',
    query:'targetImage contains lsass.exe AND rule.level >= 15',
    hits:1, savedAt:new Date(Date.now()-3600000).toISOString(), pinned:true },
  { id:'bookmark-2', name:'Hunt: Encoded PowerShell',
    query:'commandLine contains EncodedCommand AND rule.level >= 12',
    hits:3, savedAt:new Date(Date.now()-7200000).toISOString(), pinned:false },
];

function executeQuery(conditions, logic) {
  const alerts = mockAlerts || [];
  return alerts.filter(alert => {
    const results = conditions.map(cond => {
      const v = String(cond.value || '').toLowerCase();

      if (cond.field === 'rule.level') {
        const level = alert.rule_level || 0;
        if (cond.operator === '>=') return level >= Number(cond.value);
        if (cond.operator === '>')  return level >  Number(cond.value);
        if (cond.operator === '<=') return level <= Number(cond.value);
        if (cond.operator === '<')  return level <  Number(cond.value);
        if (cond.operator === 'is') return level === Number(cond.value);
        return false;
      }

      const hay = [
        alert.description, alert.agent_name,
        alert.src_ip, ...(alert.mitre||[]),
      ].join(' ').toLowerCase();

      if (cond.operator === 'contains')          return hay.includes(v);
      if (cond.operator === 'does not contain')  return !hay.includes(v);
      if (cond.operator === 'is')                return hay === v;
      if (cond.operator === 'is not')            return hay !== v;
      if (cond.operator === 'starts with')       return hay.startsWith(v);
      return hay.includes(v);
    });

    return logic === 'AND' ? results.every(Boolean) : results.some(Boolean);
  });
}

export const huntingService = {

  async executeHunt({ conditions, logic = 'AND', query = '' } = {}) {
    await delay();
    if (!conditions?.length) throw new Error('At least one condition is required');

    const results  = executeQuery(conditions, logic);
    const huntId   = `HUNT-${Date.now()}`;

    return {
      huntId,
      query,
      conditions,
      logic,
      results,
      total:       results.length,
      executedAt:  new Date().toISOString(),
      durationMs:  Math.floor(Math.random() * 200 + 50),
      indices:     ['wazuh-alerts-*','sysmon-*','suricata-*'],
    };
  },

  async getPresets() {
    await delay(60);
    return PRESETS;
  },

  async getPresetById(id) {
    await delay(60);
    const preset = PRESETS.find(p => p.id === id);
    if (!preset) throw new Error(`Preset ${id} not found`);
    return preset;
  },

  async runPreset(presetId) {
    await delay();
    const preset = await this.getPresetById(presetId);
    return this.executeHunt({
      conditions: preset.conditions,
      logic:      preset.logic,
      query:      preset.name,
    });
  },

  async getSavedHunts() {
    await delay();
    return [...savedHunts];
  },

  async saveHunt({ name, query, hits = 0 }) {
    await delay();
    if (!name || !query) throw new Error('name and query are required');
    const hunt = {
      id:      `bookmark-${Date.now()}`,
      name,
      query,
      hits,
      savedAt: new Date().toISOString(),
      pinned:  false,
    };
    savedHunts = [hunt, ...savedHunts];
    return hunt;
  },

  async togglePin(huntId) {
    await delay();
    savedHunts = savedHunts.map(h =>
      h.id === huntId ? { ...h, pinned: !h.pinned } : h
    );
    return savedHunts.find(h => h.id === huntId);
  },

  async deleteHunt(huntId) {
    await delay();
    savedHunts = savedHunts.filter(h => h.id !== huntId);
    return { deleted: true, huntId };
  },

  async getHuntStats() {
    await delay();
    return {
      totalPresets: PRESETS.length,
      savedHunts:   savedHunts.length,
      corpusSize:   (mockAlerts || []).length,
      indices:      ['wazuh-alerts-*','sysmon-*','suricata-*','cowrie-*'],
    };
  },
};