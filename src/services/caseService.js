import { mockCases, caseStats } from '../data/mockCases';

const delay = (ms = 130) => new Promise(r => setTimeout(r, ms));

const SEV_LABEL = { 1:'low', 2:'medium', 3:'high', 4:'critical' };

export const caseService = {

  async getAll({ status, severity, assignee, limit = 50 } = {}) {
    await delay();
    let results = [...(mockCases || [])];
    if (status)   results = results.filter(c => c.status === status);
    if (severity) results = results.filter(c =>
      SEV_LABEL[c.severity] === severity || c.severity === severity);
    if (assignee) results = results.filter(c =>
      (c.assigned_to || '').toLowerCase().includes(assignee.toLowerCase()));
    return results.slice(0, limit);
  },

  async getById(id) {
    await delay();
    const c = (mockCases || []).find(c => c.id === id);
    if (!c) throw new Error(`Case ${id} not found`);
    return c;
  },

  async getStats() {
    await delay();
    const cases = mockCases || [];
    return caseStats || {
      total:      cases.length,
      open:       cases.filter(c => c.status !== 'Resolved').length,
      resolved:   cases.filter(c => c.status === 'Resolved').length,
      critical:   cases.filter(c => c.severity === 4).length,
    };
  },

  async create(data) {
    await delay();
    if (!data.title) throw new Error('Case title is required');
    return {
      id:          `CASE-${Date.now()}`,
      title:       data.title,
      status:      'Open',
      severity:    data.severity || 2,
      assigned_to: data.assigned_to || null,
      summary:     data.summary || '',
      tags:        data.tags || [],
      tasks_done:  0,
      tasks_total: 0,
      observables: [],
      mitre:       data.mitre || [],
      created_at:  new Date().toISOString(),
      updated_at:  new Date().toISOString(),
    };
  },

  async update(id, updates) {
    await delay();
    const c = (mockCases || []).find(c => c.id === id);
    if (!c) throw new Error(`Case ${id} not found`);
    return { ...c, ...updates, updated_at: new Date().toISOString() };
  },

  async close(id, resolution) {
    await delay();
    return this.update(id, { status: 'Resolved', resolution });
  },

  async addObservable(caseId, observable) {
    await delay();
    const c = (mockCases || []).find(c => c.id === caseId);
    if (!c) throw new Error(`Case ${caseId} not found`);
    const newObs = {
      id:   `OBS-${Date.now()}`,
      type: observable.type || 'ip',
      value:observable.value,
      tlp:  observable.tlp || 2,
      ...observable,
    };
    return { ...c, observables: [...(c.observables || []), newObs] };
  },

  async getObservables(caseId) {
    await delay();
    const c = (mockCases || []).find(c => c.id === caseId);
    if (!c) throw new Error(`Case ${caseId} not found`);
    return c.observables || [];
  },

  async getMITRETactics() {
    await delay();
    const all = (mockCases || []).flatMap(c => c.mitre || []);
    return [...new Set(all)];
  },

  async getTaskSummary(caseId) {
    await delay();
    const c = (mockCases || []).find(c => c.id === caseId);
    if (!c) throw new Error(`Case ${caseId} not found`);
    return {
      total:   c.tasks_total || 0,
      done:    c.tasks_done  || 0,
      percent: c.tasks_total
        ? Math.round((c.tasks_done / c.tasks_total) * 100)
        : 0,
    };
  },
};