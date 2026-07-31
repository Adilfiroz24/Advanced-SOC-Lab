// ============================================================
// Advanced SOC Lab — validation.js
// Pure input validation utilities used across the UI and
// service layer. No dependencies.
// ============================================================

// ── IP address ────────────────────────────────────────────
const IPV4_RE = /^(\d{1,3}\.){3}\d{1,3}$/;
const IPV6_RE = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

export function isValidIP(ip) {
  if (!ip || typeof ip !== 'string') return false;
  ip = ip.trim();
  if (IPV4_RE.test(ip)) {
    return ip.split('.').every(o => Number(o) >= 0 && Number(o) <= 255);
  }
  return IPV6_RE.test(ip);
}

// ── CIDR ─────────────────────────────────────────────────
export function isValidCIDR(cidr) {
  if (!cidr) return false;
  const [ip, prefix] = cidr.split('/');
  const p = Number(prefix);
  return isValidIP(ip) && !Number.isNaN(p) && p >= 0 && p <= 32;
}

// ── Domain ────────────────────────────────────────────────
const DOMAIN_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

export function isValidDomain(domain) {
  return domain && DOMAIN_RE.test(domain.trim());
}

// ── URL ──────────────────────────────────────────────────
export function isValidURL(url) {
  try {
    const u = new URL(url);
    return ['http:', 'https:'].includes(u.protocol);
  } catch {
    return false;
  }
}

// ── Hash ─────────────────────────────────────────────────
const MD5_RE    = /^[a-fA-F0-9]{32}$/;
const SHA1_RE   = /^[a-fA-F0-9]{40}$/;
const SHA256_RE = /^[a-fA-F0-9]{64}$/;

export function isValidHash(hash) {
  if (!hash || typeof hash !== 'string') return false;
  return MD5_RE.test(hash) || SHA1_RE.test(hash) || SHA256_RE.test(hash);
}

export function hashType(hash) {
  if (!hash) return null;
  if (MD5_RE.test(hash))    return 'md5';
  if (SHA1_RE.test(hash))   return 'sha1';
  if (SHA256_RE.test(hash)) return 'sha256';
  return null;
}

// ── Email ─────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email) {
  return email && EMAIL_RE.test(email.trim());
}

// ── Wazuh rule level ──────────────────────────────────────
export function isValidRuleLevel(level) {
  const n = Number(level);
  return Number.isInteger(n) && n >= 1 && n <= 15;
}

// ── Wazuh rule ID ─────────────────────────────────────────
export function isValidRuleId(id) {
  const n = Number(id);
  return Number.isInteger(n) && n > 0;
}

// ── MITRE technique ID ────────────────────────────────────
const MITRE_RE = /^T\d{4}(\.\d{3})?$/;

export function isValidMITRE(technique) {
  return technique && MITRE_RE.test(technique.trim());
}

// ── IOC type detection ────────────────────────────────────
export function detectIOCType(value) {
  if (!value) return null;
  const v = value.trim();
  if (isValidIP(v))     return 'ip';
  if (isValidDomain(v)) return 'domain';
  if (isValidURL(v))    return 'url';
  if (isValidHash(v))   return 'hash';
  return null;
}

// ── Time range ────────────────────────────────────────────
const TIMERANGE_RE = /^\d+[smhdw]$/;

export function isValidTimeRange(range) {
  return range && TIMERANGE_RE.test(range.trim());
}

export function timeRangeToMs(range) {
  if (!isValidTimeRange(range)) return null;
  const value = parseInt(range);
  const unit  = range.slice(-1);
  const multipliers = { s:1000, m:60000, h:3600000, d:86400000, w:604800000 };
  return value * (multipliers[unit] || 0);
}

// ── Form validation helper ────────────────────────────────
/**
 * Validate a field map.
 * rules: { fieldName: [ validator_fn, error_message ] }
 * Returns { isValid: bool, errors: { fieldName: string } }
 */
export function validateForm(data, rules) {
  const errors = {};
  for (const [field, [validator, message]] of Object.entries(rules)) {
    if (!validator(data[field])) {
      errors[field] = message;
    }
  }
  return { isValid: Object.keys(errors).length === 0, errors };
}

// ── Sanitise for display ──────────────────────────────────
export function sanitiseForDisplay(str, maxLen = 200) {
  if (!str) return '';
  return String(str)
    .replace(/[<>&'"]/g, c => ({
      '<': '&lt;', '>': '&gt;', '&': '&amp;',
      "'": '&#39;', '"': '&quot;',
    }[c]))
    .slice(0, maxLen);
}

// ── Check if private IP ───────────────────────────────────
const PRIVATE_PREFIXES = [
  '10.', '192.168.', '172.16.', '172.17.', '172.18.', '172.19.',
  '172.20.', '172.21.', '172.22.', '172.23.', '172.24.', '172.25.',
  '172.26.', '172.27.', '172.28.', '172.29.', '172.30.', '172.31.',
  '127.', '0.', '169.254.', '::1',
];

export function isPrivateIP(ip) {
  return PRIVATE_PREFIXES.some(p => String(ip).startsWith(p));
}