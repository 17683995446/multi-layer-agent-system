import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSystemStore } from '@/stores/systemStore'
import { Task } from '@/types'

describe('Performance Benchmark Tests', () => {
  beforeEach(() => {
    localStorage.clear()
    const { result } = renderHook(() => useSystemStore())
    act(() => {
      result.current.tasks.forEach(task => {
        result.current.removeTask(task.id)
      })
    })
  })

  describe('Large Scale Task Operations', () => {
    it('should handle 100 tasks efficiently', () => {
      const { result } = renderHook(() => useSystemStore())

      const startTime = performance.now()

      const tasks: Task[] = Array.from({ length: 100 }, (_, i) => ({
        id: `perf-task-${i}`,
        name: `Performance Task ${i}`,
        status: 'pending' as const,
        priority: Math.floor(Math.random() * 4),
        createdAt: Date.now(),
        layerId: `layer-${i % 6}`,
        result: undefined,
      }))

      act(() => {
        tasks.forEach(task => {
          result.current.addTask(task)
        })
      })

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(result.current.tasks.length).toBe(100)
      expect(duration).toBeLessThan(1000)
    })

    it('should handle rapid task updates efficiently', () => {
      const { result } = renderHook(() => useSystemStore())

      const task: Task = {
        id: 'rapid-update',
        name: 'Rapid Update Task',
        status: 'pending',
        priority: 2,
        createdAt: Date.now(),
        layerId: 'layer-1',
        result: undefined,
      }

      act(() => {
        result.current.addTask(task)
      })

      const startTime = performance.now()

      for (let i = 0; i < 50; i++) {
        act(() => {
          result.current.updateTask('rapid-update', {
            status: i % 2 === 0 ? 'running' : 'pending',
            executedAt: Date.now(),
          })
        })
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(500)
    })

    it('should handle bulk task removal efficiently', () => {
      const { result } = renderHook(() => useSystemStore())

      const tasks: Task[] = Array.from({ length: 100 }, (_, i) => ({
        id: `bulk-task-${i}`,
        name: `Bulk Task ${i}`,
        status: 'pending' as const,
        priority: 2,
        createdAt: Date.now(),
        layerId: 'layer-1',
        result: undefined,
      }))

      act(() => {
        tasks.forEach(task => {
          result.current.addTask(task)
        })
      })

      expect(result.current.tasks.length).toBe(100)

      const startTime = performance.now()

      act(() => {
        result.current.clearTasks()
      })

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(result.current.tasks.length).toBe(0)
      expect(duration).toBeLessThan(500)
    })
  })

  describe('Memory Usage Optimization', () => {
    it('should not leak memory on repeated operations', () => {
      const { result } = renderHook(() => useSystemStore())

      for (let round = 0; round < 5; round++) {
        const tasks: Task[] = Array.from({ length: 50 }, (_, i) => ({
          id: `memory-task-${round}-${i}`,
          name: `Memory Task ${round}-${i}`,
          status: 'pending' as const,
          priority: 2,
          createdAt: Date.now(),
          layerId: 'layer-1',
          result: undefined,
        }))

        act(() => {
          tasks.forEach(task => {
            result.current.addTask(task)
          })
        })

        act(() => {
          result.current.clearTasks()
        })
      }

      expect(result.current.tasks.length).toBe(0)
    })

    it('should handle moderate result objects efficiently', () => {
      const { result } = renderHook(() => useSystemStore())

      const moderateResultTask: Task = {
        id: 'moderate-result',
        name: 'Moderate Result Task',
        status: 'pending',
        priority: 2,
        createdAt: Date.now(),
        layerId: 'layer-1',
        result: {
          data: Array.from({ length: 100 }, (_, i) => ({
            id: i,
            value: `value-${i}`,
          }))
        },
      }

      act(() => {
        result.current.addTask(moderateResultTask)
      })

      expect(result.current.tasks).toHaveLength(1)
      expect(result.current.tasks[0].result.data).toHaveLength(100)
    })
  })

  describe('Rendering Performance', () => {
    it('should update metrics efficiently', () => {
      const { result } = renderHook(() => useSystemStore())

      const startTime = performance.now()

      for (let i = 0; i < 50; i++) {
        act(() => {
          result.current.updateMetrics({
            totalTasks: i,
            successRate: i / 100,
          })
        })
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(result.current.metrics.totalTasks).toBe(49)
      expect(duration).toBeLessThan(200)
    })

    it('should handle layer updates efficiently', () => {
      const { result } = renderHook(() => useSystemStore())

      const startTime = performance.now()

      for (let i = 0; i < 25; i++) {
        act(() => {
          result.current.updateLayerStatus(1, {
            status: i % 2 === 0 ? 'active' : 'idle',
          })
        })
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(300)
    })
  })

  describe('Mode Switching Performance', () => {
    it('should switch modes rapidly without delay', () => {
      const { result } = renderHook(() => useSystemStore())

      const startTime = performance.now()

      for (let i = 0; i < 100; i++) {
        act(() => {
          result.current.setMode(i % 2 === 0 ? 'work' : 'idle')
        })
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(100)
    })
  })

  describe('Task Status Transitions', () => {
    it('should handle multiple status transitions', () => {
      const { result } = renderHook(() => useSystemStore())

      const task: Task = {
        id: 'status-transition',
        name: 'Status Transition Task',
        status: 'pending',
        priority: 2,
        createdAt: Date.now(),
        layerId: 'layer-1',
        result: undefined,
      }

      act(() => {
        result.current.addTask(task)
      })

      const transitions = [
        { status: 'running', executedAt: Date.now() },
        { status: 'completed', completedAt: Date.now(), duration: 1000 },
        { status: 'failed' },
      ]

      transitions.forEach(transition => {
        act(() => {
          result.current.updateTask('status-transition', transition)
        })
      })

      const finalTask = result.current.tasks.find(t => t.id === 'status-transition')
      expect(finalTask?.status).toBe('failed')
    })
  })

  describe('Concurrent Operations', () => {
    it('should handle concurrent adds and removes', () => {
      const { result } = renderHook(() => useSystemStore())

      for (let i = 0; i < 20; i++) {
        act(() => {
          result.current.addTask({
            id: `concurrent-${i}`,
            name: `Concurrent Task ${i}`,
            status: 'pending',
            priority: 2,
            createdAt: Date.now(),
            layerId: 'layer-1',
            result: undefined,
          })
        })

        if (i % 2 === 0 && i > 0) {
          act(() => {
            result.current.removeTask(`concurrent-${i - 1}`)
          })
        }
      }

      expect(result.current.tasks.length).toBeGreaterThan(0)
    })
  })
})
