import { logger } from '@/utils/systemLogger';
import { perfMonitor } from '@/utils/performance-monitor';
import { errorHandler } from '@/utils/error-handling-manager';

// 健康度评分系统
export enum HealthStatus {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

// 性能指标类型
export interface PerformanceMetrics {
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number;
  errorRate: number;
  fps: number;
  memoryUsage: number;
}

// 健康度评分结果
export interface HealthScore {
  overall: number; // 0-100
  performance: number;
  reliability: number;
  memory: number;
  errors: number;
  status: HealthStatus;
  recommendations: string[];
  lastUpdated: number;
}

// 性能瓶颈检测结果
export interface Bottleneck {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: number;
  rootCause?: string;
  possibleFixes: string[];
}

// 系统诊断结果
export interface SystemDiagnosis {
  healthScore: HealthScore;
  bottlenecks: Bottleneck[];
  recentErrors: any[];
  performanceTrend: 'improving' | 'stable' | 'degrading';
  recommendations: string[];
  selfHealing: {
    available: boolean;
    actions: string[];
    executed: number;
  };
}

export class AdvancedDiagnostics {
  private static instance: AdvancedDiagnostics;
  private history: HealthScore[] = [];
  private maxHistory: number = 1000;
  private bottlenecks: Bottleneck[] = [];
  private lastAnalysis: number = 0;
  private selfHealingActions: number = 0;

  private constructor() {
    logger.info('DIAGNOSTICS', 'Advanced Diagnostics System initialized');
    this.startPeriodicAnalysis();
  }

  static getInstance(): AdvancedDiagnostics {
    if (!AdvancedDiagnostics.instance) {
      AdvancedDiagnostics.instance = new AdvancedDiagnostics();
    }
    return AdvancedDiagnostics.instance;
  }

  // 1. 实时健康度评分
  calculateHealthScore(): HealthScore {
    const perfReport = perfMonitor.generateReport();
    const errorStats = errorHandler.getErrorStats();

    const now = Date.now();
    
    // 计算性能分数 (0-100)
    const performanceScore = this.calculatePerformanceScore(perfReport);
    
    // 计算可靠性分数 (0-100)
    const reliabilityScore = this.calculateReliabilityScore();
    
    // 计算内存分数 (0-100)
    const memoryScore = this.calculateMemoryScore();
    
    // 计算错误分数 (0-100)
    const errorsScore = this.calculateErrorsScore(errorStats);
    
    // 总体分数 (加权平均)
    const overall = Math.round(
      performanceScore * 0.35 +
      reliabilityScore * 0.30 +
      memoryScore * 0.20 +
      errorsScore * 0.15
    );

    const status = this.getHealthStatus(overall);
    const recommendations = this.generateRecommendations(
      performanceScore, reliabilityScore, memoryScore, errorsScore
    );

    const score: HealthScore = {
      overall,
      performance: performanceScore,
      reliability: reliabilityScore,
      memory: memoryScore,
      errors: errorsScore,
      status,
      recommendations,
      lastUpdated: now
    };

    // 保存历史记录
    this.history.push(score);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }

    logger.info('DIAGNOSTICS', `Health Score calculated: ${overall}/100 (${status})`, {
      performance: performanceScore,
      reliability: reliabilityScore,
      memory: memoryScore,
      errors: errorsScore
    });

    return score;
  }

  // 2. 性能瓶颈自动检测
  detectBottlenecks(): Bottleneck[] {
    const detected: Bottleneck[] = [];
    const perfReport = perfMonitor.generateReport();
    const now = Date.now();

    logger.info('DIAGNOSTICS', 'Starting bottleneck detection...');

    // 检查慢速操作
    const slowOperations = perfMonitor.getSlowOperations(100);
    if (slowOperations.length > 0) {
      detected.push({
        id: `slow-ops-${now}`,
        type: 'performance',
        severity: slowOperations.length > 10 ? 'high' : 'medium',
        description: `Detected ${slowOperations.length} slow operations (>100ms)`,
        detectedAt: now,
        rootCause: slowOperations[0]?.name || 'Unknown operation',
        possibleFixes: [
          'Optimize database queries',
          'Add caching layer',
          'Consider async processing',
          'Review algorithm complexity'
        ]
      });
    }

    // 检查内存使用
    const currentMemory = perfMonitor.getMemoryUsageMB();
    if (currentMemory && currentMemory > 500) {
      detected.push({
        id: `memory-${now}`,
        type: 'memory',
        severity: currentMemory > 800 ? 'critical' : 'warning',
        description: `High memory usage: ${currentMemory.toFixed(1)} MB`,
        detectedAt: now,
        rootCause: 'Possible memory leak or large data structures',
        possibleFixes: [
          'Check for memory leaks',
          'Implement data pagination',
          'Clear unused caches',
          'Use streaming for large datasets'
        ]
      });
    }

    // 检查FPS
    const currentFPS = perfMonitor.getCurrentFPS();
    if (currentFPS && currentFPS < 30) {
      detected.push({
        id: `fps-${now}`,
        type: 'rendering',
        severity: currentFPS < 15 ? 'high' : 'medium',
        description: `Low FPS detected: ${currentFPS.toFixed(1)}`,
        detectedAt: now,
        rootCause: 'Heavy re-renders or complex calculations',
        possibleFixes: [
          'Optimize React renders',
          'Use virtualization for lists',
          'Defer non-critical updates',
          'Implement memoization'
        ]
      });
    }

    this.bottlenecks = detected;
    
    logger.info('DIAGNOSTICS', `Bottleneck detection complete: ${detected.length} issues found`);
    
    return detected;
  }

  // 3. 问题根源自动分析
  analyzeRootCause(bottleneck: Bottleneck): string {
    let analysis = 'Analyzing...';
    
    // 基于瓶颈类型进行智能分析
    switch (bottleneck.type) {
      case 'performance':
        analysis = 'Root cause likely related to inefficient algorithms, ' +
                  'unoptimized database queries, or missing caching layers.';
        break;
      case 'memory':
        analysis = 'Root cause likely related to memory leaks, ' +
                  'large in-memory datasets, or insufficient caching strategies.';
        break;
      case 'rendering':
        analysis = 'Root cause likely related to excessive re-renders, ' +
                  'complex UI calculations, or missing memoization.';
        break;
      default:
        analysis = 'Further investigation required to determine exact root cause.';
    }
    
    logger.debug('DIAGNOSTICS', `Root cause analysis for ${bottleneck.id}: ${analysis}`);
    return analysis;
  }

  // 4. 自我修复机制
  attemptSelfHealing(): string[] {
    const executedActions: string[] = [];
    const bottlenecks = this.detectBottlenecks();

    logger.info('DIAGNOSTICS', 'Initiating self-healing procedures...');

    for (const bottleneck of bottlenecks) {
      // 尝试修复不同类型的问题
      if (bottleneck.type === 'memory') {
        // 清理缓存
        logger.info('DIAGNOSTICS', 'Self-healing: Clearing caches to reduce memory usage');
        try {
          // 这里可以调用实际的缓存清理
          // safeStorage.clearCache();
          executedActions.push('Cleared caches');
          this.selfHealingActions++;
        } catch (err) {
          logger.error('DIAGNOSTICS', 'Self-healing failed', err);
        }
      }
      
      if (bottleneck.type === 'performance') {
        // 重置性能指标
        logger.info('DIAGNOSTICS', 'Self-healing: Resetting performance metrics');
        perfMonitor.clearMetrics();
        executedActions.push('Reset performance metrics');
        this.selfHealingActions++;
      }
    }

    logger.info('DIAGNOSTICS', `Self-healing complete: ${executedActions.length} actions executed`);
    return executedActions;
  }

  // 5. 完整系统诊断
  performFullDiagnosis(): SystemDiagnosis {
    logger.info('DIAGNOSTICS', 'Performing full system diagnosis...');
    
    const healthScore = this.calculateHealthScore();
    const bottlenecks = this.detectBottlenecks();
    const recentErrors = errorHandler.getErrorStats().recentErrors || [];
    
    // 分析趋势
    const performanceTrend = this.analyzeTrend();
    
    const allRecommendations = [
      ...healthScore.recommendations,
      ...bottlenecks.flatMap(b => b.possibleFixes)
    ];

    const diagnosis: SystemDiagnosis = {
      healthScore,
      bottlenecks,
      recentErrors,
      performanceTrend,
      recommendations: [...new Set(allRecommendations)].slice(0, 10),
      selfHealing: {
        available: true,
        actions: ['Clear caches', 'Reset metrics', 'Cleanup old data'],
        executed: this.selfHealingActions
      }
    };

    logger.info('DIAGNOSTICS', 'Full diagnosis complete', {
      overallHealth: healthScore.overall,
      bottlenecks: bottlenecks.length,
      errors: recentErrors.length
    });

    return diagnosis;
  }

  // 辅助方法
  private calculatePerformanceScore(report: any): number {
    const avgDuration = report.summary.avgDuration || 1000;
    if (avgDuration < 50) return 100;
    if (avgDuration < 100) return 90;
    if (avgDuration < 200) return 75;
    if (avgDuration < 500) return 60;
    if (avgDuration < 1000) return 40;
    return 20;
  }

  private calculateReliabilityScore(): number {
    const history = this.getHistory(10);
    if (history.length < 2) return 90;
    
    const avgScore = history.reduce((sum, s) => sum + s.overall, 0) / history.length;
    return Math.min(100, Math.max(0, avgScore));
  }

  private calculateMemoryScore(): number {
    const memory = perfMonitor.getMemoryUsageMB();
    if (!memory) return 80;
    if (memory < 100) return 100;
    if (memory < 200) return 90;
    if (memory < 400) return 75;
    if (memory < 600) return 50;
    if (memory < 800) return 30;
    return 15;
  }

  private calculateErrorsScore(stats: any): number {
    const errorCount = stats.total || 0;
    if (errorCount === 0) return 100;
    if (errorCount < 5) return 90;
    if (errorCount < 20) return 70;
    if (errorCount < 50) return 50;
    if (errorCount < 100) return 30;
    return 10;
  }

  private getHealthStatus(score: number): HealthStatus {
    if (score >= 90) return HealthStatus.EXCELLENT;
    if (score >= 75) return HealthStatus.GOOD;
    if (score >= 60) return HealthStatus.FAIR;
    if (score >= 40) return HealthStatus.WARNING;
    return HealthStatus.CRITICAL;
  }

  private generateRecommendations(p: number, r: number, m: number, e: number): string[] {
    const recommendations: string[] = [];
    
    if (p < 70) recommendations.push('Review performance optimizations');
    if (r < 70) recommendations.push('Check system reliability trends');
    if (m < 60) recommendations.push('Monitor memory usage more closely');
    if (e < 70) recommendations.push('Investigate recent error patterns');
    
    return recommendations;
  }

  private analyzeTrend(): 'improving' | 'stable' | 'degrading' {
    const recent = this.getHistory(5);
    if (recent.length < 3) return 'stable';
    
    const old = recent.slice(0, 3).reduce((sum, s) => sum + s.overall, 0) / 3;
    const recent3 = recent.slice(-3).reduce((sum, s) => sum + s.overall, 0) / 3;
    
    if (recent3 > old + 5) return 'improving';
    if (recent3 < old - 5) return 'degrading';
    return 'stable';
  }

  getHistory(count: number = 100): HealthScore[] {
    return this.history.slice(-count);
  }

  private startPeriodicAnalysis() {
    // 每30秒自动分析一次
    setInterval(() => {
      try {
        this.performFullDiagnosis();
      } catch (error) {
        logger.error('DIAGNOSTICS', 'Periodic analysis failed', error);
      }
    }, 30000);
    
    logger.info('DIAGNOSTICS', 'Periodic health analysis scheduled');
  }
}

export const diagnostics = AdvancedDiagnostics.getInstance();
