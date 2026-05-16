import { describe, it, expect, beforeEach, vi } from 'vitest'

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(() => ({
    data: undefined,
    error: null,
    isLoading: false,
    isFetching: false,
    isError: false,
    isSuccess: false,
    refetch: vi.fn()
  })),
  useMutation: vi.fn(() => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn()
  })),
  useQueryClient: vi.fn(() => ({
    prefetchQuery: vi.fn().mockResolvedValue(undefined),
    getQueryData: vi.fn().mockReturnValue(undefined),
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn().mockResolvedValue(undefined),
    cancelQueries: vi.fn().mockResolvedValue(undefined),
    removeQueries: vi.fn(),
    clear: vi.fn(),
    getQueryCache: vi.fn(() => ({
      getAll: vi.fn(() => [])
    }))
  })),
  QueryClient: vi.fn(),
  QueryObserver: vi.fn()
}))

import { reactQueryOptimizer } from '@/utils/react-query-optimizer'

describe('ReactQueryOptimizer Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Singleton Pattern', () => {
    it('should create singleton instance', () => {
      const instance1 = reactQueryOptimizer
      const instance2 = reactQueryOptimizer
      expect(instance1).toBe(instance2)
    })
  })

  describe('Initialization', () => {
    it('should initialize query client', () => {
      const client = reactQueryOptimizer.initialize()
      expect(client).toBeDefined()
    })
  })

  describe('Query Statistics', () => {
    it('should get query stats', () => {
      const stats = reactQueryOptimizer.getQueryStats('test')
      expect(stats).toBeUndefined()
    })

    it('should get all query stats', () => {
      const stats = reactQueryOptimizer.getAllQueryStats()
      expect(stats).toBeInstanceOf(Map)
    })
  })

  describe('Batch Operations', () => {
    it('should batch multiple queries', async () => {
      const queries = [
        {
          queryKey: ['batch', '1'],
          queryFn: vi.fn(() => Promise.resolve('data1'))
        },
        {
          queryKey: ['batch', '2'],
          queryFn: vi.fn(() => Promise.resolve('data2'))
        }
      ]

      const results = await reactQueryOptimizer.batchQueries(queries)
      expect(results).toHaveLength(2)
    })
  })

  describe('Global Listeners', () => {
    it('should add and remove global listener', () => {
      const listener = vi.fn()
      const remove = reactQueryOptimizer.addGlobalListener(listener)
      expect(typeof remove).toBe('function')
      remove()
    })
  })
})
