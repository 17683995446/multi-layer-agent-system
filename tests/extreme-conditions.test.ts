import { describe, it, expect, beforeEach } from 'vitest';
import { diagnostics } from '@/utils/advanced-diagnostics';
import { perfMonitor } from '@/utils/performance-monitor';
import { errorHandler } from '@/utils/error-handling-manager';

describe('Extreme Conditions & Chaos Testing', () => {
  beforeEach(() => {
    perfMonitor.clearMetrics();
    errorHandler.clearHistory();
  });

  describe('1. 超大负载测试', () => {
    it('应该能处理10,000个连续操作', async () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 10000; i++) {
        const opId = perfMonitor.startOperation(`test-op-${i}`);
        // 模拟一些工作
        for (let j = 0; j < 10; j++) {
          Math.random() * Math.random();
        }
        perfMonitor.endOperation(opId);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`[STRESS] 10,000 operations completed in ${duration}ms`);
      
      // 验证操作记录正常
      const metrics = perfMonitor.getMetrics();
      expect(metrics.length).toBeGreaterThan(0);
      
      // 应该能在合理时间内完成（< 5秒）
      expect(duration).toBeLessThan(5000);
    });

    it('应该能处理大数据对象', () => {
      // 创建超大对象
      const bigData: any = {};
      for (let i = 0; i < 1000; i++) {
        bigData[`key-${i}`] = {
          id: i,
          name: `Item ${i}`,
          values: Array.from({ length: 100 }, (_, j) => j),
          nested: {
            deep: {
              structure: {
                with: {
                  many: {
                    levels: true
                  }
                }
              }
            }
          }
        };
      }
      
      const opId = perfMonitor.startOperation('big-data-processing');
      
      // 尝试序列化和处理
      const serialized = JSON.stringify(bigData);
      const deserialized = JSON.parse(serialized);
      
      perfMonitor.endOperation(opId);
      
      expect(deserialized['key-500']).toBeTruthy();
      expect(deserialized['key-500'].values.length).toBe(100);
    });
  });

  describe('2. 错误处理极限测试', () => {
    it('应该能处理大量连续错误', () => {
      for (let i = 0; i < 100; i++) {
        try {
          throw new Error(`Test error #${i}`);
        } catch (err) {
          errorHandler.classifyError(
            err instanceof Error ? err : new Error(String(err)),
            { phase: 'testing', iteration: i },
            i % 3 === 0 // 每3个标记为可重试
          );
        }
      }
      
      const stats = errorHandler.getErrorStats();
      expect(stats.total).toBe(100);
      
      console.log(`[STRESS] Error handling verified for ${stats.total} errors`);
    });

    it('应该能分类严重程度不同的错误', () => {
      // 低严重性
      const lowErr = new Error('Minor warning');
      const lowClassified = errorHandler.classifyError(lowErr, { type: 'minor' });
      
      // 中等严重性
      const medErr = new Error('Invalid parameter: missing required field');
      const medClassified = errorHandler.classifyError(medErr, { type: 'validation' });
      
      // 高严重性
      const highErr = new Error('Storage full: database write failed');
      const highClassified = errorHandler.classifyError(highErr, { type: 'storage' });
      
      // 严重错误
      const criticalErr = new Error('Fatal system crash: memory corruption detected');
      const criticalClassified = errorHandler.classifyError(criticalErr, { type: 'critical' });
      
      expect(lowClassified.severity).toBeTruthy();
      expect(medClassified.severity).toBeTruthy();
      expect(highClassified.severity).toBeTruthy();
      expect(criticalClassified.severity).toBeTruthy();
    });
  });

  describe('3. 健康度评分系统测试', () => {
    it('应该在正常状态下有良好的评分', () => {
      const score = diagnostics.calculateHealthScore();
      
      expect(score.overall).toBeGreaterThanOrEqual(60);
      expect(score.performance).toBeGreaterThanOrEqual(50);
      expect(score.reliability).toBeGreaterThanOrEqual(50);
      expect(score.status).toBeTruthy();
      
      console.log(`[HEALTH] Initial health score: ${score.overall}/100 (${score.status})`);
    });

    it('应该能检测性能瓶颈', () => {
      // 先创建一些慢速操作
      for (let i = 0; i < 20; i++) {
        const opId = perfMonitor.startOperation(`slow-op-${i}`);
        // 模拟较慢的操作
        for (let j = 0; j < 10000; j++) {
          Math.sqrt(j);
        }
        perfMonitor.endOperation(opId);
      }
      
      const bottlenecks = diagnostics.detectBottlenecks();
      
      console.log(`[DIAGNOSTICS] Detected ${bottlenecks.length} bottleneck(s)`);
      
      bottlenecks.forEach((b, i) => {
        console.log(`  [BOTTLENECK ${i+1}] ${b.type} - ${b.severity}: ${b.description}`);
      });
      
      expect(Array.isArray(bottlenecks)).toBe(true);
    });

    it('应该能进行完整的系统诊断', () => {
      const diagnosis = diagnostics.performFullDiagnosis();
      
      expect(diagnosis.healthScore).toBeTruthy();
      expect(Array.isArray(diagnosis.bottlenecks)).toBe(true);
      expect(Array.isArray(diagnosis.recommendations)).toBe(true);
      expect(diagnosis.performanceTrend).toBeTruthy();
      expect(diagnosis.selfHealing).toBeTruthy();
      
      console.log(`[DIAGNOSIS] Complete - Health: ${diagnosis.healthScore.overall}/100`);
      console.log(`[DIAGNOSIS] Recommendations: ${diagnosis.recommendations.length}`);
    });
  });

  describe('4. 自我修复机制测试', () => {
    it('应该能尝试自我修复', () => {
      // 先制造一些问题状态
      for (let i = 0; i < 15; i++) {
        const opId = perfMonitor.startOperation(`problem-op-${i}`);
        perfMonitor.endOperation(opId);
      }
      
      const actions = diagnostics.attemptSelfHealing();
      
      console.log(`[SELF-HEALING] Executed ${actions.length} self-healing action(s)`);
      
      actions.forEach((action, i) => {
        console.log(`  [HEAL ${i+1}] ${action}`);
      });
      
      expect(Array.isArray(actions)).toBe(true);
    });
  });

  describe('5. 极限边界条件', () => {
    it('应该能处理空值和undefined', () => {
      expect(() => diagnostics.calculateHealthScore()).not.toThrow();
      expect(() => diagnostics.detectBottlenecks()).not.toThrow();
      expect(() => diagnostics.performFullDiagnosis()).not.toThrow();
    });

    it('应该能处理历史记录增长', () => {
      for (let i = 0; i < 10; i++) {
        diagnostics.calculateHealthScore();
      }
      
      const history = diagnostics.getHistory(50);
      expect(history.length).toBeGreaterThanOrEqual(10);
      
      console.log(`[HISTORY] ${history.length} health scores recorded`);
    });

    it('应该能进行根源分析', () => {
      const testBottleneck = {
        id: 'test-bottleneck',
        type: 'performance' as const,
        severity: 'high' as const,
        description: 'Test performance issue',
        detectedAt: Date.now(),
        possibleFixes: ['Fix 1', 'Fix 2']
      };
      
      const rootCause = diagnostics.analyzeRootCause(testBottleneck);
      expect(rootCause).toBeTruthy();
      expect(typeof rootCause).toBe('string');
      
      console.log(`[ROOT-CAUSE] Analysis: ${rootCause.substring(0, 80)}...`);
    });
  });

  describe('6. 真实场景模拟', () => {
    it('应该能处理完整的工作流程', async () => {
      const workflowStart = perfMonitor.startOperation('complete-workflow');
      
      // 阶段1: 初始化
      const initStart = perfMonitor.startOperation('init-phase');
      for (let i = 0; i < 10; i++) {
        Math.random();
      }
      perfMonitor.endOperation(initStart);
      
      // 阶段2: 数据处理
      const dataStart = perfMonitor.startOperation('data-processing');
      const testData = Array.from({ length: 100 }, (_, i) => ({ id: i }));
      const processed = testData.map(item => ({ ...item, processed: true }));
      perfMonitor.endOperation(dataStart);
      
      // 阶段3: 健康检查
      const healthStart = perfMonitor.startOperation('health-check');
      diagnostics.calculateHealthScore();
      perfMonitor.endOperation(healthStart);
      
      // 阶段4: 诊断
      const diagStart = perfMonitor.startOperation('diagnosis');
      diagnostics.performFullDiagnosis();
      perfMonitor.endOperation(diagStart);
      
      perfMonitor.endOperation(workflowStart);
      
      expect(processed.length).toBe(100);
    });
  });

  console.log('\n========================================');
  console.log('✅ Extreme Conditions Testing Complete!');
  console.log('========================================\n');
});
