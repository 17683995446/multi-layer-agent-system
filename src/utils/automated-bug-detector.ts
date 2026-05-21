import { toast } from 'sonner';

export interface BugReport {
  id: string;
  type: 'memory_leak' | 'performance_issue' | 'error' | 'unexpected_behavior' | 'storage_issue';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: number;
  stackTrace?: string;
  metadata: Record<string, any>;
}

export interface SystemMetrics {
  timestamp: number;
  memoryUsage: number;
  cpuUsage: number;
  taskCount: number;
  responseTime: number;
  domNodes: number;
  eventListeners: number;
}

export class AutomatedBugDetector {
  private bugReports: BugReport[] = [];
  private metricsHistory: SystemMetrics[] = [];
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private previousMemory: number = 0;
  private memoryGrowthCount: number = 0;
  private subscribers: ((report: BugReport) => void)[] = [];

  constructor() {
    this.setupGlobalErrorHandlers();
  }

  private setupGlobalErrorHandlers() {
    const originalError = console.error;
    console.error = (...args) => {
      this.captureError(new Error(args.join(' ')), 'console_error');
      originalError.apply(console, args);
    };

    const originalWarn = console.warn;
    console.warn = (...args) => {
      if (this.shouldCaptureWarning(args)) {
        this.captureWarning(args.join(' '));
      }
      originalWarn.apply(console, args);
    };

    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message), 'window_error');
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        'unhandled_rejection'
      );
    });
  }

  private shouldCaptureWarning(args: any[]): boolean {
    const message = args.join(' ');
    return (
      message.includes('Warning:') ||
      message.includes('error') ||
      message.includes('deprecated') ||
      message.includes('performance')
    );
  }

  private captureError(error: Error, source: string) {
    const report: BugReport = {
      id: `bug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'error',
      severity: this.determineSeverity(error),
      title: error.message.split('\n')[0] || 'Unknown error',
      description: `Error captured from ${source}: ${error.message}`,
      timestamp: Date.now(),
      stackTrace: error.stack,
      metadata: {
        source,
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    };

    this.addBugReport(report);
  }

  private captureWarning(message: string) {
    const report: BugReport = {
      id: `warning-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'unexpected_behavior',
      severity: 'low',
      title: 'Warning detected',
      description: message,
      timestamp: Date.now(),
      metadata: {
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    };

    this.addBugReport(report);
  }

  private determineSeverity(error: Error): 'low' | 'medium' | 'high' | 'critical' {
    const message = error.message.toLowerCase();
    
    if (message.includes('crash') || message.includes('fatal') || message.includes('out of memory')) {
      return 'critical';
    }
    if (message.includes('failed') || message.includes('cannot') || message.includes('unable')) {
      return 'high';
    }
    if (message.includes('warning') || message.includes('deprecated')) {
      return 'low';
    }
    return 'medium';
  }

  private addBugReport(report: BugReport) {
    this.bugReports.unshift(report);
    this.bugReports = this.bugReports.slice(0, 100);
    
    this.subscribers.forEach(callback => callback(report));
    
    if (report.severity === 'high' || report.severity === 'critical') {
      toast.error(`[${report.severity.toUpperCase()}] ${report.title}`, {
        description: report.description,
        duration: 8000
      });
    }
  }

  public startMonitoring(intervalMs: number = 5000) {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.previousMemory = this.getMemoryUsage();
    
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
      this.analyzeMetrics();
    }, intervalMs);
    
    console.log('🔍 Automated bug detector started');
  }

  public stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('🛑 Automated bug detector stopped');
  }

  private getMemoryUsage(): number {
    if ('performance' in window && 'memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  private collectMetrics() {
    const memoryUsage = this.getMemoryUsage();
    const now = Date.now();
    
    const metrics: SystemMetrics = {
      timestamp: now,
      memoryUsage,
      cpuUsage: Math.random() * 100, // 模拟，实际需要更复杂的测量
      taskCount: Math.floor(Math.random() * 50), // 模拟
      responseTime: Math.random() * 500, // 模拟
      domNodes: document.querySelectorAll('*').length,
      eventListeners: 0 // 难以准确测量
    };
    
    this.metricsHistory.unshift(metrics);
    this.metricsHistory = this.metricsHistory.slice(0, 100);
  }

  private analyzeMetrics() {
    if (this.metricsHistory.length < 3) return;
    
    const current = this.metricsHistory[0];
    const previous = this.metricsHistory[1];
    
    // 检测内存泄漏
    if (current.memoryUsage > this.previousMemory * 1.1) {
      this.memoryGrowthCount++;
      
      if (this.memoryGrowthCount >= 3) {
        this.addBugReport({
          id: `memory-leak-${Date.now()}`,
          type: 'memory_leak',
          severity: 'high',
          title: 'Potential memory leak detected',
          description: `Memory usage has increased by ${Math.round(((current.memoryUsage - this.previousMemory) / this.previousMemory) * 100)}% over time`,
          timestamp: Date.now(),
          metadata: {
            currentMemory: current.memoryUsage,
            previousMemory: this.previousMemory
          }
        });
        this.memoryGrowthCount = 0;
      }
    } else {
      this.memoryGrowthCount = Math.max(0, this.memoryGrowthCount - 1);
    }
    
    this.previousMemory = current.memoryUsage;
    
    // 检测过多的DOM节点
    if (current.domNodes > 5000) {
      this.addBugReport({
        id: `dom-nodes-${Date.now()}`,
        type: 'performance_issue',
        severity: 'medium',
        title: 'High DOM node count detected',
        description: `Current DOM has ${current.domNodes} nodes, which may affect performance`,
        timestamp: Date.now(),
        metadata: {
          domNodes: current.domNodes
        }
      });
    }
    
    // 检测性能下降
    if (previous && current.responseTime > previous.responseTime * 2) {
      this.addBugReport({
        id: `perf-degradation-${Date.now()}`,
        type: 'performance_issue',
        severity: 'medium',
        title: 'Performance degradation detected',
        description: `Response time has doubled from ${Math.round(previous.responseTime)}ms to ${Math.round(current.responseTime)}ms`,
        timestamp: Date.now(),
        metadata: {
          previousResponseTime: previous.responseTime,
          currentResponseTime: current.responseTime
        }
      });
    }
  }

  public getBugReports(): BugReport[] {
    return [...this.bugReports];
  }

  public getMetricsHistory(): SystemMetrics[] {
    return [...this.metricsHistory];
  }

  public subscribe(callback: (report: BugReport) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  public exportReports(): string {
    return JSON.stringify({
      reports: this.bugReports,
      metrics: this.metricsHistory,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  public clearReports() {
    this.bugReports = [];
    this.metricsHistory = [];
  }
}

export const bugDetector = new AutomatedBugDetector();
