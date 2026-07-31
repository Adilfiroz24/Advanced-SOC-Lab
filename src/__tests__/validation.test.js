// ============================================================
// Advanced SOC Lab — validation.test.js
// Unit tests for src/utils/validation.js
// Run with: npx jest src/__tests__/validation.test.js
// ============================================================

import {
  isValidIP, isValidCIDR, isValidDomain, isValidURL,
  isValidHash, hashType, isValidEmail, isValidRuleLevel,
  isValidRuleId, isValidMITRE, detectIOCType,
  isPrivateIP, isValidTimeRange, timeRangeToMs,
  validateForm, sanitiseForDisplay,
} from '../utils/validation';

// ── IP address ────────────────────────────────────────────
describe('isValidIP', () => {
  test('valid IPv4', () => {
    expect(isValidIP('192.168.56.10')).toBe(true);
    expect(isValidIP('203.0.113.45')).toBe(true);
    expect(isValidIP('0.0.0.0')).toBe(true);
    expect(isValidIP('255.255.255.255')).toBe(true);
  });
  test('invalid IPv4', () => {
    expect(isValidIP('256.0.0.1')).toBe(false);
    expect(isValidIP('not-an-ip')).toBe(false);
    expect(isValidIP('')).toBe(false);
    expect(isValidIP(null)).toBe(false);
    expect(isValidIP('192.168.1')).toBe(false);
  });
  test('valid IPv6', () => {
    expect(isValidIP('::1')).toBe(true);
    expect(isValidIP('2001:db8::1')).toBe(true);
  });
});

// ── CIDR ─────────────────────────────────────────────────
describe('isValidCIDR', () => {
  test('valid CIDR', () => {
    expect(isValidCIDR('192.168.56.0/24')).toBe(true);
    expect(isValidCIDR('10.0.0.0/8')).toBe(true);
    expect(isValidCIDR('203.0.113.45/32')).toBe(true);
  });
  test('invalid CIDR', () => {
    expect(isValidCIDR('192.168.1.1')).toBe(false);
    expect(isValidCIDR('192.168.1.1/33')).toBe(false);
    expect(isValidCIDR('')).toBe(false);
  });
});

// ── Domain ───────────────────────────────────────────────
describe('isValidDomain', () => {
  test('valid domains', () => {
    expect(isValidDomain('evil-c2.xyz')).toBe(true);
    expect(isValidDomain('soc.lab')).toBe(true);
    expect(isValidDomain('sub.domain.co.uk')).toBe(true);
  });
  test('invalid domains', () => {
    expect(isValidDomain('not a domain')).toBe(false);
    expect(isValidDomain('localhost')).toBe(false);
    expect(isValidDomain('')).toBe(false);
    expect(isValidDomain(null)).toBe(false);
  });
});

// ── Hash ─────────────────────────────────────────────────
describe('isValidHash / hashType', () => {
  const md5    = 'd41d8cd98f00b204e9800998ecf8427e';
  const sha1   = 'da39a3ee5e6b4b0d3255bfef95601890afd80709';
  const sha256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  test('MD5 detected', () => {
    expect(isValidHash(md5)).toBe(true);
    expect(hashType(md5)).toBe('md5');
  });
  test('SHA-1 detected', () => {
    expect(isValidHash(sha1)).toBe(true);
    expect(hashType(sha1)).toBe('sha1');
  });
  test('SHA-256 detected', () => {
    expect(isValidHash(sha256)).toBe(true);
    expect(hashType(sha256)).toBe('sha256');
  });
  test('invalid hash', () => {
    expect(isValidHash('not-a-hash')).toBe(false);
    expect(isValidHash('')).toBe(false);
    expect(hashType('short')).toBe(null);
  });
});

// ── Email ────────────────────────────────────────────────
describe('isValidEmail', () => {
  test('valid emails', () => {
    expect(isValidEmail('analyst@soc.lab')).toBe(true);
    expect(isValidEmail('admin-kim@corp.example.com')).toBe(true);
  });
  test('invalid emails', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('@no-local.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

// ── MITRE ────────────────────────────────────────────────
describe('isValidMITRE', () => {
  test('valid techniques', () => {
    expect(isValidMITRE('T1059')).toBe(true);
    expect(isValidMITRE('T1059.001')).toBe(true);
    expect(isValidMITRE('T1003.001')).toBe(true);
  });
  test('invalid techniques', () => {
    expect(isValidMITRE('T123')).toBe(false);
    expect(isValidMITRE('not-a-technique')).toBe(false);
    expect(isValidMITRE('')).toBe(false);
  });
});

// ── IOC detection ─────────────────────────────────────────
describe('detectIOCType', () => {
  test('detects IP',     () => expect(detectIOCType('203.0.113.45')).toBe('ip'));
  test('detects domain', () => expect(detectIOCType('evil-c2.xyz')).toBe('domain'));
  test('detects URL',    () => expect(detectIOCType('http://evil.com/path')).toBe('url'));
  test('detects hash',   () => expect(detectIOCType('d41d8cd98f00b204e9800998ecf8427e')).toBe('hash'));
  test('returns null for unknown', () => expect(detectIOCType('random string')).toBe(null));
});

// ── Private IP ───────────────────────────────────────────
describe('isPrivateIP', () => {
  test('private ranges', () => {
    expect(isPrivateIP('192.168.56.10')).toBe(true);
    expect(isPrivateIP('10.0.1.10')).toBe(true);
    expect(isPrivateIP('172.16.0.1')).toBe(true);
    expect(isPrivateIP('127.0.0.1')).toBe(true);
  });
  test('public IPs', () => {
    expect(isPrivateIP('203.0.113.45')).toBe(false);
    expect(isPrivateIP('8.8.8.8')).toBe(false);
  });
});

// ── Time range ────────────────────────────────────────────
describe('timeRangeToMs', () => {
  test('converts correctly', () => {
    expect(timeRangeToMs('1s')).toBe(1000);
    expect(timeRangeToMs('5m')).toBe(300_000);
    expect(timeRangeToMs('1h')).toBe(3_600_000);
    expect(timeRangeToMs('1d')).toBe(86_400_000);
    expect(timeRangeToMs('1w')).toBe(604_800_000);
  });
  test('invalid ranges', () => {
    expect(timeRangeToMs('invalid')).toBe(null);
    expect(timeRangeToMs('')).toBe(null);
  });
});

// ── Wazuh rule level ──────────────────────────────────────
describe('isValidRuleLevel', () => {
  test('valid levels', () => {
    expect(isValidRuleLevel(1)).toBe(true);
    expect(isValidRuleLevel(15)).toBe(true);
    expect(isValidRuleLevel(10)).toBe(true);
  });
  test('invalid levels', () => {
    expect(isValidRuleLevel(0)).toBe(false);
    expect(isValidRuleLevel(16)).toBe(false);
    expect(isValidRuleLevel(1.5)).toBe(false);
    expect(isValidRuleLevel('abc')).toBe(false);
  });
});

// ── validateForm ─────────────────────────────────────────
describe('validateForm', () => {
  const rules = {
    ip:    [isValidIP,    'Invalid IP address'],
    email: [isValidEmail, 'Invalid email address'],
  };

  test('passes valid form', () => {
    const { isValid, errors } = validateForm(
      { ip: '203.0.113.45', email: 'a@b.com' }, rules
    );
    expect(isValid).toBe(true);
    expect(Object.keys(errors)).toHaveLength(0);
  });

  test('fails invalid form', () => {
    const { isValid, errors } = validateForm(
      { ip: 'not-an-ip', email: 'bad' }, rules
    );
    expect(isValid).toBe(false);
    expect(errors.ip).toBe('Invalid IP address');
    expect(errors.email).toBe('Invalid email address');
  });
});

// ── sanitiseForDisplay ────────────────────────────────────
describe('sanitiseForDisplay', () => {
  test('escapes HTML', () => {
    expect(sanitiseForDisplay('<script>alert(1)</script>'))
      .toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });
  test('truncates', () => {
    expect(sanitiseForDisplay('a'.repeat(300), 50)).toHaveLength(50);
  });
  test('handles null', () => {
    expect(sanitiseForDisplay(null)).toBe('');
  });
});