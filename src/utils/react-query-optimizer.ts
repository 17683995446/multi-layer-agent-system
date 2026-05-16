import {
  useQuery,
  useMutation,
  useQueryClient,
  QueryClient,
  QueryObserver,
  QueryKey
} from '@tanstack/react-query'
import { useCallback, useMemo, useEffect, useState } from 'react'

export interface QueryCacheConfig {
  maxAge?: number
  staleTime?: number
  cacheTime?: number
  refetchOnWindowFocus?: boolean
  refetchOnMount?: boolean
  retry?: number | boolean
  retryDelay?: (attemptIndex: number) => number
}

export interface MutationConfig<TData, TError, TVariables, TContext> {
  onMutate?: (variables: TVariables) => TContext | Promise<TContext>
  onError?: (error: TError, variables: TVariables, context: TContext | undefined) => void | Promise<void>
  onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => void | Promise<void>
  onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables, context: TContext | undefined) => void | Promise<void>
}

export interface PrefetchOptions {
  staleTime?: number
  cacheTime?: number
}

export interface QueryOptimizationOptions {
  debounceMs?: number
  throttleMs?: number
  backgroundSync?: boolean
  prefetchDistance?: number
}

export interface UseOptimizedQueryResult<TData, TError> {
  data: TData | undefined
  error: TError | null
  isLoading: boolean
  isFetching: boolean
  isError: boolean
  isSuccess: boolean
  refetch: () => Promise<any>
  cancel: () => void
}

export interface QueryStats {
  lastUpdated: Date | null
  fetchCount: number
  dataSize: number
  cacheHitRate: number
}

class ReactQueryOptimizer {
  private static instance: ReactQueryOptimizer
  private queryClient: QueryClient | null = null
  private prefetchControllers: Map<string, AbortController> = new Map()
  private queryStats: Map<string, QueryStats> = new Map()
  private globalListeners: Set<(event: QueryCacheEvent) => void> = new Set()

  static getInstance(): ReactQueryOptimizer {
    if (!ReactQueryOptimizer.instance) {
      ReactQueryOptimizer.instance = new ReactQueryOptimizer()
    }
    return ReactQueryOptimizer.instance
  }

  initialize(config?: {
    defaultOptions?: {
      queries?: {
        staleTime?: number
        cacheTime?: number
        refetchOnWindowFocus?: boolean
        retry?: number | boolean
      }
      mutations?: {
        onError?: (error: any) => void
      }
    }
  }): QueryClient {
    if (this.queryClient) {
      return this.queryClient
    }

    this.queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: config?.defaultOptions?.queries?.staleTime ?? 5 * 60 * 1000,
          cacheTime: config?.defaultOptions?.queries?.cacheTime ?? 10 * 60 * 1000,
          refetchOnWindowFocus: config?.defaultOptions?.queries?.refetchOnWindowFocus ?? false,
          retry: config?.defaultOptions?.queries?.retry ?? 1,
          ...config?.defaultOptions?.queries
        },
        mutations: {
          ...config?.defaultOptions?.mutations
        }
      }
    })

    return this.queryClient
  }

  getQueryClient(): QueryClient {
    if (!this.queryClient) {
      return this.initialize()
    }
    return this.queryClient
  }

  async prefetchQuery<T>(
    queryKey: QueryKey,
    queryFn: () => Promise<T>,
    options?: PrefetchOptions
  ): Promise<void> {
    const client = this.getQueryClient()

    await client.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: options?.staleTime,
      cacheTime: options?.cacheTime
    })

    this.updateQueryStats(queryKey as string, 'prefetch')
  }

  async prefetchInfiniteQuery<T>(
    queryKey: QueryKey,
    queryFn: ({ pageParam }: { pageParam?: any }) => Promise<T>,
    options?: PrefetchOptions & { initialPageParam?: any }
  ): Promise<void> {
    const client = this.getQueryClient()

    await client.prefetchInfiniteQuery({
      queryKey,
      queryFn,
      initialPageParam: options?.initialPageParam ?? 0,
      staleTime: options?.staleTime,
      cacheTime: options?.cacheTime
    })
  }

  setQueryData<T>(queryKey: QueryKey, data: T): void {
    const client = this.getQueryClient()
    client.setQueryData(queryKey, data)
    this.updateQueryStats(queryKey as string, 'set')
  }

  getQueryData<T>(queryKey: QueryKey): T | undefined {
    const client = this.getQueryClient()
    return client.getQueryData<T>(queryKey)
  }

  invalidateQuery(queryKey: QueryKey): void {
    const client = this.getQueryClient()
    client.invalidateQueries({ queryKey })
  }

  cancelQuery(queryKey: QueryKey): void {
    const client = this.getQueryClient()
    client.cancelQueries({ queryKey })
  }

  removeQuery(queryKey: QueryKey): void {
    const client = this.getQueryClient()
    client.removeQueries({ queryKey })
  }

  clearAllQueries(): void {
    const client = this.getQueryClient()
    client.clear()
  }

  getQueryStats(queryKey: string): QueryStats | undefined {
    return this.queryStats.get(queryKey)
  }

  getAllQueryStats(): Map<string, QueryStats> {
    return new Map(this.queryStats)
  }

  private updateQueryStats(queryKey: string, operation: 'prefetch' | 'set' | 'fetch'): void {
    const current = this.queryStats.get(queryKey) || {
      lastUpdated: null,
      fetchCount: 0,
      dataSize: 0,
      cacheHitRate: 0
    }

    this.queryStats.set(queryKey, {
      ...current,
      lastUpdated: new Date(),
      fetchCount: operation === 'fetch' ? current.fetchCount + 1 : current.fetchCount
    })
  }

  addGlobalListener(listener: (event: QueryCacheEvent) => void): () => void {
    this.globalListeners.add(listener)
    return () => this.globalListeners.delete(listener)
  }

  private notifyListeners(event: QueryCacheEvent): void {
    this.globalListeners.forEach(listener => listener(event))
  }

  async fetchWithOptimisticUpdate<T, TVariables>(
    queryKey: QueryKey,
    fetchFn: () => Promise<T>,
    updateFn: (variables: TVariables) => T,
    onError?: (error: Error) => void
  ): Promise<T> {
    const previousData = this.getQueryData(queryKey)

    try {
      this.setQueryData(queryKey, updateFn as any)
      const data = await fetchFn()
      this.setQueryData(queryKey, data)
      return data
    } catch (error) {
      if (previousData !== undefined) {
        this.setQueryData(queryKey, previousData)
      }
      if (onError && error instanceof Error) {
        onError(error)
      }
      throw error
    }
  }

  createQueryObserver<T>(queryKey: QueryKey): QueryObserver<T> {
    const client = this.getQueryClient()
    return client.getQueryCache().build<T>(client, { queryKey })
  }

  batchQueries<T>(queries: Array<{
    queryKey: QueryKey
    queryFn: () => Promise<T>
  }>): Promise<T[]> {
    return Promise.all(
      queries.map(({ queryFn }) => queryFn())
    )
  }

  invalidateMultipleQueries(queryKeys: QueryKey[]): void {
    const client = this.getQueryClient()
    queryKeys.forEach(queryKey => {
      client.invalidateQueries({ queryKey })
    })
  }
}

export interface QueryCacheEvent {
  type: 'added' | 'updated' | 'removed' | 'cleared'
  queryKey: QueryKey
  timestamp: Date
}

export const reactQueryOptimizer = ReactQueryOptimizer.getInstance()

export function useOptimizedQuery<T>(
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
  options?: {
    enabled?: boolean
    staleTime?: number
    cacheTime?: number
    refetchOnWindowFocus?: boolean
    refetchOnMount?: boolean | 'always'
    retry?: number | boolean
    select?: (data: T) => any
    optimization?: QueryOptimizationOptions
  }
): UseOptimizedQueryResult<T, Error> & { data: T | undefined } {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000,
    cacheTime = 10 * 60 * 1000,
    refetchOnWindowFocus = false,
    refetchOnMount = false,
    retry = 1,
    select,
    optimization = {}
  } = options || {}

  const {
    debounceMs = 0,
    throttleMs = 0,
    prefetchDistance = 5
  } = optimization

  const [debouncedQueryKey, setDebouncedQueryKey] = useState(queryKey)

  useEffect(() => {
    if (debounceMs > 0) {
      const timer = setTimeout(() => {
        setDebouncedQueryKey(queryKey)
      }, debounceMs)
      return () => clearTimeout(timer)
    }
  }, [queryKey, debounceMs])

  const { data, error, isLoading, isFetching, isError, isSuccess, refetch } = useQuery({
    queryKey: debouncedQueryKey,
    queryFn,
    enabled,
    staleTime,
    gcTime: cacheTime,
    refetchOnWindowFocus,
    refetchOnMount,
    retry,
    select,
    throwOnError: false
  })

  const cancel = useCallback(() => {
    reactQueryOptimizer.cancelQuery(queryKey)
  }, [queryKey])

  useEffect(() => {
    if (throttleMs > 0 && isFetching) {
      const timer = setTimeout(() => {
        refetch()
      }, throttleMs)
      return () => clearTimeout(timer)
    }
  }, [isFetching, refetch, throttleMs])

  return {
    data,
    error: error as Error | null,
    isLoading,
    isFetching,
    isError,
    isSuccess,
    refetch,
    cancel
  }
}

export function useOptimizedMutation<TData, TError, TVariables, TContext>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  config?: MutationConfig<TData, TError, TVariables, TContext>
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onMutate: config?.onMutate,
    onError: config?.onError,
    onSuccess: config?.onSuccess,
    onSettled: config?.onSettled
  })
}

export function useQueryCache() {
  const queryClient = useQueryClient()

  return useMemo(() => ({
    getQueries: <T>(filters?: { stale?: boolean }): Array<{ queryKey: QueryKey; data: T | undefined }> => {
      return queryClient.getQueriesData(filters)
    },
    removeQueries: (queryKey?: QueryKey) => {
      if (queryKey) {
        queryClient.removeQueries({ queryKey })
      } else {
        queryClient.clear()
      }
    },
    invalidateQueries: (queryKey?: QueryKey) => {
      queryClient.invalidateQueries({ queryKey })
    },
    getQueryCount: () => {
      return queryClient.getQueryCache().getAll().length
    }
  }), [queryClient])
}

export function usePrefetchOnScroll<T>(
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
  options?: PrefetchOptions
) {
  const handleScroll = useCallback(() => {
    const scrollHeight = document.documentElement.scrollHeight
    const scrollTop = document.documentElement.scrollTop
    const clientHeight = document.documentElement.clientHeight

    if (scrollTop + clientHeight >= scrollHeight - 100) {
      reactQueryOptimizer.prefetchQuery(queryKey, queryFn, options)
    }
  }, [queryKey, queryFn, options])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])
}

export function useInfiniteQueryScroll<T>(
  queryKey: QueryKey,
  queryFn: ({ pageParam }: { pageParam?: any }) => Promise<T>,
  options?: {
    initialPageParam?: any
    getNextPageParam?: (lastPage: T, allPages: T[]) => any
  }
) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status
  } = useQuery({
    queryKey: ['infinite', ...(Array.isArray(queryKey) ? queryKey : [queryKey])],
    queryFn,
    getNextPageParam: options?.getNextPageParam
  })

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
        loadMore()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [loadMore])

  return {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
    loadMore
  }
}
