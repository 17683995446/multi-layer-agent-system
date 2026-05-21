import { useSystemStore } from '@/stores/systemStore';

export interface ChaosTestConfig {
  name: string;
  duration: number; // 测试持续时间（毫秒）
  concurrency: number; // 并发操作数
  chaosLevel: 'low' | 'medium' | 'high' | 'extreme'; // 混乱程度
}

export interface ChaosIssue {
  id: string;
  type: 'error' | 'warning' | 'inconsistency' | 'performance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  timestamp: number;
  context?: any;
}

export class ChaosTestRunner {
  private isRunning = false;
  private issues: ChaosIssue[] = [];
  private operationsCompleted = 0;
  private errors = 0;
  private warnings = 0;
  private startTimestamp = 0;
  private operationLog: Array<{ op: string; ts: number; success: boolean }> = [];
  private abortController = new AbortController();

  private CHAOS_CONFIGS = {
    low: { taskFailureRate: 0.1, invalidDataRate: 0.05, rapidUpdateRate: 0.2 },
    medium: { taskFailureRate: 0.2, invalidDataRate: 0.15, rapidUpdateRate: 0.4 },
    high: { taskFailureRate: 0.35, invalidDataRate: 0.25, rapidUpdateRate: 0.6 },
    extreme: { taskFailureRate: 0.5, invalidDataRate: 0.4, rapidUpdateRate: 0.8 }
  };

  constructor() {
    console.log('🎯 ChaosTestRunner initialized');
  }

  async runChaosTest(config: ChaosTestConfig): Promise<ChaosIssue[]> {
    if (this.isRunning) {
      throw new Error('Test already running');
    }

    this.isRunning = true;
    this.issues = [];
    this.operationsCompleted = 0;
    this.errors = 0;
    this.warnings = 0;
    this.startTimestamp = Date.now();
    this.abortController = new AbortController();
    this.operationLog = [];

    console.log(`\n🔥 STARTING CHAOS TEST: ${config.name}`);
    console.log(`   Duration: ${(config.duration / 1000).toFixed(1)}s`);
    console.log(`   Concurrency: ${config.concurrency}`);
    console.log(`   Chaos Level: ${config.chaosLevel}`);

    const store = useSystemStore.getState();
    const chaosConfig = this.CHAOS_CONFIGS[config.chaosLevel];

    // 记录初始状态
    const initialState = this.captureState(store);
    console.log('📊 Initial state captured');

    try {
      // 并行运行多个混乱场景
      const tasks = [];

      for (let i = 0; i < config.concurrency; i++) {
        tasks.push(this.chaosLoop(i, store, chaosConfig, config.duration));
      }

      await Promise.all(tasks);

    } catch (error) {
      this.issues.push({
        id: `critical-${Date.now()}`,
        type: 'error',
        severity: 'critical',
        description: 'Test failed catastrophically',
        timestamp: Date.now(),
        context: { error }
      });
    } finally {
      // 记录最终状态和对比
      const finalState = this.captureState(store);
      this.compareStates(initialState, finalState);

      // 生成报告
      this.generateReport(config);
      this.isRunning = false;
    }

    return this.issues;
  }

  private async chaosLoop(workerId: number, store: any, chaos: any, duration: number) {
    const endTime = Date.now() + duration;
    const operations = [
      this.randomOperation.bind(this),
      this.rapidTaskUpdates.bind(this),
      this.memoryStress.bind(this),
      this.notificationFlood.bind(this),
      this.layerStateFlicker.bind(this),
      this.invalidDataTest.bind(this)
    ];

    while (Date.now() < endTime && !this.abortController.signal.aborted) {
      const randomOp = operations[Math.floor(Math.random() * operations.length)];
      
      try {
        await randomOp(store, chaos, workerId);
        this.operationsCompleted++;
        this.operationLog.push({ op: randomOp.name, ts: Date.now(), success: true });
      } catch (error) {
        this.errors++;
        this.issues.push({
          id: `err-${Date.now()}-${Math.random()}`,
          type: 'error',
          severity: this.errors < 10 ? 'medium' : 'high',
          description: `Operation failed in worker ${workerId}`,
          timestamp: Date.now(),
          context: { error: String(error) }
        });
        this.operationLog.push({ op: randomOp.name, ts: Date.now(), success: false });
      }

      // 随机延迟，制造混乱
      await this.sleep(Math.random() * (chaos.rapidUpdateRate ? 50 : 200));
    }
  }

  private async randomOperation(store: any, chaos: any, workerId: number) {
    const rand = Math.random();
    
    if (rand < 0.3) {
      await this.createAndExecuteTask(store, chaos);
    } else if (rand < 0.5) {
      this.createMemory(store, chaos);
    } else if (rand < 0.7) {
      this.createNotification(store, chaos);
    } else if (rand < 0.85) {
      this.updateRandomLayer(store);
    } else {
      this.mixRandomOperations(store);
    }
  }

  private async createAndExecuteTask(store: any, chaos: any) {
    const taskTypes = ['data_processing', 'analysis', 'reporting', 'integration', 'learning', 'optimization'];
    const randomType = taskTypes[Math.floor(Math.random() * taskTypes.length)];
    
    const task = store.addTask({
      name: `chaos-${randomType}-${Date.now()}-${Math.random()}`,
      priority: Math.floor(Math.random() * 5) + 1,
      input: {
        // 有时注入无效数据
        ...(Math.random() < chaos.invalidDataRate ? { invalidData: true } : {}),
        delay: Math.random() * 2000,
        shouldFail: Math.random() < chaos.taskFailureRate
      }
    });

    if (Math.random() < 0.7) {
      await store.executeTask(task.id);
    }
  }

  private rapidTaskUpdates(store: any, chaos: any) {
    // 对同一任务进行快速、并发的更新
    const tasks = store.tasks;
    if (tasks.length === 0) return;

    const task = tasks[Math.floor(Math.random() * tasks.length)];
    
    // 快速多次更新
    const updates = [
      { status: 'running' as const },
      { status: 'paused' as const },
      { status: 'running' as const },
      { status: 'completed' as const }
    ];

    updates.forEach((update, i) => {
      setTimeout(() => {
        try {
          store.updateTask(task.id, update);
        } catch (e) {
          // 忽略错误，这是测试的一部分
        }
      }, i * 5);
    });
  }

  private memoryStress(store: any, chaos: any) {
    const memoryTypes = ['experience', 'knowledge', 'strategy', 'insight', 'observation'] as const;
    const randomType = memoryTypes[Math.floor(Math.random() * memoryTypes.length)];
    
    // 创建各种大小的记忆，有些很大
    const contentSize = Math.random() < chaos.invalidDataRate ? 
      100000 : // 异常大的数据
      Math.random() * 500;
    
    const content = 'x'.repeat(Math.floor(contentSize));
    
    store.addMemory({
      type: randomType,
      content,
      relevance: Math.random()
    });
  }

  private notificationFlood(store: any, chaos: any) {
    const types = ['info', 'success', 'warning', 'error'] as const;
    const count = Math.random() < chaos.rapidUpdateRate ? 50 : 10;
    
    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const messages = {
        info: ['System update', 'New feature', 'Job complete', 'Sync done'],
        success: ['Task done', 'Backup finished', 'Deployed', 'Data imported'],
        warning: ['High load', 'Low space', 'Slow network', 'Cert expiring'],
        error: ['Connection lost', 'Task failed', 'Server error', 'Auth failed']
      };
      
      store.addNotification({
        type,
        message: `${messages[type][Math.floor(Math.random() * messages[type].length)]} (${Date.now()})`,
        read: false
      });
    }
  }

  private layerStateFlicker(store: any) {
    // 快速切换层级状态
    const layerCount = store.layers.length;
    if (layerCount === 0) return;
    
    const layerId = Math.floor(Math.random() * layerCount);
    const statuses = ['idle', 'active', 'processing', 'active', 'idle'];
    
    statuses.forEach((status, i) => {
      setTimeout(() => {
        try {
          store.updateLayerStatus(layerId, {
            status: status as any,
            metrics: {
              cpuUsage: Math.random() * 100,
              memoryUsage: Math.random() * 100
            }
          });
        } catch (e) {
          // 忽略错误
        }
      }, i * 2);
    });
  }

  private invalidDataTest(store: any, chaos: any) {
    if (Math.random() > chaos.invalidDataRate) return;
    
    // 尝试创建无效数据
    try {
      store.addTask({
        name: undefined as any, // 无效名称
        priority: 999 as any, // 无效优先级
        input: { invalid: true }
      });
      this.warnings++;
    } catch (error) {
      // 错误处理是好的，我们在测试错误处理
    }
  }

  private mixRandomOperations(store: any) {
    // 同时执行多个不同类型的操作
    const ops = [];
    for (let i = 0; i < 3; i++) {
      ops.push(Promise.resolve().then(() => {
        this.createMemory(store, { invalidDataRate: 0 });
      }));
      ops.push(Promise.resolve().then(() => {
        this.createNotification(store, { invalidDataRate: 0 });
      }));
      ops.push(Promise.resolve().then(() => {
        this.updateRandomLayer(store);
      }));
    }
  }

  private createMemory(store: any, chaos: any) {
    store.addMemory({
      type: 'experience',
      content: `mem-${Date.now()}`,
      relevance: Math.random()
    });
  }

  private createNotification(store: any, chaos: any) {
    store.addNotification({
      type: 'info',
      message: `notify-${Date.now()}`,
      read: false
    });
  }

  private updateRandomLayer(store: any) {
    const randomLayer = Math.floor(Math.random() * store.layers.length);
    store.updateLayerStatus(randomLayer, {
      status: 'active',
      metrics: {
        cpuUsage: Math.random() * 60,
        memoryUsage: Math.random() * 40
      }
    });
  }

  private captureState(store: any) {
    return {
      tasksCount: store.tasks.length,
      memoriesCount: store.memories.length,
      notificationsCount: store.notifications.length,
      timestamp: Date.now(),
      taskStatuses: store.tasks.map((t: any) => t.status),
      layerStatuses: store.layers.map((l: any) => l.status)
    };
  }

  private compareStates(initial: any, final: any) {
    // 检查任务状态是否合理
    const tasksInState = final.tasksCount - initial.tasksCount;
    console.log(`📈 Tasks change: ${tasksInState}`);
    
    if (tasksInState > 10000) {
      this.issues.push({
        id: 'state-tasks-overflow',
        type: 'inconsistency',
        severity: 'critical',
        description: `Task count increased dramatically: ${tasksInState}`,
        timestamp: Date.now(),
        context: { initial: initial.tasksCount, final: final.tasksCount }
      });
    }
    
    // 检查通知数量
    if (final.notificationsCount > 1000) {
      this.issues.push({
        id: 'notification-flood',
        type: 'warning',
        severity: 'high',
        description: 'Notification count is extremely high',
        timestamp: Date.now()
      });
    }
  }

  private generateReport(config: ChaosTestConfig) {
    const duration = Date.now() - this.startTimestamp;
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 CHAOS TEST REPORT');
    console.log('='.repeat(80));
    console.log(`Test: ${config.name}`);
    console.log(`Duration: ${(duration / 1000).toFixed(1)}s`);
    console.log(`Operations: ${this.operationsCompleted}`);
    console.log(`Errors: ${this.errors}`);
    console.log(`Warnings: ${this.warnings}`);
    console.log(`Issues detected: ${this.issues.length}`);
    console.log('\nBy Severity:');
    console.log(`  Critical: ${this.issues.filter(i => i.severity === 'critical').length}`);
    console.log(`  High: ${this.issues.filter(i => i.severity === 'high').length}`);
    console.log(`  Medium: ${this.issues.filter(i => i.severity === 'medium').length}`);
    console.log(`  Low: ${this.issues.filter(i => i.severity === 'low').length}`);
    console.log('\nIssues:');
    this.issues.slice(0, 10).forEach(issue => {
      console.log(`  [${issue.severity.toUpperCase()}] ${issue.description}`);
    });
    if (this.issues.length > 10) {
      console.log(`  ... and ${this.issues.length - 10} more`);
    }
    console.log('='.repeat(80));
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const chaosTestRunner = new ChaosTestRunner();
