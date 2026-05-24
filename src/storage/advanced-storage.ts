import { logger } from '@/utils/systemLogger';

// 数据压缩器 - 简单高效的JSON压缩（实际只是一个压缩器接口）
export class DataCompressor {
  // 简单的封装 - 实际我们可以在未来实现真正的压缩
  static compress(data: any): string {
    try {
      return JSON.stringify(data);
    } catch (error) {
      logger.warn('COMPRESSOR', 'Failed to compress data', error);
      return '{}';
    }
  }

  static decompress(data: string): any {
    try {
      return JSON.parse(data);
    } catch (error) {
      logger.warn('COMPRESSOR', 'Failed to decompress data', error);
      return {};
    }
  }
}

// IndexedDB 存储适配器
export class IndexedDBAdapter {
  private static DB_NAME = 'MultiLayerAgentDB';
  private static DB_VERSION = 1;
  private static instance: IndexedDBAdapter | null = null;
  private db: IDBDatabase | null = null;

  private constructor() {
    this.init();
  }

  static getInstance(): IndexedDBAdapter {
    if (!IndexedDBAdapter.instance) {
      IndexedDBAdapter.instance = new IndexedDBAdapter();
    }
    return IndexedDBAdapter.instance;
  }

  private init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(IndexedDBAdapter.DB_NAME, IndexedDBAdapter.DB_VERSION);

      request.onerror = () => {
        logger.error('IndexedDB', 'Failed to open database');
        reject(new Error('Failed to open database'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        logger.info('IndexedDB', 'Database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 创建对象存储
        if (!db.objectStoreNames.contains('tasks')) {
          db.createObjectStore('tasks', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('memories')) {
          db.createObjectStore('memories', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('strategies')) {
          db.createObjectStore('strategies', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('layers')) {
          db.createObjectStore('layers', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('notifications')) {
          db.createObjectStore('notifications', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('system_state')) {
          db.createObjectStore('system_state', { keyPath: 'key' });
        }

        logger.info('IndexedDB', 'Database schema updated');
      };
    });
  }

  async set(storeName: string, key: string, value: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const data = { id: key, value, timestamp: Date.now() };
      const request = store.put(data);

      request.onsuccess = () => {
        logger.debug('IndexedDB', `Set ${storeName}/${key} successfully`);
        resolve(true);
      };

      request.onerror = () => {
        logger.error('IndexedDB', `Failed to set ${storeName}/${key}`);
        reject(request.error);
      };
    });
  }

  async get(storeName: string, key: string): Promise<any | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        logger.debug('IndexedDB', `Get ${storeName}/${key}:`, result ? 'found' : 'not found');
        resolve(result?.value ?? null);
      };

      request.onerror = () => {
        logger.error('IndexedDB', `Failed to get ${storeName}/${key}`);
        reject(request.error);
      };
    });
  }

  async getAll(storeName: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result.map(item => item.value);
        logger.debug('IndexedDB', `Get all ${storeName}: ${items.length} items`);
        resolve(items);
      };

      request.onerror = () => {
        logger.error('IndexedDB', `Failed to get all ${storeName}`);
        reject(request.error);
      };
    });
  }

  async delete(storeName: string, key: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => {
        logger.debug('IndexedDB', `Deleted ${storeName}/${key} successfully`);
        resolve(true);
      };

      request.onerror = () => {
        logger.error('IndexedDB', `Failed to delete ${storeName}/${key}`);
        reject(request.error);
      };
    });
  }

  async clearStore(storeName: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => {
        logger.info('IndexedDB', `Cleared store ${storeName} successfully`);
        resolve(true);
      };

      request.onerror = () => {
        logger.error('IndexedDB', `Failed to clear store ${storeName}`);
        reject(request.error);
      };
    });
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      logger.info('IndexedDB', 'Database connection closed');
    }
  }
}

// 跨标签页同步系统
export class CrossTabSync {
  private static instance: CrossTabSync | null = null;
  private channel: BroadcastChannel | null = null;
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();
  private isListening: boolean = false;

  private constructor() {
    this.init();
  }

  static getInstance(): CrossTabSync {
    if (!CrossTabSync.instance) {
      CrossTabSync.instance = new CrossTabSync();
    }
    return CrossTabSync.instance;
  }

  private init(): void {
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel('multi-layer-agent-sync');
      this.isListening = true;
      this.startListening();
      logger.info('SYNC', 'Cross-tab sync initialized');
    } else {
      logger.warn('SYNC', 'BroadcastChannel not supported in this browser');
    }
  }

  private startListening(): void {
    if (!this.channel) return;

    this.channel.onmessage = (event) => {
      logger.debug('SYNC', 'Received message:', event.data);
      const { type, data, source } = event.data;
      
      // 避免处理自己发送的消息
      if (source === this.getTabId()) {
        return;
      }

      const callbacks = this.subscribers.get(type);
      if (callbacks) {
        callbacks.forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            logger.error('SYNC', 'Error in sync callback:', error);
          }
        });
      }
    };

    this.channel.onmessageerror = (error) => {
      logger.error('SYNC', 'Message error:', error);
    };
  }

  private getTabId(): string {
    let tabId = sessionStorage.getItem('tab-id');
    if (!tabId) {
      tabId = `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('tab-id', tabId);
    }
    return tabId;
  }

  subscribe(type: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }
    this.subscribers.get(type)!.add(callback);
    logger.debug('SYNC', `Subscribed to ${type}`);
    
    return () => {
      this.subscribers.get(type)?.delete(callback);
    };
  }

  broadcast(type: string, data: any): void {
    if (!this.channel) {
      logger.warn('SYNC', 'BroadcastChannel not available');
      return;
    }

    const message = {
      type,
      data,
      source: this.getTabId(),
      timestamp: Date.now(),
    };

    this.channel.postMessage(message);
    logger.debug('SYNC', `Broadcasted ${type}:`, data);
  }

  broadcastTaskUpdate(taskId: string, updates: any): void {
    this.broadcast('task-update', { taskId, updates });
  }

  broadcastMemoryUpdate(memoryId: string, updates: any): void {
    this.broadcast('memory-update', { memoryId, updates });
  }

  broadcastStateSync(state: any): void {
    this.broadcast('state-sync', state);
  }

  broadcastStorageLimitWarning(): void {
    this.broadcast('storage-warning', { timestamp: Date.now() });
  }

  close(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.isListening = false;
    this.subscribers.clear();
    logger.info('SYNC', 'Cross-tab sync closed');
  }
}

// 混合存储管理器
export class HybridStorageManager {
  private static instance: HybridStorageManager | null = null;
  private useIndexedDB: boolean = false;
  private indexedDB: IndexedDBAdapter;
  private crossTabSync: CrossTabSync;

  private constructor() {
    this.indexedDB = IndexedDBAdapter.getInstance();
    this.crossTabSync = CrossTabSync.getInstance();
    this.detectStorageMethod();
  }

  static getInstance(): HybridStorageManager {
    if (!HybridStorageManager.instance) {
      HybridStorageManager.instance = new HybridStorageManager();
    }
    return HybridStorageManager.instance;
  }

  private detectStorageMethod(): void {
    // 检查是否支持IndexedDB
    this.useIndexedDB = typeof indexedDB !== 'undefined';
    logger.info('STORAGE', `Hybrid storage initialized, using ${this.useIndexedDB ? 'IndexedDB' : 'LocalStorage'} for large data`);
  }

  async setLargeData(key: string, data: any): Promise<boolean> {
    if (this.useIndexedDB) {
      try {
        await this.indexedDB.set('system_state', key, data);
        this.crossTabSync.broadcast('large-data-update', { key });
        return true;
      } catch (error) {
        logger.error('STORAGE', 'Falling back to localStorage for large data', error);
      }
    }

    // 回退到localStorage
    try {
      const compressed = DataCompressor.compress(data);
      localStorage.setItem(`large-${key}`, compressed);
      return true;
    } catch (error) {
      logger.error('STORAGE', 'Failed to set large data', error);
      return false;
    }
  }

  async getLargeData(key: string): Promise<any | null> {
    if (this.useIndexedDB) {
      try {
        return await this.indexedDB.get('system_state', key);
      } catch (error) {
        logger.warn('STORAGE', 'Falling back to localStorage for large data', error);
      }
    }

    // 回退到localStorage
    try {
      const compressed = localStorage.getItem(`large-${key}`);
      if (!compressed) return null;
      return DataCompressor.decompress(compressed);
    } catch (error) {
      logger.error('STORAGE', 'Failed to get large data', error);
      return null;
    }
  }

  getSync(): CrossTabSync {
    return this.crossTabSync;
  }
}
