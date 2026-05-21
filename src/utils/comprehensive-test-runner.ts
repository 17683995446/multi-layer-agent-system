import { useSystemStore } from '@/stores/systemStore';
import { bugDetector } from '@/utils/automated-bug-detector';

interface TestScenario {
  name: string;
  description: string;
  duration: number;
  intensity: 'low' | 'medium' | 'high' | 'extreme';
  operations: TestOperation[];
}

interface TestOperation {
  type: 'task' | 'memory' | 'notification' | 'layer' | 'strategy' | 'knowledge';
  action: string;
  count: number;
  delay: number;
  shouldFail?: boolean;
}

interface TestResult {
  scenario: string;
  startTime: number;
  endTime: number;
  operations: number;
  errors: number;
  warnings: number;
  memoryPeak: number;
  success: boolean;
  issues: string[];
}

class ComprehensiveTestRunner {
  private results: TestResult[] = [];
  private isRunning: boolean = false;
  private currentScenario: string = '';
  private errorCount: number = 0;
  private warningCount: number = 0;
  private operationsCount: number = 0;
  private startTime: number = 0;
  
  constructor() {
    this.setupMonitoring();
  }
  
  private setupMonitoring() {
    bugDetector.subscribe((report) => {
      if (report.severity === 'critical' || report.severity === 'high') {
        this.errorCount++;
        console.error(`[CRITICAL BUG] ${report.title}: ${report.description}`);
      } else if (report.severity === 'low' || report.severity === 'medium') {
        this.warningCount++;
        console.warn(`[WARNING] ${report.title}: ${report.description}`);
      }
    });
  }
  
  public async runScenario(scenario: TestScenario): Promise<TestResult> {
    if (this.isRunning) {
      console.warn('Test already running');
      return this.createFailedResult(scenario.name, 'Test already running');
    }
    
    this.isRunning = true;
    this.currentScenario = scenario.name;
    this.errorCount = 0;
    this.warningCount = 0;
    this.operationsCount = 0;
    this.startTime = Date.now();
    
    console.log(`\n🚀 Starting scenario: ${scenario.name}`);
    console.log(`📝 Description: ${scenario.description}`);
    console.log(`⏱️ Duration: ${scenario.duration}ms`);
    console.log(`🎯 Intensity: ${scenario.intensity}`);
    
    const startMemory = this.getMemoryUsage();
    const issues: string[] = [];
    
    try {
      for (const operation of scenario.operations) {
        await this.executeOperation(operation, issues);
      }
      
      const endMemory = this.getMemoryUsage();
      const memoryGrowth = endMemory - startMemory;
      const endTime = Date.now();
      
      if (memoryGrowth > 50 * 1024 * 1024) { // 50MB
        issues.push(`High memory growth detected: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`);
      }
      
      const result: TestResult = {
        scenario: scenario.name,
        startTime: this.startTime,
        endTime,
        operations: this.operationsCount,
        errors: this.errorCount,
        warnings: this.warningCount,
        memoryPeak: endMemory,
        success: this.errorCount === 0,
        issues
      };
      
      this.results.push(result);
      this.logResult(result);
      
      return result;
    } catch (error) {
      const result = this.createFailedResult(scenario.name, error instanceof Error ? error.message : 'Unknown error');
      this.results.push(result);
      return result;
    } finally {
      this.isRunning = false;
      this.currentScenario = '';
    }
  }
  
  private async executeOperation(operation: TestOperation, issues: string[]): Promise<void> {
    console.log(`\n⚡ Executing: ${operation.type} - ${operation.action}`);
    
    const store = useSystemStore.getState();
    const initialTaskCount = store.tasks.length;
    const initialNotificationCount = store.notifications.length;
    const initialMemory = this.getMemoryUsage();
    
    const promises: Promise<any>[] = [];
    
    for (let i = 0; i < operation.count; i++) {
      promises.push(
        this.executeSingleOperation(operation, i).catch(error => {
          issues.push(`Operation ${i} failed: ${error.message}`);
          this.errorCount++;
        })
      );
      
      if (operation.delay > 0) {
        await this.sleep(Math.min(operation.delay, 100));
      }
    }
    
    await Promise.all(promises);
    this.operationsCount += operation.count;
    
    const finalTaskCount = store.tasks.length;
    const finalNotificationCount = store.notifications.length;
    const finalMemory = this.getMemoryUsage();
    
    const memoryGrowth = finalMemory - initialMemory;
    const taskGrowth = finalTaskCount - initialTaskCount;
    
    console.log(`✅ Completed ${operation.count} operations`);
    console.log(`📊 Task count: ${initialTaskCount} → ${finalTaskCount} (${taskGrowth > 0 ? '+' : ''}${taskGrowth})`);
    console.log(`💾 Memory growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB`);
    
    if (memoryGrowth > 10 * 1024 * 1024) { // 10MB per operation type
      issues.push(`${operation.type} operation caused ${(memoryGrowth / 1024 / 1024).toFixed(2)}MB memory growth`);
    }
  }
  
  private async executeSingleOperation(operation: TestOperation, index: number): Promise<void> {
    const store = useSystemStore.getState();
    
    switch (operation.type) {
      case 'task':
        const task = store.addTask({
          name: `Test Task ${index}`,
          priority: Math.floor(Math.random() * 5) + 1,
          input: {
            delay: 100 + Math.random() * 900,
            shouldFail: operation.shouldFail && Math.random() > 0.8
          }
        });
        
        if (operation.action === 'execute') {
          await store.executeTask(task.id);
        }
        break;
        
      case 'memory':
        const memory = store.addMemory({
          type: 'experience',
          content: `Test memory ${index} - `.repeat(100),
          relevance: Math.random(),
          metadata: {
            testData: new Array(1000).fill(0).map(() => Math.random())
          }
        });
        break;
        
      case 'notification':
        store.addNotification({
          type: ['info', 'success', 'warning', 'error'][Math.floor(Math.random() * 4)] as any,
          message: `Test notification ${index}`,
          read: false
        });
        break;
        
      case 'layer':
        const layerIndex = Math.floor(Math.random() * 8);
        store.updateLayerStatus(layerIndex, {
          status: Math.random() > 0.5 ? 'active' : 'processing'
        });
        break;
        
      case 'strategy':
        store.addStrategy({
          name: `Test Strategy ${index}`,
          description: `Test strategy ${index}`,
          version: '1.0.0',
          conditions: {},
          actions: {},
          effectiveness: Math.random(),
          usageCount: 0,
          successCount: 0,
          isActive: true
        });
        break;
        
      case 'knowledge':
        store.addKnowledgeNode({
          label: `Test Node ${index}`,
          type: 'concept',
          importance: Math.random(),
          connections: []
        });
        break;
    }
    
    await this.sleep(10 + Math.random() * 50);
  }
  
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory?.usedJSHeapSize || 0;
    }
    return 0;
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private createFailedResult(scenario: string, error: string): TestResult {
    return {
      scenario,
      startTime: this.startTime,
      endTime: Date.now(),
      operations: this.operationsCount,
      errors: this.errorCount + 1,
      warnings: this.warningCount,
      memoryPeak: this.getMemoryUsage(),
      success: false,
      issues: [error]
    };
  }
  
  private logResult(result: TestResult): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULT');
    console.log('='.repeat(60));
    console.log(`✅ Scenario: ${result.scenario}`);
    console.log(`⏱️ Duration: ${result.endTime - result.startTime}ms`);
    console.log(`📈 Operations: ${result.operations}`);
    console.log(`❌ Errors: ${result.errors}`);
    console.log(`⚠️ Warnings: ${result.warnings}`);
    console.log(`💾 Memory Peak: ${(result.memoryPeak / 1024 / 1024).toFixed(2)}MB`);
    console.log(`🎯 Success: ${result.success ? 'YES' : 'NO'}`);
    
    if (result.issues.length > 0) {
      console.log('\n🔍 Issues Found:');
      result.issues.forEach(issue => console.log(`  - ${issue}`));
    }
    console.log('='.repeat(60) + '\n');
  }
  
  public async runComprehensiveTest(): Promise<void> {
    const scenarios: TestScenario[] = [
      {
        name: 'High-Concurrency Task Execution',
        description: 'Simulate 100+ concurrent task executions',
        duration: 60000,
        intensity: 'high',
        operations: [
          { type: 'task', action: 'execute', count: 100, delay: 10, shouldFail: true }
        ]
      },
      {
        name: 'Memory Stress Test',
        description: 'Rapidly create 500+ memory entries',
        duration: 30000,
        intensity: 'extreme',
        operations: [
          { type: 'memory', action: 'create', count: 500, delay: 5 }
        ]
      },
      {
        name: 'Notification Flood',
        description: 'Generate 1000+ notifications rapidly',
        duration: 30000,
        intensity: 'extreme',
        operations: [
          { type: 'notification', action: 'create', count: 1000, delay: 1 }
        ]
      },
      {
        name: 'Mixed Operations Stress',
        description: 'Combined stress test with all operation types',
        duration: 60000,
        intensity: 'extreme',
        operations: [
          { type: 'task', action: 'execute', count: 50, delay: 20 },
          { type: 'memory', action: 'create', count: 100, delay: 10 },
          { type: 'notification', action: 'create', count: 200, delay: 5 },
          { type: 'layer', action: 'update', count: 50, delay: 10 },
          { type: 'strategy', action: 'create', count: 30, delay: 15 },
          { type: 'knowledge', action: 'create', count: 100, delay: 10 }
        ]
      },
      {
        name: 'Rapid State Changes',
        description: '1000+ rapid layer status updates',
        duration: 30000,
        intensity: 'high',
        operations: [
          { type: 'layer', action: 'update', count: 1000, delay: 1 }
        ]
      },
      {
        name: 'Error Recovery Test',
        description: 'Test system behavior with high failure rate',
        duration: 60000,
        intensity: 'high',
        operations: [
          { type: 'task', action: 'execute', count: 200, delay: 15, shouldFail: true }
        ]
      }
    ];
    
    console.log('\n' + '='.repeat(60));
    console.log('🚀 STARTING COMPREHENSIVE SYSTEM TEST');
    console.log('='.repeat(60));
    console.log(`Total scenarios: ${scenarios.length}`);
    console.log('='.repeat(60) + '\n');
    
    for (const scenario of scenarios) {
      await this.runScenario(scenario);
      await this.sleep(5000);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 FINAL SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total tests run: ${this.results.length}`);
    console.log(`Successful tests: ${this.results.filter(r => r.success).length}`);
    console.log(`Failed tests: ${this.results.filter(r => !r.success).length}`);
    console.log(`Total errors: ${this.results.reduce((sum, r) => sum + r.errors, 0)}`);
    console.log(`Total warnings: ${this.results.reduce((sum, r) => sum + r.warnings, 0)}`);
    console.log(`Total issues identified: ${this.results.flatMap(r => r.issues).length}`);
    console.log('='.repeat(60) + '\n');
    
    const allIssues = this.results.flatMap(r => r.issues);
    if (allIssues.length > 0) {
      console.log('🔍 ALL ISSUES FOUND:');
      allIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    }
  }
  
  public getResults(): TestResult[] {
    return [...this.results];
  }
  
  public clearResults(): void {
    this.results = [];
  }
}

export const testRunner = new ComprehensiveTestRunner();
export default ComprehensiveTestRunner;
