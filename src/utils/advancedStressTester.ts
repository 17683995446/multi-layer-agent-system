import { useSystemStore } from '../stores/systemStore';
import { logger } from './systemLogger';
import { perfMonitor } from './performanceMonitor';

export interface StressTestConfig {
  name: string;
  duration: number; // 毫秒
  operationsPerSecond: number;
  taskBatchSize: number;
  memoryLoad: number;
  enableChaos: boolean;
  chaosProbability: number;
}

export interface StressTestResult {
  config: StressTestConfig;
  startTime: number;
  endTime: number;
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  errors: Error[];
  performanceReport: any;
  averageResponseTime: number;
  maxResponseTime: number;
  memoryUsage: {
    start: number | null;
    end: number | null;
    peak: number | null;
  };
}

class AdvancedStressTester {
  private isRunning: boolean = false;
  private abortController: AbortController | null = null;
  private results: StressTestResult[] = [];

  private defaultConfig: StressTestConfig = {
    name: 'Default Stress Test',
    duration: 30000, // 30秒
    operationsPerSecond: 100,
    taskBatchSize: 10,
    memoryLoad: 100,
    enableChaos: false,
    chaosProbability: 0.05
  };

  constructor() {
    logger.info('TEST', 'AdvancedStressTester initialized');
  }

  // 预定义的测试配置
  static readonly PRESETS = {
    QUICK: {
      name: 'Quick Validation',
      duration: 10000,
      operationsPerSecond: 50,
      taskBatchSize: 5,
      memoryLoad: 50,
      enableChaos: false,
      chaosProbability: 0
    },
    NORMAL: {
      name: 'Normal Load',
      duration: 60000,
      operationsPerSecond: 100,
      taskBatchSize: 10,
      memoryLoad: 100,
      enableChaos: false,
      chaosProbability: 0.02
    },
    HEAVY: {
      name: 'Heavy Load',
      duration: 120000,
      operationsPerSecond: 500,
      taskBatchSize: 50,
      memoryLoad: 500,
      enableChaos: true,
      chaosProbability: 0.05
    },
    EXTREME: {
      name: 'Extreme Chaos',
      duration: 300000,
      operationsPerSecond: 1000,
      taskBatchSize: 100,
      memoryLoad: 1000,
      enableChaos: true,
      chaosProbability: 0.1
    }
  };

  // 开始压力测试
  async startTest(config?: Partial<StressTestConfig>): Promise<StressTestResult> {
    if (this.isRunning) {
      throw new Error('Test is already running');
    }

    this.isRunning = true;
    this.abortController = new AbortController();

    const testConfig: StressTestConfig = { ...this.defaultConfig, ...config };
    const result: StressTestResult = {
      config: testConfig,
      startTime: Date.now(),
      endTime: 0,
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      errors: [],
      performanceReport: null,
      averageResponseTime: 0,
      maxResponseTime: 0,
      memoryUsage: { start: null, end: null, peak: null }
    };

    logger.info('TEST', `Starting stress test: ${testConfig.name}`, testConfig);

    try {
      // 记录初始状态
      result.memoryUsage.start = perfMonitor.getMemoryUsageMB();
      perfMonitor.startFPSMonitoring();
      perfMonitor.clearMetrics();

      // 执行测试
      await this.executeTest(testConfig, result, this.abortController.signal);

    } catch (error) {
      if (error instanceof Error) {
        result.errors.push(error);
        logger.error('TEST', `Test error: ${error.message}`, error);
      }
    } finally {
      result.endTime = Date.now();
      result.memoryUsage.end = perfMonitor.getMemoryUsageMB();
      perfMonitor.stopFPSMonitoring();
      result.performanceReport = perfMonitor.generateReport();
      
      this.isRunning = false;
      this.abortController = null;
      this.results.push(result);

      logger.info('TEST', `Stress test completed: ${testConfig.name}`, {
        duration: result.endTime - result.startTime,
        successRate: ((result.successfulOperations / result.totalOperations) * 100).toFixed(2) + '%'
      });
    }

    return result;
  }

  // 停止当前测试
  stopTest(): void {
    if (this.abortController) {
      this.abortController.abort();
      logger.warn('TEST', 'Stress test stopped manually');
    }
  }

  // 执行实际测试
  private async executeTest(
    config: StressTestConfig,
    result: StressTestResult,
    signal: AbortSignal
  ): Promise<void> {
    const store = useSystemStore.getState();
    const interval = 1000 / config.operationsPerSecond;
    const endTime = Date.now() + config.duration;
    const responseTimes: number[] = [];
    let peakMemory = result.memoryUsage.start || 0;

    // 预加载记忆数据
    logger.info('TEST', `Preloading ${config.memoryLoad} memory entries`);
    for (let i = 0; i < config.memoryLoad; i++) {
      store.addMemory({
        content: `Stress test memory entry ${i}`,
        type: 'experience',
        relevance: Math.random()
      });
    }

    while (Date.now() < endTime && !signal.aborted) {
      const opStart = performance.now();
      
      try {
        result.totalOperations++;
        
        // 随机选择操作类型
        const operationType = this.getRandomOperation(config.enableChaos, config.chaosProbability);
        await this.executeOperation(operationType, config.taskBatchSize, store);
        
        result.successfulOperations++;
      } catch (error) {
        result.failedOperations++;
        if (error instanceof Error) {
          result.errors.push(error);
        }
      }

      // 记录响应时间
      const opDuration = performance.now() - opStart;
      responseTimes.push(opDuration);
      if (opDuration > result.maxResponseTime) {
        result.maxResponseTime = opDuration;
      }

      // 监控内存
      const currentMemory = perfMonitor.getMemoryUsageMB();
      if (currentMemory !== null && currentMemory > peakMemory) {
        peakMemory = currentMemory;
      }
      perfMonitor.recordMemory();

      // 等待下一个操作
      await this.sleep(interval);
    }

    // 计算平均响应时间
    if (responseTimes.length > 0) {
      result.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    }
    result.memoryUsage.peak = peakMemory;
  }

  // 获取随机操作类型
  private getRandomOperation(enableChaos: boolean, chaosProbability: number): string {
    const normalOperations = [
      'addTask', 'updateTask', 'removeTask',
      'addMemory', 'updateMemory',
      'addStrategy', 'updateStrategy',
      'updateLayerStatus', 'addNotification'
    ];

    const chaosOperations = [
      'invalidInput', 'largeData', 'rapidUpdates', 'clearAndRestore'
    ];

    if (enableChaos && Math.random() < chaosProbability) {
      return chaosOperations[Math.floor(Math.random() * chaosOperations.length)];
    }

    return normalOperations[Math.floor(Math.random() * normalOperations.length)];
  }

  // 执行单个操作
  private async executeOperation(operation: string, batchSize: number, store: any): Promise<void> {
    const opId = perfMonitor.startOperation(operation);
    
    try {
      switch (operation) {
        case 'addTask':
          for (let i = 0; i < batchSize; i++) {
            store.addTask({
              name: `Stress Test Task ${Date.now()}-${i}`,
              priority: Math.floor(Math.random() * 5),
              input: { delay: Math.random() * 100 }
            });
          }
          break;

        case 'updateTask':
          const tasks = store.tasks.slice(0, batchSize);
          for (const task of tasks) {
            store.updateTask(task.id, {
              name: task.name + ' (updated)',
              priority: Math.floor(Math.random() * 5)
            });
          }
          break;

        case 'removeTask':
          const tasksToRemove = store.tasks.slice(0, Math.min(batchSize, store.tasks.length));
          for (const task of tasksToRemove) {
            store.removeTask(task.id);
          }
          break;

        case 'addMemory':
          for (let i = 0; i < batchSize; i++) {
            store.addMemory({
              content: `Memory entry ${Date.now()}-${i}: ${this.generateRandomString(100)}`,
              type: ['experience', 'pattern', 'knowledge'][Math.floor(Math.random() * 3)],
              relevance: Math.random()
            });
          }
          break;

        case 'updateMemory':
          const memories = store.memories.slice(0, batchSize);
          for (const memory of memories) {
            store.updateMemory(memory.id, {
              content: memory.content + ' (updated)',
              relevance: Math.random()
            });
          }
          break;

        case 'addStrategy':
          store.addStrategy({
            name: `Strategy ${Date.now()}`,
            description: 'Stress test strategy',
            effectiveness: Math.random(),
            isActive: true
          });
          break;

        case 'updateStrategy':
          if (store.strategies.length > 0) {
            const strategy = store.strategies[0];
            store.updateStrategy(strategy.id, {
              effectiveness: Math.random(),
              lastUpdated: Date.now()
            });
          }
          break;

        case 'updateLayerStatus':
          const layerId = Math.floor(Math.random() * 8) + 1;
          store.updateLayerStatus(layerId, {
            status: ['idle', 'active', 'processing', 'error'][Math.floor(Math.random() * 4)],
            lastUpdate: Date.now()
          });
          break;

        case 'addNotification':
          store.addNotification({
            type: ['info', 'success', 'warn', 'error'][Math.floor(Math.random() * 4)] as any,
            message: `Notification ${Date.now()}`,
            read: false
          });
          break;

        // 混沌测试操作
        case 'invalidInput':
          // 尝试传入无效数据
          try {
            store.addTask({ priority: -1 } as any);
          } catch { /* 预期会失败 */ }
          break;

        case 'largeData':
          store.addMemory({
            content: this.generateRandomString(10000),
            type: 'experience',
            relevance: 0.5
          });
          break;

        case 'rapidUpdates':
          for (let i = 0; i < 10; i++) {
            store.setSystemMode(['idle', 'work', 'learning', 'evolution'][Math.floor(Math.random() * 4)]);
          }
          break;

        case 'clearAndRestore':
          const savedTasks = [...store.tasks];
          store.clearTasks();
          for (const task of savedTasks.slice(0, 10)) {
            store.addTask(task);
          }
          break;
      }
    } finally {
      perfMonitor.endOperation(opId);
    }
  }

  // 生成随机字符串
  private generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // 睡眠函数
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 获取所有测试结果
  getResults(): StressTestResult[] {
    return [...this.results];
  }

  // 清除测试结果
  clearResults(): void {
    this.results = [];
    logger.info('TEST', 'Stress test results cleared');
  }

  // 生成测试报告
  generateReport(): string {
    const report = {
      generatedAt: new Date().toISOString(),
      totalTests: this.results.length,
      results: this.results.map(r => ({
        name: r.config.name,
        duration: r.endTime - r.startTime,
        totalOps: r.totalOperations,
        successRate: r.totalOperations > 0 ? (r.successfulOperations / r.totalOperations * 100).toFixed(2) + '%' : 'N/A',
        avgResponseTime: r.averageResponseTime.toFixed(2) + 'ms',
        maxResponseTime: r.maxResponseTime.toFixed(2) + 'ms',
        memoryPeak: r.memoryUsage.peak ? r.memoryUsage.peak.toFixed(2) + 'MB' : 'N/A',
        errors: r.errors.length
      }))
    };
    return JSON.stringify(report, null, 2);
  }
}

export { AdvancedStressTester };
export const stressTester = new AdvancedStressTester();
