export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed';
export type LayerStatus = 'idle' | 'active' | 'error';
export type SystemMode = 'work' | 'idle';

export interface Task {
  id: string;
  name: string;
  priority: number;
  status: TaskStatus;
  input: any;
  output?: any;
  createdAt: number;
  executedAt?: number;
  duration?: number;
}

export interface ExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
}

export interface LayerMetrics {
  tasksProcessed: number;
  successRate: number;
  avgDuration: number;
}

export interface LayerState {
  id: number;
  name: string;
  status: LayerStatus;
  metrics: LayerMetrics;
  lastUpdate: number;
  modules: string[];
}

export interface SystemMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  successRate: number;
  avgResponseTime: number;
  uptime: number;
}

export interface MemoryEntry {
  id: string;
  content: string;
  type: 'experience' | 'knowledge' | 'pattern';
  timestamp: number;
  relevance: number;
}

export interface StrategyEntry {
  id: string;
  name: string;
  pattern: string;
  successRate: number;
  usageCount: number;
}

export interface KnowledgeEntry {
  id: string;
  topic: string;
  content: string;
  confidence: number;
  source: string;
}

export interface EvolutionState {
  memoriesProcessed: number;
  strategiesOptimized: number;
  knowledgeGained: number;
  lastEvolution: number;
}
