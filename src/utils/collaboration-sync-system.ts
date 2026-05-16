import { useState, useCallback, useEffect, useRef } from "react"

// ========== TOP 18: 实时协作与同步系统 (10个优化点) ==========

// 类型定义
interface CollaborationUser {
  id: string
  name: string
  color: string
  avatar?: string
  isOnline: boolean
  lastSeen?: Date
}

interface SyncState {
  isConnected: boolean
  lastSyncTime?: Date
  pendingChanges: number
  syncErrors: string[]
}

interface CollaborationEvent {
  type: "user_join" | "user_leave" | "data_update" | "conflict_resolved"
  userId?: string
  timestamp: Date
  payload?: any
}

// 优化点 1: WebSocket 连接管理
export class CollaborationWebSocket {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private listeners: Map<string, Function[]> = new Map()

  constructor(private url: string) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url)

        this.ws.onopen = () => {
          this.reconnectAttempts = 0
          this.emit("connected", {})
          resolve()
        }

        this.ws.onclose = () => {
          this.emit("disconnected", {})
          this.attemptReconnect()
        }

        this.ws.onerror = (error) => {
          this.emit("error", error)
          reject(error)
        }

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            this.emit(data.type, data.payload)
          } catch (err) {
            console.error("Failed to parse message:", err)
          }
        }
      } catch (err) {
        reject(err)
      }
    })
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      setTimeout(() => {
        this.connect()
      }, this.reconnectDelay * this.reconnectAttempts)
    }
  }

  send(type: string, payload: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }))
    }
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  private emit(event: string, payload: any) {
    const callbacks = this.listeners.get(event) || []
    callbacks.forEach((cb) => cb(payload))
  }

  disconnect() {
    this.ws?.close()
    this.ws = null
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// 优化点 2: 乐观更新
export function useOptimisticUpdate<T>(
  initialValue: T,
  syncFn: (value: T) => Promise<T>
) {
  const [value, setValue] = useState<T>(initialValue)
  const [pendingValue, setPendingValue] = useState<T | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const update = useCallback(
    async (newValue: T | ((prev: T) => T)) => {
      const resolvedValue =
        typeof newValue === "function"
          ? (newValue as Function)(value)
          : newValue

      setPendingValue(resolvedValue)
      setValue(resolvedValue)
      setError(null)

      try {
        setIsSyncing(true)
        const syncedValue = await syncFn(resolvedValue)
        setPendingValue(null)
        if (syncedValue !== resolvedValue) {
          setValue(syncedValue)
        }
      } catch (err) {
        setError(err as Error)
        setPendingValue(null)
        setValue(initialValue)
      } finally {
        setIsSyncing(false)
      }
    },
    [value, initialValue, syncFn]
  )

  return {
    value,
    pendingValue,
    isSyncing,
    error,
    update,
    hasPendingChanges: pendingValue !== null,
  }
}

// 优化点 3: 冲突解决策略
export type ConflictResolutionStrategy = "client_wins" | "server_wins" | "merge" | "manual"

export class ConflictResolver<T> {
  constructor(private strategy: ConflictResolutionStrategy = "server_wins") {}

  resolve(local: T, server: T, timestamp: Date): T {
    switch (this.strategy) {
      case "client_wins":
        return local
      case "server_wins":
        return server
      case "merge":
        return this.merge(local, server)
      case "manual":
        return this.flagConflict(local, server)
      default:
        return server
    }
  }

  private merge(local: T, server: T): T {
    if (typeof local !== "object" || typeof server !== "object") {
      return server
    }

    const merged = { ...server }

    for (const key in local) {
      if (local[key] !== undefined) {
        if (
          typeof local[key] === "object" &&
          typeof server[key] === "object"
        ) {
          merged[key] = this.merge(local[key], server[key])
        } else if (server[key] === undefined) {
          merged[key] = local[key]
        }
      }
    }

    return merged as T
  }

  private flagConflict(local: T, server: T): T {
    return {
      ...local,
      _conflict: {
        local,
        server,
        resolvedAt: new Date(),
      },
    } as any
  }
}

// 优化点 4: 在线状态管理
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [lastOnline, setLastOnline] = useState<Date | null>(null)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setLastOnline(new Date())
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return { isOnline, lastOnline }
}

// 优化点 5: 实时用户光标
export function useUserCursors(
  collaborationId: string,
  currentUserId: string
) {
  const [cursors, setCursors] = useState<
    Map<string, { x: number; y: number; user: CollaborationUser }>
  >(new Map())

  const updateCursor = useCallback(
    (userId: string, x: number, y: number) => {
      setCursors((prev) => {
        const newCursors = new Map(prev)
        const existing = newCursors.get(userId)
        if (existing) {
          newCursors.set(userId, { ...existing, x, y })
        }
        return newCursors
      })
    },
    []
  )

  const removeCursor = useCallback((userId: string) => {
    setCursors((prev) => {
      const newCursors = new Map(prev)
      newCursors.delete(userId)
      return newCursors
    })
  }, [])

  return {
    cursors: Array.from(cursors.entries()).filter(
      ([userId]) => userId !== currentUserId
    ),
    updateCursor,
    removeCursor,
  }
}

// 优化点 6: 协作锁
export class CollaborationLock {
  private locks: Map<string, { userId: string; expiresAt: Date }> = new Map()
  private lockTimeout = 30000

  acquire(resourceId: string, userId: string): boolean {
    const existing = this.locks.get(resourceId)

    if (existing) {
      if (existing.userId === userId) {
        existing.expiresAt = new Date(Date.now() + this.lockTimeout)
        return true
      }
      if (existing.expiresAt > new Date()) {
        return false
      }
    }

    this.locks.set(resourceId, {
      userId,
      expiresAt: new Date(Date.now() + this.lockTimeout),
    })

    return true
  }

  release(resourceId: string, userId: string): boolean {
    const existing = this.locks.get(resourceId)
    if (existing && existing.userId === userId) {
      this.locks.delete(resourceId)
      return true
    }
    return false
  }

  isLocked(resourceId: string): boolean {
    const existing = this.locks.get(resourceId)
    return existing ? existing.expiresAt > new Date() : false
  }

  getLockOwner(resourceId: string): string | null {
    const existing = this.locks.get(resourceId)
    return existing?.userId || null
  }
}

// 优化点 7: 变更历史追踪
export function useChangeHistory<T>(maxHistory: number = 100) {
  const [history, setHistory] = useState<
    Array<{ value: T; timestamp: Date; userId: string }>
  >([])

  const push = useCallback(
    (value: T, userId: string = "system") => {
      setHistory((prev) => {
        const newHistory = [
          ...prev,
          { value, timestamp: new Date(), userId },
        ]
        if (newHistory.length > maxHistory) {
          return newHistory.slice(-maxHistory)
        }
        return newHistory
      })
    },
    [maxHistory]
  )

  const clear = useCallback(() => {
    setHistory([])
  }, [])

  return {
    history,
    push,
    clear,
    canUndo: history.length > 1,
    canRedo: false,
  }
}

// 优化点 8: 实时通知
export function useCollaborationNotifications() {
  const [notifications, setNotifications] = useState<
    Array<{
      id: string
      type: "info" | "success" | "warning" | "error"
      message: string
      timestamp: Date
      autoDismiss?: number
    }>
  >([])

  const addNotification = useCallback(
    (
      type: "info" | "success" | "warning" | "error",
      message: string,
      autoDismiss?: number
    ) => {
      const id = `notification-${Date.now()}`
      const notification = {
        id,
        type,
        message,
        timestamp: new Date(),
        autoDismiss,
      }

      setNotifications((prev) => [...prev, notification])

      if (autoDismiss) {
        setTimeout(() => {
          removeNotification(id)
        }, autoDismiss)
      }

      return id
    },
    []
  )

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll: () => setNotifications([]),
  }
}

// 优化点 9: 同步状态
export function useSyncState(resourceId: string) {
  const [syncState, setSyncState] = useState<SyncState>({
    isConnected: false,
    pendingChanges: 0,
    syncErrors: [],
  })

  const addError = useCallback((error: string) => {
    setSyncState((prev) => ({
      ...prev,
      syncErrors: [...prev.syncErrors.slice(-9), error],
    }))
  }, [])

  const clearErrors = useCallback(() => {
    setSyncState((prev) => ({ ...prev, syncErrors: [] }))
  }, [])

  const markSynced = useCallback(() => {
    setSyncState((prev) => ({
      ...prev,
      lastSyncTime: new Date(),
      pendingChanges: 0,
    }))
  }, [])

  const incrementPending = useCallback(() => {
    setSyncState((prev) => ({
      ...prev,
      pendingChanges: prev.pendingChanges + 1,
    }))
  }, [])

  return {
    ...syncState,
    addError,
    clearErrors,
    markSynced,
    incrementPending,
    setConnected: (connected: boolean) =>
      setSyncState((prev) => ({ ...prev, isConnected: connected })),
  }
}

// 优化点 10: 防抖同步
export function useDebouncedSync<T>(
  value: T,
  syncFn: (value: T) => Promise<void>,
  delay: number = 500
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSyncRef = useRef<T>(value)

  useEffect(() => {
    if (JSON.stringify(value) === JSON.stringify(lastSyncRef.current)) {
      return
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(async () => {
      try {
        await syncFn(value)
        lastSyncRef.current = value
      } catch (err) {
        console.error("Sync failed:", err)
      }
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, syncFn, delay])

  return {
    isPending: timeoutRef.current !== null,
    cancelSync: () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    },
  }
}

// 辅助: 创建模拟 WebSocket
export function createMockWebSocket(url: string): CollaborationWebSocket {
  return new CollaborationWebSocket(url)
}

// 辅助: 生成用户颜色
export function generateUserColor(userId: string): string {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#FFA07A",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E2",
  ]
  const hash = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return colors[hash % colors.length]
}
