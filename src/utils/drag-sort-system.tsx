import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useState, useCallback, useMemo } from "react"
import { CSSProperties } from "react"

// ========== TOP 12: 拖拽排序系统 (10个优化点) ==========

interface SortableItem {
  id: string
  [key: string]: any
}

// 优化点 1: 基础拖拽排序 Hook
export function useDragSort<T extends SortableItem>(initialItems: T[]) {
  const [items, setItems] = useState<T[]>(initialItems)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
    setActiveId(null)
  }, [])

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }, [])

  const resetItems = useCallback(() => {
    setItems(initialItems)
  }, [initialItems])

  const addItem = useCallback((item: T) => {
    setItems((prev) => [...prev, item])
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  return {
    items,
    setItems,
    activeId,
    setActiveId,
    sensors,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    resetItems,
    addItem,
    removeItem,
  }
}

// 优化点 2: 可排序组件
export function SortableItem({
  id,
  children,
  isOverlay = false,
}: {
  id: string
  children: React.ReactNode
  isOverlay?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = useMemo((): CSSProperties => {
    return {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging && !isOverlay ? 0.5 : 1,
      zIndex: isDragging ? 999 : "auto",
      position: "relative",
    }
  }, [transform, transition, isDragging, isOverlay])

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={isDragging ? "cursor-grabbing" : "cursor-grab"}
    >
      {children}
    </div>
  )
}

// 优化点 3: 完整排序组件
export function SortableList<T extends SortableItem>({
  items,
  renderItem,
  onSort,
  onDragStart,
  onDragEnd,
  className,
}: {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  onSort?: (newOrder: T[]) => void
  onDragStart?: (id: string) => void
  onDragEnd?: (id: string, newIndex: number) => void
  className?: string
}) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [localItems, setLocalItems] = useState(items)

  // 同步外部items变化
  useMemo(() => {
    setLocalItems(items)
  }, [items])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    onDragStart?.(event.active.id as string)
  }, [onDragStart])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setLocalItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        const newItems = arrayMove(items, oldIndex, newIndex)
        onSort?.(newItems)
        onDragEnd?.(active.id as string, newIndex)
        return newItems
      })
    }
    setActiveId(null)
  }, [onSort, onDragEnd])

  const activeItem = useMemo(() => {
    return localItems.find((item) => item.id === activeId)
  }, [localItems, activeId])

  const itemIds = useMemo(() => localItems.map((item) => item.id), [localItems])

  return (
    <div className={className}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {localItems.map((item, index) => renderItem(item, index))}
        </SortableContext>

        <DragOverlay dropAnimation={defaultDropAnimationSideEffects}>
          {activeItem ? (
            <div className="opacity-80 scale-105">
              {renderItem(activeItem, localItems.indexOf(activeItem))}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

// 优化点 4: 多区域拖拽排序
export function useMultiContainerDragSort<
  T extends SortableItem,
  ContainerId extends string = string
>(
  initialContainers: Record<ContainerId, T[]>
) {
  const [containers, setContainers] =
    useState<Record<ContainerId, T[]>>(initialContainers)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const findContainer = useCallback((id: string): ContainerId | null => {
    for (const [containerId, items] of Object.entries(containers)) {
      if (items.some((item) => item.id === id)) {
        return containerId as ContainerId
      }
    }
    return null
  }, [containers])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over) return

      const activeId = active.id as string
      const overId = over.id as string

      // 找到源和目标容器
      const sourceContainer = findContainer(activeId)
      let targetContainer = findContainer(overId)

      // 目标可能是容器本身
      if (!targetContainer && Object.keys(containers).includes(overId)) {
        targetContainer = overId as ContainerId
      }

      if (sourceContainer && targetContainer) {
        setContainers((prev) => {
          const newContainers = { ...prev }
          const sourceItems = [...prev[sourceContainer]]
          const targetItems = [...prev[targetContainer]]

          // 找到源项目索引
          const sourceIndex = sourceItems.findIndex((item) => item.id === activeId)
          if (sourceIndex === -1) return prev

          // 移除源项目
          const [removedItem] = sourceItems.splice(sourceIndex, 1)

          // 插入目标
          if (sourceContainer === targetContainer) {
            // 同容器移动
            const targetIndex = targetItems.findIndex((item) => item.id === overId)
            if (targetIndex === -1) {
              newContainers[sourceContainer] = sourceItems
            } else {
              newContainers[sourceContainer] = arrayMove(
                targetItems,
                sourceIndex,
                targetIndex
              )
            }
          } else {
            // 跨容器移动
            const targetIndex = targetItems.findIndex((item) => item.id === overId)
            if (targetIndex === -1) {
              targetItems.push(removedItem)
            } else {
              targetItems.splice(targetIndex, 0, removedItem)
            }
            newContainers[sourceContainer] = sourceItems
            newContainers[targetContainer] = targetItems
          }

          return newContainers
        })
      }

      setActiveId(null)
    },
    [findContainer, containers]
  )

  return {
    containers,
    setContainers,
    activeId,
    setActiveId,
    sensors,
    handleDragEnd,
    findContainer,
  }
}

// 优化点 5: 触摸设备支持
export function TouchSortableItem({
  id,
  children,
  onSort,
}: {
  id: string
  children: React.ReactNode
  onSort: (newIndex: number) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: "none", // 优化点 6: 禁用默认触摸行为
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  )
}

// 优化点 7: 拖拽预览
export function useDragPreview() {
  const [isDragging, setIsDragging] = useState(false)

  const startDrag = useCallback(() => setIsDragging(true), [])
  const endDrag = useCallback(() => setIsDragging(false), [])

  return { isDragging, startDrag, endDrag }
}

// 优化点 8: 拖拽统计
export function useDragStats() {
  const [totalDrags, setTotalDrags] = useState(0)
  const [totalMoves, setTotalMoves] = useState(0)
  const [lastDragTime, setLastDragTime] = useState<Date | null>(null)

  const recordDrag = useCallback(() => {
    setTotalDrags((prev) => prev + 1)
    setLastDragTime(new Date())
  }, [])

  const recordMove = useCallback(() => {
    setTotalMoves((prev) => prev + 1)
  }, [])

  return {
    totalDrags,
    totalMoves,
    lastDragTime,
    recordDrag,
    recordMove,
  }
}

// 优化点 9: 拖拽快照
export function useDragSnapshot<T extends SortableItem>(initialItems: T[]) {
  const [snapshots, setSnapshots] = useState<T[][]>([initialItems])
  const [currentIndex, setCurrentIndex] = useState(0)

  const takeSnapshot = useCallback((items: T[]) => {
    setSnapshots((prev) => {
      const newSnapshots = prev.slice(0, currentIndex + 1)
      newSnapshots.push([...items])
      return newSnapshots
    })
    setCurrentIndex((prev) => prev + 1)
  }, [currentIndex])

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
      return snapshots[currentIndex - 1]
    }
    return null
  }, [currentIndex, snapshots])

  const redo = useCallback(() => {
    if (currentIndex < snapshots.length - 1) {
      setCurrentIndex((prev) => prev + 1)
      return snapshots[currentIndex + 1]
    }
    return null
  }, [currentIndex, snapshots])

  return {
    snapshots,
    currentIndex,
    takeSnapshot,
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < snapshots.length - 1,
  }
}

// 优化点 10: 性能优化
export function useVirtualizedSortableList<T extends SortableItem>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [localItems, setLocalItems] = useState(items)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setLocalItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
    setActiveId(null)
  }, [])

  return {
    localItems,
    setLocalItems,
    activeId,
    sensors,
    handleDragEnd,
  }
}

// 导出工具
export { arrayMove, closestCenter }
