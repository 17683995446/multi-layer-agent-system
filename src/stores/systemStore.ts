import { create } from 'zustand';
import { Task, LayerState, SystemMode, SystemMetrics, EvolutionState, MemoryEntry, StrategyEntry, KnowledgeEntry } from '@/types';

interface SystemStore {
  mode: SystemMode;
  layers: LayerState[];
  tasks: Task[];
  currentTask: Task | null;
  metrics: SystemMetrics;
  evolution: EvolutionState;
  memories: MemoryEntry[];
  strategies: StrategyEntry[];
  knowledge: KnowledgeEntry[];
  isRunning: boolean;
  systemStartTime: number;

  setMode: (mode: SystemMode) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  removeTask: (taskId: string) => void;
  clearTasks: () => void;
  setCurrentTask: (task: Task | null) => void;
  updateLayerStatus: (layerId: number, updates: Partial<LayerState>) => void;
  updateMetrics: (updates: Partial<SystemMetrics>) => void;
  updateEvolution: (updates: Partial<EvolutionState>) => void;
  addMemory: (memory: MemoryEntry) => void;
  addStrategy: (strategy: StrategyEntry) => void;
  addKnowledge: (knowledge: KnowledgeEntry) => void;
  start: () => void;
  stop: () => void;
  resetTasks: () => void;
}

const STORAGE_KEY = 'multi-layer-agent-tasks';

const loadTasksFromStorage = (): Task[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load tasks from storage:', error);
  }
  return [];
};

const saveTasksToStorage = (tasks: Task[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Failed to save tasks to storage:', error);
  }
};

const initialLayers: LayerState[] = [
  {
    id: 1,
    name: '系统初始化',
    status: 'idle',
    metrics: { tasksProcessed: 0, successRate: 0, avgDuration: 0 },
    lastUpdate: Date.now(),
    modules: ['启动引导', '环境配置', '数据加载'],
  },
  {
    id: 2,
    name: '任务接入',
    status: 'idle',
    metrics: { tasksProcessed: 0, successRate: 0, avgDuration: 0 },
    lastUpdate: Date.now(),
    modules: ['任务接收', '任务校验', '优先级排序'],
  },
  {
    id: 3,
    name: '模式调度',
    status: 'idle',
    metrics: { tasksProcessed: 0, successRate: 0, avgDuration: 0 },
    lastUpdate: Date.now(),
    modules: ['模式决策', '断点管理', '抢占切换'],
  },
  {
    id: 4,
    name: '任务执行',
    status: 'idle',
    metrics: { tasksProcessed: 0, successRate: 0, avgDuration: 0 },
    lastUpdate: Date.now(),
    modules: ['任务规划', '任务执行', '结果校验'],
  },
  {
    id: 5,
    name: '结果沉淀',
    status: 'idle',
    metrics: { tasksProcessed: 0, successRate: 0, avgDuration: 0 },
    lastUpdate: Date.now(),
    modules: ['结果输出', '经验沉淀', '反馈上报'],
  },
  {
    id: 6,
    name: '空闲进化',
    status: 'idle',
    metrics: { tasksProcessed: 0, successRate: 0, avgDuration: 0 },
    lastUpdate: Date.now(),
    modules: ['记忆治理', '策略优化', '自主学习'],
  },
];

const initialMetrics: SystemMetrics = {
  totalTasks: 0,
  completedTasks: 0,
  failedTasks: 0,
  successRate: 0,
  avgResponseTime: 0,
  uptime: 0,
};

const initialEvolution: EvolutionState = {
  memoriesProcessed: 0,
  strategiesOptimized: 0,
  knowledgeGained: 0,
  lastEvolution: Date.now(),
};

const sampleMemories: MemoryEntry[] = [
  { id: 'm1', content: '处理高优先级任务时优先调度', type: 'experience', timestamp: Date.now() - 86400000, relevance: 0.9 },
  { id: 'm2', content: '断点恢复机制有效减少任务中断', type: 'pattern', timestamp: Date.now() - 172800000, relevance: 0.85 },
  { id: 'm3', content: '空闲时期进行知识积累效果显著', type: 'knowledge', timestamp: Date.now() - 259200000, relevance: 0.8 },
];

const sampleStrategies: StrategyEntry[] = [
  { id: 's1', name: '快速失败重试', pattern: 'fail-fast', successRate: 0.92, usageCount: 156 },
  { id: 's2', name: '渐进式执行', pattern: 'incremental', successRate: 0.88, usageCount: 203 },
  { id: 's3', name: '批量处理优化', pattern: 'batch', successRate: 0.95, usageCount: 89 },
];

const sampleKnowledge: KnowledgeEntry[] = [
  { id: 'k1', topic: '系统优化', content: '通过记忆碎片化提升检索效率', confidence: 0.92, source: '自主学习' },
  { id: 'k2', topic: '任务调度', content: '基于优先级的抢占式调度算法', confidence: 0.88, source: '经验沉淀' },
  { id: 'k3', topic: '故障恢复', content: '检查点机制实现断点续传', confidence: 0.95, source: '系统学习' },
];

const loadedTasks = loadTasksFromStorage();

export const useSystemStore = create<SystemStore>((set, get) => ({
  mode: 'idle',
  layers: initialLayers,
  tasks: loadedTasks,
  currentTask: null,
  metrics: initialMetrics,
  evolution: initialEvolution,
  memories: sampleMemories,
  strategies: sampleStrategies,
  knowledge: sampleKnowledge,
  isRunning: false,
  systemStartTime: 0,

  setMode: (mode) => set({ mode }),

  addTask: (task) => {
    const newTasks = [...get().tasks, task];
    saveTasksToStorage(newTasks);
    set((state) => ({
      tasks: newTasks,
      metrics: { ...state.metrics, totalTasks: state.metrics.totalTasks + 1 },
    }));
  },

  updateTask: (taskId, updates) => {
    const newTasks = get().tasks.map((t) => t.id === taskId ? { ...t, ...updates } : t);
    saveTasksToStorage(newTasks);
    set({ tasks: newTasks });
  },

  removeTask: (taskId) => {
    const newTasks = get().tasks.filter((t) => t.id !== taskId);
    saveTasksToStorage(newTasks);
    set({ tasks: newTasks });
  },

  clearTasks: () => {
    saveTasksToStorage([]);
    set({ tasks: [], currentTask: null });
  },

  setCurrentTask: (task) => set({ currentTask: task }),

  updateLayerStatus: (layerId, updates) => set((state) => ({
    layers: state.layers.map((l) => l.id === layerId ? { ...l, ...updates, lastUpdate: Date.now() } : l),
  })),

  updateMetrics: (updates) => set((state) => ({
    metrics: { ...state.metrics, ...updates },
  })),

  updateEvolution: (updates) => set((state) => ({
    evolution: { ...state.evolution, ...updates },
  })),

  addMemory: (memory) => set((state) => ({
    memories: [memory, ...state.memories],
    evolution: { ...state.evolution, memoriesProcessed: state.evolution.memoriesProcessed + 1 },
  })),

  addStrategy: (strategy) => set((state) => ({
    strategies: [strategy, ...state.strategies],
    evolution: { ...state.evolution, strategiesOptimized: state.evolution.strategiesOptimized + 1 },
  })),

  addKnowledge: (knowledge) => set((state) => ({
    knowledge: [knowledge, ...state.knowledge],
    evolution: { ...state.evolution, knowledgeGained: state.evolution.knowledgeGained + 1 },
  })),

  start: () => set({ isRunning: true, systemStartTime: Date.now() }),

  stop: () => set({ isRunning: false }),

  resetTasks: () => {
    saveTasksToStorage([]);
    set({ tasks: [], currentTask: null });
  },
}));
