import { useSystemStore } from '@/stores/systemStore';

export interface MassiveChaosConfig {
  name: string;
  duration: number;
  concurrency: number;
  operationsPerSecond: number;
  chaosLevel: 'massive' | 'extreme' | 'apocalyptic';
}

export interface ChaosIssue {
  id: string;
  type: 'error' | 'warning' | 'inconsistency' | 'performance' | 'memory';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  timestamp: number;
  context?: any;
}

interface TestMetrics {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  operationsPerSecond: number;
  memoryUsageMB: number;
  domNodes: number;
  errors: string[];
  warnings: string[];
  performanceDegradation: number;
}

export class MassiveChaosRunner {
  private isRunning = false;
  private abortController = new AbortController();
  private metrics: TestMetrics = {
    totalOperations: 0,
    successfulOperations: 0,
    failedOperations: 0,
    operationsPerSecond: 0,
    memoryUsageMB: 0,
    domNodes: 0,
    errors: [],
    warnings: [],
    performanceDegradation: 0
  };
  private issues: ChaosIssue[] = [];
  private startTime = 0;
  private operationLog: Array<{ op: string; ts: number; success: boolean; duration: number }> = [];

  constructor() {
    console.log('🔥 MassiveChaosRunner initialized - Ready for APOCALYPTIC testing');
  }

  async runMassiveChaosTest(config: MassiveChaosConfig): Promise<ChaosIssue[]> {
    if (this.isRunning) {
      throw new Error('Test already running');
    }

    this.isRunning = true;
    this.abortController = new AbortController();
    this.issues = [];
    this.startTime = Date.now();
    this.operationLog = [];
    this.resetMetrics();

    console.log('\n' + '='.repeat(80));
    console.log('🔥🔥🔥 MASSIVE CHAOS TEST INITIATED 🔥🔥🔥');
    console.log('='.repeat(80));
    console.log(`Configuration: ${config.name}`);
    console.log(`Duration: ${(config.duration / 60000).toFixed(1)} minutes`);
    console.log(`Concurrency: ${config.concurrency} workers`);
    console.log(`Operations/sec: ${config.operationsPerSecond}`);
    console.log(`Chaos Level: ${config.chaosLevel}`);
    console.log('='.repeat(80));

    const store = useSystemStore.getState();
    const initialMetrics = this.captureMetrics(store);
    
    try {
      await this.runMassiveTest(store, config);
    } catch (error) {
      this.recordError('Test execution', error);
    } finally {
      const finalMetrics = this.captureMetrics(store);
      this.analyzeResults(initialMetrics, finalMetrics, config);
      this.generateMassiveReport();
      this.isRunning = false;
    }

    return this.issues;
  }

  private async runMassiveTest(store: any, config: MassiveChaosConfig) {
    const workers: Promise<void>[] = [];
    const operationsPerWorker = Math.ceil(config.concurrency * config.operationsPerSecond / config.concurrency);
    const endTime = Date.now() + config.duration;

    console.log(`\n🚀 Starting ${config.concurrency} chaos workers...`);

    for (let workerId = 0; workerId < config.concurrency; workerId++) {
      workers.push(
        this.runWorker(workerId, store, operationsPerWorker, endTime, config)
      );
    }

    await Promise.all(workers);
  }

  private async runWorker(workerId: number, store: any, opsCount: number, endTime: number, config: MassiveChaosConfig): Promise<void> {
    const chaosConfig = this.getChaosConfig(config.chaosLevel);
    const operations = [
      () => this.chaosTaskCreation(store, chaosConfig),
      () => this.chaosMemoryOperations(store, chaosConfig),
      () => this.chaosNotificationFlood(store, chaosConfig),
      () => this.chaosStateFlickering(store),
      () => this.chaosConcurrentWrites(store, chaosConfig),
      () => this.chaosBoundaryConditions(store),
      () => this.chaosRaceConditions(store, chaosConfig),
      () => this.chaosMemoryLeak(store, chaosConfig)
    ];

    while (Date.now() < endTime && !this.abortController.signal.aborted) {
      const opStart = Date.now();
      const operation = operations[Math.floor(Math.random() * operations.length)];
      
      try {
        await operation();
        this.metrics.successfulOperations++;
        this.operationLog.push({
          op: operation.name,
          ts: Date.now(),
          success: true,
          duration: Date.now() - opStart
        });
      } catch (error) {
        this.metrics.failedOperations++;
        this.metrics.errors.push(`Worker ${workerId}: ${error}`);
        this.recordError(`Worker ${workerId}`, error);
        this.operationLog.push({
          op: operation.name,
          ts: Date.now(),
          success: false,
          duration: Date.now() - opStart
        });
      }

      this.metrics.totalOperations++;
      
      // 动态延迟以达到目标 ops
      const delay = Math.random() * 100 / config.operationsPerSecond;
      await this.sleep(delay);
    }
  }

  private async chaosTaskCreation(store: any, chaos: any) {
    const priorities = [0, 1, 2, 3, 4];
    const tasks = store.tasks;
    
    // 快速创建大量任务
    const batchSize = Math.floor(Math.random() * 10) + 1;
    for (let i = 0; i < batchSize; i++) {
      const task = store.addTask({
        name: `chaos-${Date.now()}-${Math.random()}`,
        priority: priorities[Math.floor(Math.random() * priorities.length)],
        input: {
          delay: Math.random() * 2000,
          shouldFail: Math.random() < chaos.taskFailureRate,
          invalidData: Math.random() < chaos.invalidDataRate
        }
      });
      
      // 有时执行任务
      if (Math.random() < 0.3) {
        try {
          await store.executeTask(task.id);
        } catch (e) {
          // 忽略执行错误
        }
      }
    }
  }

  private async chaosMemoryOperations(store: any, chaos: any) {
    const types = ['experience', 'pattern', 'knowledge', 'insight'] as const;
    const type = types[Math.floor(Math.random() * types.length)];
    
    // 有时创建巨大的内存对象
    const size = Math.random() < chaos.largeDataRate ? 50000 : 500;
    const content = 'x'.repeat(size);
    
    store.addMemory({
      type,
      content,
      relevance: Math.random()
    });
  }

  private async chaosNotificationFlood(store: any, chaos: any) {
    const types = ['info', 'success', 'warning', 'error'] as const;
    const count = Math.random() < chaos.floodRate ? 100 : 20;
    
    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      store.addNotification({
        type,
        message: `Notification-${Date.now()}-${i}`,
        read: false
      });
    }
  }

  private async chaosStateFlickering(store: any) {
    const layerCount = store.layers.length;
    if (layerCount === 0) return;
    
    // 快速切换多个层级的状态
    const layersToUpdate = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < layersToUpdate; i++) {
      const layerId = Math.floor(Math.random() * layerCount);
      const statuses = ['idle', 'active', 'processing', 'error'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      try {
        store.updateLayerStatus(layerId, {
          status: status as any,
          metrics: {
            cpuUsage: Math.random() * 100,
            memoryUsage: Math.random() * 100,
            taskCount: Math.floor(Math.random() * 100),
            avgResponseTime: Math.random() * 1000,
            successRate: Math.random()
          }
        });
      } catch (e) {
        // 忽略错误
      }
    }
  }

  private async chaosConcurrentWrites(store: any, chaos: any) {
    // 模拟并发写入冲突
    const writePromises: Promise<any>[] = [];
    const writeCount = Math.floor(Math.random() * 5) + 1;
    
    for (let i = 0; i < writeCount; i++) {
      writePromises.push(Promise.resolve().then(() => {
        const tasks = store.tasks;
        if (tasks.length > 0) {
          const task = tasks[Math.floor(Math.random() * tasks.length)];
          return store.updateTask(task.id, {
            status: ['running', 'completed', 'failed'][Math.floor(Math.random() * 3)] as any,
            metadata: { updatedAt: Date.now(), writer: i }
          });
        }
      }));
    }
    
    try {
      await Promise.all(writePromises);
    } catch (e) {
      this.metrics.warnings.push(`Concurrent write conflict: ${e}`);
    }
  }

  private async chaosBoundaryConditions(store: any) {
    // 测试边界条件
    const testCases = [
      () => store.addTask({ name: '', priority: -1 as any, input: {} }),
      () => store.addMemory({ type: 'invalid' as any, content: '', relevance: -1 }),
      () => store.updateLayerStatus(999, { status: 'invalid' as any }),
      () => store.retrieveRelevantMemories('', 10000)
    ];
    
    const testCase = testCases[Math.floor(Math.random() * testCases.length)];
    try {
      testCase();
    } catch (e) {
      this.metrics.warnings.push(`Boundary condition test: ${e}`);
    }
  }

  private async chaosRaceConditions(store: any, chaos: any) {
    if (Math.random() > chaos.raceConditionRate) return;
    
    // 模拟竞态条件
    const task = store.addTask({
      name: `race-test-${Date.now()}`,
      input: { raceCondition: true }
    });
    
    // 快速连续执行同一个任务
    const executions = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < executions; i++) {
      try {
        await store.executeTask(task.id);
      } catch (e) {
        // 忽略
      }
    }
  }

  private async chaosMemoryLeak(store: any, chaos: any) {
    if (Math.random() > chaos.memoryLeakRate) return;
    
    // 创建不会被清理的引用
    const leaked: any[] = [];
    for (let i = 0; i < 100; i++) {
      leaked.push({
        timestamp: Date.now(),
        data: Array(100).fill(Math.random())
      });
    }
    
    // 存储在全局（模拟内存泄漏）
    (window as any).__chaosLeakedData = leaked;
  }

  private getChaosConfig(level: string) {
    const configs = {
      massive: {
        taskFailureRate: 0.15,
        invalidDataRate: 0.1,
        largeDataRate: 0.05,
        floodRate: 0.3,
        raceConditionRate: 0.2,
        memoryLeakRate: 0.05
      },
      extreme: {
        taskFailureRate: 0.25,
        invalidDataRate: 0.2,
        largeDataRate: 0.1,
        floodRate: 0.5,
        raceConditionRate: 0.35,
        memoryLeakRate: 0.1
      },
      apocalyptic: {
        taskFailureRate: 0.4,
        invalidDataRate: 0.35,
        largeDataRate: 0.2,
        floodRate: 0.7,
        raceConditionRate: 0.5,
        memoryLeakRate: 0.2
      }
    };
    return configs[level as keyof typeof configs] || configs.massive;
  }

  private captureMetrics(store: any): any {
    return {
      tasksCount: store.tasks.length,
      memoriesCount: store.memories.length,
      notificationsCount: store.notifications.length,
      layersCount: store.layers.length,
      timestamp: Date.now()
    };
  }

  private analyzeResults(initial: any, final: any, config: MassiveChaosConfig) {
    const duration = Date.now() - this.startTime;
    this.metrics.operationsPerSecond = this.metrics.totalOperations / (duration / 1000);

    // 检查数据一致性
    if (final.tasksCount - initial.tasksCount > 50000) {
      this.issues.push({
        id: 'task-overflow',
        type: 'inconsistency',
        severity: 'critical',
        description: `Task count exploded: ${initial.tasksCount} -> ${final.tasksCount}`,
        timestamp: Date.now()
      });
    }

    if (final.notificationsCount > 5000) {
      this.issues.push({
        id: 'notification-flood',
        type: 'warning',
        severity: 'high',
        description: `Excessive notifications: ${final.notificationsCount}`,
        timestamp: Date.now()
      });
    }

    if (final.memoriesCount > 10000) {
      this.issues.push({
        id: 'memory-overflow',
        type: 'memory',
        severity: 'high',
        description: `Memory entries overflow: ${final.memoriesCount}`,
        timestamp: Date.now()
      });
    }

    // 检查错误率
    const errorRate = this.metrics.failedOperations / this.metrics.totalOperations;
    if (errorRate > 0.3) {
      this.issues.push({
        id: 'high-error-rate',
        type: 'error',
        severity: 'critical',
        description: `Error rate too high: ${(errorRate * 100).toFixed(1)}%`,
        timestamp: Date.now()
      });
    }
  }

  private recordError(context: string, error: any) {
    this.issues.push({
      id: `error-${Date.now()}-${Math.random()}`,
      type: 'error',
      severity: this.issues.length < 5 ? 'high' : 'medium',
      description: `${context}: ${String(error)}`,
      timestamp: Date.now()
    });
  }

  private generateMassiveReport() {
    const duration = Date.now() - this.startTime;
    const durationMin = duration / 60000;
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 MASSIVE CHAOS TEST REPORT');
    console.log('='.repeat(80));
    console.log(`Duration: ${durationMin.toFixed(1)} minutes`);
    console.log(`Total Operations: ${this.metrics.totalOperations.toLocaleString()}`);
    console.log(`Successful: ${this.metrics.successfulOperations.toLocaleString()}`);
    console.log(`Failed: ${this.metrics.failedOperations.toLocaleString()}`);
    console.log(`Operations/sec: ${this.metrics.operationsPerSecond.toFixed(2)}`);
    console.log(`\nIssues Found: ${this.issues.length}`);
    console.log(`Critical: ${this.issues.filter(i => i.severity === 'critical').length}`);
    console.log(`High: ${this.issues.filter(i => i.severity === 'high').length}`);
    console.log(`Medium: ${this.issues.filter(i => i.severity === 'medium').length}`);
    console.log(`Low: ${this.issues.filter(i => i.severity === 'low').length}`);
    
    if (this.issues.length > 0) {
      console.log('\n🔥 Critical Issues:');
      this.issues.filter(i => i.severity === 'critical').slice(0, 5).forEach(issue => {
        console.log(`  - ${issue.description}`);
      });
    }
    
    console.log('='.repeat(80));
  }

  private resetMetrics() {
    this.metrics = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      operationsPerSecond: 0,
      memoryUsageMB: 0,
      domNodes: 0,
      errors: [],
      warnings: [],
      performanceDegradation: 0
    };
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, Math.max(0, ms)));
  }

  stop() {
    this.abortController.abort();
    this.isRunning = false;
  }
}

export const massiveChaosRunner = new MassiveChaosRunner();
