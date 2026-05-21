import { Task, LayerState, SystemMetrics, EvolutionState, MemoryEntry, StrategyEntry, KnowledgeEntry, SystemNotification } from '@/types';

// 存储键
const STORAGE_KEYS = {
  TASKS: 'multi-layer-agent-tasks',
  LAYERS: 'multi-layer-agent-layers',
  METRICS: 'multi-layer-agent-metrics',
  EVOLUTION: 'multi-layer-agent-evolution',
  MEMORIES: 'multi-layer-agent-memories',
  STRATEGIES: 'multi-layer-agent-strategies',
  KNOWLEDGE: 'multi-layer-agent-knowledge',
  NOTIFICATIONS: 'multi-layer-agent-notifications',
  SYSTEM_STATE: 'multi-layer-agent-system-state',
};

// 存储限制 (5MB警告，8MB限制)
const STORAGE_WARNING_THRESHOLD = 5 * 1024 * 1024;
const STORAGE_HARD_LIMIT = 8 * 1024 * 1024;

// 数据序列化和反序列化工具
export class SafeStorage {
  // 检查是否有足够空间
  static hasAvailableSpace(dataSize: number): boolean {
    try {
      const usedSpace = this.getCurrentUsage();
      const totalSpace = this.getTotalAvailableSpace();
      const available = totalSpace - usedSpace;
      return available > dataSize;
    } catch (error) {
      console.warn('Failed to check available space:', error);
      return false;
    }
    return true;
  }

  // 获取当前使用空间
  static getCurrentUsage(): number {
    try {
      let total = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage.getItem(key)?.length || 0;
        }
      }
      return total;
    } catch {
      return 0;
    }
  }

  // 估算可用空间
  static getTotalAvailableSpace(): number {
    // 保守估计 10MB (现代浏览器通常有更大空间，但我们保守)
    return 10 * 1024 * 1024;
  }

  // 检查是否接近极限
  static isNearLimit(): boolean {
    const usage = this.getCurrentUsage();
    return usage > STORAGE_WARNING_THRESHOLD;
  }

  // 安全存储
  static set<T>(key: string, data: T, maxRetries: number = 3): boolean {
    let retries = 0;
    while (retries < maxRetries) {
      try {
        // 尝试压缩数据
        const serialized = this.serialize<T>(data);
        
        // 检查空间
        if (serialized.length > STORAGE_HARD_LIMIT) {
          console.error(`Data size too large: ${serialized.length} bytes`);
          return false;
        }
        
        // 尝试存储
        localStorage.setItem(key, serialized);
        return true;
      } catch (error) {
        console.warn(`Storage attempt ${retries + 1} failed:`, error);
        
        if (retries === 0) {
          // 第一次失败尝试压缩或清理
          this.clearOldData();
        }
        
        retries++;
      }
    }
    return false;
  }

  // 安全获取
  static get<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return this.deserialize<T>(data);
    } catch (error) {
      console.warn(`Failed to get ${key} from storage:`, error);
      return defaultValue;
    }
  }

  // 序列化
  static serialize<T>(data: T): string {
    return JSON.stringify(data);
  }

  // 反序列化
  static deserialize<T>(data: string): T {
    return JSON.parse(data);
  }

  // 清除特定键
  static remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Failed to remove ${key} from storage:`, error);
    }
  }

  // 清空所有存储
  static clearAll(): void {
    try {
      Object.keys(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(STORAGE_KEYS[key as keyof typeof STORAGE_KEYS]);
      });
    } catch (error) {
      console.error('Failed to clear all storage:', error);
    }
  }

  // 清理旧数据
  static clearOldData(): void {
    try {
      // 只保留重要的系统状态，清理大量数据
      const currentTasks = this.getTasks();
      if (currentTasks.length > 100) {
        // 只保留最新的100个任务
        const recentTasks = currentTasks.slice(-100);
        this.setTasks(recentTasks);
      }

      const memories = this.getMemories();
      if (memories.length > 500) {
        const recentMemories = memories.slice(-500);
        this.setMemories(recentMemories);
      }
      
      console.info('Storage cleanup complete');
    } catch (error) {
      console.error('Failed to clean storage:', error);
    }
  }

  // 数据存取方法
  static getTasks(): Task[] {
    return this.get<Task[]>(STORAGE_KEYS.TASKS, []);
  }
  
  static setTasks(tasks: Task[]): boolean {
    return this.set<Task[]>(STORAGE_KEYS.TASKS, tasks);
  }
  
  static getLayers(): LayerState[] {
    return this.get<LayerState[]>(STORAGE_KEYS.LAYERS, []);
  }
  
  static setLayers(layers: LayerState[]): boolean {
    return this.set<LayerState[]>(STORAGE_KEYS.LAYERS, layers);
  }
  
  static getMetrics(): Partial<SystemMetrics> {
    return this.get<Partial<SystemMetrics>>(STORAGE_KEYS.METRICS, {});
  }
  
  static setMetrics(metrics: Partial<SystemMetrics>): boolean {
    return this.set<Partial<SystemMetrics>>(STORAGE_KEYS.METRICS, metrics);
  }
  
  static getEvolution(): Partial<EvolutionState> {
    return this.get<Partial<EvolutionState>>(STORAGE_KEYS.EVOLUTION, {});
  }
  
  static setEvolution(evolution: Partial<EvolutionState>): boolean {
    return this.set<Partial<EvolutionState>>(STORAGE_KEYS.EVOLUTION, evolution);
  }
  
  static getMemories(): MemoryEntry[] {
    return this.get<MemoryEntry[]>(STORAGE_KEYS.MEMORIES, []);
  }
  
  static setMemories(memories: MemoryEntry[]): boolean {
    return this.set<MemoryEntry[]>(STORAGE_KEYS.MEMORIES, memories);
  }
  
  static getStrategies(): StrategyEntry[] {
    return this.get<StrategyEntry[]>(STORAGE_KEYS.STRATEGIES, []);
  }
  
  static setStrategies(strategies: StrategyEntry[]): boolean {
    return this.set<StrategyEntry[]>(STORAGE_KEYS.STRATEGIES, strategies);
  }
  
  static getKnowledge(): KnowledgeEntry[] {
    return this.get<KnowledgeEntry[]>(STORAGE_KEYS.KNOWLEDGE, []);
  }
  
  static setKnowledge(knowledge: KnowledgeEntry[]): boolean {
    return this.set<KnowledgeEntry[]>(STORAGE_KEYS.KNOWLEDGE, knowledge);
  }
  
  static getNotifications(): SystemNotification[] {
    return this.get<SystemNotification[]>(STORAGE_KEYS.NOTIFICATIONS, []);
  }
  
  static setNotifications(notifications: SystemNotification[]): boolean {
    return this.set<SystemNotification[]>(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }
}

// 数据备份管理器
export class BackupManager {
  static async createBackup(): Promise<string> {
    const backupData = {
      timestamp: Date.now(),
      version: '1.0.0',
      tasks: SafeStorage.getTasks(),
      layers: SafeStorage.getLayers(),
      metrics: SafeStorage.getMetrics(),
      evolution: SafeStorage.getEvolution(),
      memories: SafeStorage.getMemories(),
      strategies: SafeStorage.getStrategies(),
      knowledge: SafeStorage.getKnowledge(),
    };
    
    const backupJson = JSON.stringify(backupData, null, 2);
    
    // 本地缓存备份
    try {
      localStorage.setItem('system-backup', backupJson);
    } catch (error) {
      console.error('Failed to create local backup');
    }
    
    return backupJson;
  }
  
  static async restoreBackup(data: string): Promise<boolean> {
    try {
      const backupData = JSON.parse(data);
      
      if (backupData.tasks) SafeStorage.setTasks(backupData.tasks);
      if (backupData.layers) SafeStorage.setLayers(backupData.layers);
      if (backupData.metrics) SafeStorage.setMetrics(backupData.metrics);
      if (backupData.evolution) SafeStorage.setEvolution(backupData.evolution);
      if (backupData.memories) SafeStorage.setMemories(backupData.memories);
      if (backupData.strategies) SafeStorage.setStrategies(backupData.strategies);
      if (backupData.knowledge) SafeStorage.setKnowledge(backupData.knowledge);
      
      return true;
    } catch (error) {
      console.error('Failed to restore backup:', error);
      return false;
    }
  }
  
  static downloadBackup(): void {
    this.createBackup().then(backupData => {
      const blob = new Blob([backupData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }
  
  static loadBackupFromFile(file: File): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result as string;
          this.restoreBackup(data).then(resolve).catch(reject);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  }
}

// 初始化存储统计
export function getStorageInfo() {
  const usage = SafeStorage.getCurrentUsage();
  const limit = SafeStorage.getTotalAvailableSpace();
  const percentUsage = (usage / limit) * 100;
  
  return {
    used: usage,
    limit,
    percentage: Math.min(100, percentUsage),
    nearLimit: SafeStorage.isNearLimit(),
    tasksCount: SafeStorage.getTasks().length,
    memoriesCount: SafeStorage.getMemories().length,
  };
}
