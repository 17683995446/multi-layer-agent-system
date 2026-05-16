import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  performanceBenchmark,
  measureFunctionPerformance,
  createMemorySnapshot,
  measureAsyncFunctionPerformance
} from '@/utils/performance-benchmark'

describe('PerformanceBenchmark Tests', () => {
  beforeEach(() => {
    performanceBenchmark.clear()
  })

  describe('Benchmark Registration', () => {
    it('should register a benchmark', () => {
      const fn = vi.fn(() => {})
      performanceBenchmark.register('test', fn)
    })

    it('should run registered benchmark', async () => {
      let counter = 0
      performanceBenchmark.register('counter', () => {
        counter++
      })

      const result = await performanceBenchmark.run('counter', { iterations: 5 })

      expect(result).toBeDefined()
      expect(result.name).toBe('counter')
      expect(result.iterations).toBe(5)
    })
  })

  describe('Benchmark Results', () => {
    it('should calculate average time', async () => {
      performanceBenchmark.register('slow', () => {
        const start = Date.now()
        while (Date.now() - start < 1) {}
      })

      const result = await performanceBenchmark.run('slow', { iterations: 3 })

      expect(result.averageTime).toBeGreaterThan(0)
    })

    it('should calculate ops per second', async () => {
      performanceBenchmark.register('fast', () => {})

      const result = await performanceBenchmark.run('fast', { iterations: 100 })

      expect(result.opsPerSecond).toBeGreaterThan(0)
    })

    it('should track min and max time', async () => {
      performanceBenchmark.register('variable', () => {
        const delay = Math.random() * 5
        const start = Date.now()
        while (Date.now() - start < delay) {}
      })

      const result = await performanceBenchmark.run('variable', { iterations: 10 })

      expect(result.minTime).toBeGreaterThanOrEqual(0)
      expect(result.maxTime).toBeGreaterThanOrEqual(result.minTime)
    })
  })

  describe('Benchmark Management', () => {
    it('should get result by name', async () => {
      performanceBenchmark.register('test', () => {})
      await performanceBenchmark.run('test', { iterations: 1 })

      const result = performanceBenchmark.getResult('test')
      expect(result).toBeDefined()
    })

    it('should get all results', async () => {
      performanceBenchmark.register('test1', () => {})
      performanceBenchmark.register('test2', () => {})
      await performanceBenchmark.run('test1', { iterations: 1 })
      await performanceBenchmark.run('test2', { iterations: 1 })

      const results = performanceBenchmark.getAllResults()
      expect(results.length).toBe(2)
    })

    it('should clear results', async () => {
      performanceBenchmark.register('test', () => {})
      await performanceBenchmark.run('test', { iterations: 1 })
      performanceBenchmark.clear()

      const results = performanceBenchmark.getAllResults()
      expect(results.length).toBe(0)
    })
  })

  describe('Report Generation', () => {
    it('should generate report', async () => {
      performanceBenchmark.register('test', () => {})
      await performanceBenchmark.run('test', { iterations: 1 })

      const report = performanceBenchmark.report()
      expect(report).toContain('Benchmark: test')
    })
  })

  describe('Benchmark Comparison', () => {
    it('should compare two benchmarks', async () => {
      performanceBenchmark.register('fast', () => {})
      performanceBenchmark.register('slow', () => {
        const start = Date.now()
        while (Date.now() - start < 10) {}
      })

      await performanceBenchmark.run('fast', { iterations: 1 })
      await performanceBenchmark.run('slow', { iterations: 1 })

      const comparison = performanceBenchmark.compare('fast', 'slow')
      expect(comparison).toBeDefined()
      expect(comparison?.faster).toBe('fast')
    })
  })

  describe('Measure Function Performance', () => {
    it('should measure synchronous function', () => {
      const fn = (x: number) => x * 2
      const { result, duration } = measureFunctionPerformance(fn, 5)

      expect(result).toBe(10)
      expect(duration).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Memory Snapshot', () => {
    it('should create memory snapshot', () => {
      const snapshot = createMemorySnapshot()
      expect(snapshot).toBeDefined()
    })
  })
})
