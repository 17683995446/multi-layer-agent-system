import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StateSnapshot } from '@/utils/state-snapshot-manager'

vi.mock('@/utils/error-reporting-service', () => ({
  errorReportingService: {
    reportError: vi.fn(),
    reportWarning: vi.fn(),
    reportInfo: vi.fn(),
    reportDebug: vi.fn(),
    getErrors: vi.fn(() => []),
    getStats: vi.fn(() => ({ total: 0, byType: {}, bySeverity: {} })),
    clearErrors: vi.fn(),
    exportErrors: vi.fn(() => '{}'),
    importErrors: vi.fn(() => 0)
  }
}))

vi.mock('@/utils/data-compression-service', () => ({
  compressionService: {
    compress: vi.fn((data) => ({
      data: JSON.stringify(data),
      originalSize: JSON.stringify(data).length,
      compressedSize: JSON.stringify(data).length * 0.8,
      compressionRatio: 20,
      algorithm: 'base64',
      timestamp: new Date().toISOString()
    })),
    decompress: vi.fn((data) => {
      if (typeof data === 'object' && data.data) {
        try {
          return JSON.parse(data.data)
        } catch {
          return data.data
        }
      }
      return data
    })
  }
}))

import { stateSnapshotManager } from '@/utils/state-snapshot-manager'

describe('StateSnapshotManager Tests', () => {
  beforeEach(() => {
    stateSnapshotManager.clearAllSnapshots()
  })

  describe('Basic Snapshot Operations', () => {
    it('should create a full snapshot', () => {
      const state = {
        tasks: [{ id: '1', name: 'Test Task' }],
        count: 1
      }

      const snapshot = stateSnapshotManager.createSnapshot(state, 'test')

      expect(snapshot).toBeDefined()
      expect(snapshot.id).toBeDefined()
      expect(snapshot.metadata.type).toBe('full')
      expect(snapshot.metadata.source).toBe('test')
      expect(snapshot.metadata.checksum).toBeDefined()
    })

    it('should create an incremental snapshot', () => {
      const initialState = { count: 0 }
      const updatedState = { count: 1, newField: 'value' }

      stateSnapshotManager.createSnapshot(initialState, 'test')
      const incrementalSnapshot = stateSnapshotManager.createSnapshot(
        updatedState,
        'test',
        { type: 'incremental' }
      )

      expect(incrementalSnapshot.metadata.type).toBe('incremental')
      expect(incrementalSnapshot.previousSnapshotId).toBeDefined()
    })

    it('should restore a snapshot', () => {
      const state = {
        tasks: [{ id: '1', name: 'Original' }],
        mode: 'work'
      }

      const snapshot = stateSnapshotManager.createSnapshot(state, 'test')
      const restored = stateSnapshotManager.restoreSnapshot(snapshot.id)

      expect(restored).toEqual(state)
    })

    it('should validate snapshot integrity', () => {
      const state = { data: 'test' }
      const snapshot = stateSnapshotManager.createSnapshot(state, 'test')

      const validation = stateSnapshotManager.validateSnapshot(snapshot)

      expect(validation.isValid).toBe(true)
      expect(validation.errors).toHaveLength(0)
    })
  })

  describe('Snapshot Management', () => {
    it('should get all snapshots', () => {
      stateSnapshotManager.createSnapshot({ data: 1 }, 'test')
      stateSnapshotManager.createSnapshot({ data: 2 }, 'test')
      stateSnapshotManager.createSnapshot({ data: 3 }, 'test')

      const snapshots = stateSnapshotManager.getAllSnapshots()

      expect(snapshots).toHaveLength(3)
    })

    it('should filter snapshots by source', () => {
      stateSnapshotManager.createSnapshot({ data: 1 }, 'source1')
      stateSnapshotManager.createSnapshot({ data: 2 }, 'source2')
      stateSnapshotManager.createSnapshot({ data: 3 }, 'source1')

      const filtered = stateSnapshotManager.getSnapshotsBySource('source1')

      expect(filtered).toHaveLength(2)
      expect(filtered.every(s => s.metadata.source === 'source1')).toBe(true)
    })

    it('should filter snapshots by tags', () => {
      stateSnapshotManager.createSnapshot({ data: 1 }, 'test', {
        tags: ['important', 'urgent']
      })
      stateSnapshotManager.createSnapshot({ data: 2 }, 'test', {
        tags: ['important']
      })
      stateSnapshotManager.createSnapshot({ data: 3 }, 'test', {
        tags: ['normal']
      })

      const filtered = stateSnapshotManager.getSnapshotsByTags(['important'])

      expect(filtered).toHaveLength(2)
    })

    it('should delete a snapshot', () => {
      const snapshot = stateSnapshotManager.createSnapshot({ data: 'test' }, 'test')
      const deleted = stateSnapshotManager.deleteSnapshot(snapshot.id)

      expect(deleted).toBe(true)
      expect(stateSnapshotManager.getSnapshot(snapshot.id)).toBeUndefined()
    })

    it('should cleanup old snapshots', () => {
      for (let i = 0; i < 20; i++) {
        stateSnapshotManager.createSnapshot({ index: i }, 'test')
      }

      const deleted = stateSnapshotManager.cleanupOldSnapshots(10)

      expect(deleted).toBe(10)
      expect(stateSnapshotManager.getAllSnapshots()).toHaveLength(10)
    })
  })

  describe('Snapshot Comparison', () => {
    it('should compare two snapshots', () => {
      const state1 = { tasks: [{ id: '1' }], count: 1 }
      const state2 = { tasks: [{ id: '2' }], count: 2 }

      const snapshot1 = stateSnapshotManager.createSnapshot(state1, 'test')
      const snapshot2 = stateSnapshotManager.createSnapshot(state2, 'test')

      const diff = stateSnapshotManager.compareSnapshots(snapshot1.id, snapshot2.id)

      expect(diff).toBeDefined()
      expect(diff.modified.count).toBeDefined()
    })
  })

  describe('Snapshot Export/Import', () => {
    it('should export a snapshot', () => {
      const state = { data: 'export test' }
      const snapshot = stateSnapshotManager.createSnapshot(state, 'test')

      const exported = stateSnapshotManager.exportSnapshot(snapshot.id)

      expect(exported).toContain('snapshot')
      expect(exported).toContain(snapshot.id)
    })

    it('should import a snapshot', () => {
      const state = { data: 'import test' }
      const original = stateSnapshotManager.createSnapshot(state, 'test')
      const exported = stateSnapshotManager.exportSnapshot(original.id)

      stateSnapshotManager.clearAllSnapshots()

      const imported = stateSnapshotManager.importSnapshot(exported)

      expect(imported.id).toBe(original.id)
      expect(imported.metadata.source).toBe('test')
    })

    it('should reject invalid import data', () => {
      expect(() => {
        stateSnapshotManager.importSnapshot('invalid json')
      }).toThrow()
    })
  })

  describe('Snapshot Statistics', () => {
    it('should calculate snapshot statistics', () => {
      stateSnapshotManager.createSnapshot({ data: 1 }, 'source1')
      stateSnapshotManager.createSnapshot({ data: 2 }, 'source1')
      stateSnapshotManager.createSnapshot({ data: 3 }, 'source2')

      const stats = stateSnapshotManager.getSnapshotStats()

      expect(stats.totalSnapshots).toBe(3)
      expect(stats.bySource.source1).toBe(2)
      expect(stats.bySource.source2).toBe(1)
      expect(stats.oldestSnapshot).toBeDefined()
      expect(stats.newestSnapshot).toBeDefined()
    })
  })

  describe('Snapshot with Compression', () => {
    it('should compress large snapshots', () => {
      const largeState = {
        tasks: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          data: 'x'.repeat(100)
        }))
      }

      const snapshot = stateSnapshotManager.createSnapshot(largeState, 'test', {
        compress: true
      })

      expect(snapshot.metadata.compressedSize).toBeLessThan(snapshot.metadata.size)
    })
  })

  describe('Snapshot with Tags', () => {
    it('should create snapshot with tags', () => {
      const snapshot = stateSnapshotManager.createSnapshot(
        { data: 'tagged' },
        'test',
        { tags: ['important', 'backup'] }
      )

      expect(snapshot.metadata.tags).toContain('important')
      expect(snapshot.metadata.tags).toContain('backup')
    })

    it('should create snapshot with description', () => {
      const snapshot = stateSnapshotManager.createSnapshot(
        { data: 'described' },
        'test',
        { description: 'This is a test snapshot' }
      )

      expect(snapshot.metadata.description).toBe('This is a test snapshot')
    })
  })

  describe('Snapshot Restoration', () => {
    it('should restore incremental snapshot correctly', () => {
      const initial = { count: 0, static: 'value' }
      const updated = { count: 1, static: 'value', added: 'new' }

      stateSnapshotManager.createSnapshot(initial, 'test')
      stateSnapshotManager.createSnapshot(updated, 'test', { type: 'incremental' })

      const snapshots = stateSnapshotManager.getAllSnapshots()
      const lastSnapshot = snapshots[snapshots.length - 1]
      const restored = stateSnapshotManager.restoreSnapshot(lastSnapshot.id)

      expect(restored).toEqual(updated)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty state', () => {
      const snapshot = stateSnapshotManager.createSnapshot({}, 'test')

      expect(snapshot).toBeDefined()
      expect(snapshot.metadata.size).toBeGreaterThan(0)
    })

    it('should handle null and undefined values', () => {
      const state = {
        nullValue: null,
        stringValue: 'test',
        numberValue: 42
      }

      const snapshot = stateSnapshotManager.createSnapshot(state, 'test')
      const restored = stateSnapshotManager.restoreSnapshot(snapshot.id)

      expect(restored).toHaveProperty('nullValue')
      expect(restored.nullValue).toBeNull()
      expect(restored).toHaveProperty('stringValue')
      expect(restored).toHaveProperty('numberValue')
    })

    it('should throw error for non-existent snapshot', () => {
      expect(() => {
        stateSnapshotManager.restoreSnapshot('non-existent-id')
      }).toThrow('Snapshot not found')
    })
  })
})
