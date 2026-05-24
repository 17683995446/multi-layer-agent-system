import { logger } from './systemLogger';

// 代码执行追踪器 - 提供详细的代码执行日志和调试信息
export type TraceLevel = 'FUNCTION_ENTRY' | 'FUNCTION_EXIT' | 'DATA_FLOW' | 'STATE_CHANGE' | 'CONDITION_CHECK';

export interface TraceEntry {
  id: string;
  timestamp: number;
  level: TraceLevel;
  category: string;
  functionName: string;
  message: string;
  input?: any;
  output?: any;
  duration?: number;
  location?: string;
  callStack?: string;
}

export interface CodeLineLog {
  file: string;
  line: number;
  message: string;
  timestamp: number;
  value?: any;
}

// 深度追踪和调试系统
export class DebugTracer {
  private static instance: DebugTracer;
  private traces: TraceEntry[] = [];
  private codeLineLogs: CodeLineLog[] = [];
  private maxTraces: number = 10000;
  private enabled: boolean = true;
  private traceTiming: boolean = true;
  private functionStartTime = new Map<string, number>();

  private constructor() {
    logger.info('SYSTEM', 'DebugTracer initialized - Code tracing and debugging system ready');
  }

  static getInstance(): DebugTracer {
    if (!DebugTracer.instance) {
      DebugTracer.instance = new DebugTracer();
    }
    return DebugTracer.instance;
  }

  // 在每个代码行添加日志
  logCodeLine(file: string, line: number, message: string, value?: any): void {
    if (!this.enabled) return;
    
    const entry: CodeLineLog = {
      file,
      line,
      message,
      timestamp: Date.now(),
      value
    };
    
    this.codeLineLogs.push(entry);
    
    if (this.codeLineLogs.length > this.maxTraces) {
      this.codeLineLogs = this.codeLineLogs.slice(-this.maxTraces);
    }
    
    logger.debug('SYSTEM', `[${file}:${line}] ${message}`, value);
  }

  // 函数入口追踪
  traceFunctionEntry(functionName: string, input?: any, category: string = 'SYSTEM'): void {
    if (!this.enabled) return;
    
    const traceId = `${functionName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.functionStartTime.set(traceId, Date.now());
    
    const entry: TraceEntry = {
      id: traceId,
      timestamp: Date.now(),
      level: 'FUNCTION_ENTRY',
      category,
      functionName,
      message: `Function called`,
      input,
      location: this.getCallerLocation()
    };
    
    this.traces.push(entry);
    
    if (this.traces.length > this.maxTraces) {
      this.traces = this.traces.slice(-this.maxTraces);
    }
    
    logger.debug(category, `→ Entering function: ${functionName}`, {
      functionName,
      input: typeof input === 'object' ? '[Object]' : input
    });
  }

  // 函数出口追踪
  traceFunctionExit(functionName: string, output?: any, category: string = 'SYSTEM'): void {
    if (!this.enabled) return;
    
    const traceId = Array.from(this.functionStartTime.keys()).find(id => id.startsWith(functionName));
    const startTime = traceId ? this.functionStartTime.get(traceId) : Date.now();
    const duration = startTime ? Date.now() - startTime : 0;
    
    if (traceId) {
      this.functionStartTime.delete(traceId);
    }
    
    const entry: TraceEntry = {
      id: `exit-${functionName}-${Date.now()}`,
      timestamp: Date.now(),
      level: 'FUNCTION_EXIT',
      category,
      functionName,
      message: 'Function returned',
      output,
      duration
    };
    
    this.traces.push(entry);
    
    logger.debug(category, `← Exiting function: ${functionName}`, {
      functionName,
      output: typeof output === 'object' ? '[Object]' : output,
      duration
    });
  }

  // 数据流追踪
  traceDataFlow(dataPoint: string, value: any, operation: string, category: string = 'SYSTEM'): void {
    if (!this.enabled) return;
    
    const entry: TraceEntry = {
      id: `data-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level: 'DATA_FLOW',
      category,
      functionName: dataPoint,
      message: operation,
      output: value
    };
    
    this.traces.push(entry);
    logger.debug(category, `📊 Data flow: ${operation}`, value);
  }

  // 状态变更追踪
  traceStateChange(stateName: string, oldState: any, newState: any, category: string = 'SYSTEM'): void {
    if (!this.enabled) return;
    
    const entry: TraceEntry = {
      id: `state-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level: 'STATE_CHANGE',
      category,
      functionName: stateName,
      message: 'State changed',
      input: oldState,
      output: newState
    };
    
    this.traces.push(entry);
    logger.info(category, `🔄 State changed: ${stateName}`, {
      oldState: typeof oldState === 'object' ? '[Object]' : oldState,
      newState: typeof newState === 'object' ? '[Object]' : newState
    });
  }

  // 条件检查追踪
  traceCondition(conditionName: string, result: boolean, details: any, category: string = 'SYSTEM'): void {
    if (!this.enabled) return;
    
    const entry: TraceEntry = {
      id: `condition-${Date.now()}`,
      timestamp: Date.now(),
      level: 'CONDITION_CHECK',
      category,
      functionName: conditionName,
      message: result ? 'Condition passed' : 'Condition failed',
      output: {
        conditionName,
        result,
        details
      }
    };
    
    this.traces.push(entry);
    logger.debug(category, `❓ Condition check: ${conditionName} = ${result}`, details);
  }

  // 获取调用者位置
  private getCallerLocation(): string {
    try {
      const stack = new Error().stack;
      if (!stack) return 'unknown';
      const caller = stack.split('\n')[3];
      return caller ? caller.trim() : 'unknown';
    } catch {
      return 'unknown';
    }
  }

  // 获取追踪信息
  getTraces(options?: {
    level?: TraceLevel;
    category?: string;
    functionName?: string;
    limit?: number;
  }): TraceEntry[] {
    let filtered = [...this.traces];
    
    if (options?.level) {
      filtered = filtered.filter(trace => trace.level === options.level);
    }
    
    if (options?.category) {
      filtered = filtered.filter(trace => trace.category === options.category);
    }
    
    if (options?.functionName) {
      filtered = filtered.filter(trace => trace.functionName === options.functionName);
    }
    
    if (options?.limit) {
      filtered = filtered.slice(-options.limit);
    }
    
    return filtered;
  }

  // 获取统计信息
  getStatistics(): {
    totalTraces: number;
    byLevel: Record<TraceLevel, number>;
    byFunction: Record<string, number>;
    totalFunctions: number;
  } {
    const stats = {
      totalTraces: this.traces.length,
      byLevel: {
        FUNCTION_ENTRY: 0,
        FUNCTION_EXIT: 0,
        DATA_FLOW: 0,
        STATE_CHANGE: 0,
        CONDITION_CHECK: 0
      },
      byFunction: {} as Record<string, number>,
      totalFunctions: new Set<string>().size
    };
    
    const functionNames = new Set<string>();
    
    this.traces.forEach(trace => {
      stats.byLevel[trace.level]++;
      functionNames.add(trace.functionName);
      
      if (!stats.byFunction[trace.functionName]) {
        stats.byFunction[trace.functionName] = 0;
      }
      stats.byFunction[trace.functionName]++;
    });
    
    stats.totalFunctions = functionNames.size;
    
    return stats;
  }

  // 导出追踪信息
  exportTraces(): string {
    return JSON.stringify({
      traces: this.traces,
      codeLineLogs: this.codeLineLogs,
      statistics: this.getStatistics()
    }, null, 2);
  }

  // 清空追踪
  clearTraces(): void {
    this.traces = [];
    this.codeLineLogs = [];
    this.functionStartTime.clear();
    logger.info('SYSTEM', 'All traces cleared');
  }

  // 启用/禁用
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

export const tracer = DebugTracer.getInstance();
