export interface SystemMetric {
  timestamp: number;
  memory: {
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  };
  domNodes: number;
  eventListeners: number;
  fps: number;
  performanceEntries: number;
}

export interface HealthIssue {
  id: string;
  type: 'memory_leak' | 'performance_degradation' | 'state_inconsistency' | 'error_surge';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: number;
  details: Record<string, any>;
  stackTrace?: string;
}

export interface SystemStateSnapshot {
  timestamp: number;
  tasks: {
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
  };
  notifications: {
    total: number;
    unread: number;
  };
  layers: {
    [key: number]: {
      status: string;
      metrics: any;
    };
  };
}

export class DeepHealthMonitor {
  private metricsHistory: SystemMetric[] = [];
  private issuesHistory: HealthIssue[] = [];
  private stateSnapshots: SystemStateSnapshot[] = [];
  private isRunning: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private startTime: number = 0;
  private lastMemoryCheck: number = 0;
  private lastFrameTime: number = performance.now();
  private frameCount: number = 0;
  private lastFPSUpdate: number = 0;
  
  private readonly MAX_HISTORY = 300; // 5 minutes at 1-second intervals
  private readonly CRITICAL_MEMORY_RATIO = 0.85;
  private readonly WARNING_MEMORY_RATIO = 0.70;
  
  constructor() {
    console.log('[HealthMonitor] Initialized');
  }
  
  start(intervalMs: number = 1000) {
    if (this.isRunning) {
      console.warn('[HealthMonitor] Already running');
      return;
    }
    
    this.isRunning = true;
    this.startTime = Date.now();
    this.lastMemoryCheck = Date.now();
    
    console.log('[HealthMonitor] Starting deep health monitoring...');
    
    // Take initial snapshot
    this.recordMetric();
    
    this.monitoringInterval = setInterval(() => {
      this.recordMetric();
      this.checkForIssues();
    }, intervalMs);
  }
  
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    console.log('[HealthMonitor] Stopped');
    
    // Generate final report
    this.generateFinalReport();
  }
  
  recordStateSnapshot(state: Omit<SystemStateSnapshot, 'timestamp'>) {
    this.stateSnapshots.push({
      ...state,
      timestamp: Date.now()
    });
    
    if (this.stateSnapshots.length > this.MAX_HISTORY) {
      this.stateSnapshots.shift();
    }
  }
  
  recordIssue(issue: Omit<HealthIssue, 'id' | 'timestamp'>) {
    const fullIssue: HealthIssue = {
      ...issue,
      id: `issue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    
    this.issuesHistory.push(fullIssue);
    
    if (this.issuesHistory.length > this.MAX_HISTORY * 2) {
      this.issuesHistory.shift();
    }
    
    if (issue.severity === 'critical' || issue.severity === 'high') {
      console.error(`[HealthMonitor] ${issue.severity.toUpperCase()}: ${issue.description}`, issue.details);
    } else if (issue.severity === 'medium') {
      console.warn(`[HealthMonitor] ${issue.severity.toUpperCase()}: ${issue.description}`);
    }
  }
  
  getMetrics(): SystemMetric[] {
    return [...this.metricsHistory];
  }
  
  getIssues(): HealthIssue[] {
    return [...this.issuesHistory];
  }
  
  getStateSnapshots(): SystemStateSnapshot[] {
    return [...this.stateSnapshots];
  }
  
  private recordMetric() {
    const now = Date.now();
    const metric: SystemMetric = {
      timestamp: now,
      memory: this.getMemoryUsage(),
      domNodes: this.countDOMNodes(),
      eventListeners: this.estimateEventListeners(),
      fps: this.estimateFPS(),
      performanceEntries: performance.getEntries().length
    };
    
    this.metricsHistory.push(metric);
    
    if (this.metricsHistory.length > this.MAX_HISTORY) {
      this.metricsHistory.shift();
    }
    
    if (this.metricsHistory.length % 60 === 0) { // Every minute
      console.log(`[HealthMonitor] Status: ${this.metricsHistory.length} metrics collected`);
    }
  }
  
  private getMemoryUsage() {
    if ('memory' in performance) {
      const perfMemory = (performance as any).memory;
      return {
        usedJSHeapSize: perfMemory.usedJSHeapSize,
        totalJSHeapSize: perfMemory.totalJSHeapSize,
        jsHeapSizeLimit: perfMemory.jsHeapSizeLimit
      };
    }
    return {};
  }
  
  private countDOMNodes(): number {
    try {
      return document.querySelectorAll('*').length;
    } catch {
      return 0;
    }
  }
  
  private estimateEventListeners(): number {
    const domNodes = this.countDOMNodes();
    return Math.min(domNodes * 3, 10000);
  }
  
  private estimateFPS(): number {
    const now = performance.now();
    
    if (now - this.lastFPSUpdate >= 1000) {
      const fps = Math.round((this.frameCount * 1000) / (now - this.lastFPSUpdate));
      this.frameCount = 0;
      this.lastFPSUpdate = now;
      return fps;
    }
    
    this.frameCount++;
    return this.frameCount > 0 ? 
      Math.round((this.frameCount * 1000) / (now - this.lastFPSUpdate)) : 60;
  }
  
  private checkForIssues() {
    const recentMetrics = this.metricsHistory.slice(-30);
    if (recentMetrics.length < 10) return;
    
    this.checkMemoryIssues(recentMetrics);
    this.checkPerformanceIssues(recentMetrics);
    this.checkDOMIssues(recentMetrics);
  }
  
  private checkMemoryIssues(metrics: SystemMetric[]) {
    if (metrics.length < 10) return;
    
    const current = metrics[metrics.length - 1];
    const oldest = metrics[0];
    
    if (current.memory.usedJSHeapSize && current.memory.jsHeapSizeLimit) {
      const ratio = current.memory.usedJSHeapSize / current.memory.jsHeapSizeLimit;
      
      if (ratio >= this.CRITICAL_MEMORY_RATIO) {
        this.recordIssue({
          type: 'memory_leak',
          severity: 'critical',
          description: `Memory usage critical: ${(ratio * 100).toFixed(1)}% of limit`,
          details: {
            used: current.memory.usedJSHeapSize,
            limit: current.memory.jsHeapSizeLimit,
            ratio: ratio
          }
        });
      } else if (ratio >= this.WARNING_MEMORY_RATIO) {
        this.recordIssue({
          type: 'memory_leak',
          severity: 'high',
          description: `Memory usage high: ${(ratio * 100).toFixed(1)}% of limit`,
          details: {
            used: current.memory.usedJSHeapSize,
            limit: current.memory.jsHeapSizeLimit,
            ratio: ratio
          }
        });
      }
      
      if (oldest.memory.usedJSHeapSize && current.memory.usedJSHeapSize) {
        const growth = current.memory.usedJSHeapSize - oldest.memory.usedJSHeapSize;
        const growthPercent = (growth / oldest.memory.usedJSHeapSize) * 100;
        
        if (growthPercent > 20) {
          this.recordIssue({
            type: 'memory_leak',
            severity: 'medium',
            description: `Memory growth detected: +${growthPercent.toFixed(1)}% in 30s`,
            details: {
              old: oldest.memory.usedJSHeapSize,
              new: current.memory.usedJSHeapSize,
              growth: growth,
              growthPercent: growthPercent
            }
          });
        }
      }
    }
  }
  
  private checkPerformanceIssues(metrics: SystemMetric[]) {
    if (metrics.length < 10) return;
    
    const recentFPS = metrics.slice(-10);
    const avgFPS = recentFPS.reduce((sum, m) => sum + m.fps, 0) / recentFPS.length;
    
    if (avgFPS < 30) {
      this.recordIssue({
        type: 'performance_degradation',
        severity: 'high',
        description: `Low FPS detected: ${avgFPS.toFixed(0)}`,
        details: { avgFPS, recentFPS: recentFPS.map(m => m.fps) }
      });
    } else if (avgFPS < 45) {
      this.recordIssue({
        type: 'performance_degradation',
        severity: 'medium',
        description: `Moderate FPS: ${avgFPS.toFixed(0)}`,
        details: { avgFPS }
      });
    }
  }
  
  private checkDOMIssues(metrics: SystemMetric[]) {
    if (metrics.length < 5) return;
    
    const current = metrics[metrics.length - 1];
    const oldest = metrics[0];
    
    if (current.domNodes > 5000) {
      this.recordIssue({
        type: 'performance_degradation',
        severity: 'medium',
        description: `High DOM node count: ${current.domNodes}`,
        details: { domNodes: current.domNodes }
      });
    }
    
    if (oldest.domNodes > 0 && (current.domNodes - oldest.domNodes) > 500) {
      this.recordIssue({
        type: 'memory_leak',
        severity: 'low',
        description: `DOM nodes increased by ${current.domNodes - oldest.domNodes} in 30s`,
        details: { old: oldest.domNodes, new: current.domNodes }
      });
    }
  }
  
  private generateFinalReport() {
    const duration = Date.now() - this.startTime;
    const criticalIssues = this.issuesHistory.filter(i => i.severity === 'critical').length;
    const highIssues = this.issuesHistory.filter(i => i.severity === 'high').length;
    const mediumIssues = this.issuesHistory.filter(i => i.severity === 'medium').length;
    const lowIssues = this.issuesHistory.filter(i => i.severity === 'low').length;
    
    console.group('📊 HEALTH MONITOR - FINAL REPORT');
    console.log(`Duration: ${(duration / 1000 / 60).toFixed(1)} minutes`);
    console.log(`Metrics collected: ${this.metricsHistory.length}`);
    console.log('Issues found:');
    console.log(`  - Critical: ${criticalIssues}`);
    console.log(`  - High: ${highIssues}`);
    console.log(`  - Medium: ${mediumIssues}`);
    console.log(`  - Low: ${lowIssues}`);
    console.log('Total issues:', this.issuesHistory.length);
    
    if (this.metricsHistory.length > 0) {
      const first = this.metricsHistory[0];
      const last = this.metricsHistory[this.metricsHistory.length - 1];
      
      console.log('Memory changes:');
      if (first.memory.usedJSHeapSize && last.memory.usedJSHeapSize) {
        const memoryChange = last.memory.usedJSHeapSize - first.memory.usedJSHeapSize;
        const memoryChangePercent = (memoryChange / first.memory.usedJSHeapSize) * 100;
        console.log(`  - Memory: ${memoryChangePercent >= 0 ? '+' : ''}${memoryChangePercent.toFixed(1)}%`);
      }
      console.log(`  - DOM nodes: ${last.domNodes - first.domNodes}`);
    }
    
    console.groupEnd();
  }
}

export const healthMonitor = new DeepHealthMonitor();
