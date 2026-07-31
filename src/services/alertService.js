import { mockAlerts, alertStats } from '../data/mockAlerts';

const delay = (ms = 120) => new Promise(r => setTimeout(r, ms));

export const alertService = {

  async getAll({ severity, status, agent, ruleId, limit = 100 } = {}) {
    await delay();
    let results = [...(mockAlerts || [])];
    if (severity) results = results.filter(a => a.severity === severity);
    if (status)   results = results.filter(a => a.status   === status);
    if (agent)    results = results.filter(a =>
      (a.agent_name || '').toLowerCase().includes(agent.toLowerCase()));
    if (ruleId)   results = results.filter(a => a.rule_id === ruleId);
    return results.slice(0, limit);
  },

  async getById(id) {
    await delay();
    const alert = (mockAlerts || []).find(a => a.id === id);
    if (!alert) throw new Error(`Alert ${id} not found`);
    return alert;
  },

  async getStats() {
    await delay();
    return alertStats || {
      total:    (mockAlerts || []).length,
      critical: (mockAlerts || []).filter(a => a.severity === 'critical').length,
      high:     (mockAlerts || []).filter(a => a.severity === 'high').length,
      medium:   (mockAlerts || []).filter(a => a.severity === 'medium').length,
      low:      (mockAlerts || []).filter(a => a.severity === 'low').length,
      open:     (mockAlerts || []).filter(a => a.status   === 'open').length,
    };
  },

  async getBySeverity(severity) {
    await delay();
    return (mockAlerts || []).filter(a => a.severity === severity);
  },

  async getByMITRE(technique) {
    await delay();
    return (mockAlerts || []).filter(a =>
      (a.mitre || []).includes(technique)
    );
  },

  async updateStatus(id, status) {
    await delay();
    const alert = (mockAlerts || []).find(a => a.id === id);
    if (!alert) throw new Error(`Alert ${id} not found`);
    return { ...alert, status };
  },

  async acknowledge(id, analyst) {
    await delay();
    return this.updateStatus(id, 'investigating');
  },

  async getTimeline(hours = 24) {
    await delay();
    const now     = Date.now();
    const buckets = {};
    for (let h = 0; h < hours; h++) {
      const label = `${String(h).padStart(2,'0')}:00`;
      buckets[label] = { time: label, critical: 0, high: 0, medium: 0, low: 0 };
    }
    (mockAlerts || []).forEach(a => {
      const age = (now - new Date(a.timestamp).getTime()) / 3_600_000;
      if (age < hours) {
        const label = `${String(Math.floor(age)).padStart(2,'0')}:00`;
        if (buckets[label] && a.severity) buckets[label][a.severity]++;
      }
    });
    return Object.values(buckets).reverse();
  },

  async getTopAgents(limit = 5) {
    await delay();
    const counts = {};
    (mockAlerts || []).forEach(a => {
      const k = a.agent_name || 'unknown';
      counts[k] = (counts[k] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([agent, alerts]) => ({ agent, alerts }))
      .sort((a, b) => b.alerts - a.alerts)
      .slice(0, limit);
  },
};