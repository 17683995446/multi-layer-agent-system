import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle
} from 'react'
import { VariableSizeList as List, ListChildComponentProps } from 'react-window'

export interface VirtualScrollItem<T = any> {
  index: number
  data: T
  style: React.CSSProperties
}

export interface VirtualScrollEnhancementConfig {
  overscan?: number
  estimatedItemSize?: number
  enableDynamicHeight?: boolean
  enableScrollRestoration?: boolean
  enableSmoothScrolling?: boolean
  cacheSize?: number
  onScroll?: (scrollOffset: number, scrollDirection: 'forward' | 'backward') => void
  onItemsRendered?: (visibleRange: { startIndex: number; stopIndex: number }) => void
  performanceMode?: 'auto' | 'high' | 'balanced' | 'memory'
}

export interface VirtualScrollEnhancementRef {
  scrollTo: (index: number) => void
  scrollToItem: (index: number, align?: 'auto' | 'smart' | 'center' | 'end' | 'start') => void
  forceUpdate: () => void
  getScrollOffset: () => number
  resetCache: () => void
  getVisibleItems: () => { startIndex: number; stopIndex: number }
}

const DEFAULT_CONFIG: Required<VirtualScrollEnhancementConfig> = {
  overscan: 3,
  estimatedItemSize: 60,
  enableDynamicHeight: true,
  enableScrollRestoration: true,
  enableSmoothScrolling: true,
  cacheSize: 100,
  onScroll: () => {},
  onItemsRendered: () => {},
  performanceMode: 'balanced'
}

const PERFORMANCE_PROFILES = {
  auto: { overscan: 3, estimatedItemSize: 60 },
  high: { overscan: 5, estimatedItemSize: 80 },
  balanced: { overscan: 3, estimatedItemSize: 60 },
  memory: { overscan: 1, estimatedItemSize: 50 }
}

function VirtualScrollEnhancementInner<T>(
  props: {
    items: T[]
    height: number | string
    width?: number | string
    renderItem: (item: T, index: number) => React.ReactNode
    getItemKey?: (item: T, index: number) => string | number
    config?: VirtualScrollEnhancementConfig
  },
  ref: React.Ref<VirtualScrollEnhancementRef>
) {
  const {
    items,
    height,
    width = '100%',
    renderItem,
    getItemKey,
    config = {}
  } = props

  const mergedConfig = useMemo(() => {
    const profile = PERFORMANCE_PROFILES[config.performanceMode || 'balanced']
    return {
      ...DEFAULT_CONFIG,
      ...profile,
      ...config
    }
  }, [config])

  const listRef = useRef<List>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollOffsetRef = useRef(0)
  const lastScrollOffsetRef = useRef(0)
  const itemHeightsCache = useRef<Map<number, number>>(new Map())
  const [dimensions, setDimensions] = useState({ height, width })

  useEffect(() => {
    setDimensions({ height, width })
  }, [height, width])

  useEffect(() => {
    if (mergedConfig.enableScrollRestoration && containerRef.current) {
      const savedOffset = sessionStorage.getItem('virtual-scroll-offset')
      if (savedOffset && listRef.current) {
        listRef.current.scrollTo(parseFloat(savedOffset))
      }
    }
  }, [mergedConfig.enableScrollRestoration])

  const getItemHeight = useCallback((index: number): number => {
    if (itemHeightsCache.current.has(index)) {
      return itemHeightsCache.current.get(index)!
    }
    return mergedConfig.estimatedItemSize
  }, [mergedConfig.estimatedItemSize])

  const setItemHeight = useCallback((index: number, height: number) => {
    if (mergedConfig.enableDynamicHeight) {
      itemHeightsCache.current.set(index, height)
      if (listRef.current) {
        listRef.current.resetAfterIndex(index)
      }
    }
  }, [mergedConfig.enableDynamicHeight])

  const handleScroll = useCallback(({ scrollOffset, scrollDirection }: {
    scrollOffset: number
    scrollDirection: 'forward' | 'backward'
  }) => {
    scrollOffsetRef.current = scrollOffset

    if (mergedConfig.enableScrollRestoration) {
      sessionStorage.setItem('virtual-scroll-offset', scrollOffset.toString())
    }

    mergedConfig.onScroll(scrollOffset, scrollDirection)
  }, [mergedConfig])

  const Row = useCallback(({ index, style }: ListChildComponentProps) => {
    const item = items[index]

    const handleMeasure = (node: HTMLDivElement | null) => {
      if (node && mergedConfig.enableDynamicHeight) {
        const measuredHeight = node.getBoundingClientRect().height
        if (measuredHeight !== getItemHeight(index)) {
          setItemHeight(index, measuredHeight)
        }
      }
    }

    return (
      <div style={style} ref={handleMeasure}>
        {renderItem(item, index)}
      </div>
    )
  }, [items, renderItem, getItemHeight, setItemHeight, mergedConfig.enableDynamicHeight])

  useImperativeHandle(ref, () => ({
    scrollTo: (index: number) => {
      listRef.current?.scrollTo(index * mergedConfig.estimatedItemSize)
    },
    scrollToItem: (index: number, align?: 'auto' | 'smart' | 'center' | 'end' | 'start') => {
      listRef.current?.scrollToItem(index, align)
    },
    forceUpdate: () => {
      listRef.current?.forceUpdate()
    },
    getScrollOffset: () => scrollOffsetRef.current,
    resetCache: () => {
      itemHeightsCache.current.clear()
      listRef.current?.resetAfterIndex(0)
    },
    getVisibleItems: () => {
      const startIndex = Math.floor(scrollOffsetRef.current / mergedConfig.estimatedItemSize)
      const visibleHeight = typeof height === 'number' ? height : 500
      const stopIndex = Math.min(
        items.length - 1,
        startIndex + Math.ceil(visibleHeight / mergedConfig.estimatedItemSize) + mergedConfig.overscan
      )
      return { startIndex, stopIndex }
    }
  }), [items.length, height, mergedConfig])

  const getKey = useCallback((index: number) => {
    if (getItemKey) {
      return getItemKey(items[index], index)
    }
    return index
  }, [items, getItemKey])

  const itemData = useMemo(() => ({
    items,
    renderItem,
    getItemHeight,
    mergedConfig
  }), [items, renderItem, getItemHeight, mergedConfig])

  return (
    <div
      ref={containerRef}
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        width: typeof width === 'number' ? `${width}px` : width,
        overflow: 'auto'
      }}
    >
      <List
        ref={listRef}
        height={typeof height === 'number' ? height : 500}
        width={typeof width === 'number' ? width : '100%'}
        itemCount={items.length}
        itemSize={getItemHeight}
        itemData={itemData}
        overscanCount={mergedConfig.overscan}
        onScroll={handleScroll}
        itemKey={getKey}
        useIsScrolling={mergedConfig.enableSmoothScrolling}
      >
        {Row}
      </List>
    </div>
  )
}

export const VirtualScrollEnhancement = forwardRef(VirtualScrollEnhancementInner) as <
  T
>(
  props: {
    items: T[]
    height: number | string
    width?: number | string
    renderItem: (item: T, index: number) => React.ReactNode
    getItemKey?: (item: T, index: number) => string | number
    config?: VirtualScrollEnhancementConfig
  } & {
    ref?: React.Ref<VirtualScrollEnhancementRef>
  }
) => ReturnType<typeof VirtualScrollEnhancementInner>

export interface VirtualScrollGroupConfig {
  groupBy: (item: any) => string
  renderGroupHeader?: (groupKey: string, itemCount: number) => React.ReactNode
  stickyHeaders?: boolean
}

export function useVirtualScrollOptimization<T>(
  items: T[],
  config: VirtualScrollEnhancementConfig = {}
) {
  const [visibleRange, setVisibleRange] = useState({ startIndex: 0, stopIndex: 20 })
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout>()

  const optimizedItems = useMemo(() => {
    if (config.performanceMode === 'memory') {
      return items.slice(visibleRange.startIndex, visibleRange.stopIndex + config.overscan!)
    }
    return items
  }, [items, visibleRange, config.overscan, config.performanceMode])

  const handleItemsRendered = useCallback((
    { visibleStartIndex, visibleStopIndex }: { visibleStartIndex: number; visibleStopIndex: number }
  ) => {
    setVisibleRange({
      startIndex: Math.max(0, visibleStartIndex - (config.overscan || 3)),
      stopIndex: Math.min(items.length - 1, visibleStopIndex + (config.overscan || 3))
    })
  }, [items.length, config.overscan])

  const handleScrollStart = useCallback(() => {
    setIsScrolling(true)
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
  }, [])

  const handleScrollEnd = useCallback(() => {
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false)
    }, 150)
  }, [])

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  return {
    optimizedItems,
    visibleRange,
    isScrolling,
    handleItemsRendered,
    handleScrollStart,
    handleScrollEnd
  }
}

export function useVirtualScrollPerformanceTracker() {
  const metricsRef = useRef({
    renderCount: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
    scrollEvents: 0,
    itemHeights: new Map<number, number>()
  })

  const trackRender = useCallback(() => {
    const now = performance.now()
    metricsRef.current.renderCount++
    metricsRef.current.lastRenderTime = now

    if (metricsRef.current.renderCount > 1) {
      metricsRef.current.averageRenderTime =
        (metricsRef.current.averageRenderTime * (metricsRef.current.renderCount - 1) + now) /
        metricsRef.current.renderCount
    }
  }, [])

  const trackScroll = useCallback(() => {
    metricsRef.current.scrollEvents++
  }, [])

  const trackItemHeight = useCallback((index: number, height: number) => {
    metricsRef.current.itemHeights.set(index, height)
  }, [])

  const getMetrics = useCallback(() => ({
    ...metricsRef.current,
    itemHeightStats: {
      min: Math.min(...Array.from(metricsRef.current.itemHeights.values())),
      max: Math.max(...Array.from(metricsRef.current.itemHeights.values())),
      average:
        Array.from(metricsRef.current.itemHeights.values()).reduce((a, b) => a + b, 0) /
        metricsRef.current.itemHeights.size
    }
  }), [])

  const resetMetrics = useCallback(() => {
    metricsRef.current = {
      renderCount: 0,
      lastRenderTime: 0,
      averageRenderTime: 0,
      scrollEvents: 0,
      itemHeights: new Map()
    }
  }, [])

  return {
    trackRender,
    trackScroll,
    trackItemHeight,
    getMetrics,
    resetMetrics
  }
}

export function VirtualScrollMemo({
  children,
  deps
}: {
  children: React.ReactNode
  deps: any[]
}) {
  return useMemo(() => children, deps)
}

export function VirtualScrollLazyLoad({
  items,
  loadMore,
  hasMore,
  loader,
  endMessage
}: {
  items: any[]
  loadMore: () => void
  hasMore: boolean
  loader?: React.ReactNode
  endMessage?: React.ReactNode
}) {
  const observerRef = useRef<IntersectionObserver>()
  const loaderRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    if (node && hasMore) {
      observerRef.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      })

      observerRef.current.observe(node)
    }
  }, [hasMore, loadMore])

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  return (
    <>
      {items}
      {hasMore && (
        <div ref={loaderRef}>
          {loader || <div>Loading more...</div>}
        </div>
      )}
      {!hasMore && endMessage}
    </>
  )
}
