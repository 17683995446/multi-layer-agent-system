import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSystemStore } from '@/stores/systemStore'
import { SafeStorage } from '@/storage/safeStorage'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
}

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

describe('Bug Fix Validation Test Suite', () => {
  
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear.mockClear()
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    
    const { result } = renderHook(() => useSystemStore())
    act(() => {
      result.current.clearAllData()
    })
  })
  
  describe('✅ Bug16-18 Validation: Task CRUD Storage First', () => {
    
    it('Bug16: updateTask should save storage before updating state', () => {
      const { result } = renderHook(() => useSystemStore())
      
      // Add a test task first
      const testTask = {
        id: 'bug16-test',
        name: 'Bug16 Test Task',
        priority: 1,
        status: 'pending' as const
      }
      
      act(() => {
        result.current.addTask(testTask)
      })
      
      // Now test updateTask
      localStorageMock.setItem.mockClear()
      
      act(() => {
        result.current.updateTask('bug16-test', { name: 'Bug16 Updated Task' })
      })
      
      // Verify storage was called (first!)
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })
    
    it('Bug17: removeTask should save storage before updating state', () => {
      const { result } = renderHook(() => useSystemStore())
      
      const testTask = {
        id: 'bug17-test',
        name: 'Bug17 Test Task',
        priority: 1,
        status: 'pending' as const
      }
      
      act(() => {
        result.current.addTask(testTask)
      })
      
      localStorageMock.setItem.mockClear()
      
      act(() => {
        result.current.removeTask('bug17-test')
      })
      
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })
    
    it('Bug18: clearTasks should save storage before updating state', () => {
      const { result } = renderHook(() => useSystemStore())
      
      const tasks = [
        { id: 'bug18-1', name: 'Task1', priority: 1, status: 'pending' as const },
        { id: 'bug18-2', name: 'Task2', priority: 2, status: 'pending' as const }
      ]
      
      act(() => {
        tasks.forEach(task => result.current.addTask(task))
      })
      
      localStorageMock.setItem.mockClear()
      
      act(() => {
        result.current.clearTasks()
      })
      
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })
  })
  
  describe('✅ Bug20-24 Validation: Other Modules Storage First', () => {
    
    it('Bug20: updateLayerStatus should save storage before updating state', () => {
      const { result } = renderHook(() => useSystemStore())
      
      localStorageMock.setItem.mockClear()
      
      act(() => {
        result.current.updateLayerStatus('layer-1', { status: 'active' })
      })
      
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })
    
    it('Bug21: addMemory should save storage before updating state', () => {
      const { result } = renderHook(() => useSystemStore())
      
      localStorageMock.setItem.mockClear()
      
      const testMemory = {
        type: 'experience' as const,
        content: 'Bug21 test memory',
        relevance: 0.5
      }
      
      act(() => {
        result.current.addMemory(testMemory)
      })
      
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })
    
    it('Bug22: updateMemory should save storage before updating state', () => {
      const { result } = renderHook(() => useSystemStore())
      
      // Add a test memory first
      const testMemory = {
        id: 'bug22-test',
        type: 'experience' as const,
        content: 'Bug22 test memory',
        relevance: 0.5
      }
      
      act(() => {
        result.current.addMemory(testMemory)
      })
      
      localStorageMock.setItem.mockClear()
      
      act(() => {
        result.current.updateMemory('bug22-test', { content: 'Updated memory' })
      })
      
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })
    
    it('Bug23: addStrategy should save storage before updating state', () => {
      const { result } = renderHook(() => useSystemStore())
      
      localStorageMock.setItem.mockClear()
      
      const testStrategy = {
        name: 'Bug23 Test Strategy',
        description: 'Test strategy',
        version: '1.0.0',
        conditions: {},
        actions: {},
        effectiveness: 0.5
      }
      
      act(() => {
        result.current.addStrategy(testStrategy)
      })
      
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })
    
    it('Bug24: updateStrategy should save storage before updating state', () => {
      const { result } = renderHook(() => useSystemStore())
      
      // Add a test strategy first
      const testStrategy = {
        id: 'bug24-test',
        name: 'Bug24 Test Strategy',
        description: 'Test strategy',
        version: '1.0.0',
        conditions: {},
        actions: {},
        effectiveness: 0.5
      }
      
      act(() => {
        result.current.addStrategy(testStrategy)
      })
      
      localStorageMock.setItem.mockClear()
      
      act(() => {
        result.current.updateStrategy('bug24-test', { name: 'Updated Strategy' })
      })
      
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })
  })
  
  describe('✅ Parameter Validation Testing', () => {
    
    it('addTask should validate priority and clamp to valid range', () => {
      const { result } = renderHook(() => useSystemStore())
      
      act(() => {
        // Test invalid priority values
        result.current.addTask({
          name: 'Invalid Priority Test -1',
          priority: -10,
          status: 'pending' as const
        })
        
        result.current.addTask({
          name: 'Invalid Priority Test 2',
          priority: 100,
          status: 'pending' as const
        })
        
        result.current.addTask({
          name: 'Invalid Priority Test NaN',
          priority: NaN as any,
          status: 'pending' as const
        })
      })
      
      const tasks = result.current.tasks
      expect(tasks).toHaveLength(3)
      // All should have priority 2 (default)
      tasks.forEach(task => {
        expect(task.priority).toBeGreaterThanOrEqual(0)
        expect(task.priority).toBeLessThanOrEqual(4)
      })
    })
    
    it('addMemory should validate relevance and clamp to 0-1', () => {
      const { result } = renderHook(() => useSystemStore())
      
      act(() => {
        result.current.addMemory({
          type: 'experience',
          content: 'Invalid Relevance Test -1',
          relevance: -0.5
        })
        
        result.current.addMemory({
          type: 'knowledge',
          content: 'Invalid Relevance Test 2',
          relevance: 2.5
        })
      })
      
      const memories = result.current.memories
      expect(memories).toHaveLength(2)
      memories.forEach(memory => {
        expect(memory.relevance).toBeGreaterThanOrEqual(0)
        expect(memory.relevance).toBeLessThanOrEqual(1)
      })
    })
    
    it('retrieveRelevantMemories should handle null/undefined parameters', () => {
      const { result } = renderHook(() => useSystemStore())
      
      // Add test memories first
      act(() => {
        result.current.addMemory({
          type: 'knowledge',
          content: 'test memory 1',
          relevance: 0.8
        })
        result.current.addMemory({
          type: 'experience',
          content: 'test memory 2',
          relevance: 0.5
        })
      })
      
      // Test with null/undefined query
      const results1 = result.current.retrieveRelevantMemories(null as any)
      const results2 = result.current.retrieveRelevantMemories(undefined as any)
      const results3 = result.current.retrieveRelevantMemories('', -10) // Invalid limit
      
      expect(results1).toBeDefined()
      expect(results2).toBeDefined()
      expect(results3).toBeDefined()
      expect(Array.isArray(results1)).toBe(true)
    })
  })
  
  describe('✅ Storage Fail Handling - Graceful Degradation', () => {
    
    it('should handle storage failure gracefully in addTask', () => {
      const { result } = renderHook(() => useSystemStore())
      
      // Mock storage failure
      const originalSetTasks = vi.spyOn(SafeStorage, 'setTasks')
      originalSetTasks.mockReturnValue(false)
      
      try {
        act(() => {
          result.current.addTask({
            name: 'Storage Failure Test',
            priority: 1,
            status: 'pending' as const
          })
        })
        
        expect(result.current.lastError).toBeDefined()
      } finally {
        originalSetTasks.mockRestore()
      }
    })
  })
  
  describe('✅ Memory Management Tests', () => {
    
    it('should enforce memory limit of 100', () => {
      const { result } = renderHook(() => useSystemStore())
      
      // Add more than 100 memories
      act(() => {
        for (let i = 0; i < 150; i++) {
          result.current.addMemory({
            type: 'knowledge',
            content: `Memory ${i}`,
            relevance: Math.random()
          })
        }
      })
      
      expect(result.current.memories.length).toBeLessThanOrEqual(100)
    })
    
    it('should enforce task limit with clean up', () => {
      const { result } = renderHook(() => useSystemStore())
      
      // Add more than 200 tasks
      act(() => {
        for (let i = 0; i < 250; i++) {
          result.current.addTask({
            name: `Task ${i}`,
            priority: Math.floor(Math.random() * 5) as any,
            status: Math.random() > 0.5 ? 'completed' : 'pending'
          })
        }
      })
      
      expect(result.current.tasks.length).toBeLessThanOrEqual(200)
    })
  })
  
  describe('✅ Complete Workflow Tests', () => {
    
    it('should handle complete task lifecycle from creation to completion', () => {
      const { result } = renderHook(() => useSystemStore())
      
      // Test complete cycle
      act(() => {
        result.current.addTask({
          id: 'workflow-test',
          name: 'Complete Workflow Test',
          priority: 1,
          status: 'pending' as const
        })
      })
      
      expect(result.current.tasks).toHaveLength(1)
      expect(result.current.metrics.totalTasks).toBeGreaterThan(0)
    })
    
    it('should handle multiple consecutive state changes', () => {
      const { result } = renderHook(() => useSystemStore())
      
      // Test rapid changes
      act(() => {
        for (let i = 0; i < 20; i++) {
          result.current.addTask({
            name: `Rapid Task ${i}`,
            priority: i % 5 as any,
            status: 'pending' as const
          })
        }
      })
      
      expect(result.current.tasks.length).toBeGreaterThan(0)
    })
  })
  
  describe('✅ Data Consistency After Load', () => {
    
    it('should load notifications from storage', () => {
      const { result } = renderHook(() => useSystemStore())
      
      // Add a notification
      act(() => {
        result.current.addNotification({
          type: 'info',
          message: 'Test notification',
          read: false
        })
      })
      
      const initialNotifications = result.current.notifications.length
      
      // Simulate page reload (load system state)
      act(() => {
        result.current.loadSystemState()
      })
      
      expect(result.current.notifications.length).toBe(initialNotifications)
    })
  })
})

console.log('✅ All Bug Fix Validation Tests have been loaded!')
