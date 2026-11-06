import Vue from 'vue'
import { SpireApi } from '@/app/api/spire-api'
import { AppEnv } from '@/app/env/app-env'
import UserContext from '@/app/user/UserContext'
import { ROUTE } from '@/routes'

// These field names follow the API response.
/* eslint-disable camelcase */
interface PermissionSnapshot {
  connection_id: number;
  read_all: boolean;
  write_all: boolean;
  read: string[] | null;
  write: string[] | null;
}
/* eslint-enable camelcase */

export const serverAdminAccess = Vue.observable<{ grants: PermissionSnapshot | null }>({ grants: null })
let refreshVersion = 0

function isPermissionSnapshot (value: unknown): value is PermissionSnapshot {
  if (!value || typeof value !== 'object') return false
  const fields = value as Record<string, unknown>
  return typeof fields.connection_id === 'number' &&
    typeof fields.read_all === 'boolean' && typeof fields.write_all === 'boolean' &&
    [fields.read, fields.write].every(prefixes => prefixes === null ||
      (Array.isArray(prefixes) && prefixes.every(prefix => typeof prefix === 'string')))
}

// Refresh on navigation so connection changes and revoked grants do not leave
// stale entries in the sidebar, search, or a previously mounted admin layout.
export async function refreshServerAdminAccess (): Promise<void> {
  const version = ++refreshVersion
  const publish = (grants: PermissionSnapshot | null) => {
    // A slower response from a previous navigation must not replace newer grants.
    if (version === refreshVersion) serverAdminAccess.grants = grants
  }
  try {
    if (typeof AppEnv.getEnv() === 'undefined') await AppEnv.init()
    if (!AppEnv.isLocalAuthEnabled() && !AppEnv.isGithubAuthEnabled()) {
      publish({ connection_id: 0, read_all: true, write_all: true, read: [], write: [] })
      return
    }
    const user = UserContext.getAccessToken() ? await UserContext.getUser() : null
    if (!user || !user.id || (!AppEnv.isAppLocal() && !user.is_admin)) {
      publish(null)
      return
    }
    const { data } = await SpireApi.v1().get<unknown>('permissions/me')
    publish(isPermissionSnapshot(data) ? data : null)
  } catch {
    publish(null)
  }
}

function canAccessApi (path: string, write: boolean): boolean {
  const grants = serverAdminAccess.grants
  if (!grants) return false
  if (write ? grants.write_all : grants.read_all) return true
  const prefixes = (write ? grants.write : grants.read) || []
  // Match the backend's CRUD resource segment and manual route prefixes.
  return prefixes.some(prefix => prefix === path.split('/')[0] || (prefix.includes('/') && path.includes(prefix)))
}

export function canReadAdminApi (path: string): boolean {
  return canAccessApi(path, false)
}

export function canWriteAdminApi (path: string): boolean {
  return canAccessApi(path, true)
}

export function canManageServerProcesses (): boolean {
  return canReadAdminApi('eqemuserver/server-stats') &&
    canReadAdminApi('admin/launcherconfig') &&
    canReadAdminApi('eqemuserver/pre-flight') &&
    canWriteAdminApi('eqemuserver/server/start')
}

export const dashboardApis = [
  'eqemuserver/server-stats', 'eqemuserver/dashboard-stats',
  'eqemuserver/system-all', 'eqemuserver/get-lock-status',
  'admin/serverconfig', 'eqemuserver/client-list'
]

interface AdminTool {
  path: string;
  read: string[];
  write?: string[];
}

// API dependencies, not instance-admin status, determine which tools can load.
// Pages with multiple required datasets need each corresponding read grant.
export const serverAdminTools: AdminTool[] = [
  { path: ROUTE.ADMIN_RESTART_SCHEDULES, read: ['eqemuserver/server/restart-schedules'] },
  { path: ROUTE.ADMIN_PLAYERS_ONLINE, read: ['eqemuserver/client-list'] },
  { path: ROUTE.ADMIN_PLAYER_OPERATIONS, read: ['player-operations'] },
  { path: ROUTE.ADMIN_MAIL_PARCELS, read: ['mail-parcels-editor'] },
  { path: ROUTE.ADMIN_INVENTORY_KEYRING, read: ['inventory-keyring'] },
  { path: ROUTE.ADMIN_CHAT_ADMINISTRATION, read: ['chat-administration'] },
  { path: ROUTE.ADMIN_ZONE_SERVERS, read: ['eqemuserver/zoneserver-list'] },
  { path: ROUTE.ADMIN_BACKUPS, read: ['eqemuserver/manual-backup'] },
  { path: ROUTE.ADMIN_CLIENT_FILE_DOWNLOADS, read: ['client-file'] },
  { path: ROUTE.ADMIN_SERVER_CONFIG, read: ['admin/serverconfig'] },
  { path: ROUTE.ADMIN_CONFIG_DISCORD_CRASH_WEBHOOK, read: ['admin/serverconfig'] },
  { path: ROUTE.ADMIN_CONFIG_MOTD, read: ['variables'] },
  { path: ROUTE.ADMIN_CONFIG_QUEST_HOT_RELOAD, read: ['admin/serverconfig', 'rule_values'] },
  { path: ROUTE.ADMIN_CONFIG_SERVER_RULES, read: ['rule_values'] },
  { path: ROUTE.ADMIN_DATABASE_BACKUP, read: ['backup/mysql'], write: ['backup/mysql'] },
  { path: ROUTE.ADMIN_DISCORD_WEBHOOK_SETTINGS, read: ['discord_webhooks'] },
  { path: ROUTE.ADMIN_FILE_LOGS, read: ['eqemuserver/logs'] },
  { path: ROUTE.ADMIN_LOG_SETTINGS, read: ['logsys_categories'] },
  { path: ROUTE.ADMIN_CONFIG_PLAYER_EVENT_LOGS, read: ['player_event_log_settings'] },
  { path: ROUTE.ADMIN_TOOL_PLAYER_EVENT_LOGS, read: ['player_event_logs'] },
  { path: ROUTE.ADMIN_RELOAD, read: ['eqemuserver/reload-types'], write: ['eqemuserver/reload'] },
  { path: ROUTE.ADMIN_SERVER_UPDATE, read: ['eqemuserver/update-type'] }
]

export function canAccessAdminRoute (url: string): boolean {
  const path = url.split(/[?#]/)[0].replace(/\/$/, '').toLowerCase()
  if (path === ROUTE.ADMIN_ROOT) return dashboardApis.some(canReadAdminApi)
  if (/^\/admin\/zoneservers\/[^/]+\/logs$/.test(path)) {
    return canReadAdminApi('eqemuserver/get-websocket-auth')
  }
  const tool = serverAdminTools.find(tool => tool.path === path)
  return Boolean(tool && tool.read.every(canReadAdminApi) && (tool.write || []).every(canWriteAdminApi))
}

export function serverAdminLandingRoute (): string | null {
  if (canAccessAdminRoute(ROUTE.ADMIN_ROOT)) return ROUTE.ADMIN_ROOT
  const tool = serverAdminTools.find(tool => canAccessAdminRoute(tool.path))
  return tool ? tool.path : null
}

export function canAccessServerAdmin (): boolean {
  return serverAdminLandingRoute() !== null
}
