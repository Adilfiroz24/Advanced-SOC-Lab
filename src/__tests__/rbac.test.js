// ============================================================
// Advanced SOC Lab — rbac.test.js
// Unit tests for src/auth/rbac.js
// ============================================================

import {
  hasPermission, hasAnyPermission, hasAllPermissions,
  canAccessRoute, PERMISSIONS, ROLE_PERMISSIONS,
} from '../auth/rbac';

describe('hasPermission', () => {
  test('admin has all permissions', () => {
    Object.values(PERMISSIONS).forEach(perm => {
      expect(hasPermission('admin', perm)).toBe(true);
    });
  });

  test('analyst can view and create cases', () => {
    expect(hasPermission('analyst', PERMISSIONS.VIEW_CASES)).toBe(true);
    expect(hasPermission('analyst', PERMISSIONS.CREATE_CASE)).toBe(true);
    expect(hasPermission('analyst', PERMISSIONS.BLOCK_IP)).toBe(true);
  });

  test('analyst cannot manage users', () => {
    expect(hasPermission('analyst', PERMISSIONS.MANAGE_USERS)).toBe(false);
  });

  test('viewer has read-only access', () => {
    expect(hasPermission('viewer', PERMISSIONS.VIEW_DASHBOARD)).toBe(true);
    expect(hasPermission('viewer', PERMISSIONS.VIEW_ALERTS)).toBe(true);
    expect(hasPermission('viewer', PERMISSIONS.BLOCK_IP)).toBe(false);
    expect(hasPermission('viewer', PERMISSIONS.CREATE_CASE)).toBe(false);
  });

  test('unknown role treated as viewer', () => {
    expect(hasPermission('unknown', PERMISSIONS.BLOCK_IP)).toBe(false);
    expect(hasPermission('unknown', PERMISSIONS.VIEW_DASHBOARD)).toBe(true);
  });
});

describe('hasAnyPermission', () => {
  test('analyst has any of [block, view]', () => {
    expect(hasAnyPermission('analyst', [
      PERMISSIONS.BLOCK_IP,
      PERMISSIONS.MANAGE_USERS,
    ])).toBe(true);
  });

  test('viewer has none of [block, manage]', () => {
    expect(hasAnyPermission('viewer', [
      PERMISSIONS.BLOCK_IP,
      PERMISSIONS.MANAGE_USERS,
    ])).toBe(false);
  });
});

describe('hasAllPermissions', () => {
  test('admin has all checked permissions', () => {
    expect(hasAllPermissions('admin', [
      PERMISSIONS.BLOCK_IP,
      PERMISSIONS.MANAGE_USERS,
      PERMISSIONS.APPROVE_ACTION,
    ])).toBe(true);
  });

  test('analyst does not have all admin perms', () => {
    expect(hasAllPermissions('analyst', [
      PERMISSIONS.BLOCK_IP,
      PERMISSIONS.MANAGE_USERS,
    ])).toBe(false);
  });
});

describe('canAccessRoute', () => {
  test('admin can access settings', () => {
    expect(canAccessRoute('admin', '/settings')).toBe(true);
  });

  test('viewer cannot access settings', () => {
    expect(canAccessRoute('viewer', '/settings')).toBe(false);
  });

  test('unprotected routes are accessible to all', () => {
    expect(canAccessRoute('viewer', '/dashboard')).toBe(true);
    expect(canAccessRoute('viewer', '/alerts')).toBe(true);
  });
});

describe('ROLE_PERMISSIONS coverage', () => {
  test('admin has most permissions', () => {
    expect(ROLE_PERMISSIONS.admin.length).toBeGreaterThan(10);
  });

  test('analyst has fewer permissions than admin', () => {
    expect(ROLE_PERMISSIONS.analyst.length)
      .toBeLessThan(ROLE_PERMISSIONS.admin.length);
  });

  test('viewer has fewest permissions', () => {
    expect(ROLE_PERMISSIONS.viewer.length)
      .toBeLessThan(ROLE_PERMISSIONS.analyst.length);
  });
});