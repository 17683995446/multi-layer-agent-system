import { useRef, useEffect, useCallback } from 'react';
import { useSystemStore } from '@/stores/systemStore';
import { Task, LayerStatus, LayerState } from '@/types';

// 任务执行状态
export interface ExecutionState {
  isExecuting: boolean;
  currentStep: number;
  totalSteps: number;
  taskInProgress: Task | null;
  layerProgress: Record<number, number>;
}

export interface SystemEngineConfig {
  taskProcessingTime: number;  // 单个任务处理时间 (ms)
  layerTransitionTime: number;  // 层级转换时间 (ms)
  idleEvolutionInterval: number;  // 空闲进化间隔 (ms)
  metricsUpdateInterval: number;  // 指标更新间隔 (ms)
}

const DEFAULT_CONFIG: SystemEngineConfig = {
  taskProcessingTime: 3000,
  layerTransitionTime: 500,
  idleEvolutionInterval: 10000,
  metricsUpdateInterval: 1000,
};

export class SystemEngine {
  private config: SystemEngineConfig;
  private running: boolean = false;
  private taskQueue: Task[] = [];
  private currentTaskIndex: number = 0;
  private executionTimer: ReturnType<typeof setTimeout> | null = null;
  private evolutionTimer: ReturnType<typeof setInterval> | null = null;
  private metricsTimer: ReturnType<typeof setInterval> | null = null;
  private startTime: number = 0;

  constructor(config: Partial<SystemEngineConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // 启动系统
  async start(): Promise<void> {
    if (this.running) return;
    
    this.running = true;
    this.startTime = Date.now();
    
    const { start, setMode, updateLayerStatus, updateMetrics } = useSystemStore.getState();
    start();
    setMode('work');
    
    // 初始化所有层级为active
    const layers = useSystemStore.getState().layers;
    layers.forEach((layer, index) => {
      setTimeout(() => {
        updateLayerStatus(layer.id, { status: 'active' as LayerStatus });
      }, index * this.config.layerTransitionTime);
    });
    
    // 启动指标更新
    this.startMetricsUpdater();
    
    // 开始执行队列中的任务
    this.processNextTask();
  }

  // 停止系统
  async stop(): Promise<void> {
    if (!this.running) return;
    
    this.running = false;
    
    // 清理所有定时器
    if (this.executionTimer) {
      clearTimeout(this.executionTimer);
      this.executionTimer = null;
    }
    
    if (this.evolutionTimer) {
      clearInterval(this.evolutionTimer);
      this.evolutionTimer = null;
    }
    
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
      this.metricsTimer = null;
    }
    
    // 更新状态
    const { stop, setMode, updateLayerStatus } = useSystemStore.getState();
    stop();
    setMode('idle');
    
    // 设置所有层级为idle
    useSystemStore.getState().layers.forEach(layer => {
      updateLayerStatus(layer.id, { status: 'idle' as LayerStatus });
    });
  }

  // 添加任务到队列
  addTask(task: Task): void {
    this.taskQueue.push(task);
    const { addTask } = useSystemStore.getState();
    addTask(task);
  }

  // 处理下一个任务
  private processNextTask(): void {
    if (!this.running) return;
    
    const { tasks, setCurrentTask, updateTask, updateLayerStatus, updateMetrics, addMemory, addStrategy, addKnowledge } = useSystemStore.getState();
    
    // 获取待处理任务
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    
    if (pendingTasks.length === 0) {
      // 没有待处理任务，进入空闲模式
      const { setMode } = useSystemStore.getState();
      setMode('idle');
      this.startIdleEvolution();
      return;
    }
    
    // 停止空闲进化
    this.stopIdleEvolution();
    
    // 按优先级排序并选择下一个任务
    const sortedTasks = [...pendingTasks].sort((a, b) => (b.priority || 0) - (a.priority || 0));
    const nextTask = sortedTasks[0];
    
    setCurrentTask(nextTask);
    updateTask(nextTask.id, { 
      status: 'running',
      executedAt: Date.now() 
    });
    
    // 激活任务执行层级
    updateLayerStatus(4, { status: 'active' });
    
    // 模拟任务执行
    this.executionTimer = setTimeout(() => {
      this.completeTask(nextTask);
    }, this.config.taskProcessingTime);
  }

  // 完成任务
  private completeTask(task: Task): void {
    if (!this.running) return;
    
    const { updateTask, updateLayerStatus, updateMetrics, addMemory, addStrategy, addKnowledge, setCurrentTask } = useSystemStore.getState();
    
    // 随机决定成功或失败（90%成功率）
    const isSuccess = Math.random() > 0.1;
    const duration = Math.floor(Math.random() * 2000) + 1000;
    
    updateTask(task.id, {
      status: isSuccess ? 'completed' : 'failed',
      duration,
      output: isSuccess ? { result: 'success', processedAt: Date.now() } : { error: 'Task failed' }
    });
    
    setCurrentTask(null);
    
    // 更新指标
    updateMetrics({
      completedTasks: isSuccess 
        ? useSystemStore.getState().metrics.completedTasks + 1 
        : useSystemStore.getState().metrics.completedTasks,
      failedTasks: isSuccess 
        ? useSystemStore.getState().metrics.failedTasks 
        : useSystemStore.getState().metrics.failedTasks + 1,
      successRate: Math.min(
        100,
        (useSystemStore.getState().metrics.completedTasks + 1) / useSystemStore.getState().metrics.totalTasks * 100
      ),
      avgResponseTime: duration
    });
    
    // 添加经验记忆
    if (Math.random() > 0.3) {
      const memoryTypes = ['experience', 'pattern', 'knowledge'] as const;
      const type = memoryTypes[Math.floor(Math.random() * memoryTypes.length)];
      addMemory({
        id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        content: `执行任务 "${task.name}" 的经验记录`,
        type,
        timestamp: Date.now(),
        relevance: 0.5 + Math.random() * 0.5
      });
    }
    
    // 完成后继续处理下一个
    this.processNextTask();
  }

  // 启动空闲进化
  private startIdleEvolution(): void {
    if (this.evolutionTimer) return;
    
    this.evolutionTimer = setInterval(() => {
      this.performIdleEvolution();
    }, this.config.idleEvolutionInterval);
  }

  // 停止空闲进化
  private stopIdleEvolution(): void {
    if (this.evolutionTimer) {
      clearInterval(this.evolutionTimer);
      this.evolutionTimer = null;
    }
  }

  // 执行空闲进化
  private performIdleEvolution(): void {
    if (!this.running) return;
    
    const { addKnowledge, addStrategy, updateEvolution, updateLayerStatus } = useSystemStore.getState();
    
    // 随机选择进化类型
    const evolutionType = Math.random();
    
    if (evolutionType < 0.4) {
      // 增加知识
      addKnowledge({
        id: `knowledge-${Date.now()}`,
        topic: ['系统优化', '任务调度', '性能提升', '错误处理'][Math.floor(Math.random() * 4)],
        content: `通过空闲学习获得的新知识 - ${Date.now()}`,
        confidence: 0.5 + Math.random() * 0.4,
        source: '自主学习'
      });
    } else if (evolutionType < 0.7) {
      // 优化策略
      addStrategy({
        id: `strategy-${Date.now()}`,
        name: `策略${Math.floor(Math.random() * 1000)}`,
        pattern: ['sequential', 'batch', 'parallel', 'prioritized'][Math.floor(Math.random() * 4)],
        successRate: 0.7 + Math.random() * 0.3,
        usageCount: Math.floor(Math.random() * 100)
      });
    }
    
    // 更新进化状态
    updateEvolution({
      lastEvolution: Date.now()
    });
    
    // 激活空闲进化层级
    updateLayerStatus(6, { status: 'active' });
  }

  // 启动指标更新器
  private startMetricsUpdater(): void {
    if (this.metricsTimer) return;
    
    this.metricsTimer = setInterval(() => {
      this.updateMetrics();
    }, this.config.metricsUpdateInterval);
  }

  // 更新运行时指标
  private updateMetrics(): void {
    if (!this.running) return;
    
    const { updateMetrics, metrics } = useSystemStore.getState();
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    
    updateMetrics({
      ...metrics,
      uptime
    });
  }

  // 获取系统运行时间
  getUptime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  // 系统是否运行中
  isSystemRunning(): boolean {
    return this.running;
  }

  // 获取队列长度
  getQueueLength(): number {
    return useSystemStore.getState().tasks.filter(t => t.status === 'pending').length;
  }
}

// 单例实例
let systemEngineInstance: SystemEngine | null = null;

export function getSystemEngine(): SystemEngine {
  if (!systemEngineInstance) {
    systemEngineInstance = new SystemEngine();
  }
  return systemEngineInstance;
}

// 系统初始化Hook
export function useSystemEngine() {
  const engineRef = useRef<SystemEngine | null>(null);
  
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = getSystemEngine();
    }
    
    return () => {
      // 组件卸载时确保停止系统
      if (engineRef.current?.isSystemRunning()) {
        engineRef.current.stop();
      }
    };
  }, []);

  const startSystem = useCallback(async () => {
    if (engineRef.current) {
      await engineRef.current.start();
    }
  }, []);

  const stopSystem = useCallback(async () => {
    if (engineRef.current) {
      await engineRef.current.stop();
    }
  }, []);

  const addTaskToQueue = useCallback((task: Task) => {
    if (engineRef.current) {
      engineRef.current.addTask(task);
    }
  }, []);

  return {
    engine: engineRef.current,
    startSystem,
    stopSystem,
    addTaskToQueue,
  };
}
