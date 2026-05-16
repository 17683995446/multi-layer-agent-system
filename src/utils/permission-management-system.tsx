import { useState, useCallback, useMemo, useEffect } from "react"

// ========== TOP 19: 高级权限管理系统 (10个优化点) ==========

// 权限类型定义
type Permission =
  | "read"
  | "write"
  | "delete"
  | "admin"
  | "execute"
  | "manage_users"
  | "manage_settings"
  | "export_data"
  | "import_data"

type Resource =
  | "tasks"
  | "users"
  | "settings"
  | "reports"
  | "exports"
  | "system"

interface Role {
  id: string
  name: string
  description: string
  permissions: Map<Resource, Permission[]>
  isSystem?: boolean
}

interface UserPermissions {
  userId: string
  roles: string[]
  customPermissions?: Map<Resource, Permission[]>
  deniedPermissions?: Map<Resource, Permission[]>
}

interface PermissionCheck {
  allowed: boolean
  reason?: string
  requiredPermissions?: Permission[]
}

// 优化点 1: 角色定义
export const predefinedRoles: Role[] = [
  {
    id: "admin",
    name: "管理员",
    description: "完全访问权限",
    permissions: new Map([
      ["tasks", ["read", "write", "delete"]],
      ["users", ["read", "write", "delete", "manage_users"]],
      ["settings", ["read", "write", "manage_settings"]],
      ["reports", ["read", "write"]],
      ["exports", ["read", "write", "export_data"]],
      ["system", ["read", "write", "admin"]],
    ]),
    isSystem: true,
  },
  {
    id: "editor",
    name: "编辑",
    description: "可以编辑内容",
    permissions: new Map([
      ["tasks", ["read", "write"]],
      ["users", ["read"]],
      ["settings", ["read"]],
      ["reports", ["read", "write"]],
      ["exports", ["read", "export_data"]],
      ["system", []],
    ]),
    isSystem: true,
  },
  {
    id: "viewer",
    name: "查看者",
    description: "只读访问",
    permissions: new Map([
      ["tasks", ["read"]],
      ["users", ["read"]],
      ["settings", ["read"]],
      ["reports", ["read"]],
      ["exports", ["read"]],
      ["system", []],
    ]),
    isSystem: true,
  },
  {
    id: "guest",
    name: "访客",
    description: "受限访问",
    permissions: new Map([
      ["tasks", []],
      ["users", []],
      ["settings", []],
      ["reports", []],
      ["exports", []],
      ["system", []],
    ]),
    isSystem: true,
  },
]

// 优化点 2: 权限检查核心
export class PermissionManager {
  private roles: Map<string, Role> = new Map()
  private userPermissions: Map<string, UserPermissions> = new Map()

  constructor() {
    predefinedRoles.forEach((role) => this.registerRole(role))
  }

  registerRole(role: Role) {
    this.roles.set(role.id, role)
  }

  getRole(roleId: string): Role | undefined {
    return this.roles.get(roleId)
  }

  getAllRoles(): Role[] {
    return Array.from(this.roles.values())
  }

  setUserPermissions(userId: string, permissions: UserPermissions) {
    this.userPermissions.set(userId, permissions)
  }

  getUserPermissions(userId: string): UserPermissions | undefined {
    return this.userPermissions.get(userId)
  }

  checkPermission(
    userId: string,
    resource: Resource,
    permission: Permission
  ): PermissionCheck {
    const userPerms = this.userPermissions.get(userId)
    if (!userPerms) {
      return { allowed: false, reason: "用户未找到" }
    }

    // 检查拒绝权限
    const deniedPerms = userPerms.deniedPermissions?.get(resource)
    if (deniedPerms?.includes(permission)) {
      return { allowed: false, reason: "权限被明确拒绝" }
    }

    // 检查自定义权限
    const customPerms = userPerms.customPermissions?.get(resource)
    if (customPerms && customPerms.includes(permission)) {
      return { allowed: true, reason: "自定义权限允许" }
    }

    // 检查角色权限
    for (const roleId of userPerms.roles) {
      const role = this.roles.get(roleId)
      if (role) {
        const rolePerms = role.permissions.get(resource)
        if (rolePerms?.includes(permission)) {
          return { allowed: true, reason: `角色 ${role.name} 允许` }
        }
        if (rolePerms?.includes("admin")) {
          return { allowed: true, reason: "管理员权限" }
        }
      }
    }

    return {
      allowed: false,
      reason: "未找到匹配的角色权限",
      requiredPermissions: [permission],
    }
  }

  checkMultiplePermissions(
    userId: string,
    checks: Array<{ resource: Resource; permission: Permission }>
  ): Map<string, PermissionCheck> {
    const results = new Map<string, PermissionCheck>()

    checks.forEach(({ resource, permission }) => {
      const key = `${resource}:${permission}`
      results.set(key, this.checkPermission(userId, resource, permission))
    })

    return results
  }

  hasAnyPermission(
    userId: string,
    checks: Array<{ resource: Resource; permission: Permission }>
  ): boolean {
    return checks.some(({ resource, permission }) =>
      this.checkPermission(userId, resource, permission).allowed
    )
  }

  hasAllPermissions(
    userId: string,
    checks: Array<{ resource: Resource; permission: Permission }>
  ): boolean {
    return checks.every(({ resource, permission }) =>
      this.checkPermission(userId, resource, permission).allowed
    )
  }
}

// 优化点 3: React Hook for 权限
export function usePermissionManager() {
  const [manager] = useState(() => new PermissionManager())
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const checkPermission = useCallback(
    (resource: Resource, permission: Permission) => {
      if (!currentUserId) {
        return { allowed: false, reason: "未登录" }
      }
      return manager.checkPermission(currentUserId, resource, permission)
    },
    [manager, currentUserId]
  )

  const canRead = useCallback(
    (resource: Resource) => checkPermission(resource, "read").allowed,
    [checkPermission]
  )

  const canWrite = useCallback(
    (resource: Resource) => checkPermission(resource, "write").allowed,
    [checkPermission]
  )

  const canDelete = useCallback(
    (resource: Resource) => checkPermission(resource, "delete").allowed,
    [checkPermission]
  )

  const canAdmin = useCallback(
    () => checkPermission("system", "admin").allowed,
    [checkPermission]
  )

  return {
    manager,
    currentUserId,
    setCurrentUserId,
    checkPermission,
    canRead,
    canWrite,
    canDelete,
    canAdmin,
  }
}

// 优化点 4: 权限条件渲染
export function withPermission(
  WrappedComponent: React.ComponentType<any>,
  options: {
    resource: Resource
    permission: Permission
    fallback?: React.ReactNode
  }
) {
  return function PermissionGuard(props: any) {
    const { checkPermission } = usePermissionManager()
    const { allowed } = checkPermission(options.resource, options.permission)

    if (!allowed) {
      return options.fallback || null
    }

    return <WrappedComponent {...props} />
  }
}

// 优化点 5: 权限指令
export function RequirePermission({
  resource,
  permission,
  children,
  fallback = null,
}: {
  resource: Resource
  permission: Permission
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { checkPermission } = usePermissionManager()
  const { allowed } = checkPermission(resource, permission)

  if (!allowed) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// 优化点 6: 权限组
export function RequireAnyPermission({
  checks,
  children,
  fallback = null,
}: {
  checks: Array<{ resource: Resource; permission: Permission }>
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { manager, currentUserId } = usePermissionManager()

  const hasPermission = useMemo(() => {
    if (!currentUserId) return false
    return manager.hasAnyPermission(currentUserId, checks)
  }, [manager, currentUserId, checks])

  if (!hasPermission) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// 优化点 7: 权限变更监听
export function usePermissionListener(
  userId: string,
  onChange: (permissions: PermissionCheck[]) => void
) {
  const { manager } = usePermissionManager()

  useEffect(() => {
    if (!userId) return

    const checkAllPermissions = () => {
      const resources: Resource[] = [
        "tasks",
        "users",
        "settings",
        "reports",
        "exports",
        "system",
      ]
      const permissions: Permission[] = [
        "read",
        "write",
        "delete",
        "admin",
      ]

      const checks: PermissionCheck[] = []
      resources.forEach((resource) => {
        permissions.forEach((permission) => {
          checks.push(manager.checkPermission(userId, resource, permission))
        })
      })

      onChange(checks)
    }

    checkAllPermissions()

    const interval = setInterval(checkAllPermissions, 5000)

    return () => clearInterval(interval)
  }, [userId, manager, onChange])
}

// 优化点 8: 权限缓存
export function usePermissionCache(
  userId: string,
  ttl: number = 60000
) {
  const [cache, setCache] = useState<
    Map<string, { check: PermissionCheck; timestamp: number }>
  >(new Map())

  const getCachedPermission = useCallback(
    (resource: Resource, permission: Permission) => {
      const key = `${resource}:${permission}`
      const cached = cache.get(key)

      if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.check
      }

      return null
    },
    [cache, ttl]
  )

  const setCachedPermission = useCallback(
    (resource: Resource, permission: Permission, check: PermissionCheck) => {
      const key = `${resource}:${permission}`
      setCache((prev) => {
        const newCache = new Map(prev)
        newCache.set(key, { check, timestamp: Date.now() })
        return newCache
      })
    },
    []
  )

  const clearCache = useCallback(() => {
    setCache(new Map())
  }, [])

  return {
    getCachedPermission,
    setCachedPermission,
    clearCache,
    cacheSize: cache.size,
  }
}

// 优化点 9: 审计日志
export interface AuditLogEntry {
  id: string
  userId: string
  action: string
  resource: Resource
  permission: Permission
  allowed: boolean
  timestamp: Date
  details?: Record<string, any>
}

export function usePermissionAudit() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])

  const logPermissionCheck = useCallback(
    (
      userId: string,
      action: string,
      resource: Resource,
      permission: Permission,
      allowed: boolean,
      details?: Record<string, any>
    ) => {
      const entry: AuditLogEntry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        action,
        resource,
        permission,
        allowed,
        timestamp: new Date(),
        details,
      }

      setLogs((prev) => [...prev, entry])
    },
    []
  )

  const getLogsByUser = useCallback(
    (targetUserId: string) => {
      return logs.filter((log) => log.userId === targetUserId)
    },
    [logs]
  )

  const getLogsByResource = useCallback(
    (resource: Resource) => {
      return logs.filter((log) => log.resource === resource)
    },
    [logs]
  )

  const exportLogs = useCallback((format: "json" | "csv" = "json") => {
    if (format === "json") {
      return JSON.stringify(logs, null, 2)
    }

    const headers = [
      "ID",
      "User ID",
      "Action",
      "Resource",
      "Permission",
      "Allowed",
      "Timestamp",
    ]
    const rows = logs.map((log) => [
      log.id,
      log.userId,
      log.action,
      log.resource,
      log.permission,
      log.allowed.toString(),
      log.timestamp.toISOString(),
    ])

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
  }, [logs])

  return {
    logs,
    logPermissionCheck,
    getLogsByUser,
    getLogsByResource,
    exportLogs,
    clearLogs: () => setLogs([]),
  }
}

// 优化点 10: 临时权限提升
export class TemporaryPermissionElevator {
  private temporaryPermissions: Map<
    string,
    { permissions: Permission[]; expiresAt: Date }[]
  > = new Map()

  grantTemporaryPermission(
    userId: string,
    resource: Resource,
    permissions: Permission[],
    durationMs: number
  ) {
    const key = userId
    const expiresAt = new Date(Date.now() + durationMs)

    if (!this.temporaryPermissions.has(key)) {
      this.temporaryPermissions.set(key, [])
    }

    this.temporaryPermissions.get(key)!.push({ permissions, expiresAt })
  }

  revokeTemporaryPermissions(userId: string) {
    this.temporaryPermissions.delete(userId)
  }

  getTemporaryPermissions(userId: string): Map<Resource, Permission[]> {
    const result = new Map<Resource, Permission[]>()
    const permissions = this.temporaryPermissions.get(userId)

    if (!permissions) return result

    const now = Date.now()
    const validPermissions = permissions.filter((p) => p.expiresAt.getTime() > now)

    validPermissions.forEach(({ permissions: perms }) => {
      perms.forEach((p) => {
        const existing = result.get(p as any) || []
        result.set(p as any, [...existing, p])
      })
    })

    return result
  }
}

// 创建全局权限管理器实例
export const permissionManager = new PermissionManager()
