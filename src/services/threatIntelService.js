import {
  mockThreatIntel,
  mitreCoverage,
  feedSummary,
} from '../data/mockThreatIntel';

const delay = (ms = 110) => new Promise(r => setTimeout(r, ms));

export const threatIntelService = {

  async getAllIOCs({ type, minConfidence = 0, blocked, limit = 100 } = {}) {
    await delay();
    let iocs = [...(mockThreatIntel || [])];
    if (type !== undefined && type !== null)
      iocs = iocs.filter(i => i.type === type);
    if (minConfidence > 0)
      iocs = iocs.filter(i => i.confidence >= minConfidence);
    if (blocked !== undefined)
      iocs = iocs.filter(i => !!i.blocked === blocked);
    return iocs.slice(0, limit);
  },

  async getIOCById(id) {
    await delay();
    const ioc = (mockThreatIntel || []).find(i => i.id === id);
    if (!ioc) throw new Error(`IOC ${id} not found`);
    return ioc;
  },

  async searchIOC(value) {
    await delay();
    if (!value) throw new Error('Search value required');
    const q = value.toLowerCase().trim();
    return (mockThreatIntel || []).filter(i =>
      i.value.toLowerCase().includes(q)
    );
  },

  async getMITRECoverage() {
    await delay();
    return mitreCoverage || [];
  },

  async getFeedSummary() {
    await delay();
    return feedSummary || {
      total:   (mockThreatIntel || []).length,
      blocked: (mockThreatIntel || []).filter(i => i.blocked).length,
      byType:  {},
    };
  },

  async getByType(type) {
    await delay();
    return (mockThreatIntel || []).filter(i => i.type === type);
  },

  async getHighConfidence(threshold = 80) {
    await delay();
    return (mockThreatIntel || []).filter(i => i.confidence >= threshold);
  },

  async getBlockedIOCs() {
    await delay();
    return (mockThreatIntel || []).filter(i => i.blocked);
  },

  async getRelatedIOCs(iocId) {
    await delay();
    const ioc = (mockThreatIntel || []).find(i => i.id === iocId);
    if (!ioc) throw new Error(`IOC ${iocId} not found`);
    return (mockThreatIntel || []).filter(i =>
      i.id !== iocId &&
      (i.threat_type === ioc.threat_type || i.country === ioc.country)
    ).slice(0, 5);
  },

  async enrichIP(ip) {
    await delay(300);
    const existing = (mockThreatIntel || []).find(i => i.value === ip);
    if (existing) return { source: 'cache', ...existing };
    return {
      source:     'abuseipdb_mock',
      value:      ip,
      type:       'ip',
      confidence: Math.floor(Math.random() * 60 + 20),
      country:    'Unknown',
      reports:    Math.floor(Math.random() * 10),
      blocked:    false,
    };
  },

  async submitToMISP(ioc) {
    await delay(400);
    if (!ioc.value) throw new Error('IOC value required for MISP submission');
    return {
      success:   true,
      eventId:   `MISP-${Date.now()}`,
      attribute: ioc.value,
      timestamp: new Date().toISOString(),
    };
  },

  async getTypeBreakdown() {
    await delay();
    const counts = {};
    (mockThreatIntel || []).forEach(i => {
      counts[i.type] = (counts[i.type] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({ type, count }));
  },
};