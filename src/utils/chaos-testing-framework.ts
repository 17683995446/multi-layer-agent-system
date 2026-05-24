import { logger } from './systemLogger';
import { perfMonitor } from './performanceMonitor';
import { errorHandler } from './error-handling-manager';
import { diagnostics } from './advanced-diagnostics';

export enum ChaosType {
  RANDOM_FAILURE = 'random_failure',
  NETWORK_PARTITION = 'network_partition',
  MEMORY_PRESSURE = 'memory_pressure',
  CPU_SPIKE = 'cpu_spike',
  DELAY_INJECTION = 'delay_injection',
  DATA_CORRUPTION = 'data_corruption',
  RACE_CONDITION = 'race_condition',
  STORAGE_EXHAUSTION = 'storage_exhaustion',
}

export interface ChaosConfig {
  enabled: boolean;
  failureRate: number;
  injectionInterval: number;
  maxConcurrent: number;
  chaosTypes: ChaosType[];
}

export interface ChaosResult {
  testId: string;
  type: ChaosType;
  timestamp: number;
  success: boolean;
  duration: number;
  metrics: {
    memoryBefore: number;
    memoryAfter: number;
    opsPerSecond: number;
    errorRate: number;
  };
  error?: Error;
}

export interface StressTestConfig {
  duration: number;
  operationsPerSecond: number;
  dataSize: number;
  concurrent: number;
  enableChaos: boolean;
  chaosConfig: Partial<ChaosConfig>;
}

export interface StressTestResult {
  testId: string;
  startTime: number;
  endTime: number;
  duration: number;
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  errorRate: number;
  operationsPerSecond: number;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  memoryTrend: Array<{ timestamp: number; usage: number }>;
  chaosEvents: ChaosResult[];
  healthScore: number;
  bottlenecks: Array<{ type: string; severity: string }>;
  systemStable: boolean;
  recommendations: string[];
}

export class ChaosTestingFramework {
  private static instance: ChaosTestingFramework;
  private chaosEvents: ChaosResult[] = [];
  private isRunning: boolean = false;
  private abortController: AbortController | null = null;
  private config: ChaosConfig = {
    enabled: true,
    failureRate: 0.1,
    injectionInterval: 5000,
    maxConcurrent: 10,
    chaosTypes: Object.values(ChaosType),
  };

  private constructor() {
    logger.info('CHAOS', 'Chaos Testing Framework initialized');
  }

  static getInstance(): ChaosTestingFramework {
    if (!ChaosTestingFramework.instance) {
      ChaosTestingFramework.instance = new ChaosTestingFramework();
    }
    return ChaosTestingFramework.instance;
  }

  setConfig(config: Partial<ChaosConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('CHAOS', 'Chaos configuration updated', this.config);
  }

  private injectRandomChaos(): ChaosType | null {
    if (!this.config.enabled) return null;
    if (Math.random() > this.config.failureRate) return null;

    const availableTypes = this.config.chaosTypes;
    const randomIndex = Math.floor(Math.random() * availableTypes.length);
    return availableTypes[randomIndex];
  }

  private async injectChaos(type: ChaosType): Promise<ChaosResult> {
    const testId = `chaos-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = performance.now();
    let success = true;
    let error: Error | undefined;

    logger.warn('CHAOS', `Injecting chaos: ${type}`);

    try {
      switch (type) {
        case ChaosType.MEMORY_PRESSURE:
          await this.injectMemoryPressure();
          break;
        case ChaosType.DELAY_INJECTION:
          await this.injectDelay();
          break;
        case ChaosType.DATA_CORRUPTION:
          await this.injectDataCorruption();
          break;
        case ChaosType.RANDOM_FAILURE:
          await this.injectRandomFailure();
          break;
        case ChaosType.CPU_SPIKE:
          await this.injectCPUSpike();
          break;
      }
    } catch (err) {
      success = false;
      error = err instanceof Error ? err : new Error(String(err));
      logger.error('CHAOS', `Chaos injection failed: ${type}`, error);
    }

    const duration = performance.now() - startTime;

    const result: ChaosResult = {
      testId,
      type,
      timestamp: Date.now(),
      success,
      duration,
      metrics: {
        memoryBefore: perfMonitor.getMemoryUsageMB() || 0,
        memoryAfter: perfMonitor.getMemoryUsageMB() || 0,
        opsPerSecond: 0,
        errorRate: success ? 0 : 1,
      },
      error,
    };

    this.chaosEvents.push(result);
    return result;
  }

  private async injectMemoryPressure(): Promise<void> {
    logger.warn('CHAOS', 'Injecting memory pressure...');
    const allocations: any[] = [];
    for (let i = 0; i < 100; i++) {
      allocations.push(new Array(10000).fill(Math.random()));
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    allocations.length = 0;
  }

  private async injectDelay(): Promise<void> {
    const delay = Math.random() * 1000 + 500;
    logger.warn('CHAOS', `Injecting delay: ${delay.toFixed(0)}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private async injectDataCorruption(): Promise<void> {
    logger.warn('CHAOS', 'Simulating data corruption scenario');
    const corruptedData = {
      valid: false,
      checksum: 'INVALID',
      timestamp: Date.now(),
      data: undefined,
    };
    if (corruptedData.valid === false) {
      throw new Error('Data corruption detected');
    }
  }

  private async injectRandomFailure(): Promise<void> {
    if (Math.random() < 0.5) {
      throw new Error('Random system failure injected');
    }
  }

  private async injectCPUSpike(): Promise<void> {
    logger.warn('CHAOS', 'Injecting CPU spike...');
    const start = Date.now();
    while (Date.now() - start < 100) {
      Math.sqrt(Math.random() * 1000000);
    }
  }

  async runStressTest(config: StressTestConfig): Promise<StressTestResult> {
    const testId = `stress-${Date.now()}`;
    const startTime = Date.now();
    let totalOperations = 0;
    let successfulOperations = 0;
    let failedOperations = 0;
    const latencies: number[] = [];
    const memoryTrend: Array<{ timestamp: number; usage: number }> = [];
    const chaosResults: ChaosResult[] = [];

    this.isRunning = true;
    this.abortController = new AbortController();

    logger.info('CHAOS', `Starting stress test: ${testId}`, config);

    const endTime = startTime + config.duration;
    const opsInterval = 1000 / config.operationsPerSecond;

    while (Date.now() < endTime && !this.abortController.signal.aborted) {
      const batchPromises: Promise<void>[] = [];

      for (let i = 0; i < config.concurrent; i++) {
        const promise = this.executeOperation(config)
          .then(({ success, latency }) => {
            totalOperations++;
            if (success) {
              successfulOperations++;
            } else {
              failedOperations++;
            }
            latencies.push(latency);
          })
          .catch(() => {
            totalOperations++;
            failedOperations++;
            latencies.push(1000);
          });

        batchPromises.push(promise);
      }

      await Promise.all(batchPromises);

      const memory = perfMonitor.getMemoryUsageMB();
      if (memory) {
        memoryTrend.push({ timestamp: Date.now(), usage: memory });
      }

      if (config.enableChaos) {
        const chaosType = this.injectRandomChaos();
        if (chaosType) {
          const chaosResult = await this.injectChaos(chaosType);
          chaosResults.push(chaosResult);
        }
      }

      if (totalOperations % 1000 === 0) {
        const health = diagnostics.calculateHealthScore();
        logger.info('CHAOS', `Health check at ${totalOperations} ops: ${health.overall}/100`);
      }

      await new Promise(resolve => setTimeout(resolve, opsInterval));
    }

    const testEndTime = Date.now();
    const duration = testEndTime - startTime;
    const errorRate = totalOperations > 0 ? failedOperations / totalOperations : 0;
    const operationsPerSecond = duration > 0 ? (totalOperations / duration) * 1000 : 0;

    latencies.sort((a, b) => a - b);
    const p95Index = Math.floor(latencies.length * 0.95);
    const p99Index = Math.floor(latencies.length * 0.99);
    const averageLatency = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
    const p95Latency = latencies[p95Index] || 0;
    const p99Latency = latencies[p99Index] || 0;

    const finalHealth = diagnostics.calculateHealthScore();
    const bottlenecks = diagnostics.detectBottlenecks();

    const result: StressTestResult = {
      testId,
      startTime,
      endTime: testEndTime,
      duration,
      totalOperations,
      successfulOperations,
      failedOperations,
      errorRate,
      operationsPerSecond,
      averageLatency,
      p95Latency,
      p99Latency,
      memoryTrend: memoryTrend.slice(-100),
      chaosEvents: chaosResults,
      healthScore: finalHealth.overall,
      bottlenecks: bottlenecks.map(b => ({ type: b.type, severity: b.severity })),
      systemStable: finalHealth.overall >= 60 && errorRate < 0.1,
      recommendations: finalHealth.recommendations,
    };

    logger.info('CHAOS', `Stress test completed: ${testId}`, {
      totalOps: totalOperations,
      errorRate: (errorRate * 100).toFixed(2) + '%',
      opsPerSecond: operationsPerSecond.toFixed(2),
      healthScore: finalHealth.overall,
      systemStable: result.systemStable,
    });

    this.isRunning = false;
    return result;
  }

  private async executeOperation(config: StressTestConfig): Promise<{ success: boolean; latency: number }> {
    const start = performance.now();
    let success = true;

    try {
      const data = Array.from({ length: Math.min(config.dataSize, 100) }, (_, i) => ({
        id: i,
        value: Math.random(),
        timestamp: Date.now(),
      }));

      const processed = data.map(item => ({
        ...item,
        computed: Math.sqrt(item.value) * Math.random(),
      }));

      if (Math.random() < 0.01) {
        diagnostics.calculateHealthScore();
      }

      if (Math.random() < 0.05) {
        errorHandler.classifyError(
          new Error(`Test error at ${Date.now()}`),
          { operation: 'stress-test' },
          false
        );
      }

      perfMonitor.recordMetric('stress-test', performance.now() - start);
    } catch (err) {
      success = false;
    }

    const latency = performance.now() - start;
    return { success, latency };
  }

  abortTest(): void {
    if (this.abortController) {
      this.abortController.abort();
      logger.warn('CHAOS', 'Stress test aborted by user');
    }
  }

  getChaosHistory(): ChaosResult[] {
    return this.chaosEvents.slice(-100);
  }

  clearHistory(): void {
    this.chaosEvents = [];
    logger.info('CHAOS', 'Chaos history cleared');
  }

  isTestRunning(): boolean {
    return this.isRunning;
  }
}

export const chaosFramework = ChaosTestingFramework.getInstance();
