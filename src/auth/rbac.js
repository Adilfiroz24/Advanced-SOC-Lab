// ============================================================
// Advanced SOC Lab — rbac.js
// Role-Based Access Control definitions and permission checks.
// ============================================================

// ── Permission definitions ────────────────────────────────
export const PERMISSIONS = {
  // Dashboard & monitoring
  VIEW_DASHBOARD:      'view:dashboard',
  VIEW_ALERTS:         'view:alerts',
  VIEW_CASES:          'view:cases',
  VIEW_THREAT_INTEL:   'view:threat_intel',
  VIEW_AUDIT_LOG:      'view:audit_log',
  VIEW_REPORTS:        'view:reports',
  VIEW_SETTINGS:       'view:settings',

  // Case management
  CREATE_CASE:         'create:case',
  UPDATE_CASE:         'update:case',
  CLOSE_CASE:          'close:case',
  DELETE_CASE:         'delete:case',
  ASSIGN_CASE:         'assign:case',

  // Response actions
  BLOCK_IP:            'action:block_ip',
  UNBLOCK_IP:          'action:unblock_ip',
  ISOLATE_HOST:        'action:isolate_host',
  RUN_PLAYBOOK:        'action:run_playbook',
  APPROVE_ACTION:      'action:approve',

  // Configuration
  MANAGE_RULES:        'config:rules',
  MANAGE_USERS:        'config:users',
  MANAGE_INTEGRATIONS: 'config:integrations',
  MANAGE_PLAYBOOKS:    'config:playbooks',
  EXPORT_DATA:         'config:export',

  // Threat hunting
  RUN_HUNT:            'hunt:execute',
  SAVE_HUNT:           'hunt:save',

  // Reports
  GENERATE_REPORT:     'report:generate',
  EXPORT_REPORT:       'report:export',
};

// ── Role → permission mapping ─────────────────────────────
const ROLE_PERMISSIONS = {
  admin: Object.values(PERMISSIONS),   // all permissions

  analyst: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ALERTS,
    PERMISSIONS.VIEW_CASES,
    PERMISSIONS.VIEW_THREAT_INTEL,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.CREATE_CASE,
    PERMISSIONS.UPDATE_CASE,
    PERMISSIONS.CLOSE_CASE,
    PERMISSIONS.ASSIGN_CASE,
    PERMISSIONS.BLOCK_IP,
    PERMISSIONS.RUN_PLAYBOOK,
    PERMISSIONS.EXPORT_DATA,
    PERMISSIONS.RUN_HUNT,
    PERMISSIONS.SAVE_HUNT,
    PERMISSIONS.GENERATE_REPORT,
    PERMISSIONS.EXPORT_REPORT,
  ],

  viewer: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ALERTS,
    PERMISSIONS.VIEW_CASES,
    PERMISSIONS.VIEW_THREAT_INTEL,
    PERMISSIONS.VIEW_REPORTS,
  ],
};

// ── Permission check functions ────────────────────────────
export function hasPermission(role, permission) {
  const perms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.viewer;
  return perms.includes(permission);
}

export function hasAnyPermission(role, permissions = []) {
  return permissions.some(p => hasPermission(role, p));
}

export function hasAllPermissions(role, permissions = []) {
  return permissions.every(p => hasPermission(role, p));
}

// ── React hook ────────────────────────────────────────────
import { useMemo } from 'react';
import { currentRole } from './auth';

export function usePermissions() {
  const role = currentRole();
  return useMemo(() => ({
    role,
    can:    (perm)  => hasPermission(role, perm),
    canAny: (perms) => hasAnyPermission(role, perms),
    canAll: (perms) => hasAllPermissions(role, perms),
  }), [role]);
}

// ── HOC: guard a component behind a permission ────────────
import React from 'react';

export function withPermission(Component, requiredPermission, Fallback = null) {
  return function PermissionGated(props) {
    const role = currentRole();
    if (!hasPermission(role, requiredPermission)) {
      return Fallback
        ? <Fallback permission={requiredPermission} role={role} />
        : (
          <div style={{
            textAlign: 'center', padding: '40px 24px',
            color: '#3d5080',
          }}>
            <div style={{ fontSize: 14, color: '#4a6090', marginBottom: 6 }}>
              Access Restricted
            </div>
            <div style={{ fontSize: 12 }}>
              Your role (<code style={{
                fontFamily: 'JetBrains Mono, monospace', color: '#00e5ff',
              }}>{role}</code>) does not have permission:{' '}
              <code style={{
                fontFamily: 'JetBrains Mono, monospace', color: '#ff8c00',
              }}>{requiredPermission}</code>
            </div>
          </div>
        );
    }
    return <Component {...props} />;
  };
}

// ── Route guard ───────────────────────────────────────────
export function canAccessRoute(role, route) {
  const routePermissions = {
    '/settings':        PERMISSIONS.VIEW_SETTINGS,
    '/audit':           PERMISSIONS.VIEW_AUDIT_LOG,
    '/reports':         PERMISSIONS.VIEW_REPORTS,
    '/attack-simulator':PERMISSIONS.RUN_PLAYBOOK,
  };
  const required = routePermissions[route];
  if (!required) return true; // public route
  return hasPermission(role, required);
}

export { ROLE_PERMISSIONS };