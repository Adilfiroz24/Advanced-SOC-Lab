import { mockAlerts     } from '../data/mockAlerts';
import { mockCases      } from '../data/mockCases';
import { mockThreatIntel} from '../data/mockThreatIntel';

const delay = (ms = 160) => new Promise(r => setTimeout(r, ms));

function buildCorpus() {
  const corpus = [];

  (mockAlerts || []).forEach(a => corpus.push({
    id:        a.id,
    type:      'alert',
    title:     a.description || '',
    severity:  a.severity,
    status:    a.status,
    agent:     a.agent_name  || '',
    src_ip:    a.src_ip      || '',
    rule_id:   a.rule_id     || '',
    mitre:     a.mitre       || [],
    timestamp: a.timestamp,
    raw:       a,
  }));

  (mockCases || []).forEach(c => corpus.push({
    id:        c.id,
    type:      'case',
    title:     c.title || '',
    severity:  ['','low','medium','high','critical'][c.severity] || 'medium',
    status:    c.status || '',
    agent:     c.assigned_to || '',
    src_ip:    '',
    rule_id:   '',
    mitre:     c.mitre || [],
    timestamp: c.created_at,
    raw:       c,
  }));

  (mockThreatIntel || []).forEach(i => corpus.push({
    id:        i.id,
    type:      'ioc',
    title:     i.value || '',
    severity:  i.confidence >= 90 ? 'critical'
             : i.confidence >= 70 ? 'high'
             : i.confidence >= 50 ? 'medium' : 'low',
    status:    i.blocked ? 'blocked' : 'active',
    agent:     '',
    src_ip:    i.type === 'ip' ? i.value : '',
    rule_id:   '',
    mitre:     i.mitre || [],
    timestamp: i.last_seen,
    raw:       i,
  }));

  return corpus;
}

const CORPUS = buildCorpus();

function matchesTimeRange(timestamp, range) {
  if (!range || range === 'all') return true;
  const now = Date.now();
  const ms  = { '15m':900_000, '1h':3_600_000, '6h':21_600_000,
    '24h':86_400_000, '7d':604_800_000, '30d':2_592_000_000 }[range];
  if (!ms) return true;
  return (now - new Date(timestamp).getTime()) < ms;
}

export const searchService = {

  async query({
    q              = '',
    type,
    severity       = [],
    status         = [],
    source         = [],
    mitre          = [],
    agent          = '',
    ruleId         = '',
    timeRange      = '24h',
    page           = 1,
    pageSize       = 25,
    sortBy         = 'timestamp',
    sortDir        = 'desc',
  } = {}) {
    await delay();

    const qLow = q.toLowerCase().trim();
    const useAnd = qLow.includes(' and ');
    const terms = useAnd
      ? qLow.split(' and ').map(s => s.trim()).filter(Boolean)
      : qLow.split(' or  ').map(s => s.trim()).filter(Boolean);

    let results = CORPUS.filter(item => {
      // Text match
      if (qLow) {
        const hay = [item.title, item.agent, item.src_ip,
          item.rule_id, ...(item.mitre || [])].join(' ').toLowerCase();
        const hit = useAnd
          ? terms.every(t => hay.includes(t))
          : terms.length > 0 ? terms.some(t => hay.includes(t)) : true;
        if (!hit) return false;
      }
      if (type           && item.type      !== type)               return false;
      if (severity.length && !severity.includes(item.severity))    return false;
      if (status.length  && !status.includes(item.status?.toLowerCase())) return false;
      if (agent          && !item.agent.toLowerCase().includes(agent.toLowerCase())) return false;
      if (ruleId         && !item.rule_id.includes(ruleId))        return false;
      if (mitre.length   && !mitre.some(t => item.mitre.includes(t))) return false;
      if (!matchesTimeRange(item.timestamp, timeRange))            return false;
      return true;
    });

    // Sort
    results.sort((a, b) => {
      if (sortBy === 'timestamp')
        return sortDir === 'desc'
          ? new Date(b.timestamp) - new Date(a.timestamp)
          : new Date(a.timestamp) - new Date(b.timestamp);
      if (sortBy === 'severity') {
        const ORDER = { critical:0, high:1, medium:2, low:3 };
        return sortDir === 'asc'
          ? (ORDER[a.severity]||9) - (ORDER[b.severity]||9)
          : (ORDER[b.severity]||9) - (ORDER[a.severity]||9);
      }
      return 0;
    });

    const total = results.length;
    const start = (page - 1) * pageSize;
    return {
      results:    results.slice(start, start + pageSize),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      breakdown: {
        alerts: results.filter(r => r.type === 'alert').length,
        cases:  results.filter(r => r.type === 'case').length,
        iocs:   results.filter(r => r.type === 'ioc').length,
      },
    };
  },

  async suggest(partial) {
    await delay(60);
    if (!partial || partial.length < 2) return [];
    const q = partial.toLowerCase();
    const seen = new Set();
    const suggestions = [];
    CORPUS.forEach(item => {
      const val = item.title;
      if (val.toLowerCase().includes(q) && !seen.has(val)) {
        seen.add(val);
        suggestions.push({ value: val, type: item.type });
      }
      (item.mitre || []).forEach(t => {
        if (t.toLowerCase().includes(q) && !seen.has(t)) {
          seen.add(t);
          suggestions.push({ value: t, type: 'technique' });
        }
      });
    });
    return suggestions.slice(0, 10);
  },

  async getCorpusStats() {
    await delay();
    return {
      total:  CORPUS.length,
      alerts: CORPUS.filter(c => c.type === 'alert').length,
      cases:  CORPUS.filter(c => c.type === 'case').length,
      iocs:   CORPUS.filter(c => c.type === 'ioc').length,
    };
  },

  async getSavedQueries() {
    await delay();
    return [
      { id:1, name:'Critical Alerts (24h)', q:'severity:critical', timeRange:'24h' },
      { id:2, name:'LSASS Hunt',            q:'lsass',             timeRange:'7d'  },
      { id:3, name:'Log4Shell',             q:'log4shell',         timeRange:'30d' },
    ];
  },
};