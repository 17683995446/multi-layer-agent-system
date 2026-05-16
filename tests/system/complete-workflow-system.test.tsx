import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useTestSystem, testCases } from '@/utils/test-helpers'

describe('System Testing - Complete Workflow Tests', () => {
  describe('End-to-End Task Flow', () => {
    it('should complete a full task lifecycle', async () => {
      const { result } = renderHook(() => useTestSystem())

      const testCase = testCases[0]

      await act(async () => {
        await result.current.runTest(testCase.name, testCase.test)
      })

      expect(result.current.testResults).toHaveLength(1)
      expect(result.current.testResults[0].passed).toBe(true)
      expect(result.current.testResults[0].name).toBe(testCase.name)
    })

    it('should track multiple task results', async () => {
      const { result } = renderHook(() => useTestSystem())

      for (const testCase of testCases) {
        await act(async () => {
          await result.current.runTest(testCase.name, testCase.test)
        })
      }

      expect(result.current.testResults).toHaveLength(testCases.length)
    })

    it('should calculate statistics correctly', async () => {
      const { result } = renderHook(() => useTestSystem())

      for (const testCase of testCases) {
        await act(async () => {
          await result.current.runTest(testCase.name, testCase.test)
        })
      }

      const stats = result.current.getStats()

      expect(stats.total).toBe(testCases.length)
      expect(stats.passed + stats.failed).toBe(stats.total)
      expect(stats.avgDuration).toBeGreaterThan(0)
    })
  })

  describe('System Health Check', () => {
    it('should report healthy status', async () => {
      const { result } = renderHook(() => useTestSystem())

      expect(result.current.isRunning).toBe(false)
      expect(result.current.testResults).toHaveLength(0)
    })
  })

  describe('Result Management', () => {
    it('should clear results', async () => {
      const { result } = renderHook(() => useTestSystem())

      await act(async () => {
        await result.current.runTest(testCases[0].name, testCases[0].test)
      })

      expect(result.current.testResults).toHaveLength(1)

      act(() => {
        result.current.clearResults()
      })

      expect(result.current.testResults).toHaveLength(0)
    })

    it('should handle failed tests', async () => {
      const { result } = renderHook(() => useTestSystem())

      await act(async () => {
        await result.current.runTest('Failing Test', async () => {
          throw new Error('Test failed intentionally')
        })
      })

      expect(result.current.testResults).toHaveLength(1)
      expect(result.current.testResults[0].passed).toBe(false)
      expect(result.current.testResults[0].error).toBeDefined()
    })
  })
})
