import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import {
  useChartData,
  aggregateData,
  sortData,
  filterData,
  sampleLineData,
  samplePieData,
} from "@/utils/data-visualization-charts"

describe("Top 14: 数据可视化图表 (10个优化点)", () => {
  const testData = [
    { name: "项目1", value: 100, category: "A" },
    { name: "项目2", value: 200, category: "A" },
    { name: "项目3", value: 150, category: "B" },
    { name: "项目4", value: 300, category: "B" },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("优化点 1-6: 图表组件", () => {
    it("sample data should be available", () => {
      expect(sampleLineData.length).toBeGreaterThan(0)
      expect(samplePieData.length).toBeGreaterThan(0)
    })

    it("sample line data should have correct structure", () => {
      expect(sampleLineData[0].name).toBeDefined()
      expect(sampleLineData[0].value).toBeDefined()
    })
  })

  describe("优化点 7: 数据处理 Hook", () => {
    it("useChartData should initialize with given data", () => {
      const { result } = renderHook(() => useChartData(testData))
      expect(result.current.data).toEqual(testData)
    })

    it("should add data point correctly", () => {
      const { result } = renderHook(() => useChartData(testData))
      act(() => {
        result.current.addDataPoint({ name: "新项目", value: 250 })
      })
      expect(result.current.data.length).toBe(5)
    })

    it("should remove data point by name", () => {
      const { result } = renderHook(() => useChartData(testData))
      act(() => {
        result.current.removeDataPoint("项目2")
      })
      expect(result.current.data.find((d) => d.name === "项目2")).toBeUndefined()
    })

    it("should calculate correct total", () => {
      const { result } = renderHook(() => useChartData(testData))
      expect(result.current.total).toBe(750)
    })

    it("should calculate correct average", () => {
      const { result } = renderHook(() => useChartData(testData))
      expect(result.current.average).toBe(187.5)
    })

    it("should find max value", () => {
      const { result } = renderHook(() => useChartData(testData))
      expect(result.current.max).toBe(300)
    })

    it("should find min value", () => {
      const { result } = renderHook(() => useChartData(testData))
      expect(result.current.min).toBe(100)
    })
  })

  describe("优化点 8: 数据聚合", () => {
    it("aggregateData should group and sum correctly", () => {
      const aggregated = aggregateData(testData, "category")
      expect(aggregated.length).toBe(2)
      expect(aggregated.find((a) => a.name === "A")?.value).toBe(300)
      expect(aggregated.find((a) => a.name === "B")?.value).toBe(450)
    })
  })

  describe("优化点 9: 数据排序", () => {
    it("sortData should sort in ascending order", () => {
      const sorted = sortData(testData, "value", "asc")
      expect(sorted[0].value).toBe(100)
      expect(sorted[3].value).toBe(300)
    })

    it("sortData should sort in descending order", () => {
      const sorted = sortData(testData, "value", "desc")
      expect(sorted[0].value).toBe(300)
      expect(sorted[3].value).toBe(100)
    })
  })

  describe("优化点 10: 数据过滤", () => {
    it("filterData should filter with predicate", () => {
      const filtered = filterData(testData, (item) => item.value > 150)
      expect(filtered.length).toBe(2)
      expect(filtered.every((item) => item.value > 150)).toBe(true)
    })

    it("filterData should return empty for no matches", () => {
      const filtered = filterData(testData, (item) => item.value > 500)
      expect(filtered.length).toBe(0)
    })
  })

  describe("组合功能", () => {
    it("should chain sort and filter", () => {
      const filtered = filterData(testData, (item) => item.value >= 150)
      const sorted = sortData(filtered, "value", "desc")
      expect(sorted[0].value).toBe(300)
      expect(sorted[sorted.length - 1].value).toBe(150)
    })
  })
})
