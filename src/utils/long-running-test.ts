/**
 * 长时间运行的真实测试系统
 * 用于发现系统在真实使用中的问题
 */

import { useSystemStore } from '@/stores/systemStore';

interface TestResult {
  timestamp: number;
  type: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

export class LongRunningTestSystem {
  private testResults: TestResult[] = [];
  private isRunning: boolean = false;
  private testInterval: any = null;
  private taskCounter: number = 0;
  private startTime: number = 0;

  constructor() {
    console.log('🔧 长时间测试系统初始化完成');
  }

  // 启动长时间测试
  startTest() {
    if (this.isRunning) {
      console.warn('⚠️ 测试已在运行中');
      return;
    }

    this.isRunning = true;
    this.startTime = Date.now();
    this.testResults = [];
    this.taskCounter = 0;

    console.log('🚀 开始长时间真实测试...');
    this.addResult('success', '测试系统启动');

    // 立即启动系统
    useSystemStore.getState().startSystem();

    // 开始测试循环
    this.testInterval = setInterval(() => this.runTestStep(), 2000);
    
    // 定期清理和检查
    setInterval(() => this.performMaintenance(), 30000);
  }

  // 停止测试
  stopTest() {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.testInterval) {
      clearInterval(this.testInterval);
      this.testInterval = null;
    }

    useSystemStore.getState().stopSystem();
    this.addResult('success', '测试系统停止');
    
    const duration = Math.floor((Date.now() - this.startTime) / 1000);
    console.log(`✅ 测试结束，总时长: ${duration}秒，执行任务: ${this.taskCounter}`);
  }

  // 执行单个测试步骤
  private runTestStep() {
    const store = useSystemStore.getState();
    
    try {
      // 1. 随机添加任务
      if (Math.random() > 0.3) {
        this.addRandomTask();
      }

      // 2. 随机执行任务
      if (Math.random() > 0.5) {
        this.processRandomTask();
      }

      // 3. 随机添加记忆
      if (Math.random() > 0.7) {
        this.addRandomMemory();
      }

      // 4. 更新指标
      this.updateMetrics();

      // 5. 随机切换层级状态
      if (Math.random() > 0.8) {
        this.toggleLayerStatus();
      }

    } catch (error) {
      this.addResult('error', `测试步骤错误: ${error}`, { error });
      console.error('❌ 测试步骤失败:', error);
    }
  }

  // 添加随机任务
  private addRandomTask() {
    const store = useSystemStore.getState();
    const taskTypes = [
      '数据分析任务', '数据处理', '用户请求', '系统诊断',
      '知识图谱构建', '模型训练', '数据同步', '批量处理'
    ];
    const priorities = [0, 1, 2, 3, 4] as const;

    const task = {
      id: `test-task-${Date.now()}-${++this.taskCounter}`,
      name: `${taskTypes[Math.floor(Math.random() * taskTypes.length)]} #${this.taskCounter}`,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      status: 'pending' as const,
      input: { test: true, timestamp: Date.now() },
      createdAt: Date.now()
    };

    store.addTask(task);
    
    if (this.taskCounter % 10 === 0) {
      this.addResult('success', `已添加 ${this.taskCounter} 个任务`);
    }
  }

  // 处理随机任务
  private processRandomTask() {
    const store = useSystemStore.getState();
    const tasks = store.tasks;
    
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    if (pendingTasks.length > 0) {
      const randomIndex = Math.floor(Math.random() * pendingTasks.length);
      store.executeTask(pendingTasks[randomIndex].id);
    }
  }

  // 添加随机记忆
  private addRandomMemory() {
    const store = useSystemStore.getState();
    const memoryContents = [
      '发现优化点', '学习新策略', '记录用户偏好',
      '保存历史数据', '更新知识图谱'
    ];

    const memory = {
      id: `memory-${Date.now()}-${Math.random()}`,
      content: memoryContents[Math.floor(Math.random() * memoryContents.length)],
      timestamp: Date.now(),
      importance: Math.random()
    };

    store.addMemory(memory);
  }

  // 更新指标
  private updateMetrics() {
    const store = useSystemStore.getState();
    store.updateMetrics({
      avgResponseTime: 50 + Math.random() * 200,
      knowledgeGrowth: Math.floor(Math.random() * 100)
    });
  }

  // 切换层级状态
  private toggleLayerStatus() {
    const store = useSystemStore.getState();
    const layerId = Math.floor(Math.random() * 8) + 1;
    const statuses = ['idle', 'active', 'processing'] as const;
    const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    store.updateLayerStatus(layerId, newStatus);
  }

  // 执行维护检查
  private performMaintenance() {
    const store = useSystemStore.getState();
    const state = store;
    
    // 检查任务数量
    if (state.tasks.length > 100) {
      this.addResult('warning', '任务数量过多，考虑清理', { count: state.tasks.length });
    }

    // 检查记忆数量
    if (state.memories.length > 50) {
      this.addResult('warning', '记忆数量增长过快', { count: state.memories.length });
    }

    // 检查通知数量
    if (state.notifications.length > 20) {
      this.addResult('warning', '通知队列积压', { count: state.notifications.length });
    }

    // 记录正常心跳
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    this.addResult('success', `系统正常运行 ${uptime} 秒`, { 
      tasks: state.tasks.length,
      memories: state.memories.length,
      notifications: state.notifications.length
    });
  }

  // 添加测试结果
  private addResult(type: 'success' | 'warning' | 'error', message: string, details?: any) {
    const result: TestResult = {
      timestamp: Date.now(),
      type,
      message,
      details
    };
    
    this.testResults.push(result);
    this.testResults = this.testResults.slice(-100); // 保留最近100条
    
    // 输出到控制台
    const emoji = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : '❌';
    console.log(`${emoji} [${new Date().toLocaleTimeString()}] ${message}`);
  }

  // 获取测试结果
  getTestResults() {
    return [...this.testResults];
  }

  // 获取测试统计
  getTestStats() {
    const results = this.testResults;
    return {
      total: results.length,
      success: results.filter(r => r.type === 'success').length,
      warning: results.filter(r => r.type === 'warning').length,
      error: results.filter(r => r.type === 'error').length,
      taskCount: this.taskCounter,
      uptime: this.isRunning ? Math.floor((Date.now() - this.startTime) / 1000) : 0
    };
  }

  // 检查是否运行中
  getIsRunning() {
    return this.isRunning;
  }
}

// 全局单例
export const longRunningTestSystem = new LongRunningTestSystem();
