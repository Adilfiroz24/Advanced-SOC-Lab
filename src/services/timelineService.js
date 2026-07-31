import { mockAlerts } from '../data/mockAlerts';
import { mockCases  } from '../data/mockCases';

const delay = (ms = 100) => new Promise(r => setTimeout(r, ms));

function alertToEvent(alert) {
  return {
    id:          `TL-A-${alert.id}`,
    type:        'alert',
    severity:    alert.severity,
    title:       alert.description || 'Alert',
    description: `Rule ${alert.rule_id || '?'} fired on ${alert.agent_name || '?'}`,
    timestamp:   alert.timestamp,
    agent:       alert.agent_name,
    src_ip:      alert.src_ip,
    mitre:       alert.mitre || [],
    rule_id:     alert.rule_id,
    raw:         alert,
  };
}

function caseToEvent(c) {
  return {
    id:          `TL-C-${c.id}`,
    type:        'automation',
    severity:    'info',
    title:       `Case created: ${c.id}`,
    description: c.title,
    timestamp:   c.created_at,
    agent:       'auto_investigate',
    mitre:       c.mitre || [],
    raw:         c,
  };
}

export const timelineService = {

  async getForCase(caseId) {
    await delay();
    const events = [];
    (mockAlerts || []).forEach(a => events.push(alertToEvent(a)));
    (mockCases  || []).forEach(c => events.push(caseToEvent(c)));
    return events.sort((a, b) =>
      new Date(a.timestamp) - new Date(b.timestamp)
    );
  },

  async getRecent(hours = 24, limit = 50) {
    await delay();
    const cutoff = Date.now() - hours * 3_600_000;
    return (mockAlerts || [])
      .filter(a => new Date(a.timestamp).getTime() >= cutoff)
      .map(alertToEvent)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  },

  async getById(eventId) {
    await delay();
    const alertId = eventId.replace('TL-A-', '');
    const alert   = (mockAlerts || []).find(a => a.id === alertId);
    if (!alert) throw new Error(`Timeline event ${eventId} not found`);
    return alertToEvent(alert);
  },

  async getBySeverity(severity) {
    await delay();
    return (mockAlerts || [])
      .filter(a => a.severity === severity)
      .map(alertToEvent);
  },

  async getByMITRE(technique) {
    await delay();
    return (mockAlerts || [])
      .filter(a => (a.mitre || []).includes(technique))
      .map(alertToEvent);
  },

  async getByAgent(agentName) {
    await delay();
    return (mockAlerts || [])
      .filter(a => (a.agent_name || '').toLowerCase()
        .includes(agentName.toLowerCase()))
      .map(alertToEvent);
  },

  async getHourlyBuckets(hours = 24) {
    await delay();
    const now     = Date.now();
    const buckets = Array.from({ length: hours }, (_, h) => ({
      hour:     hours - 1 - h,
      label:    `${String(hours - 1 - h).padStart(2, '0')}:00`,
      count:    0,
      critical: 0,
    }));

    (mockAlerts || []).forEach(a => {
      const age = Math.floor((now - new Date(a.timestamp).getTime()) / 3_600_000);
      if (age < hours) {
        buckets[age].count++;
        if (a.severity === 'critical') buckets[age].critical++;
      }
    });

    return buckets.reverse();
  },

  async addEvent(event) {
    await delay();
    if (!event.title)     throw new Error('Event title is required');
    if (!event.timestamp) throw new Error('Event timestamp is required');
    return {
      id:        `TL-M-${Date.now()}`,
      type:      event.type      || 'note',
      severity:  event.severity  || 'info',
      ...event,
    };
  },
};