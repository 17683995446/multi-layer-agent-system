import { Task, LayerState, SystemMetrics, EvolutionState, MemoryEntry, StrategyEntry, KnowledgeEntry, SystemNotification } from '@/types';
import { logger } from '@/utils/systemLogger';

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
  // 缓存层 - 减少 localStorage 访问
  private static cache: Map<string, any> = new Map();
  private static cacheEnabled: boolean = true;
  private static batchQueue: Map<string, any> = new Map();
  private static batchTimer: number | null = null;
  private static batchDelay: number = 100; // 100ms 批量延迟

  // 检查是否有足够空间
  static hasAvailableSpace(dataSize: number): boolean {
    try {
      const usedSpace = this.getCurrentUsage();
      const totalSpace = this.getTotalAvailableSpace();
      const available = totalSpace - usedSpace;
      logger.debug('STORAGE', `Space check: used=${usedSpace}, total=${totalSpace}, need=${dataSize}`);
      return available > dataSize;
    } catch (error) {
      logger.warn('STORAGE', 'Failed to check available space:', error);
      return false;
    }
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
      logger.warn('STORAGE', 'Failed to get current usage');
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
    const nearLimit = usage > STORAGE_WARNING_THRESHOLD;
    if (nearLimit) {
      logger.warn('STORAGE', `Storage near limit: ${usage} bytes used`);
    }
    return nearLimit;
  }

  // 启用/禁用缓存
  static setCacheEnabled(enabled: boolean): void {
    this.cacheEnabled = enabled;
    if (!enabled) {
      this.cache.clear();
    }
  }

  // 清空缓存
  static clearCache(): void {
    this.cache.clear();
  }

  // 批量操作队列
  static queueSet<T>(key: string, data: T): void {
    this.batchQueue.set(key, data);
    this.scheduleBatchFlush();
  }

  private static scheduleBatchFlush(): void {
    if (this.batchTimer !== null) return;
    
    this.batchTimer = window.setTimeout(() => {
      this.flushBatch();
      this.batchTimer = null;
    }, this.batchDelay);
  }

  static flushBatch(): void {
    if (this.batchQueue.size === 0) return;
    
    const entries = Array.from(this.batchQueue.entries());
    this.batchQueue.clear();
    
    for (const [key, data] of entries) {
      this.set(key, data);
    }
  }

  // 安全存储
  static set<T>(key: string, data: T, maxRetries: number = 3): boolean {
    logger.debug('STORAGE', `Setting key: ${key}`, { dataSize: JSON.stringify(data).length });
    
    // 更新缓存
    if (this.cacheEnabled) {
      this.cache.set(key, data);
    }
    
    let retries = 0;
    while (retries < maxRetries) {
      try {
        // 尝试压缩数据
        const serialized = this.serialize<T>(data);
        
        // 检查空间
        if (serialized.length > STORAGE_HARD_LIMIT) {
          logger.error('STORAGE', `Data size too large: ${serialized.length} bytes (limit: ${STORAGE_HARD_LIMIT})`);
          return false;
        }
        
        // 尝试存储
        localStorage.setItem(key, serialized);
        logger.debug('STORAGE', `Successfully stored key: ${key}`);
        return true;
      } catch (error) {
        logger.warn('STORAGE', `Storage attempt ${retries + 1}/${maxRetries} failed for key: ${key}`, error);
        
        if (retries === 0) {
          // 第一次失败尝试压缩或清理
          logger.info('STORAGE', 'Attempting storage cleanup...');
          this.clearOldData();
        }
        
        retries++;
      }
    }
    logger.error('STORAGE', `All storage attempts failed for key: ${key}`);
    return false;
  }

  // 安全获取
  static get<T>(key: string, defaultValue: T): T {
    // 检查缓存
    if (this.cacheEnabled && this.cache.has(key)) {
      logger.debug('STORAGE', `Cache hit for key: ${key}`);
      return this.cache.get(key);
    }
    
    try {
      const data = localStorage.getItem(key);
      if (!data) {
        logger.debug('STORAGE', `Key not found, using default: ${key}`);
        // 缓存默认值
        if (this.cacheEnabled) {
          this.cache.set(key, defaultValue);
        }
        return defaultValue;
      }
      const deserialized = this.deserialize<T>(data);
      logger.debug('STORAGE', `Successfully retrieved key: ${key}`);
      // 缓存结果
      if (this.cacheEnabled) {
        this.cache.set(key, deserialized);
      }
      return deserialized;
    } catch (error) {
      logger.warn('STORAGE', `Failed to get ${key} from storage, using default`, error);
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
      // 更新缓存
      if (this.cacheEnabled) {
        this.cache.delete(key);
      }
      localStorage.removeItem(key);
      logger.debug('STORAGE', `Removed key: ${key}`);
    } catch (error) {
      logger.warn('STORAGE', `Failed to remove ${key} from storage:`, error);
    }
  }

  // 清空所有存储
  static clearAll(): void {
    try {
      // 清空缓存
      this.cache.clear();
      // 清空批量队列
      this.batchQueue.clear();
      if (this.batchTimer !== null) {
        clearTimeout(this.batchTimer);
        this.batchTimer = null;
      }
      Object.keys(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(STORAGE_KEYS[key as keyof typeof STORAGE_KEYS]);
      });
      logger.info('STORAGE', 'All storage cleared successfully');
    } catch (error) {
      logger.error('STORAGE', 'Failed to clear all storage:', error);
    }
  }

  // 清理旧数据
  static clearOldData(): void {
    try {
      logger.info('STORAGE', 'Starting storage cleanup...');
      // 只保留重要的系统状态，清理大量数据
      const currentTasks = this.getTasks();
      if (currentTasks.length > 100) {
        // 只保留最新的100个任务
        const recentTasks = currentTasks.slice(-100);
        logger.info('STORAGE', `Cleaned tasks: ${currentTasks.length} -> ${recentTasks.length}`);
        this.setTasks(recentTasks);
      }

      const memories = this.getMemories();
      if (memories.length > 500) {
        const recentMemories = memories.slice(-500);
        logger.info('STORAGE', `Cleaned memories: ${memories.length} -> ${recentMemories.length}`);
        this.setMemories(recentMemories);
      }
      
      logger.info('STORAGE', 'Storage cleanup complete');
    } catch (error) {
      logger.error('STORAGE', 'Failed to clean storage:', error);
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
    logger.info('BACKUP', 'Creating system backup...');
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
    const dataSize = backupJson.length;
    logger.info('BACKUP', `Backup created, size: ${(dataSize / 1024).toFixed(2)} KB`);
    
    // 本地缓存备份
    try {
      localStorage.setItem('system-backup', backupJson);
      logger.info('BACKUP', 'Local backup saved successfully');
    } catch (error) {
      logger.error('BACKUP', 'Failed to create local backup', error);
    }
    
    return backupJson;
  }
  
  static async restoreBackup(data: string): Promise<boolean> {
    logger.info('BACKUP', 'Restoring system backup...');
    try {
      const backupData = JSON.parse(data);
      
      if (backupData.tasks) {
        logger.debug('BACKUP', 'Restoring tasks...');
        SafeStorage.setTasks(backupData.tasks);
      }
      if (backupData.layers) {
        logger.debug('BACKUP', 'Restoring layers...');
        SafeStorage.setLayers(backupData.layers);
      }
      if (backupData.metrics) {
        logger.debug('BACKUP', 'Restoring metrics...');
        SafeStorage.setMetrics(backupData.metrics);
      }
      if (backupData.evolution) {
        logger.debug('BACKUP', 'Restoring evolution...');
        SafeStorage.setEvolution(backupData.evolution);
      }
      if (backupData.memories) {
        logger.debug('BACKUP', 'Restoring memories...');
        SafeStorage.setMemories(backupData.memories);
      }
      if (backupData.strategies) {
        logger.debug('BACKUP', 'Restoring strategies...');
        SafeStorage.setStrategies(backupData.strategies);
      }
      if (backupData.knowledge) {
        logger.debug('BACKUP', 'Restoring knowledge...');
        SafeStorage.setKnowledge(backupData.knowledge);
      }
      
      logger.info('BACKUP', 'System backup restored successfully');
      return true;
    } catch (error) {
      logger.error('BACKUP', 'Failed to restore backup:', error);
      return false;
    }
  }
  
  static downloadBackup(): void {
    logger.info('BACKUP', 'Initiating backup download...');
    this.createBackup().then(backupData => {
      const blob = new Blob([backupData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      logger.info('BACKUP', 'Backup download initiated');
    }).catch(error => {
      logger.error('BACKUP', 'Failed to download backup:', error);
    });
  }
  
  static loadBackupFromFile(file: File): Promise<boolean> {
    logger.info('BACKUP', `Loading backup from file: ${file.name} (${file.size} bytes)`);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result as string;
          logger.debug('BACKUP', 'File read successfully, restoring...');
          this.restoreBackup(data).then(resolve).catch(reject);
        } catch (error) {
          logger.error('BACKUP', 'Failed to read backup file:', error);
          reject(error);
        }
      };
      reader.onerror = (error) => {
        logger.error('BACKUP', 'File reader error:', error);
        reject(error);
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
