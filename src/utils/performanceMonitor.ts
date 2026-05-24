import { logger } from './systemLogger';

export interface PerformanceMetric {
  id: string;
  timestamp: number;
  type: 'operation' | 'render' | 'memory' | 'fps';
  name: string;
  duration?: number;
  value?: number;
  unit?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceReport {
  startTime: number;
  endTime: number;
  metrics: PerformanceMetric[];
  summary: {
    totalOperations: number;
    avgDuration: number;
    maxDuration: number;
    minDuration: number;
    memoryUsage?: { avg: number; max: number; min: number };
    fps?: { avg: number; max: number; min: number };
  };
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics: number = 10000;
  private startTime: number = Date.now();
  private operationTimers: Map<string, number> = new Map();
  private fpsHistory: number[] = [];
  private lastFrameTime: number = performance.now();
  private frameCount: number = 0;
  private fpsSampleInterval: number = 1000;
  private fpsSampleStart: number = performance.now();
  private isMonitoringFPS: boolean = false;
  private fpsObserver?: number;

  constructor() {
    logger.info('SYSTEM', 'PerformanceMonitor initialized');
  }

  // 开始操作计时
  startOperation(name: string, metadata?: Record<string, any>): string {
    const id = `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.operationTimers.set(id, performance.now());
    logger.debug('SYSTEM', `Started operation: ${name}`, { id, metadata });
    return id;
  }

  // 结束操作计时
  endOperation(id: string): PerformanceMetric | null {
    const startTime = this.operationTimers.get(id);
    if (!startTime) {
      logger.warn('SYSTEM', `Operation timer not found: ${id}`);
      return null;
    }

    const duration = performance.now() - startTime;
    this.operationTimers.delete(id);

    const metric: PerformanceMetric = {
      id,
      timestamp: Date.now(),
      type: 'operation',
      name: id.split('-').slice(3).join('-') || 'unknown',
      duration,
      unit: 'ms',
      metadata: { startTime }
    };

    this.addMetric(metric);
    logger.debug('SYSTEM', `Completed operation in ${duration.toFixed(2)}ms`, { id });

    if (duration > 100) {
      logger.warn('SYSTEM', `Slow operation detected: ${duration.toFixed(2)}ms`, { id });
    }

    return metric;
  }

  // 便捷方法：测量同步函数执行时间
  measureSync<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    const id = this.startOperation(name, metadata);
    try {
      return fn();
    } finally {
      this.endOperation(id);
    }
  }

  // 便捷方法：测量异步函数执行时间
  async measureAsync<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    const id = this.startOperation(name, metadata);
    try {
      return await fn();
    } finally {
      this.endOperation(id);
    }
  }

  // 记录渲染性能
  recordRender(name: string, duration: number, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      id: `render-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      type: 'render',
      name,
      duration,
      unit: 'ms',
      metadata
    };
    this.addMetric(metric);
  }

  // 记录内存使用
  recordMemory(): void {
    const memory = (performance as any).memory;
    if (memory) {
      const metric: PerformanceMetric = {
        id: `memory-${Date.now()}`,
        timestamp: Date.now(),
        type: 'memory',
        name: 'heap-usage',
        value: memory.usedJSHeapSize,
        unit: 'bytes',
        metadata: {
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit
        }
      };
      this.addMetric(metric);
    }
  }

  // 获取当前内存使用（MB）
  getMemoryUsageMB(): number | null {
    const memory = (performance as any).memory;
    return memory ? memory.usedJSHeapSize / (1024 * 1024) : null;
  }

  // 开始 FPS 监控
  startFPSMonitoring(): void {
    if (this.isMonitoringFPS) return;
    
    this.isMonitoringFPS = true;
    this.frameCount = 0;
    this.fpsSampleStart = performance.now();
    this.lastFrameTime = performance.now();
    
    const measureFPS = () => {
      if (!this.isMonitoringFPS) return;
      
      this.frameCount++;
      const now = performance.now();
      const elapsed = now - this.fpsSampleStart;
      
      if (elapsed >= this.fpsSampleInterval) {
        const fps = (this.frameCount / elapsed) * 1000;
        this.fpsHistory.push(fps);
        
        if (this.fpsHistory.length > 60) {
          this.fpsHistory.shift();
        }
        
        const metric: PerformanceMetric = {
          id: `fps-${Date.now()}`,
          timestamp: Date.now(),
          type: 'fps',
          name: 'framerate',
          value: fps,
          unit: 'fps'
        };
        this.addMetric(metric);
        
        if (fps < 30) {
          logger.warn('SYSTEM', `Low FPS detected: ${fps.toFixed(1)}`);
        }
        
        this.frameCount = 0;
        this.fpsSampleStart = now;
      }
      
      this.fpsObserver = requestAnimationFrame(measureFPS);
    };
    
    this.fpsObserver = requestAnimationFrame(measureFPS);
    logger.info('SYSTEM', 'FPS monitoring started');
  }

  // 停止 FPS 监控
  stopFPSMonitoring(): void {
    this.isMonitoringFPS = false;
    if (this.fpsObserver) {
      cancelAnimationFrame(this.fpsObserver);
      this.fpsObserver = undefined;
    }
    logger.info('SYSTEM', 'FPS monitoring stopped');
  }

  // 获取当前平均 FPS
  getCurrentFPS(): number | null {
    if (this.fpsHistory.length === 0) return null;
    return this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
  }

  // 添加指标
  private addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    if (this.metrics.length > this.maxMetrics) {
      const removeCount = this.metrics.length - this.maxMetrics;
      this.metrics = this.metrics.slice(removeCount);
    }
  }

  // 获取指标
  getMetrics(options?: {
    type?: PerformanceMetric['type'];
    name?: string;
    limit?: number;
    startTimestamp?: number;
    endTimestamp?: number;
  }): PerformanceMetric[] {
    let filtered = [...this.metrics];
    
    if (options?.type) {
      filtered = filtered.filter(m => m.type === options.type);
    }
    
    if (options?.name) {
      filtered = filtered.filter(m => m.name.includes(options.name));
    }
    
    if (options?.startTimestamp) {
      filtered = filtered.filter(m => m.timestamp >= options.startTimestamp);
    }
    
    if (options?.endTimestamp) {
      filtered = filtered.filter(m => m.timestamp <= options.endTimestamp);
    }
    
    if (options?.limit) {
      filtered = filtered.slice(-options.limit);
    }
    
    return filtered;
  }

  // 生成性能报告
  generateReport(): PerformanceReport {
    const endTime = Date.now();
    const operations = this.metrics.filter(m => m.type === 'operation' && m.duration);
    const memoryMetrics = this.metrics.filter(m => m.type === 'memory' && m.value);
    const fpsMetrics = this.metrics.filter(m => m.type === 'fps' && m.value);
    
    const durations = operations.map(m => m.duration!);
    const memoryValues = memoryMetrics.map(m => m.value!);
    const fpsValues = fpsMetrics.map(m => m.value!);
    
    const summary: PerformanceReport['summary'] = {
      totalOperations: operations.length,
      avgDuration: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      maxDuration: durations.length > 0 ? Math.max(...durations) : 0,
      minDuration: durations.length > 0 ? Math.min(...durations) : 0,
      memoryUsage: memoryValues.length > 0 ? {
        avg: memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length,
        max: Math.max(...memoryValues),
        min: Math.min(...memoryValues)
      } : undefined,
      fps: fpsValues.length > 0 ? {
        avg: fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length,
        max: Math.max(...fpsValues),
        min: Math.min(...fpsValues)
      } : undefined
    };
    
    return {
      startTime: this.startTime,
      endTime,
      metrics: this.metrics,
      summary
    };
  }

  // 获取慢速操作（> 100ms）
  getSlowOperations(threshold: number = 100): PerformanceMetric[] {
    return this.metrics.filter(
      m => m.type === 'operation' && m.duration && m.duration > threshold
    ).sort((a, b) => (b.duration! - a.duration!));
  }

  // 清除指标
  clearMetrics(): void {
    this.metrics = [];
    this.startTime = Date.now();
    this.fpsHistory = [];
    logger.info('SYSTEM', 'Performance metrics cleared');
  }

  // 导出报告为 JSON
  exportReport(): string {
    return JSON.stringify(this.generateReport(), null, 2);
  }
}

export const perfMonitor = new PerformanceMonitor();
