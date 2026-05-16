import { useState, useCallback } from 'react'

export interface BenchmarkResult {
  name: string
  iterations: number
  totalTime: number
  averageTime: number
  minTime: number
  maxTime: number
  opsPerSecond: number
  memoryUsage?: {
    before: number
    after: number
    delta: number
  }
}

export interface BenchmarkOptions {
  iterations?: number
  warmup?: number
  async?: boolean
  measureMemory?: boolean
}

class PerformanceBenchmark {
  private static instance: PerformanceBenchmark
  private results: Map<string, BenchmarkResult> = new Map()
  private benchmarks: Map<string, () => void | Promise<void>> = new Map()

  static getInstance(): PerformanceBenchmark {
    if (!PerformanceBenchmark.instance) {
      PerformanceBenchmark.instance = new PerformanceBenchmark()
    }
    return PerformanceBenchmark.instance
  }

  register(name: string, fn: () => void | Promise<void>): void {
    this.benchmarks.set(name, fn)
  }

  async run(name: string, options: BenchmarkOptions = {}): Promise<BenchmarkResult> {
    const iterations = options.iterations || 100
    const warmup = options.warmup || 10
    const fn = this.benchmarks.get(name)

    if (!fn) {
      throw new Error(`Benchmark "${name}" not found`)
    }

    for (let i = 0; i < warmup; i++) {
      await fn()
    }

    const memoryBefore = options.measureMemory ? this.getMemoryUsage() : undefined
    const times: number[] = []

    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      await fn()
      const end = performance.now()
      times.push(end - start)
    }

    const memoryAfter = options.measureMemory ? this.getMemoryUsage() : undefined

    const result: BenchmarkResult = {
      name,
      iterations,
      totalTime: times.reduce((a, b) => a + b, 0),
      averageTime: times.reduce((a, b) => a + b, 0) / iterations,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      opsPerSecond: (iterations / times.reduce((a, b) => a + b, 0)) * 1000,
      memoryUsage:
        memoryBefore && memoryAfter
          ? {
              before: memoryBefore,
              after: memoryAfter,
              delta: memoryAfter - memoryBefore
            }
          : undefined
    }

    this.results.set(name, result)
    return result
  }

  async runAll(options: BenchmarkOptions = {}): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = []
    for (const name of this.benchmarks.keys()) {
      const result = await this.run(name, options)
      results.push(result)
    }
    return results
  }

  getResult(name: string): BenchmarkResult | undefined {
    return this.results.get(name)
  }

  getAllResults(): BenchmarkResult[] {
    return Array.from(this.results.values())
  }

  clear(): void {
    this.results.clear()
  }

  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory.usedJSHeapSize
    }
    return 0
  }

  report(): string {
    const results = this.getAllResults()
    if (results.length === 0) return 'No benchmark results'

    const lines = ['\n=== Performance Benchmark Results ===\n']

    results.forEach(result => {
      lines.push(`Benchmark: ${result.name}`)
      lines.push(`  Iterations: ${result.iterations}`)
      lines.push(`  Average Time: ${result.averageTime.toFixed(3)}ms`)
      lines.push(`  Min Time: ${result.minTime.toFixed(3)}ms`)
      lines.push(`  Max Time: ${result.maxTime.toFixed(3)}ms`)
      lines.push(`  Ops/Second: ${result.opsPerSecond.toFixed(2)}`)

      if (result.memoryUsage) {
        lines.push(
          `  Memory Delta: ${(result.memoryUsage.delta / 1024 / 1024).toFixed(2)}MB`
        )
      }

      lines.push('')
    })

    return lines.join('\n')
  }

  compare(benchmark1: string, benchmark2: string): {
    faster: string
    percentage: number
  } | null {
    const result1 = this.results.get(benchmark1)
    const result2 = this.results.get(benchmark2)

    if (!result1 || !result2) return null

    const faster = result1.averageTime < result2.averageTime ? benchmark1 : benchmark2
    const slower = faster === benchmark1 ? benchmark2 : benchmark1
    const fasterTime =
      faster === benchmark1 ? result1.averageTime : result2.averageTime
    const slowerTime =
      slower === benchmark1 ? result1.averageTime : result2.averageTime

    const percentage = ((slowerTime - fasterTime) / slowerTime) * 100

    return { faster, percentage }
  }
}

export const performanceBenchmark = PerformanceBenchmark.getInstance()

export function usePerformanceBenchmark(name: string) {
  const [result, setResult] = useState<BenchmarkResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  const run = useCallback(
    async (fn: () => void | Promise<void>, options?: BenchmarkOptions) => {
      setIsRunning(true)
      performanceBenchmark.register(name, fn)
      const benchmarkResult = await performanceBenchmark.run(name, options)
      setResult(benchmarkResult)
      setIsRunning(false)
      return benchmarkResult
    },
    [name]
  )

  return { result, isRunning, run }
}

export function measureFunctionPerformance<T extends (...args: any[]) => any>(
  fn: T,
  ...args: Parameters<T>
): {
  result: ReturnType<T>
  duration: number
} {
  const start = performance.now()
  const result = fn(...args)
  const duration = performance.now() - start

  return { result, duration }
}

export async function measureAsyncFunctionPerformance<
  T extends (...args: any[]) => Promise<any>
>(
  fn: T,
  ...args: Parameters<T>
): Promise<{
  result: Awaited<ReturnType<T>>
  duration: number
}> {
  const start = performance.now()
  const result = await fn(...args)
  const duration = performance.now() - start

  return { result, duration }
}

export function createMemorySnapshot(): {
  jsHeapSize: number
  totalHeapSize: number
  heapSizeLimit: number
} | null {
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory
    return {
      jsHeapSize: memory.usedJSHeapSize,
      totalHeapSize: memory.totalJSHeapSize,
      heapSizeLimit: memory.jsHeapSizeLimit
    }
  }
  return null
}

export function calculateMemoryGrowth(
  snapshot1: ReturnType<typeof createMemorySnapshot>,
  snapshot2: ReturnType<typeof createMemorySnapshot>
): {
  growth: number
  percentage: number
} | null {
  if (!snapshot1 || !snapshot2) return null

  const growth = snapshot2.jsHeapSize - snapshot1.jsHeapSize
  const percentage = (growth / snapshot1.jsHeapSize) * 100

  return { growth, percentage }
}
