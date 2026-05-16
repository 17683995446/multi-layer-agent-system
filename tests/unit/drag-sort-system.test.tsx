import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import {
  useDragSort,
  useDragPreview,
  useDragStats,
  useDragSnapshot,
  useVirtualizedSortableList,
  arrayMove,
} from "@/utils/drag-sort-system"

describe("Top 12: 拖拽排序系统 (10个优化点)", () => {
  const mockItems = [
    { id: "item-1", name: "项目1" },
    { id: "item-2", name: "项目2" },
    { id: "item-3", name: "项目3" },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("优化点 1: 基础拖拽排序 Hook", () => {
    it("should initialize with correct items", () => {
      const { result } = renderHook(() => useDragSort(mockItems))
      expect(result.current.items).toEqual(mockItems)
    })

    it("should add item correctly", () => {
      const { result } = renderHook(() => useDragSort(mockItems))
      act(() => {
        result.current.addItem({ id: "item-4", name: "项目4" })
      })
      expect(result.current.items.length).toBe(4)
    })

    it("should remove item correctly", () => {
      const { result } = renderHook(() => useDragSort(mockItems))
      act(() => {
        result.current.removeItem("item-2")
      })
      expect(result.current.items).toEqual([
        { id: "item-1", name: "项目1" },
        { id: "item-3", name: "项目3" },
      ])
    })
  })

  describe("优化点 2-4: 多容器和组件", () => {
    it("should track active id state", () => {
      const { result } = renderHook(() => useDragSort(mockItems))
      expect(result.current.activeId).toBeNull()
      act(() => {
        result.current.setActiveId("item-1")
      })
      expect(result.current.activeId).toBe("item-1")
    })
  })

  describe("优化点 5-6: 触摸和预览", () => {
    it("useDragPreview should track dragging state", () => {
      const { result } = renderHook(() => useDragPreview())
      expect(result.current.isDragging).toBe(false)
      act(() => {
        result.current.startDrag()
      })
      expect(result.current.isDragging).toBe(true)
      act(() => {
        result.current.endDrag()
      })
      expect(result.current.isDragging).toBe(false)
    })
  })

  describe("优化点 7-8: 统计功能", () => {
    it("useDragStats should record drags and moves", () => {
      const { result } = renderHook(() => useDragStats())
      expect(result.current.totalDrags).toBe(0)
      expect(result.current.totalMoves).toBe(0)
      act(() => {
        result.current.recordDrag()
        result.current.recordDrag()
        result.current.recordMove()
      })
      expect(result.current.totalDrags).toBe(2)
      expect(result.current.totalMoves).toBe(1)
    })

    it("should record last drag time", () => {
      const { result } = renderHook(() => useDragStats())
      expect(result.current.lastDragTime).toBeNull()
      act(() => {
        result.current.recordDrag()
      })
      expect(result.current.lastDragTime).toBeInstanceOf(Date)
    })
  })

  describe("优化点 9: 快照和撤销/重做", () => {
    it("useDragSnapshot should create snapshots", () => {
      const { result } = renderHook(() => useDragSnapshot(mockItems))
      expect(result.current.snapshots.length).toBe(1)
      expect(result.current.canUndo).toBe(false)
      expect(result.current.canRedo).toBe(false)
    })

    it("should take multiple snapshots", () => {
      const { result } = renderHook(() => useDragSnapshot(mockItems))
      const newItems = [...mockItems, { id: "item-4", name: "项目4" }]
      act(() => {
        result.current.takeSnapshot(newItems)
      })
      expect(result.current.snapshots.length).toBe(2)
      expect(result.current.canUndo).toBe(true)
      expect(result.current.canRedo).toBe(false)
    })
  })

  describe("优化点 10: 性能优化和虚拟化", () => {
    it("useVirtualizedSortableList should initialize", () => {
      const { result } = renderHook(() =>
        useVirtualizedSortableList(mockItems, 50, 500)
      )
      expect(result.current.localItems).toEqual(mockItems)
    })

    it("arrayMove should correctly reorder items", () => {
      const arr = [1, 2, 3, 4, 5]
      const moved = arrayMove(arr, 1, 3)
      expect(moved).toEqual([1, 3, 4, 2, 5])
    })
  })

  describe("系统功能", () => {
    it("should reset items to initial state", () => {
      const { result } = renderHook(() => useDragSort(mockItems))
      act(() => {
        result.current.addItem({ id: "new-item", name: "新项" })
      })
      expect(result.current.items.length).toBe(4)
      act(() => {
        result.current.resetItems()
      })
      expect(result.current.items.length).toBe(3)
    })
  })
})
