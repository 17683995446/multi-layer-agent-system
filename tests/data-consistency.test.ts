import { describe, it, expect, beforeEach } from 'vitest';
import {
  DataConsistencyManager,
  consistencyManager,
  OperationType,
  TransactionState,
} from '../src/utils/data-consistency-manager';

describe('DataConsistencyManager', () => {
  beforeEach(() => {
    // 重置状态
    // 注意：由于是单例模式，我们需要通过创建新实例来测试
  });

  describe('Transaction Management', () => {
    it('should start and commit transactions', () => {
      const manager = new (DataConsistencyManager as any)();
      
      const txId = manager.startTransaction({ test: true });
      expect(txId).toBeDefined();
      expect(manager.getActiveTransaction()).not.toBeNull();
      
      const result = manager.commitTransaction();
      expect(result).toBe(true);
      expect(manager.getActiveTransaction()).toBeNull();
    });

    it('should rollback transactions', () => {
      const manager = new (DataConsistencyManager as any)();
      
      manager.startTransaction({ test: 'rollback' });
      expect(manager.getActiveTransaction()).not.toBeNull();
      
      const result = manager.rollbackTransaction();
      expect(result).toBe(true);
      expect(manager.getActiveTransaction()).toBeNull();
    });

    it('should handle nested transactions gracefully', () => {
      const manager = new (DataConsistencyManager as any)();
      
      manager.startTransaction({ first: true });
      const txId2 = manager.startTransaction({ nested: true });
      
      expect(txId2).toBeDefined();
      expect(manager.getActiveTransaction()).not.toBeNull();
      
      manager.commitTransaction();
    });
  });

  describe('Operation Logging', () => {
    it('should log operations', () => {
      const manager = new (DataConsistencyManager as any)();
      
      const opId = manager.logOperation(
        OperationType.ADD_TASK,
        { before: 'state' },
        { after: 'state' },
        'target-123',
        { test: true }
      );
      
      expect(opId).toBeDefined();
      
      const log = manager.getOperationLog(10);
      expect(log.length).toBeGreaterThan(0);
    });

    it('should include operations in active transaction', () => {
      const manager = new (DataConsistencyManager as any)();
      
      manager.startTransaction({ tx: 'test' });
      
      manager.logOperation(OperationType.ADD_TASK, {}, {}, 'task-1');
      manager.logOperation(OperationType.UPDATE_TASK, {}, {}, 'task-1');
      
      const tx = manager.getActiveTransaction();
      expect(tx.operations.length).toBe(2);
      
      manager.commitTransaction();
    });
  });

  describe('Data Versioning', () => {
    it('should create data versions', () => {
      const manager = new (DataConsistencyManager as any)();
      
      const versionId = manager.createDataVersion('test-operation');
      expect(versionId).toBeDefined();
      
      const versions = manager.getDataVersions(10);
      expect(versions.length).toBeGreaterThan(0);
    });

    it('should have valid checksum on versions', () => {
      const manager = new (DataConsistencyManager as any)();
      
      const versionId = manager.createDataVersion('checksum-test');
      const versions = manager.getDataVersions(10);
      const lastVersion = versions[versions.length - 1];
      
      expect(lastVersion.checksum).toBeDefined();
      expect(typeof lastVersion.checksum).toBe('string');
      expect(lastVersion.checksum.length).toBeGreaterThan(0);
    });
  });

  describe('Consistency Check', () => {
    it('should perform consistency check', () => {
      const manager = new (DataConsistencyManager as any)();
      
      const result = manager.checkConsistency();
      
      expect(result.isValid).toBeDefined();
      expect(typeof result.isValid).toBe('boolean');
      expect(result.checkedAt).toBeLessThanOrEqual(Date.now());
    });

    it('should detect empty state (warnings)', () => {
      const manager = new (DataConsistencyManager as any)();
      
      const result = manager.checkConsistency();
      
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.issues)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle commit without active transaction', () => {
      const manager = new (DataConsistencyManager as any)();
      
      const result = manager.commitTransaction();
      expect(result).toBe(false);
    });

    it('should handle rollback without active transaction', () => {
      const manager = new (DataConsistencyManager as any)();
      
      const result = manager.rollbackTransaction();
      expect(result).toBe(false);
    });

    it('should handle rollback to non-existent version', () => {
      const manager = new (DataConsistencyManager as any)();
      
      const result = manager.rollbackToVersion('non-existent-version');
      expect(result).toBe(false);
    });
  });

  describe('Exported singleton', () => {
    it('should have working singleton instance', () => {
      expect(consistencyManager).toBeDefined();
      
      const result = consistencyManager.checkConsistency();
      expect(result).toBeDefined();
    });
  });
});
