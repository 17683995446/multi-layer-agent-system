import { compressionService } from './data-compression-service'
import { errorReportingService } from './error-reporting-service'

export interface SnapshotMetadata {
  id: string
  timestamp: string
  size: number
  compressedSize: number
  type: 'full' | 'incremental'
  checksum: string
  source: string
  tags: string[]
  description?: string
}

export interface StateSnapshot {
  id: string
  metadata: SnapshotMetadata
  state: any
  previousSnapshotId?: string
}

export interface SnapshotDiff {
  added: Record<string, any>
  removed: Record<string, any>
  modified: Record<string, { old: any; new: any }>
}

export interface SnapshotOptions {
  type?: 'full' | 'incremental'
  compress?: boolean
  encrypt?: boolean
  tags?: string[]
  description?: string
  maxSnapshots?: number
  autoCleanup?: boolean
}

export interface SnapshotValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

class StateSnapshotManager {
  private static instance: StateSnapshotManager
  private snapshots: Map<string, StateSnapshot> = new Map()
  private snapshotOrder: string[] = []
  private maxSnapshots: number = 50
  private autoCleanup: boolean = true
  private lastState: any = null

  static getInstance(): StateSnapshotManager {
    if (!StateSnapshotManager.instance) {
      StateSnapshotManager.instance = new StateSnapshotManager()
    }
    return StateSnapshotManager.instance
  }

  private generateId(): string {
    return `snapshot-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  private calculateChecksum(data: any): string {
    const str = JSON.stringify(data)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(16).padStart(8, '0')
  }

  private generateIncrementalDiff(previousState: any, currentState: any): any {
    const diff: SnapshotDiff = {
      added: {},
      removed: {},
      modified: {}
    }

    const previousKeys = Object.keys(previousState || {})
    const currentKeys = Object.keys(currentState || {})

    currentKeys.forEach(key => {
      if (!(key in (previousState || {}))) {
        diff.added[key] = currentState[key]
      } else if (JSON.stringify(previousState[key]) !== JSON.stringify(currentState[key])) {
        diff.modified[key] = {
          old: previousState[key],
          new: currentState[key]
        }
      }
    })

    previousKeys.forEach(key => {
      if (!(key in currentState)) {
        diff.removed[key] = previousState[key]
      }
    })

    return diff
  }

  private applyIncrementalDiff(baseState: any, diff: SnapshotDiff): any {
    const newState = { ...baseState }

    Object.keys(diff.added).forEach(key => {
      newState[key] = diff.added[key]
    })

    Object.keys(diff.removed).forEach(key => {
      delete newState[key]
    })

    Object.keys(diff.modified).forEach(key => {
      newState[key] = diff.modified[key].new
    })

    return newState
  }

  createSnapshot(
    state: any,
    source: string,
    options: SnapshotOptions = {}
  ): StateSnapshot {
    try {
      const id = this.generateId()
      const type = options.type || 'full'
      const tags = options.tags || []
      const description = options.description || ''

      let snapshotData = state
      let previousSnapshotId: string | undefined

      if (type === 'incremental' && this.lastState) {
        snapshotData = this.generateIncrementalDiff(this.lastState, state)
        previousSnapshotId = this.snapshotOrder[this.snapshotOrder.length - 1]
      }

      let processedData = snapshotData
      let compressedSize = 0

      if (options.compress !== false) {
        const compressed = compressionService.compress(snapshotData)
        processedData = compressed
        compressedSize = compressed.compressedSize
      }

      if (options.encrypt) {
        processedData = this.encryptSnapshot(processedData)
      }

      const metadata: SnapshotMetadata = {
        id,
        timestamp: new Date().toISOString(),
        size: JSON.stringify(state).length,
        compressedSize: compressedSize || JSON.stringify(processedData).length,
        type,
        checksum: this.calculateChecksum(snapshotData),
        source,
        tags,
        description
      }

      const snapshot: StateSnapshot = {
        id,
        metadata,
        state: processedData,
        previousSnapshotId
      }

      this.snapshots.set(id, snapshot)
      this.snapshotOrder.push(id)
      this.lastState = state

      if (options.maxSnapshots) {
        this.maxSnapshots = options.maxSnapshots
      }

      if (this.autoCleanup && options.autoCleanup !== false) {
        this.cleanupOldSnapshots()
      }

      if (options.autoCleanup === false) {
        this.autoCleanup = false
      }

      errorReportingService.reportInfo(`Snapshot created: ${id}`, {
        type,
        source,
        size: metadata.size
      })

      return snapshot
    } catch (error) {
      errorReportingService.reportError(
        'Failed to create snapshot',
        error instanceof Error ? error.stack : undefined,
        { source, options }
      )
      throw error
    }
  }

  private encryptSnapshot(data: any): any {
    const str = typeof data === 'string' ? data : JSON.stringify(data)
    return `encrypted:${btoa(str)}`
  }

  private decryptSnapshot(data: any): any {
    if (typeof data === 'string' && data.startsWith('encrypted:')) {
      const decoded = atob(data.substring(10))
      try {
        return JSON.parse(decoded)
      } catch {
        return decoded
      }
    }
    return data
  }

  restoreSnapshot(snapshotId: string, decrypt: boolean = true): any {
    const snapshot = this.snapshots.get(snapshotId)
    if (!snapshot) {
      throw new Error(`Snapshot not found: ${snapshotId}`)
    }

    try {
      let state = snapshot.state

      if (decrypt && snapshot.metadata.encrypt) {
        state = this.decryptSnapshot(state)
      }

      if (snapshot.metadata.compressedSize > 0) {
        state = compressionService.decompress(state)
      }

      if (snapshot.metadata.type === 'incremental' && snapshot.previousSnapshotId) {
        const baseSnapshot = this.snapshots.get(snapshot.previousSnapshotId)
        if (baseSnapshot) {
          const baseState = this.restoreSnapshot(baseSnapshot.id, decrypt)
          state = this.applyIncrementalDiff(baseState, state)
        }
      }

      const validation = this.validateSnapshot(snapshot)
      if (!validation.isValid) {
        errorReportingService.reportWarning(
          'Snapshot validation failed',
          { snapshotId, errors: validation.errors }
        )
      }

      return state
    } catch (error) {
      errorReportingService.reportError(
        'Failed to restore snapshot',
        error instanceof Error ? error.stack : undefined,
        { snapshotId }
      )
      throw error
    }
  }

  validateSnapshot(snapshot: StateSnapshot): SnapshotValidation {
    const validation: SnapshotValidation = {
      isValid: true,
      errors: [],
      warnings: []
    }

    if (!snapshot.id || !snapshot.metadata) {
      validation.isValid = false
      validation.errors.push('Missing required snapshot properties')
      return validation
    }

    const currentChecksum = this.calculateChecksum(snapshot.state)
    if (currentChecksum !== snapshot.metadata.checksum) {
      validation.warnings.push('Checksum mismatch - snapshot may have been modified')
    }

    if (!snapshot.metadata.timestamp) {
      validation.errors.push('Missing timestamp')
      validation.isValid = false
    }

    if (!snapshot.metadata.source) {
      validation.warnings.push('Missing source information')
    }

    return validation
  }

  compareSnapshots(snapshotId1: string, snapshotId2: string): SnapshotDiff {
    const state1 = this.restoreSnapshot(snapshotId1)
    const state2 = this.restoreSnapshot(snapshotId2)

    return this.generateIncrementalDiff(state1, state2)
  }

  getSnapshot(snapshotId: string): StateSnapshot | undefined {
    return this.snapshots.get(snapshotId)
  }

  getAllSnapshots(): StateSnapshot[] {
    return this.snapshotOrder.map(id => this.snapshots.get(id)!).filter(Boolean)
  }

  getSnapshotsBySource(source: string): StateSnapshot[] {
    return this.getAllSnapshots().filter(s => s.metadata.source === source)
  }

  getSnapshotsByTags(tags: string[]): StateSnapshot[] {
    return this.getAllSnapshots().filter(snapshot =>
      tags.some(tag => snapshot.metadata.tags.includes(tag))
    )
  }

  deleteSnapshot(snapshotId: string): boolean {
    const deleted = this.snapshots.delete(snapshotId)
    if (deleted) {
      this.snapshotOrder = this.snapshotOrder.filter(id => id !== snapshotId)
    }
    return deleted
  }

  cleanupOldSnapshots(keepCount?: number): number {
    const count = keepCount || this.maxSnapshots
    let deletedCount = 0

    while (this.snapshotOrder.length > count) {
      const oldestId = this.snapshotOrder[0]
      if (this.deleteSnapshot(oldestId)) {
        deletedCount++
      } else {
        break
      }
    }

    if (deletedCount > 0) {
      errorReportingService.reportInfo(`Cleaned up ${deletedCount} old snapshots`)
    }

    return deletedCount
  }

  exportSnapshot(snapshotId: string): string {
    const snapshot = this.snapshots.get(snapshotId)
    if (!snapshot) {
      throw new Error(`Snapshot not found: ${snapshotId}`)
    }

    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      snapshot
    }

    return JSON.stringify(exportData, null, 2)
  }

  importSnapshot(data: string): StateSnapshot {
    try {
      const parsed = JSON.parse(data)
      if (!parsed.snapshot) {
        throw new Error('Invalid snapshot data format')
      }

      const snapshot = parsed.snapshot as StateSnapshot
      const validation = this.validateSnapshot(snapshot)

      if (!validation.isValid) {
        throw new Error(`Snapshot validation failed: ${validation.errors.join(', ')}`)
      }

      this.snapshots.set(snapshot.id, snapshot)
      if (!this.snapshotOrder.includes(snapshot.id)) {
        this.snapshotOrder.push(snapshot.id)
      }

      errorReportingService.reportInfo(`Snapshot imported: ${snapshot.id}`)
      return snapshot
    } catch (error) {
      errorReportingService.reportError(
        'Failed to import snapshot',
        error instanceof Error ? error.stack : undefined
      )
      throw error
    }
  }

  clearAllSnapshots(): void {
    this.snapshots.clear()
    this.snapshotOrder = []
    errorReportingService.reportInfo('All snapshots cleared')
  }

  getSnapshotStats(): {
    totalSnapshots: number
    totalSize: number
    byType: Record<string, number>
    bySource: Record<string, number>
    oldestSnapshot?: string
    newestSnapshot?: string
  } {
    const snapshots = this.getAllSnapshots()

    return {
      totalSnapshots: snapshots.length,
      totalSize: snapshots.reduce((sum, s) => sum + s.metadata.size, 0),
      byType: snapshots.reduce((acc, s) => {
        acc[s.metadata.type] = (acc[s.metadata.type] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      bySource: snapshots.reduce((acc, s) => {
        acc[s.metadata.source] = (acc[s.metadata.source] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      oldestSnapshot: snapshots[0]?.id,
      newestSnapshot: snapshots[snapshots.length - 1]?.id
    }
  }
}

export const stateSnapshotManager = StateSnapshotManager.getInstance()

export function useStateSnapshot() {
  return {
    createSnapshot: (state: any, source: string, options?: SnapshotOptions) =>
      stateSnapshotManager.createSnapshot(state, source, options),
    restoreSnapshot: (id: string, decrypt?: boolean) =>
      stateSnapshotManager.restoreSnapshot(id, decrypt),
    getSnapshot: (id: string) => stateSnapshotManager.getSnapshot(id),
    getAllSnapshots: () => stateSnapshotManager.getAllSnapshots(),
    getSnapshotsBySource: (source: string) => stateSnapshotManager.getSnapshotsBySource(source),
    getSnapshotsByTags: (tags: string[]) => stateSnapshotManager.getSnapshotsByTags(tags),
    deleteSnapshot: (id: string) => stateSnapshotManager.deleteSnapshot(id),
    compareSnapshots: (id1: string, id2: string) =>
      stateSnapshotManager.compareSnapshots(id1, id2),
    validateSnapshot: (snapshot: StateSnapshot) =>
      stateSnapshotManager.validateSnapshot(snapshot),
    exportSnapshot: (id: string) => stateSnapshotManager.exportSnapshot(id),
    importSnapshot: (data: string) => stateSnapshotManager.importSnapshot(data),
    clearAllSnapshots: () => stateSnapshotManager.clearAllSnapshots(),
    getSnapshotStats: () => stateSnapshotManager.getSnapshotStats()
  }
}
