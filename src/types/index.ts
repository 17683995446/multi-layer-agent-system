// 基础枚举类型
export type TaskStatus = 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'interrupted';
export type LayerStatus = 'idle' | 'active' | 'processing' | 'error' | 'recovering';
export type SystemMode = 'work' | 'learning' | 'evolving' | 'sleeping' | 'repairing';

// 层级状态
export interface LayerState {
  id: number;
  name: string;
  status: LayerStatus;
  metrics: {
    cpuUsage: number;
    memoryUsage: number;
    taskCount: number;
    avgResponseTime: number;
    successRate: number;
  };
  lastUpdate: number;
  modules: string[];
}

// 任务类型
export interface Task {
  id: string;
  name: string;
  description?: string;
  priority: 0 | 1 | 2 | 3 | 4; // 0=最低, 4=最高
  status: TaskStatus;
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  createdAt: number;
  queuedAt?: number;
  startedAt?: number;
  completedAt?: number;
  executedAt?: number;
  duration?: number;
  executorLayer?: number;
  metadata?: Record<string, any>;
  tags?: string[];
}

// 记忆类型
export interface MemoryEntry {
  id: string;
  type: 'experience' | 'pattern' | 'knowledge' | 'error' | 'success';
  content: string;
  context?: Record<string, any>;
  relevance: number; // 0-1 相关性得分
  embedding?: number[]; // 向量嵌入
  createdAt: number;
  lastAccessed?: number;
  accessCount: number;
  tags?: string[];
}

// 策略类型
export interface StrategyEntry {
  id: string;
  name: string;
  description: string;
  version: string;
  conditions: Record<string, any>;
  actions: Record<string, any>;
  effectiveness: number; // 0-1 效果得分
  usageCount: number;
  successCount: number;
  createdAt: number;
  lastUpdated: number;
  isActive: boolean;
}

// 知识节点
export interface KnowledgeNode {
  id: string;
  label: string;
  type: string;
  properties: Record<string, any>;
  embedding?: number[];
}

// 知识关系
export interface KnowledgeEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  weight: number;
  properties: Record<string, any>;
}

// 知识图谱
export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
}

// 知识条目（用于存储）
export interface KnowledgeEntry {
  id: string;
  type: 'concept' | 'rule' | 'pattern' | 'fact';
  content: string;
  source: string;
  confidence: number;
  createdAt: number;
  lastUpdated: number;
  accessCount: number;
  tags?: string[];
}

// 系统指标
export interface SystemMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  successRate: number;
  avgResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  knowledgeGrowth: number;
  evolutionSteps: number;
}

// 性能基准
export interface PerformanceBenchmark {
  id: string;
  name: string;
  timestamp: number;
  metrics: Record<string, number>;
  configuration: Record<string, any>;
}

// 执行结果
export interface ExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
}

// 层级指标（向后兼容）
export interface LayerMetrics {
  tasksProcessed: number;
  successRate: number;
  avgDuration: number;
}

// 进化状态
export interface EvolutionState {
  memoriesProcessed: number;
  strategiesOptimized: number;
  knowledgeGained: number;
  lastEvolution: number;
}

// 事件类型
export interface SystemEvent {
  id: string;
  type: string;
  source: string;
  timestamp: number;
  payload: any;
  priority: number;
}

// 通知类型
export interface SystemNotification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: number;
  read: boolean;
}

// 8层架构的层级定义
export const LAYER_DEFINITIONS = [
  {
    id: 1,
    name: '感知层',
    modules: ['输入解析', '数据预处理', '上下文构建'],
    description: '多模态输入处理与预处理'
  },
  {
    id: 2,
    name: '认知层',
    modules: ['意图理解', '语义分析', '关系构建', '记忆检索'],
    description: '理解与推理层'
  },
  {
    id: 3,
    name: '决策层',
    modules: ['目标分解', '路径规划', '风险评估', '资源分配'],
    description: '智能规划与决策'
  },
  {
    id: 4,
    name: '执行层',
    modules: ['任务调度', '并行执行', '状态管理', '中断处理'],
    description: '任务执行与调度'
  },
  {
    id: 5,
    name: '监控层',
    modules: ['指标收集', '性能分析', '告警引擎', '可视化展示'],
    description: '实时监控与告警'
  },
  {
    id: 6,
    name: '反思层',
    modules: ['日志分析', '根因分析', '模式提取', '改进建议'],
    description: '事后分析与总结'
  },
  {
    id: 7,
    name: '学习层',
    modules: ['知识提取', '模式识别', '策略更新', '知识库维护'],
    description: '知识提取与更新'
  },
  {
    id: 8,
    name: '进化层',
    modules: ['架构评估', '参数调优', '组件升级', 'A/B测试'],
    description: '系统自我优化'
  }
];
