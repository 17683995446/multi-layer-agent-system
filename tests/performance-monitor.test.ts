import { describe, it, expect, beforeEach, vi } from 'vitest';
import { perfMonitor } from '../src/utils/performanceMonitor';

describe('Performance Monitor', () => {
  beforeEach(() => {
    perfMonitor.clearMetrics();
  });

  describe('Basic Operations', () => {
    it('should be able to start and end operations', () => {
      const opId = perfMonitor.startOperation('test-operation');
      expect(opId).toBeTruthy();
      
      const result = perfMonitor.endOperation(opId);
      expect(result).toBeTruthy();
      expect(result?.type).toBe('operation');
    });

    it('should record operation duration', async () => {
      const opId = perfMonitor.startOperation('timed-operation');
      await new Promise(resolve => setTimeout(resolve, 50));
      const result = perfMonitor.endOperation(opId);
      
      expect(result?.duration).toBeGreaterThan(0);
    });

    it('should handle ending non-existent operations', () => {
      const result = perfMonitor.endOperation('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('Metrics Collection', () => {
    it('should collect metrics', () => {
      const id1 = perfMonitor.startOperation('op1');
      perfMonitor.endOperation(id1);
      
      const id2 = perfMonitor.startOperation('op2');
      perfMonitor.endOperation(id2);
      
      const metrics = perfMonitor.getMetrics();
      expect(metrics.length).toBe(2);
    });

    it('should filter metrics by type', () => {
      const id = perfMonitor.startOperation('test-op');
      perfMonitor.endOperation(id);
      
      const operationMetrics = perfMonitor.getMetrics({ type: 'operation' });
      expect(operationMetrics.length).toBeGreaterThan(0);
      
      const fpsMetrics = perfMonitor.getMetrics({ type: 'fps' });
      expect(fpsMetrics.length).toBe(0);
    });

    it('should limit metrics', () => {
      for (let i = 0; i < 10; i++) {
        const id = perfMonitor.startOperation(`op-${i}`);
        perfMonitor.endOperation(id);
      }
      
      const limitedMetrics = perfMonitor.getMetrics({ limit: 5 });
      expect(limitedMetrics.length).toBe(5);
    });
  });

  describe('Report Generation', () => {
    it('should generate performance reports', () => {
      for (let i = 0; i < 5; i++) {
        const id = perfMonitor.startOperation(`test-op-${i}`);
        perfMonitor.endOperation(id);
      }
      
      const report = perfMonitor.generateReport();
      expect(report.summary.totalOperations).toBe(5);
      expect(report.metrics.length).toBe(5);
    });

    it('should export reports as JSON', () => {
      const id = perfMonitor.startOperation('export-test');
      perfMonitor.endOperation(id);
      
      const json = perfMonitor.exportReport();
      const parsed = JSON.parse(json);
      expect(parsed).toHaveProperty('startTime');
      expect(parsed).toHaveProperty('endTime');
      expect(parsed).toHaveProperty('metrics');
    });
  });

  describe('Utility Functions', () => {
    it('should measure sync functions', () => {
      const result = perfMonitor.measureSync('sync-test', () => {
        return 42;
      });
      
      expect(result).toBe(42);
      
      const metrics = perfMonitor.getMetrics();
      expect(metrics.length).toBe(1);
    });

    it('should measure async functions', async () => {
      const result = await perfMonitor.measureAsync('async-test', async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'async-result';
      });
      
      expect(result).toBe('async-result');
      
      const metrics = perfMonitor.getMetrics();
      expect(metrics.length).toBe(1);
    });
  });
});
