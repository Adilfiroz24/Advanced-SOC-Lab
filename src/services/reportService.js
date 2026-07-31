import { mockAlerts, alertStats } from '../data/mockAlerts';
import { mockCases,  caseStats  } from '../data/mockCases';
import { mockThreatIntel         } from '../data/mockThreatIntel';

const delay = (ms = 200) => new Promise(r => setTimeout(r, ms));

let reportStore = [];

function buildReportData(config) {
  const alerts = mockAlerts || [];
  const cases  = mockCases  || [];
  const iocs   = mockThreatIntel || [];

  return {
    metadata: {
      title:          config.title          || 'SOC Incident Report',
      subtitle:       config.subtitle       || '',
      analyst:        config.analyst        || 'SOC Team',
      classification: config.classification || 'CONFIDENTIAL',
      generatedAt:    new Date().toISOString(),
    },
    executive: {
      totalAlerts:   alerts.length,
      criticalAlerts:alerts.filter(a => a.severity === 'critical').length,
      totalCases:    cases.length,
      ipsBlocked:    iocs.filter(i => i.blocked).length,
      mttr_minutes:  42,
    },
    timeline: alerts.map(a => ({
      time:     a.timestamp,
      event:    a.description,
      severity: a.severity,
      rule:     a.rule_id,
      agent:    a.agent_name,
    })).sort((a,b) => new Date(a.time)-new Date(b.time)),
    mitre: [...new Set(alerts.flatMap(a => a.mitre || []))],
    iocs:  iocs.slice(0, 10).map(i => ({
      type:       i.type,
      value:      i.value,
      confidence: i.confidence,
      source:     i.source,
      action:     i.blocked ? 'Blocked' : 'Active',
    })),
    recommendations: [
      'Implement MFA on all admin accounts',
      'Deploy EDR on all Windows endpoints',
      'Enable Windows Defender Credential Guard',
      'Increase Suricata scan thresholds for port scanning',
      'Schedule weekly Caldera adversary emulation exercises',
    ],
  };
}

export const reportService = {

  async generate(config) {
    await delay();
    if (!config.title) throw new Error('Report title is required');

    const data   = buildReportData(config);
    const report = {
      id:       `RPT-${Date.now()}`,
      config,
      data,
      format:   config.format   || 'json',
      sections: config.sections || ['executive','timeline','mitre','iocs','recommendations'],
      createdAt:new Date().toISOString(),
      analyst:  config.analyst  || 'SOC Team',
    };

    reportStore = [report, ...reportStore];
    return report;
  },

  async getAll() {
    await delay();
    return reportStore.map(r => ({
      id:        r.id,
      title:     r.config.title,
      format:    r.format,
      analyst:   r.analyst,
      sections:  r.sections.length,
      createdAt: r.createdAt,
    }));
  },

  async getById(id) {
    await delay();
    const r = reportStore.find(r => r.id === id);
    if (!r) throw new Error(`Report ${id} not found`);
    return r;
  },

  async exportJSON(id) {
    await delay();
    const r = await this.getById(id);
    return JSON.stringify(r.data, null, 2);
  },

  async exportHTML(id) {
    await delay();
    const r    = await this.getById(id);
    const d    = r.data;
    const meta = d.metadata;
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${meta.title}</title>
  <style>
    body { background:#0a0f1e; color:#c8d8f0; font-family:Inter,sans-serif; padding:32px; }
    h1   { color:#e8f4ff; }
    h2   { color:#00e5ff; border-bottom:1px solid #1a2744; padding-bottom:6px; }
    code { font-family:JetBrains Mono,monospace; color:#00e5ff; }
    .badge { background:rgba(255,45,109,0.15); color:#ff2d6d;
      border-radius:4px; padding:1px 8px; font-size:12px; }
  </style>
</head>
<body>
  <h1>${meta.title}</h1>
  <p>${meta.subtitle}</p>
  <p><strong>Analyst:</strong> ${meta.analyst} &nbsp;
     <strong>Classification:</strong> <span class="badge">${meta.classification}</span> &nbsp;
     <strong>Generated:</strong> ${new Date(meta.generatedAt).toLocaleString()}</p>
  <h2>Executive Summary</h2>
  <ul>
    <li>Total Alerts: <code>${d.executive.totalAlerts}</code></li>
    <li>Critical Alerts: <code>${d.executive.criticalAlerts}</code></li>
    <li>Cases Created: <code>${d.executive.totalCases}</code></li>
    <li>IPs Blocked: <code>${d.executive.ipsBlocked}</code></li>
    <li>Avg MTTR: <code>${d.executive.mttr_minutes}m</code></li>
  </ul>
  <h2>MITRE ATT&amp;CK</h2>
  <p>${d.mitre.map(t => `<code>${t}</code>`).join(' &nbsp;')}</p>
  <h2>Recommendations</h2>
  <ol>${d.recommendations.map(r => `<li>${r}</li>`).join('')}</ol>
</body>
</html>`;
  },

  async getTemplates() {
    await delay();
    return [
      { id:'full',        name:'Full Incident Report',     sections:['executive','timeline','mitre','iocs','recommendations'] },
      { id:'executive',   name:'Executive Summary Only',   sections:['executive'] },
      { id:'ioc_digest',  name:'IOC & Threat Intel',       sections:['iocs','mitre'] },
      { id:'compliance',  name:'Compliance Evidence Pack', sections:['executive','mitre','recommendations'] },
    ];
  },

  async getSectionData(section, config) {
    await delay(80);
    const data = buildReportData(config);
    if (!data[section]) throw new Error(`Section "${section}" not found`);
    return data[section];
  },
};