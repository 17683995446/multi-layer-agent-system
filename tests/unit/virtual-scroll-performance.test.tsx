import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSystemStore } from '@/stores/systemStore'
import { Task } from '@/types'

describe('Virtual Scroll Performance Tests', () => {
  beforeEach(() => {
    localStorage.clear()
    const { result } = renderHook(() => useSystemStore())
    act(() => {
      result.current.tasks.forEach(task => {
        result.current.removeTask(task.id)
      })
    })
  })

  describe('Large Dataset Handling', () => {
    it('should handle 500 tasks efficiently for virtual scroll', () => {
      const { result } = renderHook(() => useSystemStore())

      const startTime = performance.now()

      const largeTasks: Task[] = Array.from({ length: 500 }, (_, i) => ({
        id: `virtual-task-${i}`,
        name: `Virtual Task ${i}`,
        status: 'pending' as const,
        priority: Math.floor(Math.random() * 4),
        createdAt: Date.now(),
        layerId: `layer-${i % 6}`,
        result: undefined,
      }))

      act(() => {
        largeTasks.forEach(task => {
          result.current.addTask(task)
        })
      })

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(result.current.tasks.length).toBe(500)
      expect(duration).toBeLessThan(2000)
    })

    it('should handle 1000 tasks efficiently', () => {
      const { result } = renderHook(() => useSystemStore())

      const startTime = performance.now()

      const veryLargeTasks: Task[] = Array.from({ length: 1000 }, (_, i) => ({
        id: `very-large-task-${i}`,
        name: `Large Task ${i}`,
        status: 'pending' as const,
        priority: Math.floor(Math.random() * 4),
        createdAt: Date.now(),
        layerId: `layer-${i % 6}`,
        result: undefined,
      }))

      act(() => {
        veryLargeTasks.forEach(task => {
          result.current.addTask(task)
        })
      })

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(result.current.tasks.length).toBe(1000)
      expect(duration).toBeLessThan(3000)
    })
  })

  describe('Rendering Efficiency', () => {
    it('should maintain performance with complex task data', () => {
      const { result } = renderHook(() => useSystemStore())

      const complexTasks: Task[] = Array.from({ length: 200 }, (_, i) => ({
        id: `complex-task-${i}`,
        name: `Complex Task ${i} with long description`,
        status: 'pending' as const,
        priority: Math.floor(Math.random() * 4),
        createdAt: Date.now(),
        layerId: `layer-${i % 6}`,
        result: {
          metadata: {
            description: `Task ${i}`,
            tags: ['test', 'complex'],
            count: i,
          }
        },
      }))

      const startTime = performance.now()

      act(() => {
        complexTasks.forEach(task => {
          result.current.addTask(task)
        })
      })

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(result.current.tasks.length).toBe(200)
      expect(duration).toBeLessThan(1500)
    })

    it('should handle rapid task updates efficiently', () => {
      const { result } = renderHook(() => useSystemStore())

      const tasks: Task[] = Array.from({ length: 100 }, (_, i) => ({
        id: `update-task-${i}`,
        name: `Update Task ${i}`,
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

      const startTime = performance.now()

      for (let i = 0; i < 30; i++) {
        act(() => {
          result.current.updateTask(`update-task-${i % 100}`, {
            status: i % 2 === 0 ? 'running' : 'pending',
            executedAt: Date.now(),
          })
        })
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(500)
    })
  })

  describe('Memory Efficiency', () => {
    it('should not leak memory with repeated operations', () => {
      const { result } = renderHook(() => useSystemStore())

      for (let round = 0; round < 3; round++) {
        const tasks: Task[] = Array.from({ length: 200 }, (_, i) => ({
          id: `memory-test-${round}-${i}`,
          name: `Memory Test ${round}-${i}`,
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
  })

  describe('Scroll State Management', () => {
    it('should maintain state with task additions and removals', () => {
      const { result } = renderHook(() => useSystemStore())

      for (let i = 0; i < 100; i++) {
        act(() => {
          result.current.addTask({
            id: `scroll-test-${i}`,
            name: `Scroll Test ${i}`,
            status: 'pending',
            priority: 2,
            createdAt: Date.now(),
            layerId: 'layer-1',
            result: undefined,
          })
        })

        if (i % 10 === 0 && i > 0) {
          act(() => {
            result.current.removeTask(`scroll-test-${i - 5}`)
          })
        }
      }

      expect(result.current.tasks.length).toBeGreaterThan(50)
      expect(result.current.tasks.length).toBeLessThan(100)
    })
  })
})
