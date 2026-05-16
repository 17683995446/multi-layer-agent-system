import { useState, useMemo, useCallback } from 'react'

export interface Task {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  priority?: number
  tags?: string[]
  createdAt?: Date
  updatedAt?: Date
  metadata?: Record<string, any>
}

export interface SearchOptions {
  caseSensitive?: boolean
  fuzzyMatch?: boolean
  searchFields?: string[]
  sortBy?: 'name' | 'status' | 'priority' | 'createdAt' | 'updatedAt'
  sortOrder?: 'asc' | 'desc'
}

export interface FilterOptions {
  status?: Task['status'][]
  priority?: number[]
  tags?: string[]
  dateRange?: {
    start?: Date
    end?: Date
  }
}

export interface SearchResult<T> {
  item: T
  score: number
  matches: Array<{
    field: string
    indices: Array<[number, number]>
  }>
}

export class TaskSearchEngine<T extends Task = Task> {
  private index: Map<string, T> = new Map()

  indexTasks(tasks: T[]): void {
    this.index.clear()
    tasks.forEach(task => {
      this.index.set(task.id, task)
    })
  }

  search(query: string, options: SearchOptions = {}): SearchResult<T>[] {
    if (!query.trim()) {
      return Array.from(this.index.values()).map(item => ({
        item,
        score: 0,
        matches: []
      }))
    }

    const results: SearchResult<T>[] = []
    const searchFields = options.searchFields || ['name', 'tags']

    this.index.forEach(task => {
      const score = this.calculateScore(task, query, searchFields, options)
      if (score > 0) {
        results.push({
          item: task,
          score,
          matches: this.findMatches(task, query, searchFields, options)
        })
      }
    })

    return this.sortResults(results, options)
  }

  private calculateScore(
    task: T,
    query: string,
    fields: string[],
    options: SearchOptions
  ): number {
    let score = 0
    const q = options.caseSensitive ? query : query.toLowerCase()

    fields.forEach(field => {
      const value = this.getFieldValue(task, field)
      if (typeof value === 'string') {
        const v = options.caseSensitive ? value : value.toLowerCase()
        if (v === q) score += 100
        else if (v.startsWith(q)) score += 50
        else if (v.includes(q)) score += 20
      } else if (Array.isArray(value)) {
        value.forEach(item => {
          if (typeof item === 'string') {
            const v = options.caseSensitive ? item : item.toLowerCase()
            if (v === q) score += 100
            else if (v.includes(q)) score += 20
          }
        })
      }
    })

    return score
  }

  private getFieldValue(task: T, field: string): any {
    const fields = field.split('.')
    let value: any = task
    for (const f of fields) {
      value = value?.[f]
    }
    return value
  }

  private findMatches(
    task: T,
    query: string,
    fields: string[],
    options: SearchOptions
  ): Array<{ field: string; indices: Array<[number, number]> }> {
    const matches: Array<{ field: string; indices: Array<[number, number]> }> = []
    const q = options.caseSensitive ? query : query.toLowerCase()

    fields.forEach(field => {
      const value = this.getFieldValue(task, field)
      if (typeof value === 'string') {
        const v = options.caseSensitive ? value : value.toLowerCase()
        const idx = v.indexOf(q)
        if (idx !== -1) {
          matches.push({
            field,
            indices: [[idx, idx + q.length - 1]]
          })
        }
      }
    })

    return matches
  }

  private sortResults(
    results: SearchResult<T>[],
    options: SearchOptions
  ): SearchResult<T>[] {
    const { sortBy = 'score', sortOrder = 'desc' } = options

    return results.sort((a, b) => {
      let comparison = 0
      if (sortBy === 'score') {
        comparison = b.score - a.score
      } else {
        const aVal = a.item[sortBy as keyof T]
        const bVal = b.item[sortBy as keyof T]
        if (aVal < bVal) comparison = -1
        else if (aVal > bVal) comparison = 1
      }

      return sortOrder === 'desc' ? comparison : -comparison
    })
  }
}

export function useTaskSearch<T extends Task = Task>(tasks: T[]) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    caseSensitive: false,
    fuzzyMatch: false,
    searchFields: ['name', 'tags']
  })
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({})

  const searchEngine = useMemo(() => {
    const engine = new TaskSearchEngine<T>()
    engine.indexTasks(tasks)
    return engine
  }, [tasks])

  const searchResults = useMemo(() => {
    let results = searchEngine.search(searchQuery, searchOptions)

    if (filterOptions.status && filterOptions.status.length > 0) {
      results = results.filter(r => filterOptions.status!.includes(r.item.status))
    }

    if (filterOptions.priority && filterOptions.priority.length > 0) {
      results = results.filter(
        r => r.item.priority && filterOptions.priority!.includes(r.item.priority)
      )
    }

    if (filterOptions.tags && filterOptions.tags.length > 0) {
      results = results.filter(r =>
        r.item.tags?.some(tag => filterOptions.tags!.includes(tag))
      )
    }

    if (filterOptions.dateRange) {
      const { start, end } = filterOptions.dateRange
      results = results.filter(r => {
        const date = r.item.createdAt
        if (!date) return true
        if (start && date < start) return false
        if (end && date > end) return false
        return true
      })
    }

    return results
  }, [searchEngine, searchQuery, searchOptions, filterOptions])

  const updateSearchQuery = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  const updateSearchOptions = useCallback((options: Partial<SearchOptions>) => {
    setSearchOptions(prev => ({ ...prev, ...options }))
  }, [])

  const updateFilterOptions = useCallback((options: Partial<FilterOptions>) => {
    setFilterOptions(prev => ({ ...prev, ...options }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilterOptions({})
  }, [])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])

  return {
    searchQuery,
    searchOptions,
    filterOptions,
    searchResults,
    updateSearchQuery,
    updateSearchOptions,
    updateFilterOptions,
    clearFilters,
    clearSearch
  }
}

export function highlightMatches(text: string, query: string): React.ReactNode {
  if (!query) return text

  const parts = text.split(new RegExp(`(${query})`, 'gi'))

  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} style={{ backgroundColor: 'yellow' }}>
        {part}
      </mark>
    ) : (
      part
    )
  )
}
