import { useSystemStore } from '@/stores/systemStore';
import { healthMonitor } from './deep-health-monitor';

export interface DeepStressTestScenario {
  name: string;
  duration: number; // seconds
  dimensions: {
    cpu?: {
      operationsPerSecond: number;
      complexity: 'low' | 'medium' | 'high';
    };
    memory?: {
      allocationRate: number; // per second
      retentionTime: number; // ms
      maxSize: number;
    };
    storage?: {
      writeRate: number;
      readRate: number;
      dataSize: number;
    };
    concurrent?: {
      parallelTasks: number;
      synchronizationLevel: 'none' | 'low' | 'high';
    };
    error?: {
      failureRate: number;
      recoveryTime: number;
    };
  };
}

export const DEEP_STRESS_SCENARIOS: DeepStressTestScenario[] = [
  {
    name: 'Sustained Load Test',
    duration: 600, // 10 minutes
    dimensions: {
      cpu: { operationsPerSecond: 50, complexity: 'medium' },
      memory: { allocationRate: 10, retentionTime: 5000, maxSize: 100 },
      storage: { writeRate: 5, readRate: 10, dataSize: 1000 },
      concurrent: { parallelTasks: 20, synchronizationLevel: 'low' },
      error: { failureRate: 0.05, recoveryTime: 1000 }
    }
  },
  {
    name: 'Memory Exhaustion Test',
    duration: 300, // 5 minutes
    dimensions: {
      memory: { allocationRate: 50, retentionTime: 10000, maxSize: 500 },
      storage: { writeRate: 20, readRate: 30, dataSize: 5000 },
      error: { failureRate: 0.1, recoveryTime: 2000 }
    }
  },
  {
    name: 'Concurrency Chaos Test',
    duration: 480, // 8 minutes
    dimensions: {
      concurrent: { parallelTasks: 100, synchronizationLevel: 'high' },
      cpu: { operationsPerSecond: 100, complexity: 'high' },
      error: { failureRate: 0.15, recoveryTime: 500 }
    }
  },
  {
    name: 'Sustained Write Test',
    duration: 600, // 10 minutes
    dimensions: {
      storage: { writeRate: 50, readRate: 20, dataSize: 2000 },
      memory: { allocationRate: 20, retentionTime: 3000, maxSize: 200 },
      error: { failureRate: 0.08, recoveryTime: 1500 }
    }
  },
  {
    name: 'Full System Burn-in',
    duration: 900, // 15 minutes
    dimensions: {
      cpu: { operationsPerSecond: 75, complexity: 'high' },
      memory: { allocationRate: 30, retentionTime: 8000, maxSize: 300 },
      storage: { writeRate: 30, readRate: 40, dataSize: 3000 },
      concurrent: { parallelTasks: 50, synchronizationLevel: 'high' },
      error: { failureRate: 0.1, recoveryTime: 1000 }
    }
  }
];

export class DeepStressTestRunner {
  private isRunning = false;
  private startTime = 0;
  private operations = {
    tasksCreated: 0,
    tasksCompleted: 0,
    tasksFailed: 0,
    memoriesCreated: 0,
    notificationsCreated: 0,
    layersUpdated: 0,
    errors: [] as string[],
    warnings: [] as string[]
  };
  
  constructor() {
    console.log('[DeepStressRunner] Initialized');
  }
  
  async runScenario(scenario: DeepStressTestScenario): Promise<void> {
    if (this.isRunning) {
      console.warn('[DeepStressRunner] Already running');
      return;
    }
    
    this.isRunning = true;
    this.startTime = Date.now();
    
    console.log('%c🔥 DEEP STRESS TEST STARTING', 'color: #ff0000; font-size: 20px; font-weight: bold;');
    console.log(`%cScenario: ${scenario.name}`, 'color: #ff6600; font-size: 16px;');
    console.log(`%cDuration: ${(scenario.duration / 60).toFixed(0)} minutes`, 'color: #ff6600; font-size: 14px;');
    console.log(`%cDimensions: CPU ${scenario.dimensions.cpu ? '✓' : '-'} MEM ${scenario.dimensions.memory ? '✓' : '-'} STO ${scenario.dimensions.storage ? '✓' : '-'} CON ${scenario.dimensions.concurrent ? '✓' : '-'} ERR ${scenario.dimensions.error ? '✓' : '-'}`, 'color: #0066ff; font-size: 12px;');
    
    const startMetrics = this.getCurrentMetrics();
    console.log(`%cInitial Memory: ${(startMetrics.memory / 1024 / 1024).toFixed(2)}MB`, 'color: #00cc00; font-size: 12px;');
    console.log(`%cInitial Tasks: ${startMetrics.tasks}`, 'color: #00cc00; font-size: 12px;');
    
    // Start health monitoring
    healthMonitor.start(1000);
    
    // Reset operations counter
    this.resetOperations();
    
    const endTime = Date.now() + scenario.duration * 1000;
    const progressInterval = setInterval(() => this.logProgress(scenario, endTime), 10000);
    
    try {
      while (Date.now() < endTime && this.isRunning) {
        await this.performCycle(scenario);
        await this.sleep(100); // 10 cycles per second
      }
      
      if (this.isRunning) {
        await this.performFinalVerification(scenario);
      }
    } catch (error) {
      console.error('%c❌ CRITICAL ERROR', 'color: #ff0000; font-size: 16px;', error);
      this.operations.errors.push(`Critical error: ${error instanceof Error ? error.message : 'Unknown'}`);
    } finally {
      this.isRunning = false;
      clearInterval(progressInterval);
      healthMonitor.stop();
      
      this.generateFinalReport(scenario, startMetrics);
    }
  }
  
  private async performCycle(scenario: DeepStressTestScenario): Promise<void> {
    const promises: Promise<void>[] = [];
    
    // CPU dimension
    if (scenario.dimensions.cpu) {
      const { operationsPerSecond } = scenario.dimensions.cpu;
      for (let i = 0; i < Math.ceil(operationsPerSecond / 10); i++) {
        promises.push(this.performCPUOperation(scenario.dimensions.cpu.complexity));
      }
    }
    
    // Memory dimension
    if (scenario.dimensions.memory) {
      const { allocationRate } = scenario.dimensions.memory;
      if (Math.random() < allocationRate / 10) {
        promises.push(this.performMemoryOperation());
      }
    }
    
    // Storage dimension
    if (scenario.dimensions.storage) {
      const { writeRate } = scenario.dimensions.storage;
      if (Math.random() < writeRate / 10) {
        promises.push(this.performStorageOperation());
      }
    }
    
    // Concurrent dimension
    if (scenario.dimensions.concurrent) {
      const { parallelTasks } = scenario.dimensions.concurrent;
      const tasksToCreate = Math.min(5, Math.ceil(parallelTasks / 20));
      for (let i = 0; i < tasksToCreate; i++) {
        promises.push(this.performConcurrentTask());
      }
    }
    
    // Error injection
    if (scenario.dimensions.error) {
      if (Math.random() < scenario.dimensions.error.failureRate / 10) {
        this.injectError(scenario.dimensions.error.failureRate);
      }
    }
    
    await Promise.allSettled(promises);
  }
  
  private async performCPUOperation(complexity: 'low' | 'medium' | 'high'): Promise<void> {
    const iterations = complexity === 'low' ? 1000 : complexity === 'medium' ? 10000 : 50000;
    
    let result = 0;
    for (let i = 0; i < iterations; i++) {
      result += Math.sqrt(i) * Math.sin(i) * Math.cos(i);
    }
    
    return Promise.resolve();
  }
  
  private async performMemoryOperation(): Promise<void> {
    try {
      const store = useSystemStore.getState();
      
      const memoryTypes = ['experience', 'knowledge', 'strategy', 'insight', 'observation'];
      const randomType = memoryTypes[Math.floor(Math.random() * memoryTypes.length)] as any;
      
      const content = new Array(100).fill(0).map(() => 
        Math.random().toString(36).substring(2, 15)
      ).join(' ');
      
      store.addMemory({
        type: randomType,
        content,
        relevance: Math.random(),
        metadata: {
          timestamp: Date.now(),
          operation: 'stress_test',
          size: content.length
        }
      });
      
      this.operations.memoriesCreated++;
    } catch (error) {
      this.operations.errors.push(`Memory operation failed: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }
  
  private async performStorageOperation(): Promise<void> {
    try {
      const store = useSystemStore.getState();
      
      const task = store.addTask({
        name: `stress_task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        priority: Math.floor(Math.random() * 5) + 1,
        input: {
          size: Math.floor(Math.random() * 10000),
          complexity: Math.random(),
          shouldFail: Math.random() < 0.05
        }
      });
      
      this.operations.tasksCreated++;
      
      // Randomly execute tasks
      if (Math.random() < 0.7) {
        setTimeout(() => {
          store.executeTask(task.id).then(() => {
            this.operations.tasksCompleted++;
          }).catch(() => {
            this.operations.tasksFailed++;
          });
        }, Math.random() * 2000);
      }
    } catch (error) {
      this.operations.errors.push(`Storage operation failed: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }
  
  private async performConcurrentTask(): Promise<void> {
    try {
      const store = useSystemStore.getState();
      
      const task = store.addTask({
        name: `concurrent_task_${Date.now()}`,
        priority: Math.floor(Math.random() * 5) + 1,
        input: {
          parallel: true,
          syncLevel: 'high'
        }
      });
      
      this.operations.tasksCreated++;
      
      await store.executeTask(task.id);
      this.operations.tasksCompleted++;
    } catch (error) {
      this.operations.tasksFailed++;
      this.operations.errors.push(`Concurrent task failed: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }
  
  private injectError(failureRate: number): void {
    if (Math.random() < failureRate) {
      const errorTypes = [
        'Simulated network timeout',
        'Simulated memory pressure',
        'Simulated storage failure',
        'Simulated concurrent conflict'
      ];
      const error = errorTypes[Math.floor(Math.random() * errorTypes.length)];
      
      if (Math.random() < 0.5) {
        this.operations.errors.push(error);
        console.warn(`%c⚠️ Injected error: ${error}`, 'color: #ff6600; font-size: 11px;');
      } else {
        this.operations.warnings.push(error);
        console.warn(`%c⚠️ Injected warning: ${error}`, 'color: #ffcc00; font-size: 11px;');
      }
    }
  }
  
  private async performFinalVerification(scenario: DeepStressTestScenario): Promise<void> {
    console.log('%c🔍 Performing final verification...', 'color: #00ccff; font-size: 14px;');
    
    const store = useSystemStore.getState();
    
    // Verify state consistency
    const tasks = store.tasks;
    const runningTasks = tasks.filter(t => t.status === 'running').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    
    if (runningTasks > 50) {
      this.operations.warnings.push(`High number of running tasks: ${runningTasks}`);
    }
    
    if (pendingTasks > 100) {
      this.operations.warnings.push(`High number of pending tasks: ${pendingTasks}`);
    }
    
    // Verify memory consistency
    const metrics = healthMonitor.getMetrics();
    if (metrics.length > 0) {
      const lastMetric = metrics[metrics.length - 1];
      const firstMetric = metrics[0];
      
      if (lastMetric.memory.usedJSHeapSize && firstMetric.memory.usedJSHeapSize) {
        const memoryGrowth = ((lastMetric.memory.usedJSHeapSize - firstMetric.memory.usedJSHeapSize) / firstMetric.memory.usedJSHeapSize) * 100;
        
        if (memoryGrowth > 50) {
          this.operations.errors.push(`Severe memory growth detected: +${memoryGrowth.toFixed(1)}%`);
        } else if (memoryGrowth > 20) {
          this.operations.warnings.push(`Memory growth detected: +${memoryGrowth.toFixed(1)}%`);
        }
      }
    }
    
    console.log('%c✅ Verification complete', 'color: #00ff00; font-size: 14px;');
  }
  
  private getCurrentMetrics() {
    const store = useSystemStore.getState();
    const mem = (performance as any).memory;
    
    return {
      memory: mem?.usedJSHeapSize || 0,
      tasks: store.tasks.length,
      notifications: store.notifications.length,
      memories: store.memories.length
    };
  }
  
  private logProgress(scenario: DeepStressTestScenario, endTime: number) {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const total = scenario.duration;
    const progress = (elapsed / total) * 100;
    const metrics = this.getCurrentMetrics();
    
    console.log(`%c[${(elapsed / 60).toFixed(1)}/${(total / 60).toFixed(0)}min] Progress: ${progress.toFixed(1)}% | Tasks: ${metrics.tasks} | Memory: ${(metrics.memory / 1024 / 1024).toFixed(1)}MB | Errors: ${this.operations.errors.length}`, 'color: #00ccff; font-size: 11px;');
  }
  
  private generateFinalReport(scenario: DeepStressTestScenario, startMetrics: any): void {
    const endMetrics = this.getCurrentMetrics();
    const duration = (Date.now() - this.startTime) / 1000;
    const healthIssues = healthMonitor.getIssues();
    
    console.group('%c🔥 DEEP STRESS TEST - FINAL REPORT', 'color: #ff0000; font-size: 18px; font-weight: bold;');
    
    console.log('%c📊 Test Information', 'color: #00ccff; font-size: 14px; font-weight: bold;');
    console.log(`  Scenario: ${scenario.name}`);
    console.log(`  Duration: ${duration.toFixed(0)}s (${(duration / 60).toFixed(1)} minutes)`);
    console.log(`  Dimensions: ${Object.keys(scenario.dimensions).join(', ')}`);
    
    console.log('%c📈 Operations Summary', 'color: #00ccff; font-size: 14px; font-weight: bold;');
    console.log(`  Tasks Created: ${this.operations.tasksCreated}`);
    console.log(`  Tasks Completed: ${this.operations.tasksCompleted}`);
    console.log(`  Tasks Failed: ${this.operations.tasksFailed}`);
    console.log(`  Memories Created: ${this.operations.memoriesCreated}`);
    console.log(`  Success Rate: ${this.operations.tasksCreated > 0 ? ((this.operations.tasksCompleted / this.operations.tasksCreated) * 100).toFixed(1) : 0}%`);
    
    console.log('%c💾 Memory Analysis', 'color: #00ccff; font-size: 14px; font-weight: bold;');
    console.log(`  Start: ${(startMetrics.memory / 1024 / 1024).toFixed(2)}MB`);
    console.log(`  End: ${(endMetrics.memory / 1024 / 1024).toFixed(2)}MB`);
    const memoryGrowth = ((endMetrics.memory - startMetrics.memory) / startMetrics.memory) * 100;
    console.log(`  Growth: ${memoryGrowth >= 0 ? '+' : ''}${memoryGrowth.toFixed(1)}%`);
    
    console.log('%c🔍 Health Issues Detected', 'color: #00ccff; font-size: 14px; font-weight: bold;');
    console.log(`  Total: ${healthIssues.length}`);
    console.log(`  Critical: ${healthIssues.filter(i => i.severity === 'critical').length}`);
    console.log(`  High: ${healthIssues.filter(i => i.severity === 'high').length}`);
    console.log(`  Medium: ${healthIssues.filter(i => i.severity === 'medium').length}`);
    console.log(`  Low: ${healthIssues.filter(i => i.severity === 'low').length}`);
    
    console.log('%c❌ Errors', 'color: #ff0000; font-size: 14px; font-weight: bold;');
    console.log(`  Count: ${this.operations.errors.length}`);
    if (this.operations.errors.length > 0) {
      this.operations.errors.slice(0, 10).forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
    }
    
    console.log('%c⚠️ Warnings', 'color: #ffcc00; font-size: 14px; font-weight: bold;');
    console.log(`  Count: ${this.operations.warnings.length}`);
    if (this.operations.warnings.length > 0) {
      this.operations.warnings.slice(0, 10).forEach((warn, i) => {
        console.log(`  ${i + 1}. ${warn}`);
      });
    }
    
    console.log('%c💡 Recommendations', 'color: #00ff00; font-size: 14px; font-weight: bold;');
    if (healthIssues.length > 0 || this.operations.errors.length > 0 || memoryGrowth > 20) {
      console.log('  • System showed signs of stress - review logs for details');
      console.log('  • Consider implementing additional memory management');
      console.log('  • Review error handling and recovery mechanisms');
    } else {
      console.log('  • System performed well under sustained load');
      console.log('  • No critical issues detected');
    }
    
    console.groupEnd();
  }
  
  private resetOperations(): void {
    this.operations = {
      tasksCreated: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      memoriesCreated: 0,
      notificationsCreated: 0,
      layersUpdated: 0,
      errors: [],
      warnings: []
    };
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  stop(): void {
    this.isRunning = false;
    console.log('%c🛑 Deep stress test stopped by user', 'color: #ff6600; font-size: 14px;');
  }
}

export const deepStressRunner = new DeepStressTestRunner();
