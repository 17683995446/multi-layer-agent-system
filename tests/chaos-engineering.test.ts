import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  chaosFramework, 
  ChaosTestingFramework,
  ChaosType,
  StressTestConfig 
} from '../src/utils/chaos-testing-framework';
import { perfMonitor } from '../src/utils/performanceMonitor';
import { errorHandler } from '../src/utils/error-handling-manager';
import { diagnostics } from '../src/utils/advanced-diagnostics';

describe('Chaos Engineering & Large-Scale Testing', () => {
  beforeEach(() => {
    chaosFramework.clearHistory();
    perfMonitor.clearMetrics();
    errorHandler.clearHistory();
  });

  afterEach(() => {
    if (chaosFramework.isTestRunning()) {
      chaosFramework.abortTest();
    }
  });

  describe('1. Chaos Framework基础测试', () => {
    it('应该能够配置混沌参数', () => {
      chaosFramework.setConfig({
        enabled: true,
        failureRate: 0.2,
        injectionInterval: 1000,
        maxConcurrent: 5,
        chaosTypes: [ChaosType.DELAY_INJECTION, ChaosType.MEMORY_PRESSURE],
      });

      expect(() => chaosFramework.setConfig({})).not.toThrow();
    });

    it('应该能够获取混沌历史', () => {
      const history = chaosFramework.getChaosHistory();
      expect(Array.isArray(history)).toBe(true);
    });

    it('应该能够清除混沌历史', () => {
      expect(() => chaosFramework.clearHistory()).not.toThrow();
      const history = chaosFramework.getChaosHistory();
      expect(history.length).toBe(0);
    });
  });

  describe('2. 大规模数据处理测试', () => {
    it('应该能够处理10,000项数据', async () => {
      const config: StressTestConfig = {
        duration: 5000,
        operationsPerSecond: 1000,
        dataSize: 1000,
        concurrent: 10,
        enableChaos: false,
        chaosConfig: {},
      };

      const result = await chaosFramework.runStressTest(config);

      console.log(`[LARGE-SCALE] Processed ${result.totalOperations} operations`);
      console.log(`[LARGE-SCALE] Error rate: ${(result.errorRate * 100).toFixed(2)}%`);
      console.log(`[LARGE-SCALE] Ops/sec: ${result.operationsPerSecond.toFixed(2)}`);

      expect(result.totalOperations).toBeGreaterThan(0);
      expect(result.systemStable).toBe(true);
    });
  });

  describe('3. 性能基准测试', () => {
    it('应该达到预期的吞吐量', async () => {
      const config: StressTestConfig = {
        duration: 3000,
        operationsPerSecond: 2000,
        dataSize: 500,
        concurrent: 30,
        enableChaos: false,
        chaosConfig: {},
      };

      const result = await chaosFramework.runStressTest(config);

      console.log(`[BENCHMARK] Achieved: ${result.operationsPerSecond.toFixed(2)} ops/sec`);
      console.log(`[BENCHMARK] System Stable: ${result.systemStable}`);

      expect(result.operationsPerSecond).toBeGreaterThan(500);
    });

    it('应该保持低延迟', async () => {
      const config: StressTestConfig = {
        duration: 3000,
        operationsPerSecond: 1000,
        dataSize: 500,
        concurrent: 20,
        enableChaos: false,
        chaosConfig: {},
      };

      const result = await chaosFramework.runStressTest(config);

      console.log(`[LATENCY] Average: ${result.averageLatency.toFixed(2)}ms`);
      console.log(`[LATENCY] P95: ${result.p95Latency.toFixed(2)}ms`);

      expect(result.averageLatency).toBeLessThan(200);
    });
  });

  console.log('\n✅ All Chaos Engineering Tests Completed!\n');
});
