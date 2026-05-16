import { useState, useCallback, useEffect, useMemo, useRef } from "react"

// ========== TOP 20: 性能监控与分析系统 (10个优化点) ==========

// 性能指标类型
interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: Date
  tags?: Record<string, string>
}

interface MemoryMetric {
  usedJSHeapSize: number
  totalJSHeapSize: number
  jsHeapSizeLimit: number
}

interface NetworkMetric {
  url: string
  duration: number
  status: number
  size: number
  type: string
}

interface ErrorMetric {
  message: string
  stack?: string
  timestamp: Date
  count: number
}

// 优化点 1: 核心性能监控
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private listeners: Set<(metric: PerformanceMetric) => void> = new Set()
  private maxMetrics = 1000

  constructor() {
    if (typeof window !== "undefined") {
      this.setupPerformanceObserver()
    }
  }

  private setupPerformanceObserver() {
    if (typeof PerformanceObserver === "undefined") return

    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === "measure") {
          this.recordMetric({
            name: entry.name,
            value: entry.duration,
            unit: "ms",
            timestamp: new Date(entry.startTime),
          })
        }
      })
    })

    try {
      observer.observe({ entryTypes: ["measure", "navigation", "paint"] })
    } catch (e) {
      console.warn("Performance observer not supported")
    }
  }

  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric)
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift()
    }
    this.listeners.forEach((listener) => listener(metric))
  }

  measureTime(name: string, fn: () => void) {
    const start = performance.now()
    fn()
    const duration = performance.now() - start
    this.recordMetric({
      name,
      value: duration,
      unit: "ms",
      timestamp: new Date(),
    })
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start
      this.recordMetric({
        name,
        value: duration,
        unit: "ms",
        timestamp: new Date(),
      })
      return result
    } catch (error) {
      const duration = performance.now() - start
      this.recordMetric({
        name: `${name}_error`,
        value: duration,
        unit: "ms",
        timestamp: new Date(),
      })
      throw error
    }
  }

  subscribe(listener: (metric: PerformanceMetric) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getMetrics(name?: string, limit?: number) {
    let filtered = this.metrics
    if (name) {
      filtered = filtered.filter((m) => m.name.includes(name))
    }
    if (limit) {
      filtered = filtered.slice(-limit)
    }
    return filtered
  }

  clearMetrics() {
    this.metrics = []
  }

  getAverage(name: string, windowMs?: number) {
    const now = Date.now()
    const filtered = this.metrics.filter((m) => {
      if (m.name !== name) return false
      if (windowMs && now - m.timestamp.getTime() > windowMs) return false
      return true
    })

    if (filtered.length === 0) return 0
    const sum = filtered.reduce((acc, m) => acc + m.value, 0)
    return sum / filtered.length
  }

  getPercentile(name: string, percentile: number) {
    const filtered = this.metrics.filter((m) => m.name === name).sort((a, b) => a.value - b.value)
    if (filtered.length === 0) return 0

    const index = Math.ceil((percentile / 100) * filtered.length) - 1
    return filtered[Math.max(0, index)].value
  }
}

// 优化点 2: 内存监控
export function useMemoryMonitor() {
  const [memory, setMemory] = useState<MemoryMetric | null>(null)

  const updateMemory = useCallback(() => {
    if ((performance as any).memory) {
      const mem = (performance as any).memory
      setMemory({
        usedJSHeapSize: mem.usedJSHeapSize,
        totalJSHeapSize: mem.totalJSHeapSize,
        jsHeapSizeLimit: mem.jsHeapSizeLimit,
      })
    }
  }, [])

  useEffect(() => {
    updateMemory()
    const interval = setInterval(updateMemory, 5000)
    return () => clearInterval(interval)
  }, [updateMemory])

  const getMemoryUsage = useCallback(() => {
    if (!memory) return 0
    return (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
  }, [memory])

  return {
    memory,
    updateMemory,
    getMemoryUsage,
    formatBytes: (bytes: number) => {
      const mb = bytes / (1024 * 1024)
      return `${mb.toFixed(2)} MB`
    },
  }
}

// 优化点 3: FPS 监控
export function useFPSMonitor(targetFPS: number = 60) {
  const [fps, setFPS] = useState(0)
  const [isSlow, setIsSlow] = useState(false)
  const frameCount = useRef(0)
  const lastTime = useRef(performance.now())

  useEffect(() => {
    let animationId: number

    const measureFrame = () => {
      frameCount.current++
      const currentTime = performance.now()
      const elapsed = currentTime - lastTime.current

      if (elapsed >= 1000) {
        const currentFPS = (frameCount.current * 1000) / elapsed
        setFPS(Math.round(currentFPS))
        setIsSlow(currentFPS < targetFPS * 0.8)
        frameCount.current = 0
        lastTime.current = currentTime
      }

      animationId = requestAnimationFrame(measureFrame)
    }

    animationId = requestAnimationFrame(measureFrame)
    return () => cancelAnimationFrame(animationId)
  }, [targetFPS])

  return { fps, isSlow, targetFPS }
}

// 优化点 4: 网络请求监控
export class NetworkMonitor {
  private requests: NetworkMetric[] = []
  private listeners: Set<(request: NetworkMetric) => void> = new Set()
  private xhrOpen: typeof XMLHttpRequest.prototype.open
  private xhrSend: typeof XMLHttpRequest.prototype.send

  constructor() {
    if (typeof window !== "undefined") {
      this.setupXHRInterceptor()
      this.setupFetchInterceptor()
    }
  }

  private setupXHRInterceptor() {
    const originalOpen = XMLHttpRequest.prototype.open
    const originalSend = XMLHttpRequest.prototype.send
    const self = this

    XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL
    ) {
      ;(this as any).__url = url.toString()
      ;(this as any).__startTime = performance.now()
      return originalOpen.apply(this, arguments as any)
    }

    XMLHttpRequest.prototype.send = function (data: any) {
      this.addEventListener("load", function () {
        const duration = performance.now() - (this as any).__startTime
        self.recordRequest({
          url: (this as any).__url,
          duration,
          status: this.status,
          size: parseInt(this.getResponseHeader("Content-Length") || "0"),
          type: "xhr",
        })
      })
      return originalSend.apply(this, arguments as any)
    }
  }

  private setupFetchInterceptor() {
    const originalFetch = window.fetch
    const self = this

    window.fetch = async function (input, init) {
      const url = typeof input === "string" ? input : input.url
      const startTime = performance.now()

      try {
        const response = await originalFetch.apply(this, arguments as any)
        const duration = performance.now() - startTime

        const contentLength = response.headers.get("Content-Length")
        const size = contentLength ? parseInt(contentLength) : 0

        self.recordRequest({
          url,
          duration,
          status: response.status,
          size,
          type: "fetch",
        })

        return response
      } catch (error) {
        const duration = performance.now() - startTime
        self.recordRequest({
          url,
          duration,
          status: 0,
          size: 0,
          type: "fetch",
        })
        throw error
      }
    }
  }

  recordRequest(request: NetworkMetric) {
    this.requests.push(request)
    if (this.requests.length > 500) {
      this.requests.shift()
    }
    this.listeners.forEach((listener) => listener(request))
  }

  subscribe(listener: (request: NetworkMetric) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getRequests(filter?: {
    url?: string
    status?: number
    type?: string
    startTime?: Date
    endTime?: Date
  }) {
    return this.requests.filter((req) => {
      if (filter?.url && !req.url.includes(filter.url)) return false
      if (filter?.status && req.status !== filter.status) return false
      if (filter?.type && req.type !== filter.type) return false
      if (filter?.startTime && req.duration < 0) return false
      return true
    })
  }

  getAverageDuration(filter?: { url?: string; status?: number }) {
    const requests = filter ? this.getRequests(filter) : this.requests
    if (requests.length === 0) return 0
    const sum = requests.reduce((acc, r) => acc + r.duration, 0)
    return sum / requests.length
  }
}

// 优化点 5: 错误追踪
export class ErrorTracker {
  private errors: ErrorMetric[] = []
  private listeners: Set<(error: ErrorMetric) => void> = new Set()
  private errorCounts: Map<string, number> = new Map()

  constructor() {
    if (typeof window !== "undefined") {
      this.setupGlobalHandler()
    }
  }

  private setupGlobalHandler() {
    window.addEventListener("error", (event) => {
      this.recordError({
        message: event.message,
        stack: event.error?.stack,
        timestamp: new Date(),
      })
    })

    window.addEventListener("unhandledrejection", (event) => {
      this.recordError({
        message: event.reason?.message || "Unhandled Promise Rejection",
        stack: event.reason?.stack,
        timestamp: new Date(),
      })
    })
  }

  recordError(error: { message: string; stack?: string; timestamp: Date }) {
    const key = `${error.message}:${error.stack?.split("\n")[1]}`
    const count = (this.errorCounts.get(key) || 0) + 1
    this.errorCounts.set(key, count)

    const metric: ErrorMetric = {
      ...error,
      count,
    }

    this.errors.push(metric)
    if (this.errors.length > 100) {
      this.errors.shift()
    }

    this.listeners.forEach((listener) => listener(metric))
  }

  subscribe(listener: (error: ErrorMetric) => void) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getErrors() {
    return this.errors
  }

  getErrorCount(message: string) {
    return this.errorCounts.get(message) || 0
  }

  clearErrors() {
    this.errors = []
    this.errorCounts.clear()
  }
}

// 优化点 6: React 组件性能追踪
export function useComponentPerformance(componentName: string) {
  const renderCount = useRef(0)
  const lastRenderTime = useRef(Date.now())

  useEffect(() => {
    renderCount.current++
    const now = Date.now()
    const timeSinceLastRender = now - lastRenderTime.current
    lastRenderTime.current = now

    if (timeSinceLastRender > 100) {
      console.warn(
        `[Performance] ${componentName} re-render took ${timeSinceLastRender}ms`
      )
    }
  })

  return {
    renderCount: renderCount.current,
    lastRenderTime: lastRenderTime.current,
  }
}

// 优化点 7: 性能报告生成
export function generatePerformanceReport(
  monitor: PerformanceMonitor,
  networkMonitor: NetworkMonitor,
  errorTracker: ErrorTracker
) {
  const metrics = monitor.getMetrics()
  const networkRequests = networkMonitor.getRequests()
  const errors = errorTracker.getErrors()

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalMetrics: metrics.length,
      totalNetworkRequests: networkRequests.length,
      totalErrors: errors.length,
      averageFPS: 60,
    },
    performance: {
      averageLoadTime: monitor.getAverage("page_load"),
      p50ResponseTime: monitor.getPercentile("api_response", 50),
      p95ResponseTime: monitor.getPercentile("api_response", 95),
      p99ResponseTime: monitor.getPercentile("api_response", 99),
    },
    network: {
      averageRequestDuration: networkMonitor.getAverageDuration(),
      totalRequestSize: networkRequests.reduce((acc, r) => acc + r.size, 0),
      slowestRequests: networkRequests
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5),
    },
    errors: {
      errorRate: errors.length / (metrics.length || 1),
      recentErrors: errors.slice(-10),
      errorTypes: Array.from(
        errors.reduce((acc, e) => {
          acc.set(e.message, (acc.get(e.message) || 0) + 1)
          return acc
        }, new Map<string, number>())
      ),
    },
  }

  return report
}

// 优化点 8: 性能警告系统
export function usePerformanceAlerts() {
  const [alerts, setAlerts] = useState<
    Array<{
      id: string
      type: "warning" | "error" | "info"
      message: string
      timestamp: Date
      metric?: string
    }>
  >([])

  const addAlert = useCallback(
    (
      type: "warning" | "error" | "info",
      message: string,
      metric?: string
    ) => {
      const alert = {
        id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        message,
        timestamp: new Date(),
        metric,
      }
      setAlerts((prev) => [...prev, alert])

      setTimeout(() => {
        setAlerts((prev) => prev.filter((a) => a.id !== alert.id))
      }, 30000)

      return alert.id
    },
    []
  )

  const clearAlerts = useCallback(() => {
    setAlerts([])
  }, [])

  return {
    alerts,
    addAlert,
    clearAlerts,
    hasWarnings: alerts.some((a) => a.type === "warning"),
    hasErrors: alerts.some((a) => a.type === "error"),
  }
}

// 优化点 9: 性能基准测试
export class PerformanceBenchmark {
  private results: Map<string, number[]> = new Map()

  run(name: string, fn: () => void, iterations: number = 100) {
    const durations: number[] = []

    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      fn()
      const duration = performance.now() - start
      durations.push(duration)
    }

    this.results.set(name, durations)

    return {
      name,
      iterations,
      average: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      median: this.percentile(durations, 50),
      p95: this.percentile(durations, 95),
      p99: this.percentile(durations, 99),
    }
  }

  private percentile(arr: number[], p: number): number {
    const sorted = arr.sort((a, b) => a - b)
    const index = Math.ceil((p / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)]
  }

  compare(name1: string, name2: string) {
    const results1 = this.results.get(name1)
    const results2 = this.results.get(name2)

    if (!results1 || !results2) {
      throw new Error("Benchmark results not found")
    }

    const avg1 = results1.reduce((a, b) => a + b, 0) / results1.length
    const avg2 = results2.reduce((a, b) => a + b, 0) / results2.length

    return {
      faster: avg1 < avg2 ? name1 : name2,
      improvement: Math.abs((avg2 - avg1) / avg2) * 100,
    }
  }

  getResults() {
    return Array.from(this.results.entries()).map(([name, durations]) => ({
      name,
      average: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
    }))
  }
}

// 优化点 10: 性能历史趋势
export function usePerformanceHistory(maxDataPoints: number = 100) {
  const [history, setHistory] = useState<
    Array<{
      timestamp: Date
      metrics: {
        fps: number
        memory: number
        renderTime: number
      }
    }>
  >([])

  const addDataPoint = useCallback(
    (data: { fps: number; memory: number; renderTime: number }) => {
      setHistory((prev) => {
        const newHistory = [
          ...prev,
          { timestamp: new Date(), metrics: data },
        ]
        if (newHistory.length > maxDataPoints) {
          return newHistory.slice(-maxDataPoints)
        }
        return newHistory
      })
    },
    [maxDataPoints]
  )

  const getTrend = useCallback(
    (metric: "fps" | "memory" | "renderTime") => {
      if (history.length < 2) return "stable"

      const recent = history.slice(-10)
      const older = history.slice(-20, -10)

      if (recent.length === 0 || older.length === 0) return "stable"

      const recentAvg =
        recent.reduce((acc, h) => acc + h.metrics[metric], 0) / recent.length
      const olderAvg =
        older.reduce((acc, h) => acc + h.metrics[metric], 0) / older.length

      const diff = ((recentAvg - olderAvg) / olderAvg) * 100

      if (diff > 10) return "increasing"
      if (diff < -10) return "decreasing"
      return "stable"
    },
    [history]
  )

  return {
    history,
    addDataPoint,
    getTrend,
    clearHistory: () => setHistory([]),
  }
}

// 创建全局性能监控实例
export const performanceMonitor = new PerformanceMonitor()
export const networkMonitor = new NetworkMonitor()
export const errorTracker = new ErrorTracker()
