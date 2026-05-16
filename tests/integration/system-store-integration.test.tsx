import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSystemStore } from '@/stores/systemStore'
import { Task } from '@/types'

describe('System Store Integration Tests', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useSystemStore())
    act(() => {
      localStorage.clear()
      result.current.tasks.forEach(task => {
        result.current.removeTask(task.id)
      })
    })
  })

  describe('Task Management Integration', () => {
    it('should add task and update state correctly', async () => {
      const { result } = renderHook(() => useSystemStore())

      const newTask: Task = {
        id: 'test-1',
        name: 'Test Task',
        status: 'pending',
        priority: 1,
        createdAt: Date.now(),
        layerId: 'layer-1',
        result: undefined,
      }

      act(() => {
        result.current.addTask(newTask)
      })

      expect(result.current.tasks).toContain(newTask)
      expect(result.current.tasks).toHaveLength(1)
    })

    it('should update task status correctly', async () => {
      const { result } = renderHook(() => useSystemStore())

      const task: Task = {
        id: 'test-2',
        name: 'Test Task 2',
        status: 'pending',
        priority: 1,
        createdAt: Date.now(),
        layerId: 'layer-1',
        result: undefined,
      }

      act(() => {
        result.current.addTask(task)
        result.current.updateTask('test-2', { status: 'running', executedAt: Date.now() })
      })

      const updatedTask = result.current.tasks.find(t => t.id === 'test-2')
      expect(updatedTask?.status).toBe('running')
      expect(updatedTask?.executedAt).toBeDefined()
    })

    it('should remove task correctly', async () => {
      const { result } = renderHook(() => useSystemStore())

      const task: Task = {
        id: 'test-3',
        name: 'Test Task 3',
        status: 'pending',
        priority: 1,
        createdAt: Date.now(),
        layerId: 'layer-1',
        result: undefined,
      }

      act(() => {
        result.current.addTask(task)
        result.current.removeTask('test-3')
      })

      expect(result.current.tasks).toHaveLength(0)
    })

    it('should clear all tasks correctly', async () => {
      const { result } = renderHook(() => useSystemStore())

      const tasks: Task[] = [
        {
          id: 'test-4',
          name: 'Task 4',
          status: 'pending',
          priority: 1,
          createdAt: Date.now(),
          layerId: 'layer-1',
          result: undefined,
        },
        {
          id: 'test-5',
          name: 'Task 5',
          status: 'pending',
          priority: 2,
          createdAt: Date.now(),
          layerId: 'layer-1',
          result: undefined,
        },
      ]

      act(() => {
        tasks.forEach(task => result.current.addTask(task))
        result.current.clearTasks()
      })

      expect(result.current.tasks).toHaveLength(0)
    })
  })

  describe('Mode Switching Integration', () => {
    it('should switch from work to idle mode', async () => {
      const { result } = renderHook(() => useSystemStore())

      act(() => {
        result.current.setMode('work')
      })

      expect(result.current.mode).toBe('work')

      act(() => {
        result.current.setMode('idle')
      })

      expect(result.current.mode).toBe('idle')
    })

    it('should switch from idle to work mode', async () => {
      const { result } = renderHook(() => useSystemStore())

      act(() => {
        result.current.setMode('idle')
      })

      expect(result.current.mode).toBe('idle')

      act(() => {
        result.current.setMode('work')
      })

      expect(result.current.mode).toBe('work')
    })
  })

  describe('Metrics Tracking Integration', () => {
    it('should update total tasks count', async () => {
      const { result } = renderHook(() => useSystemStore())

      const initialCount = result.current.metrics.totalTasks

      act(() => {
        result.current.updateMetrics({
          totalTasks: initialCount + 1,
        })
      })

      expect(result.current.metrics.totalTasks).toBe(initialCount + 1)
    })

    it('should update success rate correctly', async () => {
      const { result } = renderHook(() => useSystemStore())

      act(() => {
        result.current.updateMetrics({
          successRate: 0.95,
        })
      })

      expect(result.current.metrics.successRate).toBe(0.95)
    })
  })
})
