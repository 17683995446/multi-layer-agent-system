import { useSystemStore } from '@/stores/systemStore';

export interface TestStats {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  startTime: number;
  endTime: number;
  errors: string[];
  metrics: {
    tasksAdded: number;
    tasksCompleted: number;
    memoriesAdded: number;
    notificationsSent: number;
  };
}

export class DirectTestRunner {
  private isRunning = false;
  private stats: TestStats | null = null;
  
  constructor() {
    console.log('[DirectTestRunner] Initialized');
  }
  
  async runShortTest(): Promise<TestStats> {
    if (this.isRunning) {
      console.warn('[DirectTestRunner] Already running');
      throw new Error('Test already in progress');
    }
    
    console.clear();
    console.log('%c🚀 STARTING SHORT STRESS TEST', 'color: #00ff00; font-size: 20px; font-weight: bold;');
    console.log('%cDuration: 3 minutes', 'color: #00ccff; font-size: 14px;');
    
    this.isRunning = true;
    this.stats = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      startTime: Date.now(),
      endTime: 0,
      errors: [],
      metrics: {
        tasksAdded: 0,
        tasksCompleted: 0,
        memoriesAdded: 0,
        notificationsSent: 0
      }
    };
    
    const store = useSystemStore.getState();
    
    try {
      // Test 1: Add many tasks
      console.log('\n%c📋 TEST 1: Adding tasks...', 'color: #ff6600; font-size: 14px;');
      await this.addManyTasks(store, 50);
      this.stats.metrics.tasksAdded += 50;
      
      // Test 2: Execute some tasks
      console.log('\n%c⚡ TEST 2: Executing tasks...', 'color: #ff6600; font-size: 14px;');
      await this.executeRandomTasks(store, 30);
      this.stats.metrics.tasksCompleted += 30;
      
      // Test 3: Add many memory entries
      console.log('\n%c💾 TEST 3: Adding memory...', 'color: #ff6600; font-size: 14px;');
      await this.addManyMemories(store, 100);
      this.stats.metrics.memoriesAdded += 100;
      
      // Test 4: Send many notifications
      console.log('\n%c🔔 TEST 4: Sending notifications...', 'color: #ff6600; font-size: 14px;');
      await this.sendManyNotifications(store, 100);
      this.stats.metrics.notificationsSent += 100;
      
      // Test 5: Stress pattern - mixed operations
      console.log('\n%c🔄 TEST 5: Mixed operations...', 'color: #ff6600; font-size: 14px;');
      await this.stressPattern(store);
      
      // Test 6: Check state consistency
      console.log('\n%c✅ TEST 6: Checking consistency...', 'color: #ff6600; font-size: 14px;');
      await this.checkConsistency(store);
      
    } catch (error) {
      console.error('%c❌ CRITICAL TEST FAILURE', 'color: #ff0000; font-size: 16px;', error);
      this.stats.errors.push(`Critical error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.stats.endTime = Date.now();
      this.isRunning = false;
      this.printFinalReport();
    }
    
    return this.stats;
  }
  
  private async addManyTasks(store: any, count: number): Promise<void> {
    console.log(`Adding ${count} tasks...`);
    
    for (let i = 0; i < count; i++) {
      try {
        const taskTypes = ['data_processing', 'analysis', 'reporting', 'integration', 'learning', 'optimization'];
        const randomType = taskTypes[Math.floor(Math.random() * taskTypes.length)];
        
        const task = store.addTask({
          name: `${randomType}_test_${i}`,
          description: `Test task ${i}`,
          priority: Math.floor(Math.random() * 5) + 1,
          input: {
            delay: 100 + Math.random() * 900,
            complexity: Math.random()
          }
        });
        
        this.stats!.successfulOperations++;
      } catch (error) {
        this.stats!.errors.push(`Task creation failed at ${i}: ${error}`);
        this.stats!.failedOperations++;
      }
      
      this.stats!.totalOperations++;
      
      if (i % 10 === 0) {
        console.log(`  Added ${i}/${count} tasks...`);
      }
      
      await this.sleep(10);
    }
    
    console.log(`✅ Added ${count} tasks`);
  }
  
  private async executeRandomTasks(store: any, count: number): Promise<void> {
    const tasks = store.tasks.filter((t: any) => t.status === 'pending');
    const toExecute = Math.min(count, tasks.length);
    
    console.log(`Executing ${toExecute} tasks...`);
    
    for (let i = 0; i < toExecute; i++) {
      try {
        const randomIndex = Math.floor(Math.random() * tasks.length);
        const task = tasks[randomIndex];
        
        await store.executeTask(task.id);
        this.stats!.successfulOperations++;
        
        if (i % 10 === 0) {
          console.log(`  Executed ${i + 1}/${toExecute} tasks...`);
        }
      } catch (error) {
        this.stats!.errors.push(`Task execution failed: ${error}`);
        this.stats!.failedOperations++;
      }
      
      this.stats!.totalOperations++;
      await this.sleep(50);
    }
    
    console.log(`✅ Tried to execute ${toExecute} tasks`);
  }
  
  private async addManyMemories(store: any, count: number): Promise<void> {
    console.log(`Adding ${count} memory entries...`);
    
    const memoryTypes = ['experience', 'knowledge', 'strategy', 'insight', 'observation'];
    
    for (let i = 0; i < count; i++) {
      try {
        const randomType = memoryTypes[Math.floor(Math.random() * memoryTypes.length)] as any;
        const content = `Memory entry ${i}: ${'Lorem ipsum dolor sit amet '.repeat(Math.ceil(Math.random() * 5))}`;
        
        store.addMemory({
          type: randomType,
          content: content,
          relevance: Math.random(),
          metadata: {
            timestamp: Date.now(),
            source: 'stress_test',
            test: true
          }
        });
        
        this.stats!.successfulOperations++;
      } catch (error) {
        this.stats!.errors.push(`Memory creation failed at ${i}: ${error}`);
        this.stats!.failedOperations++;
      }
      
      this.stats!.totalOperations++;
      
      if (i % 25 === 0) {
        console.log(`  Added ${i}/${count} memories...`);
      }
      
      await this.sleep(5);
    }
    
    console.log(`✅ Added ${count} memory entries`);
  }
  
  private async sendManyNotifications(store: any, count: number): Promise<void> {
    console.log(`Sending ${count} notifications...`);
    
    const notificationTypes = ['info', 'success', 'warning', 'error'] as const;
    
    const messages = {
      info: ['System update available', 'New feature released', 'Background job completed', 'Data sync finished'],
      success: ['Task completed successfully', 'Backup finished', 'Deployment succeeded', 'Data imported'],
      warning: ['High system load', 'Storage almost full', 'Slow network detected', 'Certificate expiring'],
      error: ['Connection lost', 'Task failed', 'Server error', 'Authentication failed']
    };
    
    for (let i = 0; i < count; i++) {
      try {
        const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
        const messageList = messages[type];
        const message = messageList[Math.floor(Math.random() * messageList.length)];
        
        store.addNotification({
          type: type,
          message: `${message} (Test ${i})`,
          read: false
        });
        
        this.stats!.successfulOperations++;
      } catch (error) {
        this.stats!.errors.push(`Notification failed at ${i}: ${error}`);
        this.stats!.failedOperations++;
      }
      
      this.stats!.totalOperations++;
      
      if (i % 25 === 0) {
        console.log(`  Sent ${i}/${count} notifications...`);
      }
      
      await this.sleep(5);
    }
    
    console.log(`✅ Sent ${count} notifications`);
  }
  
  private async stressPattern(store: any): Promise<void> {
    console.log('Running mixed operation stress pattern...');
    
    for (let i = 0; i < 50; i++) {
      const operationType = Math.random();
      
      try {
        if (operationType < 0.3) {
          // Add task
          store.addTask({
            name: `mixed_op_task_${i}`,
            description: 'Mixed operation task',
            priority: 1
          });
        } else if (operationType < 0.6) {
          // Add memory
          store.addMemory({
            type: 'experience',
            content: `Mixed test memory ${i}`,
            relevance: 0.5
          });
        } else if (operationType < 0.8) {
          // Send notification
          store.addNotification({
            type: 'info',
            message: `Mixed operation notification ${i}`,
            read: false
          });
        } else {
          // Update random layer
          const layers = store.layers;
          if (layers.length > 0) {
            const layerId = Math.floor(Math.random() * layers.length);
            store.updateLayerStatus(layerId, {
              status: 'active',
              metrics: {
                cpuUsage: 20 + Math.random() * 60
              }
            });
          }
        }
        
        this.stats!.successfulOperations++;
      } catch (error) {
        this.stats!.errors.push(`Mixed operation failed at ${i}: ${error}`);
        this.stats!.failedOperations++;
      }
      
      this.stats!.totalOperations++;
      
      if (i % 10 === 0) {
        console.log(`  Mixed operations: ${i}/50 complete...`);
      }
      
      await this.sleep(20);
    }
    
    console.log('✅ Mixed operations completed');
  }
  
  private async checkConsistency(store: any): Promise<void> {
    console.log('Checking system consistency...');
    
    const currentTasks = store.tasks;
    const currentNotifications = store.notifications;
    const currentMemories = store.memories;
    
    console.log(`  Tasks in state: ${currentTasks.length}`);
    console.log(`  Notifications in state: ${currentNotifications.length}`);
    console.log(`  Memories in state: ${currentMemories.length}`);
    
    // Check for invalid states
    const runningTasks = currentTasks.filter((t: any) => t.status === 'running');
    const pendingTasks = currentTasks.filter((t: any) => t.status === 'pending');
    const completedTasks = currentTasks.filter((t: any) => t.status === 'completed');
    
    console.log(`  Running: ${runningTasks.length}`);
    console.log(`  Pending: ${pendingTasks.length}`);
    console.log(`  Completed: ${completedTasks.length}`);
    
    // Check for possible issues
    if (runningTasks.length > 20) {
      const warning = `High number of running tasks: ${runningTasks.length}`;
      console.warn('%c⚠️ ' + warning, 'color: #ffcc00;');
      this.stats!.errors.push(warning);
    }
    
    if (currentNotifications.length > 200) {
      const warning = `Notification accumulation detected: ${currentNotifications.length}`;
      console.warn('%c⚠️ ' + warning, 'color: #ffcc00;');
      this.stats!.errors.push(warning);
    }
    
    console.log('✅ Consistency check complete');
  }
  
  private printFinalReport(): void {
    const stats = this.stats!;
    const duration = (stats.endTime - stats.startTime) / 1000;
    const successRate = stats.totalOperations > 0 ? ((stats.successfulOperations / stats.totalOperations) * 100).toFixed(1) : '0';
    
    console.group('%c📊 FINAL TEST REPORT', 'color: #00ccff; font-size: 18px; font-weight: bold;');
    
    console.log('%c=== Summary ===', 'color: #00ff00; font-size: 14px;');
    console.log(`Duration: ${duration.toFixed(1)}s`);
    console.log(`Total operations: ${stats.totalOperations}`);
    console.log(`Successful: ${stats.successfulOperations} (${successRate}%)`);
    console.log(`Failed: ${stats.failedOperations}`);
    
    console.log('\n%c=== Metrics ===', 'color: #ff6600; font-size: 14px;');
    console.log(`Tasks added: ${stats.metrics.tasksAdded}`);
    console.log(`Tasks executed: ${stats.metrics.tasksCompleted}`);
    console.log(`Memories added: ${stats.metrics.memoriesAdded}`);
    console.log(`Notifications sent: ${stats.metrics.notificationsSent}`);
    
    if (stats.errors.length > 0) {
      console.log('\n%c=== Issues Found ===', 'color: #ff0000; font-size: 14px;');
      console.log(`Total issues: ${stats.errors.length}`);
      
      stats.errors.slice(0, 10).forEach((error, i) => {
        console.log(`${i + 1}. ${error}`);
      });
      
      if (stats.errors.length > 10) {
        console.log(`...and ${stats.errors.length - 10} more`);
      }
    } else {
      console.log('\n%c✅ No issues detected!', 'color: #00ff00; font-size: 14px;');
    }
    
    console.log('%c=== Next Steps ===', 'color: #00ccff; font-size: 14px;');
    if (stats.errors.length > 0) {
      console.log('1. Analyze the issues above');
      console.log('2. Fix the problems in the code');
      console.log('3. Run this test again to verify fixes');
    } else {
      console.log('1. Great job! No issues found.');
      console.log('2. Try a longer test (5-10 minutes)');
    }
    
    console.groupEnd();
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const directTestRunner = new DirectTestRunner();
