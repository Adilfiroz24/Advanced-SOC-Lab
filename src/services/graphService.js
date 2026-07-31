import { mockAlerts     } from '../data/mockAlerts';
import { mockCases      } from '../data/mockCases';
import { mockThreatIntel} from '../data/mockThreatIntel';

const delay = (ms = 140) => new Promise(r => setTimeout(r, ms));

let nodeCounter = 1;
function makeId() { return `node-${nodeCounter++}`; }

export const graphService = {

  async buildCaseGraph(caseId) {
    await delay();
    const c = (mockCases || []).find(c => c.id === caseId)
      || (mockCases || [])[0];
    if (!c) throw new Error(`Case ${caseId} not found`);

    const nodes = [];
    const edges = [];

    // Case root node
    const caseNode = { id: 'case-root', type: 'alert',
      label: c.id, detail: c.title, x: 400, y: 220 };
    nodes.push(caseNode);

    // Observables
    (c.observables || []).forEach((obs, i) => {
      const angle = (2 * Math.PI * i) / Math.max((c.observables || []).length, 1);
      const nx = { id: makeId(), type: obs.type || 'ip',
        label: obs.value, detail: obs.tlp ? `TLP:${obs.tlp}` : '',
        x: 400 + 160 * Math.cos(angle),
        y: 220 + 160 * Math.sin(angle) };
      nodes.push(nx);
      edges.push({ id: `e-${nx.id}`, source: nx.id,
        target: 'case-root', relation: 'observed_in', weight: 1.5 });
    });

    // Related alerts
    const related = (mockAlerts || []).filter(a =>
      (a.mitre || []).some(t => (c.mitre || []).includes(t))
    ).slice(0, 4);

    related.forEach((a, i) => {
      const angle = (2 * Math.PI * i) / 4 + Math.PI;
      const nx = { id: makeId(), type: 'alert',
        label: `Alert ${a.id}`, detail: a.severity,
        x: 400 + 240 * Math.cos(angle),
        y: 220 + 240 * Math.sin(angle) };
      nodes.push(nx);
      edges.push({ id: `e-alert-${nx.id}`, source: nx.id,
        target: 'case-root', relation: 'related_to', weight: 1 });
    });

    return { nodes, edges, caseId: c.id };
  },

  async buildIOCGraph(iocId) {
    await delay();
    const iocs = mockThreatIntel || [];
    const root = iocs.find(i => i.id === iocId) || iocs[0];
    if (!root) throw new Error(`IOC ${iocId} not found`);

    const nodes = [{ id: 'ioc-root', type: root.type || 'ip',
      label: root.value, detail: root.threat_type,
      score: root.confidence, blocked: root.blocked,
      x: 400, y: 240 }];
    const edges = [];

    // Related IOCs (same threat type or country)
    const related = iocs
      .filter(i => i.id !== root.id &&
        (i.threat_type === root.threat_type || i.country === root.country))
      .slice(0, 6);

    related.forEach((ioc, i) => {
      const angle = (2 * Math.PI * i) / related.length;
      const nx = { id: `r-${ioc.id}`, type: ioc.type || 'ip',
        label: ioc.value, detail: ioc.threat_type,
        score: ioc.confidence, blocked: ioc.blocked,
        x: 400 + 180 * Math.cos(angle),
        y: 240 + 180 * Math.sin(angle) };
      nodes.push(nx);
      edges.push({ id: `e-${nx.id}`, source: `r-${ioc.id}`,
        target: 'ioc-root',
        relation: ioc.blocked ? 'blocked' : 'related_to',
        weight: 1.5 });
    });

    // MITRE nodes
    const techniques = [...new Set((root.mitre || []).slice(0, 3))];
    techniques.forEach((t, i) => {
      const angle = (2 * Math.PI * i) / 3 + Math.PI / 4;
      const nx = { id: `mitre-${t}`, type: 'alert',
        label: t, detail: 'ATT&CK Technique',
        x: 400 + 280 * Math.cos(angle),
        y: 240 + 280 * Math.sin(angle) };
      nodes.push(nx);
      edges.push({ id: `e-mitre-${t}`, source: 'ioc-root',
        target: `mitre-${t}`, relation: 'maps_to', weight: 1 });
    });

    return { nodes, edges, rootIOC: root };
  },

  async getConnectedEntities(entityId, entityType) {
    await delay();
    const connections = [];

    if (entityType === 'ip') {
      const alerts = (mockAlerts || []).filter(a => a.src_ip === entityId);
      alerts.forEach(a => connections.push({
        id: a.id, type: 'alert', value: a.description,
        relation: 'source_of', severity: a.severity,
      }));
    }

    if (entityType === 'alert') {
      const alert = (mockAlerts || []).find(a => a.id === entityId);
      if (alert?.mitre?.length) {
        alert.mitre.forEach(t => connections.push({
          id: t, type: 'technique', value: t,
          relation: 'uses', severity: null,
        }));
      }
    }

    return connections;
  },

  async getShortestPath(fromId, toId) {
    await delay();
    // Simplified: return a mock path between two node IDs
    return {
      path:   [fromId, 'intermediate', toId],
      length: 2,
      hops:   ['observed_in', 'related_to'],
    };
  },

  async getNodeNeighbours(nodeId, maxDepth = 1) {
    await delay();
    const all     = mockThreatIntel || [];
    const root    = all.find(i => i.id === nodeId);
    if (!root) return { node: null, neighbours: [] };
    const neighbours = all
      .filter(i => i.id !== nodeId &&
        i.threat_type === root.threat_type)
      .slice(0, 8);
    return { node: root, neighbours };
  },
};