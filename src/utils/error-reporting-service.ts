export interface ErrorReport {
  id: string
  message: string
  stack?: string
  componentStack?: string
  timestamp: string
  userAgent: string
  url: string
  level: 'error' | 'warning' | 'info'
  context?: Record<string, any>
  userId?: string
  sessionId?: string
  metadata?: {
    componentName?: string
    props?: Record<string, any>
    state?: Record<string, any>
  }
}

export interface ErrorStats {
  totalErrors: number
  errorsByLevel: {
    error: number
    warning: number
    info: number
  }
  topErrors: Array<{
    message: string
    count: number
    lastOccurrence: string
  }>
  errorTrends: Array<{
    date: string
    count: number
  }>
}

export class ErrorReportingService {
  private static instance: ErrorReportingService
  private errors: ErrorReport[] = []
  private readonly maxErrors = 100
  private readonly storageKey = 'mlas_error_reports'

  private constructor() {
    this.loadErrors()
  }

  static getInstance(): ErrorReportingService {
    if (!ErrorReportingService.instance) {
      ErrorReportingService.instance = new ErrorReportingService()
    }
    return ErrorReportingService.instance
  }

  private loadErrors(): void {
    try {
      const stored = localStorage.getItem(this.storageKey)
      if (stored) {
        this.errors = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load error reports:', error)
      this.errors = []
    }
  }

  private saveErrors(): void {
    try {
      const dataToSave = this.errors.slice(0, this.maxErrors)
      localStorage.setItem(this.storageKey, JSON.stringify(dataToSave))
    } catch (error) {
      console.error('Failed to save error reports:', error)
      this.cleanupOldErrors()
    }
  }

  private cleanupOldErrors(): void {
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors)
      this.saveErrors()
    }
  }

  generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  reportError(
    message: string,
    stack?: string,
    options: {
      level?: 'error' | 'warning' | 'info'
      context?: Record<string, any>
      componentStack?: string
      metadata?: ErrorReport['metadata']
    } = {}
  ): string {
    const errorId = this.generateErrorId()

    const report: ErrorReport = {
      id: errorId,
      message,
      stack,
      componentStack: options.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      level: options.level || 'error',
      context: options.context,
      metadata: options.metadata
    }

    this.errors.unshift(report)
    this.cleanupOldErrors()
    this.saveErrors()

    if (process.env.NODE_ENV === 'development') {
      console.error('🔴 Error reported:', report)
    }

    return errorId
  }

  reportWarning(message: string, context?: Record<string, any>): string {
    return this.reportError(message, undefined, { level: 'warning', context })
  }

  reportInfo(message: string, context?: Record<string, any>): string {
    return this.reportError(message, undefined, { level: 'info', context })
  }

  getErrors(limit?: number): ErrorReport[] {
    if (limit) {
      return this.errors.slice(0, limit)
    }
    return [...this.errors]
  }

  getErrorById(id: string): ErrorReport | undefined {
    return this.errors.find(err => err.id === id)
  }

  getStats(): ErrorStats {
    const errorsByLevel = {
      error: this.errors.filter(e => e.level === 'error').length,
      warning: this.errors.filter(e => e.level === 'warning').length,
      info: this.errors.filter(e => e.level === 'info').length
    }

    const errorMessages = new Map<string, { count: number; lastOccurrence: string }>()
    
    this.errors.forEach(err => {
      const key = err.message
      const existing = errorMessages.get(key)
      if (existing) {
        existing.count++
        if (err.timestamp > existing.lastOccurrence) {
          existing.lastOccurrence = err.timestamp
        }
      } else {
        errorMessages.set(key, {
          count: 1,
          lastOccurrence: err.timestamp
        })
      }
    })

    const topErrors = Array.from(errorMessages.entries())
      .map(([message, data]) => ({
        message,
        count: data.count,
        lastOccurrence: data.lastOccurrence
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const errorTrends = this.calculateErrorTrends()

    return {
      totalErrors: this.errors.length,
      errorsByLevel,
      topErrors,
      errorTrends
    }
  }

  private calculateErrorTrends(): ErrorStats['errorTrends'] {
    const days = 7
    const trends: Map<string, number> = new Map()

    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      trends.set(dateStr, 0)
    }

    this.errors.forEach(err => {
      const dateStr = err.timestamp.split('T')[0]
      if (trends.has(dateStr)) {
        trends.set(dateStr, (trends.get(dateStr) || 0) + 1)
      }
    })

    return Array.from(trends.entries())
      .map(([date, count]) => ({ date, count }))
      .reverse()
  }

  clearErrors(): void {
    this.errors = []
    localStorage.removeItem(this.storageKey)
  }

  deleteError(id: string): void {
    this.errors = this.errors.filter(err => err.id !== id)
    this.saveErrors()
  }

  exportErrors(): string {
    return JSON.stringify(this.errors, null, 2)
  }

  importErrors(data: string): number {
    try {
      const imported = JSON.parse(data) as ErrorReport[]
      const validReports = imported.filter(report => 
        report.id && report.message && report.timestamp
      )
      
      this.errors = [...validReports, ...this.errors]
      this.cleanupOldErrors()
      this.saveErrors()
      
      return validReports.length
    } catch (error) {
      console.error('Failed to import error reports:', error)
      return 0
    }
  }

  subscribeToErrors(callback: (error: ErrorReport) => void): () => void {
    const handler = (event: CustomEvent) => {
      callback(event.detail as ErrorReport)
    }
    
    window.addEventListener('mlas-error' as any, handler)
    
    return () => {
      window.removeEventListener('mlas-error' as any, handler)
    }
  }

  notifyError(error: ErrorReport): void {
    window.dispatchEvent(new CustomEvent('mlas-error', { detail: error }))
  }
}

export const errorReporter = ErrorReportingService.getInstance()

export function useErrorReporter() {
  return {
    reportError: (message: string, stack?: string, options?: any) => 
      errorReporter.reportError(message, stack, options),
    reportWarning: (message: string, context?: Record<string, any>) => 
      errorReporter.reportWarning(message, context),
    reportInfo: (message: string, context?: Record<string, any>) => 
      errorReporter.reportInfo(message, context),
    getErrors: (limit?: number) => errorReporter.getErrors(limit),
    getErrorById: (id: string) => errorReporter.getErrorById(id),
    getStats: () => errorReporter.getStats(),
    clearErrors: () => errorReporter.clearErrors(),
    deleteError: (id: string) => errorReporter.deleteError(id),
    exportErrors: () => errorReporter.exportErrors(),
    importErrors: (data: string) => errorReporter.importErrors(data),
  }
}
