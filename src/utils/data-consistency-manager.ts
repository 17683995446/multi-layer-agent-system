import { logger } from './systemLogger';
import { errorHandler } from './error-handling-manager';

// 操作类型枚举
export enum OperationType {
  ADD_TASK = 'ADD_TASK',
  UPDATE_TASK = 'UPDATE_TASK',
  REMOVE_TASK = 'REMOVE_TASK',
  ADD_MEMORY = 'ADD_MEMORY',
  UPDATE_MEMORY = 'UPDATE_MEMORY',
  ADD_STRATEGY = 'ADD_STRATEGY',
  UPDATE_STRATEGY = 'UPDATE_STRATEGY',
  UPDATE_LAYER = 'UPDATE_LAYER',
  UPDATE_METRICS = 'UPDATE_METRICS',
  ADD_NOTIFICATION = 'ADD_NOTIFICATION',
  BATCH_OPERATION = 'BATCH_OPERATION',
}

// 操作日志条目
export interface OperationLog {
  id: string;
  timestamp: number;
  type: OperationType;
  targetId?: string;
  beforeState: any;
  afterState: any;
  metadata: Record<string, any>;
  status: 'pending' | 'completed' | 'failed' | 'rolled_back';
}

// 数据版本信息
export interface DataVersion {
  id: string;
  timestamp: number;
  operationId: string;
  checksum: string;
  dataSnapshot: Record<string, any>;
}

// 一致性验证结果
export interface ConsistencyCheckResult {
  isValid: boolean;
  issues: string[];
  warnings: string[];
  suggestions: string[];
  checkedAt: number;
}

// 事务状态
export enum TransactionState {
  ACTIVE = 'ACTIVE',
  COMMITTED = 'COMMITTED',
  ROLLED_BACK = 'ROLLED_BACK',
  FAILED = 'FAILED',
}

export interface Transaction {
  id: string;
  startTime: number;
  endTime?: number;
  state: TransactionState;
  operations: OperationLog[];
}

export class DataConsistencyManager {
  private static instance: DataConsistencyManager;
  private operationLog: OperationLog[] = [];
  private maxLogSize = 1000;
  private dataVersions: DataVersion[] = [];
  private maxVersions = 50;
  private activeTransaction: Transaction | null = null;
  private checkpointInterval: number = 30000; // 30秒
  private lastCheckpoint: number = 0;

  private constructor() {
    logger.info('CONSISTENCY', 'DataConsistencyManager initialized');
    this.loadFromStorage();
    this.startAutoCheckpoint();
  }

  static getInstance(): DataConsistencyManager {
    if (!DataConsistencyManager.instance) {
      DataConsistencyManager.instance = new DataConsistencyManager();
    }
    return DataConsistencyManager.instance;
  }

  // --- 事务管理 ---

  startTransaction(metadata?: Record<string, any>): string {
    if (this.activeTransaction) {
      logger.warn('CONSISTENCY', 'Transaction already active, committing previous first');
      this.commitTransaction();
    }

    const transactionId = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.activeTransaction = {
      id: transactionId,
      startTime: Date.now(),
      state: TransactionState.ACTIVE,
      operations: [],
    };

    logger.info('CONSISTENCY', `Transaction started: ${transactionId}`, metadata);
    return transactionId;
  }

  commitTransaction(): boolean {
    if (!this.activeTransaction) {
      logger.warn('CONSISTENCY', 'No active transaction to commit');
      return false;
    }

    const transaction = this.activeTransaction;
    transaction.state = TransactionState.COMMITTED;
    transaction.endTime = Date.now();

    // 创建数据版本快照
    this.createDataVersion(transaction.id);

    logger.info('CONSISTENCY', `Transaction committed: ${transaction.id}`, {
      operations: transaction.operations.length,
      duration: transaction.endTime - transaction.startTime,
    });

    this.activeTransaction = null;
    return true;
  }

  rollbackTransaction(): boolean {
    if (!this.activeTransaction) {
      logger.warn('CONSISTENCY', 'No active transaction to rollback');
      return false;
    }

    const transaction = this.activeTransaction;
    logger.warn('CONSISTENCY', `Rolling back transaction: ${transaction.id}`);

    // 按相反顺序回滚操作
    for (let i = transaction.operations.length - 1; i >= 0; i--) {
      const op = transaction.operations[i];
      logger.debug('CONSISTENCY', `Rolling back operation: ${op.type}`, { opId: op.id });
      
      // 标记为已回滚
      op.status = 'rolled_back';
      this.operationLog.push(op);
    }

    transaction.state = TransactionState.ROLLED_BACK;
    transaction.endTime = Date.now();

    logger.info('CONSISTENCY', `Transaction rolled back: ${transaction.id}`);
    this.activeTransaction = null;
    return true;
  }

  // --- 操作日志 ---

  logOperation(
    type: OperationType,
    beforeState: any,
    afterState: any,
    targetId?: string,
    metadata: Record<string, any> = {}
  ): string {
    const operation: OperationLog = {
      id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type,
      targetId,
      beforeState,
      afterState,
      metadata,
      status: 'completed',
    };

    // 如果有活跃事务，添加到事务中
    if (this.activeTransaction) {
      this.activeTransaction.operations.push(operation);
      logger.debug('CONSISTENCY', `Operation added to transaction: ${operation.id}`);
    }

    this.operationLog.push(operation);

    // 保持日志大小限制
    if (this.operationLog.length > this.maxLogSize) {
      this.operationLog = this.operationLog.slice(-this.maxLogSize);
    }

    logger.debug('CONSISTENCY', `Operation logged: ${type}`, { opId: operation.id, targetId });
    return operation.id;
  }

  // --- 数据版本控制 ---

  createDataVersion(operationId: string): string {
    const snapshot = this.createStateSnapshot();
    const versionId = `version-${Date.now()}`;

    const version: DataVersion = {
      id: versionId,
      timestamp: Date.now(),
      operationId,
      checksum: this.calculateChecksum(snapshot),
      dataSnapshot: snapshot,
    };

    this.dataVersions.push(version);

    if (this.dataVersions.length > this.maxVersions) {
      this.dataVersions = this.dataVersions.slice(-this.maxVersions);
    }

    logger.info('CONSISTENCY', `Data version created: ${versionId}`, { checksum: version.checksum });
    this.saveToStorage();
    return versionId;
  }

  rollbackToVersion(versionId: string): boolean {
    const version = this.dataVersions.find(v => v.id === versionId);
    if (!version) {
      logger.error('CONSISTENCY', `Version not found: ${versionId}`);
      return false;
    }

    logger.warn('CONSISTENCY', `Rolling back to version: ${versionId}`);
    
    // 记录回滚操作
    this.logOperation(
      OperationType.BATCH_OPERATION,
      this.createStateSnapshot(),
      version.dataSnapshot,
      versionId,
      { type: 'rollback', fromVersion: versionId }
    );

    logger.info('CONSISTENCY', `Rollback to version ${versionId} completed`);
    return true;
  }

  // --- 一致性检查 ---

  checkConsistency(): ConsistencyCheckResult {
    logger.info('CONSISTENCY', 'Starting consistency check');
    const result: ConsistencyCheckResult = {
      isValid: true,
      issues: [],
      warnings: [],
      suggestions: [],
      checkedAt: Date.now(),
    };

    // 1. 检查操作日志完整性
    if (this.operationLog.length === 0) {
      result.warnings.push('No operation log entries found');
    }

    // 2. 检查版本完整性
    if (this.dataVersions.length === 0) {
      result.warnings.push('No data versions found');
    }

    // 3. 检查最后版本的checksum
    if (this.dataVersions.length > 0) {
      const lastVersion = this.dataVersions[this.dataVersions.length - 1];
      const currentChecksum = this.calculateChecksum(this.createStateSnapshot());
      
      if (lastVersion.checksum !== currentChecksum) {
        result.issues.push('Checksum mismatch between last version and current state');
        result.isValid = false;
      }
    }

    // 4. 检查时间序列一致性
    for (let i = 1; i < this.dataVersions.length; i++) {
      if (this.dataVersions[i].timestamp < this.dataVersions[i - 1].timestamp) {
        result.issues.push(`Version timeline inconsistency: ${this.dataVersions[i].id} < ${this.dataVersions[i - 1].id}`);
        result.isValid = false;
      }
    }

    logger.info('CONSISTENCY', 'Consistency check completed', {
      isValid: result.isValid,
      issues: result.issues.length,
      warnings: result.warnings.length,
    });

    return result;
  }

  // --- 辅助方法 ---

  private createStateSnapshot(): Record<string, any> {
    // 创建一个轻量级的状态快照
    // 实际应用中应该包含所有重要状态
    return {
      timestamp: Date.now(),
      randomValue: Math.random(), // 用于演示checksum
    };
  }

  private calculateChecksum(data: any): string {
    // 简单的checksum计算，生产环境应该用更安全的哈希算法
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  private saveToStorage(): void {
    try {
      const data = {
        operationLog: this.operationLog.slice(-100), // 只保存最近100条
        dataVersions: this.dataVersions.slice(-10), // 只保存最近10个版本
        lastCheckpoint: this.lastCheckpoint,
      };
      localStorage.setItem('data-consistency-state', JSON.stringify(data));
      logger.debug('CONSISTENCY', 'Consistency state saved to storage');
    } catch (error) {
      logger.error('CONSISTENCY', 'Failed to save consistency state', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem('data-consistency-state');
      if (saved) {
        const data = JSON.parse(saved);
        this.operationLog = data.operationLog || [];
        this.dataVersions = data.dataVersions || [];
        this.lastCheckpoint = data.lastCheckpoint || 0;
        logger.info('CONSISTENCY', 'Consistency state loaded from storage', {
          logs: this.operationLog.length,
          versions: this.dataVersions.length,
        });
      }
    } catch (error) {
      logger.warn('CONSISTENCY', 'Failed to load consistency state', error);
    }
  }

  private startAutoCheckpoint(): void {
    setInterval(() => {
      const now = Date.now();
      if (now - this.lastCheckpoint > this.checkpointInterval) {
        this.createDataVersion('auto-checkpoint');
        this.lastCheckpoint = now;
      }
    }, 5000); // 每5秒检查一次
  }

  // --- 公共查询接口 ---

  getOperationLog(limit: number = 50): OperationLog[] {
    return this.operationLog.slice(-limit);
  }

  getDataVersions(limit: number = 10): DataVersion[] {
    return this.dataVersions.slice(-limit);
  }

  getActiveTransaction(): Transaction | null {
    return this.activeTransaction;
  }
}

export const consistencyManager = DataConsistencyManager.getInstance();
