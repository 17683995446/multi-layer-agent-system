export interface StorageItem<T = any> {
  key: string
  data: T
  timestamp: number
  expiresAt?: number
  size: number
  compressed?: boolean
}

export interface StorageStats {
  used: number
  total: number
  percentage: number
  itemCount: number
  oldestItem?: string
  newestItem?: string
}

export interface CachePolicy {
  maxItems?: number
  maxSize?: number
  ttl?: number
  compression?: boolean
}

export class AdvancedStorageManager {
  private prefix: string
  private defaultTTL: number = 7 * 24 * 60 * 60 * 1000
  private maxStorageSize: number = 5 * 1024 * 1024
  private compressionEnabled: boolean = false

  constructor(prefix: string = 'mlas_') {
    this.prefix = prefix
    this.cleanupExpired()
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`
  }

  private calculateSize(data: any): number {
    const str = JSON.stringify(data)
    return new Blob([str]).size
  }

  private isExpired(item: StorageItem): boolean {
    if (!item.expiresAt) return false
    return Date.now() > item.expiresAt
  }

  private compress(data: string): string {
    if (!this.compressionEnabled || typeof btoa === 'undefined') {
      return data
    }
    try {
      return btoa(encodeURIComponent(data))
    } catch {
      return data
    }
  }

  private decompress(data: string): string {
    if (!this.compressionEnabled || typeof atob === 'undefined') {
      return data
    }
    try {
      return decodeURIComponent(atob(data))
    } catch {
      return data
    }
  }

  setItem<T>(key: string, data: T, ttl?: number): boolean {
    try {
      const timestamp = Date.now()
      const expiresAt = ttl ? timestamp + ttl : timestamp + this.defaultTTL
      const size = this.calculateSize(data)

      if (size > this.maxStorageSize) {
        console.warn(`Data size ${size} exceeds max storage size ${this.maxStorageSize}`)
        return false
      }

      const item: StorageItem<T> = {
        key: this.getKey(key),
        data,
        timestamp,
        expiresAt,
        size,
        compressed: this.compressionEnabled
      }

      const value = this.compressionEnabled 
        ? this.compress(JSON.stringify(item))
        : JSON.stringify(item)
      
      localStorage.setItem(this.getKey(key), value)

      const currentSize = this.getStats().used
      if (currentSize > this.maxStorageSize * 0.8) {
        this.autoCleanup()
      }

      return true
    } catch (error) {
      console.error('Failed to set item:', error)
      return false
    }
  }

  getItem<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(this.getKey(key))
      if (!raw) return null

      const itemStr = this.compressionEnabled ? this.decompress(raw) : raw
      const item: StorageItem<T> = JSON.parse(itemStr)

      if (this.isExpired(item)) {
        this.removeItem(key)
        return null
      }

      return item.data
    } catch (error) {
      console.error('Failed to get item:', error)
      return null
    }
  }

  removeItem(key: string): void {
    localStorage.removeItem(this.getKey(key))
  }

  clear(): void {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key)
      }
    })
  }

  hasItem(key: string): boolean {
    return this.getItem(key) !== null
  }

  getStats(): StorageStats {
    let used = 0
    let itemCount = 0
    let oldestTimestamp = Infinity
    let newestTimestamp = 0
    let oldestKey = ''
    let newestKey = ''

    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (!key.startsWith(this.prefix)) return

      try {
        const raw = localStorage.getItem(key)
        if (!raw) return

        const itemStr = this.compressionEnabled ? this.decompress(raw) : raw
        const item: StorageItem = JSON.parse(itemStr)

        if (this.isExpired(item)) {
          this.removeItem(key.replace(this.prefix, ''))
          return
        }

        used += item.size
        itemCount++

        if (item.timestamp < oldestTimestamp) {
          oldestTimestamp = item.timestamp
          oldestKey = key.replace(this.prefix, '')
        }

        if (item.timestamp > newestTimestamp) {
          newestTimestamp = item.timestamp
          newestKey = key.replace(this.prefix, '')
        }
      } catch {
        this.removeItem(key.replace(this.prefix, ''))
      }
    })

    return {
      used,
      total: this.maxStorageSize,
      percentage: (used / this.maxStorageSize) * 100,
      itemCount,
      oldestItem: oldestKey,
      newestItem: newestKey
    }
  }

  autoCleanup(policy: CachePolicy = {}): number {
    const stats = this.getStats()
    let removed = 0

    if (policy.maxItems && stats.itemCount > policy.maxItems) {
      removed += this.removeLRUItems(stats.itemCount - policy.maxItems)
    }

    if (policy.maxSize && stats.used > policy.maxSize) {
      const targetSize = policy.maxSize * 0.8
      removed += this.removeOldestItemsUntil(stats.used - targetSize)
    }

    return removed
  }

  private removeLRUItems(count: number): number {
    const items: Array<{ key: string; timestamp: number }> = []
    
    Object.keys(localStorage).forEach(key => {
      if (!key.startsWith(this.prefix)) return
      
      try {
        const raw = localStorage.getItem(key)
        if (!raw) return
        
        const itemStr = this.compressionEnabled ? this.decompress(raw) : raw
        const item: StorageItem = JSON.parse(itemStr)
        
        items.push({ key: key.replace(this.prefix, ''), timestamp: item.timestamp })
      } catch {
        localStorage.removeItem(key)
      }
    })

    items.sort((a, b) => a.timestamp - b.timestamp)
    
    let removed = 0
    for (let i = 0; i < Math.min(count, items.length); i++) {
      this.removeItem(items[i].key)
      removed++
    }

    return removed
  }

  private removeOldestItemsUntil(bytes: number): number {
    let removedBytes = 0
    let removed = 0

    const items: Array<{ key: string; size: number; timestamp: number }> = []
    
    Object.keys(localStorage).forEach(key => {
      if (!key.startsWith(this.prefix)) return
      
      try {
        const raw = localStorage.getItem(key)
        if (!raw) return
        
        const itemStr = this.compressionEnabled ? this.decompress(raw) : raw
        const item: StorageItem = JSON.parse(itemStr)
        
        items.push({ 
          key: key.replace(this.prefix, ''), 
          size: item.size,
          timestamp: item.timestamp 
        })
      } catch {
        localStorage.removeItem(key)
      }
    })

    items.sort((a, b) => a.timestamp - b.timestamp)

    for (const item of items) {
      if (removedBytes >= bytes) break
      
      this.removeItem(item.key)
      removedBytes += item.size
      removed++
    }

    return removed
  }

  cleanupExpired(): number {
    let removed = 0
    
    Object.keys(localStorage).forEach(key => {
      if (!key.startsWith(this.prefix)) return
      
      try {
        const raw = localStorage.getItem(key)
        if (!raw) return
        
        const itemStr = this.compressionEnabled ? this.decompress(raw) : raw
        const item: StorageItem = JSON.parse(itemStr)
        
        if (this.isExpired(item)) {
          this.removeItem(key.replace(this.prefix, ''))
          removed++
        }
      } catch {
        localStorage.removeItem(key)
        removed++
      }
    })

    return removed
  }

  setCompression(enabled: boolean): void {
    this.compressionEnabled = enabled
  }

  setDefaultTTL(ttl: number): void {
    this.defaultTTL = ttl
  }

  exportData(): Record<string, any> {
    const data: Record<string, any> = {}
    
    Object.keys(localStorage).forEach(key => {
      if (!key.startsWith(this.prefix)) return
      
      const cleanKey = key.replace(this.prefix, '')
      data[cleanKey] = this.getItem(cleanKey)
    })
    
    return data
  }

  importData(data: Record<string, any>): number {
    let imported = 0
    
    Object.entries(data).forEach(([key, value]) => {
      if (this.setItem(key, value)) {
        imported++
      }
    })
    
    return imported
  }
}

export const storageManager = new AdvancedStorageManager()

export function useStorageManager() {
  return {
    setItem: <T>(key: string, data: T, ttl?: number) => storageManager.setItem(key, data, ttl),
    getItem: <T>(key: string) => storageManager.getItem<T>(key),
    removeItem: (key: string) => storageManager.removeItem(key),
    clear: () => storageManager.clear(),
    hasItem: (key: string) => storageManager.hasItem(key),
    getStats: () => storageManager.getStats(),
    cleanupExpired: () => storageManager.cleanupExpired(),
    autoCleanup: (policy?: CachePolicy) => storageManager.autoCleanup(policy),
  }
}
