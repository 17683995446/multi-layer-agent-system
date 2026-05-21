export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
export type LogCategory = 'SYSTEM' | 'STORE' | 'TASK' | 'MEMORY' | 'NOTIFICATION' | 'LAYER' | 'TEST';

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  location?: string;
}

class SystemLogger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 10000;
  private minLevel: LogLevel = 'DEBUG';
  private enabledCategories: LogCategory[] = ['SYSTEM', 'STORE', 'TASK', 'MEMORY', 'NOTIFICATION', 'LAYER', 'TEST'];
  private consoleEnabled: boolean = true;
  private callback?: (log: LogEntry) => void;

  private levelOrder: LogLevel[] = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];

  constructor() {
    console.log('📋 SystemLogger initialized - Detailed logging system ready');
  }

  setMinLevel(level: LogLevel): void {
    this.minLevel = level;
    console.log(`📋 Log level set to: ${level}`);
  }

  setEnabledCategories(categories: LogCategory[]): void {
    this.enabledCategories = categories;
    console.log(`📋 Log categories enabled: ${categories.join(', ')}`);
  }

  setConsoleEnabled(enabled: boolean): void {
    this.consoleEnabled = enabled;
  }

  setCallback(callback: (log: LogEntry) => void): void {
    this.callback = callback;
  }

  private shouldLog(level: LogLevel, category: LogCategory): boolean {
    const levelIndex = this.levelOrder.indexOf(level);
    const minLevelIndex = this.levelOrder.indexOf(this.minLevel);
    return levelIndex >= minLevelIndex && this.enabledCategories.includes(category);
  }

  private createLogEntry(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: any,
    location?: string
  ): LogEntry {
    return {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level,
      category,
      message,
      data,
      location
    };
  }

  private logToConsole(entry: LogEntry): void {
    if (!this.consoleEnabled) return;

    const colors = {
      DEBUG: 'color: #888; background: #333',
      INFO: 'color: #4af; background: #113',
      WARN: 'color: #fa4; background: #320',
      ERROR: 'color: #f44; background: #300',
      FATAL: 'color: #f0f; background: #303',
    };

    const categoryColors = {
      SYSTEM: 'color: #0ff',
      STORE: 'color: #0f0',
      TASK: 'color: #ff0',
      MEMORY: 'color: #f0f',
      NOTIFICATION: 'color: #f00',
      LAYER: 'color: #00f',
      TEST: 'color: #fa0',
    };

    const time = new Date(entry.timestamp).toLocaleTimeString('zh-CN', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    });

    console.log(
      `%c[${time}] %c[${entry.level}] %c[${entry.category}] %c${entry.message}`,
      'color: #aaa',
      colors[entry.level],
      categoryColors[entry.category],
      'color: #fff'
    );

    if (entry.data !== undefined && entry.data !== null) {
      console.log('  Data:', entry.data);
    }

    if (entry.location) {
      console.log(`  Location: ${entry.location}`);
    }
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    
    if (this.logs.length > this.maxLogs) {
      const removeCount = this.logs.length - this.maxLogs;
      this.logs = this.logs.slice(removeCount);
    }

    this.logToConsole(entry);
    
    if (this.callback) {
      this.callback(entry);
    }
  }

  debug(category: LogCategory, message: string, data?: any, location?: string): void {
    if (!this.shouldLog('DEBUG', category)) return;
    const entry = this.createLogEntry('DEBUG', category, message, data, location);
    this.addLog(entry);
  }

  info(category: LogCategory, message: string, data?: any, location?: string): void {
    if (!this.shouldLog('INFO', category)) return;
    const entry = this.createLogEntry('INFO', category, message, data, location);
    this.addLog(entry);
  }

  warn(category: LogCategory, message: string, data?: any, location?: string): void {
    if (!this.shouldLog('WARN', category)) return;
    const entry = this.createLogEntry('WARN', category, message, data, location);
    this.addLog(entry);
  }

  error(category: LogCategory, message: string, data?: any, location?: string): void {
    if (!this.shouldLog('ERROR', category)) return;
    const entry = this.createLogEntry('ERROR', category, message, data, location);
    this.addLog(entry);
  }

  fatal(category: LogCategory, message: string, data?: any, location?: string): void {
    if (!this.shouldLog('FATAL', category)) return;
    const entry = this.createLogEntry('FATAL', category, message, data, location);
    this.addLog(entry);
  }

  getLogs(options?: {
    level?: LogLevel;
    category?: LogCategory;
    limit?: number;
    startTimestamp?: number;
    endTimestamp?: number;
  }): LogEntry[] {
    let filtered = [...this.logs];

    if (options?.level) {
      const minIndex = this.levelOrder.indexOf(options.level);
      filtered = filtered.filter(log => this.levelOrder.indexOf(log.level) >= minIndex);
    }

    if (options?.category) {
      filtered = filtered.filter(log => log.category === options.category);
    }

    if (options?.startTimestamp) {
      filtered = filtered.filter(log => log.timestamp >= options.startTimestamp);
    }

    if (options?.endTimestamp) {
      filtered = filtered.filter(log => log.timestamp <= options.endTimestamp);
    }

    if (options?.limit) {
      filtered = filtered.slice(-options.limit);
    }

    return filtered;
  }

  getLogStats(): {
    total: number;
    byLevel: Record<LogLevel, number>;
    byCategory: Record<LogCategory, number>;
  } {
    const stats = {
      total: this.logs.length,
      byLevel: { DEBUG: 0, INFO: 0, WARN: 0, ERROR: 0, FATAL: 0 },
      byCategory: { SYSTEM: 0, STORE: 0, TASK: 0, MEMORY: 0, NOTIFICATION: 0, LAYER: 0, TEST: 0 }
    };

    this.logs.forEach(log => {
      stats.byLevel[log.level]++;
      stats.byCategory[log.category]++;
    });

    return stats;
  }

  clearLogs(): void {
    this.logs = [];
    console.log('📋 All logs cleared');
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

export const logger = new SystemLogger();
