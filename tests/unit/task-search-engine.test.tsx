import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTaskSearch, TaskSearchEngine, highlightMatches } from '@/utils/task-search-engine'

const mockTasks: Task[] = [
  { id: '1', name: 'Task One', status: 'pending', priority: 1, tags: ['urgent', 'work'] },
  { id: '2', name: 'Task Two', status: 'running', priority: 2, tags: ['normal'] },
  { id: '3', name: 'Task Three', status: 'completed', priority: 3, tags: ['done'] },
  { id: '4', name: 'Important Task', status: 'pending', priority: 1, tags: ['urgent'] }
]

describe('TaskSearchEngine Tests', () => {
  let engine: TaskSearchEngine<Task>

  beforeEach(() => {
    engine = new TaskSearchEngine<Task>()
    engine.indexTasks(mockTasks)
  })

  describe('Basic Search', () => {
    it('should search by exact name', () => {
      const results = engine.search('Task One')

      expect(results).toHaveLength(1)
      expect(results[0].item.name).toBe('Task One')
    })

    it('should search by partial name', () => {
      const results = engine.search('Task')

      expect(results.length).toBeGreaterThan(0)
      expect(results.some(r => r.item.name.includes('Task'))).toBe(true)
    })

    it('should search by tag', () => {
      const results = engine.search('urgent')

      expect(results.length).toBeGreaterThan(0)
      expect(results.every(r => r.item.tags?.includes('urgent'))).toBe(true)
    })
  })

  describe('Search Options', () => {
    it('should support case sensitive search', () => {
      const results = engine.search('task', { caseSensitive: true })
      expect(results.length).toBe(0)
    })

    it('should support custom search fields', () => {
      const results = engine.search('urgent', { searchFields: ['tags'] })
      expect(results.length).toBeGreaterThan(0)
    })
  })

  describe('Sorting', () => {
    it('should sort by priority', () => {
      const results = engine.search('', { sortBy: 'priority', sortOrder: 'asc' })
      expect(results[0].item.priority).toBe(1)
    })
  })
})

describe('useTaskSearch Tests', () => {
  it('should use hook', () => {
    const { result } = renderHook(() => useTaskSearch(mockTasks))

    expect(result.current.searchQuery).toBe('')
    expect(result.current.searchResults).toBeDefined()
  })

  it('should update search query', () => {
    const { result } = renderHook(() => useTaskSearch(mockTasks))

    act(() => {
      result.current.updateSearchQuery('Task')
    })

    expect(result.current.searchQuery).toBe('Task')
  })
})

describe('Highlight Matches', () => {
  it('should highlight matching text', () => {
    const result = highlightMatches('Task One', 'Task')
    expect(result).toBeDefined()
  })

  it('should return original text when no match', () => {
    const result = highlightMatches('Task One', '')
    expect(result).toBe('Task One')
  })
})
