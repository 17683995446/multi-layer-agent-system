import { logger } from './systemLogger';
import { tracer } from './debugTracer';
import { diagnostics } from './advanced-diagnostics';

// 可用性指标类型
export type AvailabilityStatus = 'OPERATIONAL' | 'DEGRADED' | 'PARTIAL_OUTAGE' | 'OUTAGE';
export type SystemComponent = 'STORAGE' | 'PLUGINS' | 'WEBHOOKS' | 'MEMORY' | 'PERFORMANCE' | 'API' | 'UI';

// 可用性指标接口
export interface AvailabilityMetrics {
  overallUptime: number; // 正常运行时间百分比
  lastErrorTime?: number;
  meanTimeToRecover: number;
  uptimeSinceLastError: number;
}

// 组件状态
export interface ComponentStatus {
  component: SystemComponent;
  status: AvailabilityStatus;
  healthy: boolean;
  lastCheck: number;
  uptimePercentage: number;
  errorCount: number;
  errorRate: number;
}

// 系统可用性报告
export interface SystemAvailabilityReport {
  timestamp: number;
  overallStatus: AvailabilityStatus;
  overallHealthScore: number;
  components: ComponentStatus[];
  uptimeMetrics: AvailabilityMetrics;
  recommendations: string[];
  criticalIssues: string[];
}

// 深度可用性监控系统
export class SystemAvailabilityMonitor {
  private static instance: SystemAvailabilityMonitor;
  private startTime: number;
  private componentStatuses: Map<SystemComponent, ComponentStatus>;
  private errorHistory: Array<{
    component: SystemComponent;
    error: Error;
    timestamp: number;
  }> = [];
  private checkInterval: number = 30000; // 每30秒检查一次
  private intervalId: any = null;
  private maxErrorHistory: number = 1000;

  private constructor() {
    this.startTime = Date.now();
    this.componentStatuses = new Map();
    
    // 初始化所有组件状态
    const components: SystemComponent[] = ['STORAGE', 'PLUGINS', 'WEBHOOKS', 'MEMORY', 'PERFORMANCE', 'API', 'UI'];
    
    components.forEach(component => {
      this.componentStatuses.set(component, {
        component,
        status: 'OPERATIONAL',
        healthy: true,
        lastCheck: Date.now(),
        uptimePercentage: 100,
        errorCount: 0,
        errorRate: 0
      });
    });

    logger.info('SYSTEM', 'SystemAvailabilityMonitor initialized - Availability and reliability monitoring system ready');
    this.startMonitoring();
  }

  static getInstance(): SystemAvailabilityMonitor {
    if (!SystemAvailabilityMonitor.instance) {
      SystemAvailabilityMonitor.instance = new SystemAvailabilityMonitor();
    }
    return SystemAvailabilityMonitor.instance;
  }

  // 开始持续监控
  private startMonitoring(): void {
    if (this.intervalId) return;
    
    this.intervalId = setInterval(() => {
      this.checkAllComponents();
    }, this.checkInterval);
    
    logger.info('SYSTEM', 'Availability monitoring started');
  }

  // 停止监控
  private stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      logger.info('SYSTEM', 'Availability monitoring stopped');
    }
  }

  // 检查所有组件
  checkAllComponents(): void {
    logger.debug('SYSTEM', 'Checking all components health');
    
    this.componentStatuses.forEach((status, component) => {
      this.checkComponent(component);
    });

    const report = this.generateReport();
    logger.info('SYSTEM', 'System availability check completed', {
      overallStatus: report.overallStatus,
      overallHealthScore: report.overallHealthScore
    });
  }

  // 检查单个组件
  checkComponent(component: SystemComponent): void {
    let status: AvailabilityStatus = 'OPERATIONAL';
    let healthy = true;
    
    try {
      switch (component) {
        case 'MEMORY':
          healthy = this.checkMemoryHealth();
          if (!healthy) status = 'DEGRADED';
          break;
          
        case 'PERFORMANCE':
          healthy = this.checkPerformanceHealth();
          if (!healthy) status = 'DEGRADED';
          break;
          
        case 'STORAGE':
          healthy = this.checkStorageHealth();
          if (!healthy) status = 'DEGRADED';
          break;
          
        default:
          healthy = true;
      }
    } catch (error) {
      healthy = false;
      status = 'DEGRADED';
      this.recordError(component, error instanceof Error ? error : new Error(String(error)));
    }

    const currentStatus = this.componentStatuses.get(component);
    if (currentStatus) {
      this.componentStatuses.set(component, {
        ...currentStatus,
        status,
        healthy,
        lastCheck: Date.now()
      });
    }
  }

  // 检查内存健康
  private checkMemoryHealth(): boolean {
    try {
      const allocation = new Array(1000).fill(Math.random());
      allocation.length = 0;
      return true;
    } catch {
      return false;
    }
  }

  // 检查性能健康
  private checkPerformanceHealth(): boolean {
    try {
      const startTime = Date.now();
      let sum = 0;
      for (let i = 0; i < 10000; i++) {
        sum += Math.sqrt(i);
      }
      const duration = Date.now() - startTime;
      return duration < 500; // 500ms阈值
    } catch {
      return false;
    }
  }

  // 检查存储健康
  private checkStorageHealth(): boolean {
    try {
      const testKey = 'availability-test';
      localStorage.setItem(testKey, JSON.stringify({ test: Date.now() }));
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      return retrieved !== null;
    } catch {
      return false;
    }
  }

  // 记录错误
  recordError(component: SystemComponent, error: Error): void {
    logger.error('SYSTEM', `Component error: ${component}`, error);
    
    this.errorHistory.push({
      component,
      error,
      timestamp: Date.now()
    });

    if (this.errorHistory.length > this.maxErrorHistory) {
      this.errorHistory = this.errorHistory.slice(-this.maxErrorHistory);
    }

    const status = this.componentStatuses.get(component);
    if (status) {
      status.errorCount++;
      status.errorRate = (status.errorCount / Math.max(1, this.errorHistory.length)) * 100;
      
      if (status.errorRate > 10) {
        status.status = 'DEGRADED';
        status.healthy = false;
      }
    }
  }

  // 生成可用性报告
  generateReport(): SystemAvailabilityReport {
    const totalTime = Date.now() - this.startTime;
    const errorsInLastHour = this.errorHistory.filter(e => 
      Date.now() - e.timestamp < 3600000
    );
    
    const components: ComponentStatus[] = Array.from(this.componentStatuses.values());
    
    const healthyCount = components.filter(c => c.healthy).length;
    const overallHealthScore = Math.round((healthyCount / components.length) * 100);
    
    let overallStatus: AvailabilityStatus = 'OPERATIONAL';
    if (overallHealthScore < 80) overallStatus = 'DEGRADED';
    if (overallHealthScore < 50) overallStatus = 'PARTIAL_OUTAGE';
    if (overallHealthScore < 20) overallStatus = 'OUTAGE';

    const recommendations = this.generateRecommendations(components, errorsInLastHour);
    const criticalIssues = this.getCriticalIssues(components);

    return {
      timestamp: Date.now(),
      overallStatus,
      overallHealthScore,
      components,
      uptimeMetrics: {
        overallUptime: overallHealthScore,
        meanTimeToRecover: 300, // 5分钟平均恢复时间 (示例)
        uptimeSinceLastError: Date.now() - (this.errorHistory[this.errorHistory.length - 1]?.timestamp || this.startTime)
      },
      recommendations,
      criticalIssues
    };
  }

  // 生成建议
  private generateRecommendations(
    components: ComponentStatus[], 
    recentErrors: any[]
  ): string[] {
    const recommendations: string[] = [];

    const degradedComponents = components.filter(c => !c.healthy);
    if (degradedComponents.length > 0) {
      recommendations.push(`Check degraded components: ${degradedComponents.map(c => c.component).join(', ')}`);
    }

    if (recentErrors.length > 10) {
      recommendations.push('High error rate detected - review error logs for details');
    }

    recommendations.push('Continue regular health monitoring');
    
    return recommendations;
  }

  // 获取严重问题
  private getCriticalIssues(components: ComponentStatus[]): string[] {
    const issues: string[] = [];

    components.forEach(c => {
      if (c.status === 'OUTAGE' || c.status === 'PARTIAL_OUTAGE') {
        issues.push(`${c.component} has status: ${c.status}`);
      }
      if (c.errorRate > 20) {
        issues.push(`${c.component} has high error rate: ${c.errorRate.toFixed(1)}%`);
      }
    });

    return issues;
  }

  // 获取组件状态
  getComponentStatus(component: SystemComponent): ComponentStatus | undefined {
    return this.componentStatuses.get(component);
  }

  // 获取所有组件状态
  getAllComponentStatuses(): ComponentStatus[] {
    return Array.from(this.componentStatuses.values());
  }

  // 获取总体状态
  getOverallStatus(): AvailabilityStatus {
    const report = this.generateReport();
    return report.overallStatus;
  }

  // 导出监控数据
  exportMonitoringData(): string {
    const report = this.generateReport();
    return JSON.stringify({
      report,
      errorHistory: this.errorHistory,
      exportTime: Date.now()
    }, null, 2);
  }

  // 清空历史
  clearHistory(): void {
    this.errorHistory = [];
    const components = Array.from(this.componentStatuses.keys());
    components.forEach(component => {
      const status = this.componentStatuses.get(component);
      if (status) {
        status.errorCount = 0;
        status.errorRate = 0;
      }
    });
    logger.info('SYSTEM', 'Monitoring history cleared');
  }
}

export const availabilityMonitor = SystemAvailabilityMonitor.getInstance();
