import { create } from 'zustand';
import { 
  Task, 
  LayerState, 
  SystemMode, 
  SystemMetrics, 
  EvolutionState, 
  MemoryEntry, 
  StrategyEntry, 
  KnowledgeGraph,
  KnowledgeNode,
  KnowledgeEdge,
  PerformanceBenchmark,
  SystemNotification,
  LAYER_DEFINITIONS
} from '@/types';
import { SafeStorage } from '@/storage/safeStorage';
import { logger } from '@/utils/systemLogger';

logger.info('SYSTEM', 'Initializing systemStore - Loading and setting up state');

// 初始化8层架构的层级状态
const initializeLayers = (): LayerState[] => {
  logger.debug('SYSTEM', 'initializeLayers: Creating layer states');
  const layers = LAYER_DEFINITIONS.map((layer) => ({
    id: layer.id,
    name: layer.name,
    status: 'idle',
    metrics: {
      cpuUsage: 0,
      memoryUsage: 0,
      taskCount: 0,
      avgResponseTime: 0,
      successRate: 1,
    },
    lastUpdate: Date.now(),
    modules: layer.modules,
  }));
  logger.info('SYSTEM', `initializeLayers: Created ${layers.length} layers`);
  return layers;
};

// 初始化指标
const initializeMetrics = (): SystemMetrics => {
  logger.debug('SYSTEM', 'initializeMetrics: Creating initial metrics');
  const metrics = {
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    successRate: 0,
    avgResponseTime: 0,
    maxResponseTime: 0,
    minResponseTime: Infinity,
    uptime: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    knowledgeGrowth: 0,
    evolutionSteps: 0,
  };
  logger.debug('SYSTEM', 'initializeMetrics: Metrics created', metrics);
  return metrics;
};

// 初始化知识图谱
const initializeKnowledgeGraph = (): KnowledgeGraph => {
  logger.debug('SYSTEM', 'initializeKnowledgeGraph: Creating empty graph');
  return { nodes: [], edges: [] };
};

// 示例数据
const sampleMemories: MemoryEntry[] = [
  { 
    id: 'm1', 
    content: '处理高优先级任务时优先调度', 
    type: 'experience', 
    relevance: 0.9,
    accessCount: 15,
    createdAt: Date.now() - 86400000,
  },
  { 
    id: 'm2', 
    content: '断点恢复机制有效减少任务中断', 
    type: 'pattern', 
    relevance: 0.85,
    accessCount: 8,
    createdAt: Date.now() - 172800000,
  },
  { 
    id: 'm3', 
    content: '空闲时期进行知识积累效果显著', 
    type: 'knowledge', 
    relevance: 0.8,
    accessCount: 5,
    createdAt: Date.now() - 259200000,
  },
];

const sampleStrategies: StrategyEntry[] = [
  { 
    id: 's1', 
    name: '快速失败重试', 
    description: '检测到可恢复错误时立即重试',
    version: '1.0.0',
    conditions: {},
    actions: {},
    effectiveness: 0.92,
    usageCount: 156,
    successCount: 144,
    createdAt: Date.now() - 86400000,
    lastUpdated: Date.now(),
    isActive: true,
  },
  { 
    id: 's2', 
    name: '渐进式执行', 
    description: '分阶段执行复杂任务',
    version: '1.1.0',
    conditions: {},
    actions: {},
    effectiveness: 0.88,
    usageCount: 203,
    successCount: 179,
    createdAt: Date.now() - 172800000,
    lastUpdated: Date.now(),
    isActive: true,
  },
];

interface SystemStore {
  // 系统基础状态
  systemMode: SystemMode;
  isRunning: boolean;
  systemStartTime: number;
  
  // 层级状态
  layers: LayerState[];
  
  // 任务管理
  tasks: Task[];
  currentTask: Task | null;
  taskQueue: Task[];
  
  // 知识与记忆
  memories: MemoryEntry[];
  strategies: StrategyEntry[];
  knowledgeGraph: KnowledgeGraph;
  
  // 系统指标
  metrics: SystemMetrics;
  benchmarks: PerformanceBenchmark[];
  performanceHistory: PerformanceBenchmark[];
  
  // 进化状态
  evolutionState: any;
  
  // 通知与错误
  notifications: SystemNotification[];
  lastError: string | null;
  storageWarning: boolean;
  
  // Actions - 系统控制
  setSystemMode: (mode: SystemMode) => void;
  startSystem: () => void;
  stopSystem: () => void;
  
  // Actions - 任务管理
  addTask: (task: Partial<Task>) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  removeTask: (id: string) => void;
  clearTasks: () => void;
  executeTask: (taskId: string) => Promise<void>;
  batchExecuteTasks: (taskIds: string[]) => Promise<void>;
  setCurrentTask: (task: Task | null) => void;
  
  // Actions - 层级管理
  updateLayerStatus: (layerId: number, updates: Partial<LayerState>) => void;
  
  // Actions - 记忆管理
  addMemory: (memory: Partial<MemoryEntry>) => MemoryEntry;
  updateMemory: (id: string, updates: Partial<MemoryEntry>) => void;
  retrieveRelevantMemories: (query: string, limit?: number) => MemoryEntry[];
  
  // Actions - 策略管理
  addStrategy: (strategy: Partial<StrategyEntry>) => StrategyEntry;
  updateStrategy: (id: string, updates: Partial<StrategyEntry>) => void;
  getOptimalStrategy: (context: Record<string, any>) => StrategyEntry | null;
  
  // Actions - 知识图谱
  addKnowledgeNode: (node: Partial<KnowledgeNode>) => KnowledgeNode;
  addKnowledgeEdge: (edge: Partial<KnowledgeEdge>) => KnowledgeEdge;
  updateKnowledgeGraph: (updates: Partial<KnowledgeGraph>) => void;
  
  // Actions - 指标管理
  updateMetrics: (updates: Partial<SystemMetrics>) => void;
  addBenchmark: (benchmark: PerformanceBenchmark) => void;
  
  // Actions - 通知管理
  addNotification: (notification: Omit<SystemNotification, 'id' | 'timestamp'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  setLastError: (error: string | null) => void;
  
  // Actions - 持久化
  saveSystemState: () => Promise<void>;
  loadSystemState: () => Promise<void>;
  exportData: (type: 'full' | 'tasks' | 'knowledge') => string;
  importData: (data: string) => Promise<void>;
  setStorageWarning: (value: boolean) => void;
  
  // Actions - 清除数据
  clearAllData: () => void;
}

// 从存储加载状态
logger.info('SYSTEM', 'Loading state from SafeStorage');
const loadedTasks = SafeStorage.getTasks();
logger.debug('STORE', `Loaded ${loadedTasks.length} tasks from storage`);
const loadedLayers = SafeStorage.getLayers();
logger.debug('STORE', `Loaded ${loadedLayers.length} layers from storage`);
const loadedMetrics = SafeStorage.getMetrics();
logger.debug('STORE', 'Loaded metrics from storage', loadedMetrics);
const loadedEvolution = SafeStorage.getEvolution();
const loadedMemories = SafeStorage.getMemories();
logger.debug('STORE', `Loaded ${loadedMemories.length} memories from storage`);
const loadedStrategies = SafeStorage.getStrategies();
logger.debug('STORE', `Loaded ${loadedStrategies.length} strategies from storage`);
const loadedNotifications = SafeStorage.getNotifications();
logger.debug('STORE', `Loaded ${loadedNotifications.length} notifications from storage`);

export const useSystemStore = create<SystemStore>((set, get) => {
  logger.info('SYSTEM', 'Creating Zustand store instance');
  
  return {
    // 初始化状态
    systemMode: 'work',
    isRunning: false,
    systemStartTime: 0,
    layers: loadedLayers.length > 0 ? loadedLayers : initializeLayers(),
    tasks: loadedTasks,
    currentTask: null,
    taskQueue: [],
    memories: loadedMemories.length > 0 ? loadedMemories : sampleMemories,
    strategies: loadedStrategies.length > 0 ? loadedStrategies : sampleStrategies,
    knowledgeGraph: initializeKnowledgeGraph(),
    metrics: { ...initializeMetrics(), ...loadedMetrics },
    benchmarks: [],
    performanceHistory: [],
    evolutionState: {
      currentPhase: 'initialization',
      phaseProgress: 0,
      lastEvolutionAt: Date.now(),
      evolutionCycle: 0,
      insights: [],
      improvements: [],
    },
    notifications: loadedNotifications,
    lastError: null,
    storageWarning: SafeStorage.isNearLimit(),
    
    // 系统控制
    setSystemMode: (mode) => {
      logger.debug('STORE', `setSystemMode: Changing mode to ${mode}`);
      set({ systemMode: mode });
      logger.info('STORE', `setSystemMode: Mode changed to ${mode}`);
    },
    
    startSystem: () => {
      logger.info('SYSTEM', 'startSystem: Starting system');
      const startTime = Date.now();
      set({ isRunning: true, systemStartTime: startTime });
      logger.debug('SYSTEM', `startSystem: Set start time to ${startTime}`);
      
      get().addNotification({
        type: 'info',
        message: '系统已启动',
        read: false,
      });
      logger.info('SYSTEM', 'startSystem: System started successfully');
    },
    
    stopSystem: () => {
      logger.info('SYSTEM', 'stopSystem: Stopping system');
      set({ isRunning: false });
      
      get().addNotification({
        type: 'info',
        message: '系统已停止',
        read: false,
      });
      logger.info('SYSTEM', 'stopSystem: System stopped successfully');
    },
    
    // 任务管理
    addTask: (task) => {
      logger.debug('TASK', 'addTask: Adding new task', { task });
      const stateBefore = get();
      const currentTasks = stateBefore.tasks;
      logger.debug('TASK', `addTask: Current tasks count: ${currentTasks.length}`);
      
      // 自动清理 - 确保任务总数不超过200，不管状态
      let tasksToKeep = currentTasks;
      if (currentTasks.length >= 200) {
        logger.warn('TASK', 'addTask: Task count exceeds limit, starting cleanup');
        
        // 分类处理：保留所有pending/running，完成/失败的只保留最近的
        const completedTasks = currentTasks.filter(t => t.status === 'completed' || t.status === 'failed');
        const pendingTasks = currentTasks.filter(t => t.status === 'pending' || t.status === 'running');
        logger.debug('TASK', `addTask: Completed tasks: ${completedTasks.length}, Pending tasks: ${pendingTasks.length}`);
        
        // 如果pending/running已经超过150，也需要清理（保留最新的）
        let finalPendingTasks = pendingTasks;
        if (pendingTasks.length > 150) {
          logger.warn('TASK', `addTask: Too many pending/running tasks (${pendingTasks.length}), cleaning up oldest ones`);
          finalPendingTasks = pendingTasks.sort((a, b) => b.createdAt - a.createdAt).slice(0, 150);
        }
        
        // 保留最近的完成/失败任务
        const recentCompleted = completedTasks.sort((a, b) => 
          (b.completedAt || b.createdAt) - (a.completedAt || a.createdAt)
        ).slice(0, 50);
        
        tasksToKeep = [...finalPendingTasks, ...recentCompleted];
        logger.info('TASK', `addTask: Cleaned up to ${tasksToKeep.length} tasks`);
      }
      
      // 安全验证 priority 范围 (0-4)
      let safePriority = task.priority;
      if (typeof safePriority !== 'number' || safePriority < 0 || safePriority > 4) {
        logger.warn('TASK', `addTask: Invalid priority ${task.priority}, using default 2`);
        safePriority = 2;
      }
      
      const newTask: Task = {
        id: task.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: task.name || '未命名任务',
        priority: safePriority,
        status: 'pending',
        input: task.input || {},
        createdAt: Date.now(),
        ...task,
      };
      logger.debug('TASK', `addTask: Created new task with ID: ${newTask.id}`);
      
      const newTasks = [...tasksToKeep, newTask];
      logger.debug('TASK', `addTask: New tasks count: ${newTasks.length}`);
      
      const newMetrics = { 
        ...stateBefore.metrics, 
        totalTasks: stateBefore.metrics.totalTasks + 1 
      };
      
      // Bug10 修复: 先尝试存储，存储成功后再更新状态
      const tasksSaved = SafeStorage.setTasks(newTasks);
      const metricsSaved = SafeStorage.setMetrics(newMetrics);
      
      if (!tasksSaved || !metricsSaved) {
        logger.error('STORE', 'addTask: Failed to save to storage', { tasksSaved, metricsSaved });
        set({ lastError: 'Failed to save task to storage' });
        return { ...newTask, warning: 'storage failed' };
      } else {
        logger.debug('STORE', 'addTask: Saved to storage successfully');
      }
      
      if (SafeStorage.isNearLimit()) {
        logger.warn('STORE', 'addTask: Storage limit approaching');
        set({ storageWarning: true });
      }
      
      set({
        tasks: newTasks,
        metrics: newMetrics,
      });
      
      logger.debug('STORE', `addTask: Updated metrics - totalTasks: ${newMetrics.totalTasks}`);
      
      logger.info('TASK', `addTask: Task added successfully - ${newTask.name} (${newTask.id})`);
      return newTask;
    },
    
    updateTask: (id, updates) => {
      logger.debug('TASK', `updateTask: Updating task ${id}`, { updates });
      const newTasks = get().tasks.map((t) => t.id === id ? { ...t, ...updates } : t);
      logger.debug('TASK', `updateTask: Task list updated, new count: ${newTasks.length}`);
      
      // Bug16 修复: 先存储，后更新状态
      const saved = SafeStorage.setTasks(newTasks);
      
      if (!saved) {
        logger.error('STORE', 'updateTask: Failed to save tasks to storage');
        set({ lastError: 'Failed to update task' });
        // 不更新状态，保持一致性
        return;
      } else {
        logger.debug('STORE', 'updateTask: Tasks saved to storage successfully');
      }
      
      set({ tasks: newTasks });
      logger.info('TASK', `updateTask: Task ${id} updated successfully`);
    },
    
    removeTask: (id) => {
      logger.info('TASK', `removeTask: Removing task ${id}`);
      const newTasks = get().tasks.filter((t) => t.id !== id);
      logger.debug('TASK', `removeTask: New task count: ${newTasks.length}`);
      
      // Bug17 修复: 先存储，后更新状态
      const saved = SafeStorage.setTasks(newTasks);
      
      if (!saved) {
        logger.error('STORE', 'removeTask: Failed to save tasks to storage');
        set({ lastError: 'Failed to remove task' });
        // 不更新状态，保持一致性
        return;
      } else {
        logger.debug('STORE', 'removeTask: Tasks saved to storage successfully');
      }
      
      set({ tasks: newTasks });
      logger.info('TASK', `removeTask: Task ${id} removed successfully`);
    },
    
    clearTasks: () => {
      logger.warn('TASK', 'clearTasks: Clearing all tasks');
      
      // Bug18 修复: 先存储，后更新状态
      const saved = SafeStorage.setTasks([]);
      
      if (!saved) {
        logger.error('STORE', 'clearTasks: Failed to save tasks to storage');
        set({ lastError: 'Failed to clear tasks' });
        // 不更新状态，保持一致性
        return;
      }
      
      set({ tasks: [], currentTask: null });
      logger.info('TASK', 'clearTasks: All tasks cleared');
    },
    
    executeTask: async (taskId: string) => {
      logger.info('TASK', `executeTask: Starting execution of task ${taskId}`);
      const state = get();
      const task = state.tasks.find(t => t.id === taskId);
      
      if (!task) {
        logger.error('TASK', `executeTask: Task ${taskId} not found`);
        get().addNotification({ type: 'error', message: `任务 ${taskId} 不存在`, read: false });
        return;
      }
      
      logger.debug('TASK', `executeTask: Found task`, { task });
      
      // 防止重复执行
      if (task.status === 'running') {
        logger.warn('TASK', `executeTask: Task ${taskId} is already running`);
        return;
      }
      
      try {
        logger.debug('TASK', `executeTask: Checking for current task`);
        if (state.currentTask?.id === taskId) {
          logger.warn('TASK', `executeTask: Task ${taskId} is already current task`);
          return;
        }
        
        logger.info('TASK', `executeTask: Setting task ${taskId} as current`);
        set({ currentTask: task });
        
        get().updateTask(taskId, { status: 'running', startedAt: Date.now() });
        logger.debug('TASK', `executeTask: Task ${taskId} status set to running`);
        
        // 激活执行层
        logger.debug('LAYER', 'executeTask: Activating layer 4 (execution)');
        get().updateLayerStatus(4, { status: 'processing' });
        
        // 模拟执行过程 - 安全验证 task.input.delay
        let executionTime: number;
        if (task.input?.delay) {
          const parsedDelay = Number(task.input.delay);
          // 验证 delay 是有效数字，范围在 0 到 1 小时
          if (!isNaN(parsedDelay) && parsedDelay >= 0 && parsedDelay <= 3600000) {
            executionTime = parsedDelay;
          } else {
            logger.warn('TASK', `executeTask: Invalid delay value, using default instead`);
            executionTime = 1500 + Math.random() * 2000;
          }
        } else {
          executionTime = 1500 + Math.random() * 2000;
        }
        
        logger.debug('TASK', `executeTask: Will execute for ${executionTime}ms`);
        await new Promise(resolve => setTimeout(resolve, executionTime));
        
        const shouldFail = task.input?.shouldFail as boolean || Math.random() > 0.9;
        const completedAt = Date.now();
        const duration = completedAt - (task.startedAt || completedAt);
        logger.debug('TASK', `executeTask: Execution complete - shouldFail: ${shouldFail}, duration: ${duration}ms`);
        
        if (shouldFail) {
          logger.warn('TASK', `executeTask: Task ${taskId} failed`);
          get().updateTask(taskId, { 
            status: 'failed', 
            error: '任务执行失败', 
            completedAt, 
            duration 
          });
          get().addNotification({ type: 'error', message: `任务失败: ${task.name}`, read: false });
        } else {
          logger.info('TASK', `executeTask: Task ${taskId} completed successfully`);
          get().updateTask(taskId, { 
            status: 'completed', 
            completedAt, 
            duration,
            output: { result: 'success', executionTime: duration }
          });
          get().addNotification({ type: 'success', message: `任务完成: ${task.name}`, read: false });
        }
        
        // 更新指标 - 使用批量更新减少状态变更
        logger.debug('STORE', 'executeTask: Updating metrics');
        const currentMetrics = get().metrics;
        const newTotalTasks = currentMetrics.totalTasks;
        const newCompletedTasks = shouldFail ? currentMetrics.completedTasks : currentMetrics.completedTasks + 1;
        const newFailedTasks = shouldFail ? currentMetrics.failedTasks + 1 : currentMetrics.failedTasks;
        
        const newMetrics = {
          ...currentMetrics,
          totalTasks: newTotalTasks,
          completedTasks: newCompletedTasks,
          failedTasks: newFailedTasks,
          avgResponseTime: currentMetrics.avgResponseTime * 0.7 + duration * 0.3,
          successRate: newTotalTasks > 0 
            ? Math.min(100, (newCompletedTasks / newTotalTasks) * 100) 
            : 0,
        };
        
        logger.debug('STORE', 'executeTask: New metrics', {
          completed: newCompletedTasks,
          failed: newFailedTasks,
          successRate: newMetrics.successRate
        });
        
        // Bug14 修复: 先持久化metrics
        const metricsSaved = SafeStorage.setMetrics(newMetrics);
        
        if (!metricsSaved) {
          logger.error('STORE', 'executeTask: Failed to save metrics to storage');
          set({ lastError: 'Failed to save metrics to storage' });
        } else {
          logger.debug('STORE', 'executeTask: Metrics saved to storage successfully');
          set({ metrics: newMetrics });
        }
        
        logger.info('TASK', `executeTask: Task ${taskId} execution fully completed`);
        
      } catch (error) {
        logger.error('TASK', `executeTask: Error during task ${taskId} execution`, { error });
        get().updateTask(taskId, { 
          status: 'failed', 
          error: error instanceof Error ? error.message : '未知错误', 
          completedAt: Date.now(), 
        });
        get().addNotification({ type: 'error', message: `任务执行异常: ${task.name}`, read: false });
        get().setLastError(error instanceof Error ? error.message : '任务执行异常');
      } finally {
        logger.debug('TASK', `executeTask: Cleaning up after task ${taskId}`);
        set({ currentTask: null });
        get().updateLayerStatus(4, { status: 'active' });
        logger.debug('LAYER', 'executeTask: Layer 4 set back to active');
      }
    },
    
    batchExecuteTasks: async (taskIds: string[]) => {
      logger.info('TASK', `batchExecuteTasks: Executing ${taskIds.length} tasks in batch`);
      for (let i = 0; i < taskIds.length; i++) {
        const taskId = taskIds[i];
        logger.debug('TASK', `batchExecuteTasks: Executing task ${i + 1}/${taskIds.length} - ${taskId}`);
        await get().executeTask(taskId);
      }
      logger.info('TASK', 'batchExecuteTasks: All tasks executed');
    },
    
    setCurrentTask: (task) => {
      logger.debug('TASK', `setCurrentTask: Setting current task to ${task?.id || 'null'}`);
      set({ currentTask: task });
    },
    
    // 层级管理
    updateLayerStatus: (layerId, updates) => set((state) => {
      logger.debug('LAYER', `updateLayerStatus: Updating layer ${layerId}`, { updates });
      const newLayers = state.layers.map((l) => l.id === layerId ? { ...l, ...updates, lastUpdate: Date.now() } : l);
      
      logger.debug('STORE', 'updateLayerStatus: Saving layers to storage');
      SafeStorage.setLayers(newLayers);
      
      logger.info('LAYER', `updateLayerStatus: Layer ${layerId} updated`);
      return { layers: newLayers };
    }),
    
    // 记忆管理
    addMemory: (memory) => {
      logger.debug('MEMORY', 'addMemory: Adding new memory', { memory });
      
      // 安全验证 relevance 范围 (0-1)
      let safeRelevance = memory.relevance;
      if (typeof safeRelevance !== 'number' || safeRelevance < 0 || safeRelevance > 1) {
        logger.warn('MEMORY', `addMemory: Invalid relevance ${memory.relevance}, using default 0.5`);
        safeRelevance = 0.5;
      }
      
      const newMemory: MemoryEntry = {
        id: memory.id || `memory-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: memory.type || 'experience',
        content: memory.content || '',
        relevance: safeRelevance,
        createdAt: Date.now(),
        accessCount: 0,
        ...memory,
      };
      logger.debug('MEMORY', `addMemory: Created memory with ID: ${newMemory.id}`);
      
      set((state) => {
        // 优化：不要每次都排序，保持新的在前，只在超过限制时排序
        let newMemories = [newMemory, ...state.memories];
        logger.debug('MEMORY', `addMemory: Current memory count: ${newMemories.length}`);
        
        if (newMemories.length > 100) {
          logger.warn('MEMORY', 'addMemory: Memory limit exceeded, cleaning up');
          newMemories = newMemories.sort((a, b) => 
            (b.relevance || 0) - (a.relevance || 0)
          ).slice(0, 100);
          logger.info('MEMORY', `addMemory: Cleaned up to ${newMemories.length} memories`);
        }
        
        logger.debug('STORE', 'addMemory: Saving memories to storage');
        SafeStorage.setMemories(newMemories);
        
        return { memories: newMemories };
      });
      
      logger.info('MEMORY', `addMemory: Memory added successfully - ${newMemory.id}`);
      return newMemory;
    },
    
    updateMemory: (id, updates) => set((state) => {
      logger.debug('MEMORY', `updateMemory: Updating memory ${id}`, { updates });
      const newMemories = state.memories.map((m) => m.id === id ? { ...m, ...updates } : m);
      
      SafeStorage.setMemories(newMemories);
      logger.info('MEMORY', `updateMemory: Memory ${id} updated`);
      
      return { memories: newMemories };
    }),
    
    retrieveRelevantMemories: (query: string, limit = 10) => {
      logger.debug('MEMORY', `retrieveRelevantMemories: Searching for "${query}" with limit ${limit}`);
      const state = get();
      
      // 安全验证：处理 null/undefined 查询和记忆
      const safeQuery = (query || '').toLowerCase();
      const safeLimit = limit > 0 ? limit : 10;
      
      const relevantMemories = state.memories
        .filter((m) => {
          const safeContent = (m.content || '').toLowerCase();
          return safeContent.includes(safeQuery);
        })
        .sort((a, b) => (b.relevance || 0) - (a.relevance || 0))
        .slice(0, safeLimit);
      
      logger.info('MEMORY', `retrieveRelevantMemories: Found ${relevantMemories.length} relevant memories`);
      return relevantMemories;
    },
    
    // 策略管理
    addStrategy: (strategy) => {
      logger.debug('STRATEGY', 'addStrategy: Adding new strategy', { strategy });
      
      const newStrategy: StrategyEntry = {
        id: strategy.id || `strategy-${Date.now()}`,
        name: strategy.name || '未命名策略',
        description: strategy.description || '',
        version: strategy.version || '1.0.0',
        conditions: strategy.conditions || {},
        actions: strategy.actions || {},
        effectiveness: strategy.effectiveness || 0.5,
        usageCount: 0,
        successCount: 0,
        createdAt: Date.now(),
        lastUpdated: Date.now(),
        isActive: strategy.isActive !== undefined ? strategy.isActive : true,
      };
      logger.debug('STRATEGY', `addStrategy: Created strategy with ID: ${newStrategy.id}`);
      
      set((state) => {
        const newStrategies = [newStrategy, ...state.strategies];
        logger.debug('STRATEGY', `addStrategy: New strategies count: ${newStrategies.length}`);
        
        SafeStorage.setStrategies(newStrategies);
        return { strategies: newStrategies };
      });
      
      logger.info('STRATEGY', `addStrategy: Strategy added successfully - ${newStrategy.name} (${newStrategy.id})`);
      return newStrategy;
    },
    
    updateStrategy: (id, updates) => set((state) => {
      logger.debug('STRATEGY', `updateStrategy: Updating strategy ${id}`, { updates });
      const newStrategies = state.strategies.map((s) => s.id === id ? { ...s, ...updates, lastUpdated: Date.now() } : s);
      
      SafeStorage.setStrategies(newStrategies);
      logger.info('STRATEGY', `updateStrategy: Strategy ${id} updated`);
      
      return { strategies: newStrategies };
    }),
    
    getOptimalStrategy: (context) => {
      logger.debug('STRATEGY', 'getOptimalStrategy: Finding optimal strategy', { context });
      const state = get();
      const activeStrategies = state.strategies.filter((s) => s.isActive);
      logger.debug('STRATEGY', `getOptimalStrategy: Found ${activeStrategies.length} active strategies`);
      
      if (activeStrategies.length === 0) {
        logger.warn('STRATEGY', 'getOptimalStrategy: No active strategies found');
        return null;
      }
      
      activeStrategies.sort((a, b) => b.effectiveness - a.effectiveness);
      const optimal = activeStrategies[0];
      logger.info('STRATEGY', `getOptimalStrategy: Selected optimal strategy: ${optimal.name} (effectiveness: ${optimal.effectiveness})`);
      
      return optimal;
    },
    
    // 知识图谱
    addKnowledgeNode: (node) => {
      logger.debug('KNOWLEDGE', 'addKnowledgeNode: Adding new node', { node });
      
      const newNode: KnowledgeNode = {
        id: node.id || `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        label: node.label || '未命名节点',
        type: node.type || 'concept',
        properties: node.properties || {},
        ...node,
      };
      logger.debug('KNOWLEDGE', `addKnowledgeNode: Created node with ID: ${newNode.id}`);
      
      set((state) => {
        const newNodes = [...state.knowledgeGraph.nodes, newNode];
        const newGraph = { ...state.knowledgeGraph, nodes: newNodes };
        logger.debug('KNOWLEDGE', `addKnowledgeNode: New nodes count: ${newNodes.length}`);
        return { knowledgeGraph: newGraph };
      });
      
      logger.info('KNOWLEDGE', `addKnowledgeNode: Node added successfully - ${newNode.label} (${newNode.id})`);
      return newNode;
    },
    
    addKnowledgeEdge: (edge) => {
      logger.debug('KNOWLEDGE', 'addKnowledgeEdge: Adding new edge', { edge });
      
      const newEdge: KnowledgeEdge = {
        id: edge.id || `edge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        source: edge.source || '',
        target: edge.target || '',
        type: edge.type || 'related_to',
        weight: edge.weight || 1,
        properties: edge.properties || {},
        ...edge,
      };
      logger.debug('KNOWLEDGE', `addKnowledgeEdge: Created edge with ID: ${newEdge.id}`);
      
      set((state) => {
        const newEdges = [...state.knowledgeGraph.edges, newEdge];
        const newGraph = { ...state.knowledgeGraph, edges: newEdges };
        logger.debug('KNOWLEDGE', `addKnowledgeEdge: New edges count: ${newEdges.length}`);
        return { knowledgeGraph: newGraph };
      });
      
      logger.info('KNOWLEDGE', `addKnowledgeEdge: Edge added successfully - ${newEdge.id}`);
      return newEdge;
    },
    
    updateKnowledgeGraph: (updates) => set((state) => {
      logger.debug('KNOWLEDGE', 'updateKnowledgeGraph: Updating graph', { updates });
      return { knowledgeGraph: { ...state.knowledgeGraph, ...updates } };
    }),
    
    // 指标管理
    updateMetrics: (updates) => set((state) => {
      logger.debug('STORE', 'updateMetrics: Updating metrics', { updates });
      const newMetrics = { ...state.metrics, ...updates };
      SafeStorage.setMetrics(newMetrics);
      return { metrics: newMetrics };
    }),
    
    addBenchmark: (benchmark) => set((state) => {
      logger.debug('STORE', 'addBenchmark: Adding benchmark', { benchmark });
      return { benchmarks: [...state.benchmarks, benchmark] };
    }),
    
    // 通知管理
    addNotification: (notification) => set((state) => {
      logger.debug('NOTIFICATION', 'addNotification: Adding notification', { notification });
      const newNotification = {
        ...notification,
        id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      };
      
      const newNotifications = [newNotification, ...state.notifications].slice(0, 100);
      logger.info('NOTIFICATION', `addNotification: Notification added - ${notification.type}: ${notification.message}`);
      
      // Bug9 修复: 持久化通知
      SafeStorage.setNotifications(newNotifications);
      
      return { notifications: newNotifications };
    }),
    
    markNotificationRead: (id) => set((state) => {
      logger.debug('NOTIFICATION', `markNotificationRead: Marking notification ${id} as read`);
      const newNotifications = state.notifications.map((n) => n.id === id ? { ...n, read: true } : n);
      
      SafeStorage.setNotifications(newNotifications);
      
      return {
        notifications: newNotifications,
      };
    }),
    
    clearNotifications: () => {
      logger.warn('NOTIFICATION', 'clearNotifications: Clearing all notifications');
      set({ notifications: [] });
      SafeStorage.setNotifications([]);
    },
    
    setLastError: (error) => {
      if (error) {
        logger.error('STORE', `setLastError: Setting last error - ${error}`);
      }
      set({ lastError: error });
    },
    
    setStorageWarning: (value) => {
      logger.debug('STORE', `setStorageWarning: Setting storage warning to ${value}`);
      set({ storageWarning: value });
    },
    
    // 持久化
    saveSystemState: async () => {
      logger.info('STORE', 'saveSystemState: Saving system state');
      const state = get();
      
      SafeStorage.setTasks(state.tasks);
      SafeStorage.setLayers(state.layers);
      SafeStorage.setMetrics(state.metrics);
      SafeStorage.setMemories(state.memories);
      SafeStorage.setStrategies(state.strategies);
      SafeStorage.setNotifications(state.notifications); // Bug13 修复: 保存通知
      
      logger.info('STORE', 'saveSystemState: System state saved successfully');
    },
    
    loadSystemState: async () => {
      logger.info('STORE', 'loadSystemState: Loading system state');
      const tasks = SafeStorage.getTasks();
      const layers = SafeStorage.getLayers();
      const metrics = SafeStorage.getMetrics();
      const memories = SafeStorage.getMemories();
      const strategies = SafeStorage.getStrategies();
      const notifications = SafeStorage.getNotifications(); // Bug12 修复: 加载通知
      
      set({
        tasks,
        layers: layers.length > 0 ? layers : initializeLayers(),
        metrics: { ...initializeMetrics(), ...metrics },
        memories: memories.length > 0 ? memories : sampleMemories,
        strategies: strategies.length > 0 ? strategies : sampleStrategies,
        notifications, // Bug12 修复: 使用加载的通知
      });
      
      logger.info('STORE', 'loadSystemState: System state loaded successfully');
    },
    
    exportData: (type) => {
      logger.info('STORE', `exportData: Exporting data of type ${type}`);
      const state = get();
      let data: any = {};
      
      switch (type) {
        case 'full':
          data = {
            tasks: state.tasks,
            memories: state.memories,
            strategies: state.strategies,
            knowledgeGraph: state.knowledgeGraph,
            metrics: state.metrics,
            exportedAt: Date.now(),
          };
          break;
        case 'tasks':
          data = { tasks: state.tasks, exportedAt: Date.now() };
          break;
        case 'knowledge':
          data = { 
            memories: state.memories, 
            strategies: state.strategies, 
            knowledgeGraph: state.knowledgeGraph, 
            exportedAt: Date.now() 
          };
          break;
      }
      
      logger.debug('STORE', `exportData: Exporting ${JSON.stringify(data).length} characters of data`);
      return JSON.stringify(data, null, 2);
    },
    
    importData: async (data: string) => {
      logger.info('STORE', 'importData: Importing data');
      try {
        const parsed = JSON.parse(data);
        logger.debug('STORE', 'importData: Data parsed successfully', { keys: Object.keys(parsed) });
        
        if (parsed.tasks) {
          SafeStorage.setTasks(parsed.tasks);
          set({ tasks: parsed.tasks });
          logger.info('STORE', `importData: Imported ${parsed.tasks.length} tasks`);
        }
        
        if (parsed.memories) {
          SafeStorage.setMemories(parsed.memories);
          set({ memories: parsed.memories });
          logger.info('STORE', `importData: Imported ${parsed.memories.length} memories`);
        }
        
        if (parsed.strategies) {
          SafeStorage.setStrategies(parsed.strategies);
          set({ strategies: parsed.strategies });
          logger.info('STORE', `importData: Imported ${parsed.strategies.length} strategies`);
        }
        
        if (parsed.knowledgeGraph) {
          set({ knowledgeGraph: parsed.knowledgeGraph });
          logger.info('STORE', 'importData: Imported knowledge graph');
        }
        
        get().addNotification({ type: 'success', message: '数据导入成功', read: false });
        logger.info('STORE', 'importData: Data imported successfully');
        
      } catch (error) {
        logger.error('STORE', 'importData: Failed to import data', { error });
        get().setLastError('数据导入失败');
      }
    },
    
    clearAllData: () => {
      logger.warn('STORE', 'clearAllData: Clearing ALL system data - THIS IS A DESTRUCTIVE OPERATION!');
      
      // 重置所有状态到初始值
      set({
        tasks: [],
        currentTask: null,
        memories: [],
        notifications: [],
        layers: initializeLayers(),
        strategies: [],
        knowledgeGraph: initializeKnowledgeGraph(),
        systemMode: 'idle',
        evolutionState: {
          currentPhase: 'initialization',
          phaseProgress: 0,
          lastEvolutionAt: Date.now(),
          evolutionCycle: 0,
          insights: [],
          improvements: [],
        },
        metrics: initializeMetrics(),
        performanceHistory: [],
        lastError: null,
        storageWarning: false,
      });
      
      logger.debug('STORE', 'clearAllData: Clearing persistent storage');
      SafeStorage.clearAll();
      
      logger.info('STORE', '✅ All system data cleared successfully');
    },
  };
});
