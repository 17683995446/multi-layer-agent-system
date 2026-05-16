import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { useState, useMemo, useCallback } from "react"

// ========== TOP 14: 数据可视化图表 (10个优化点) ==========

// 数据类型定义
interface ChartDataPoint {
  name: string
  value: number
  [key: string]: string | number
}

// 颜色配置
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

// 优化点 1: 折线图
export function SimpleLineChart({
  data,
  dataKey,
  xKey = "name",
  title,
  height = 300,
}: {
  data: ChartDataPoint[]
  dataKey: string
  xKey?: string
  title?: string
  height?: number
}) {
  return (
    <div>
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke="#8884d8"
            strokeWidth={2}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// 优化点 2: 面积图
export function SimpleAreaChart({
  data,
  dataKey,
  xKey = "name",
  title,
  height = 300,
}: {
  data: ChartDataPoint[]
  dataKey: string
  xKey?: string
  title?: string
  height?: number
}) {
  return (
    <div>
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke="#8884d8"
            fillOpacity={1}
            fill="url(#colorValue)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// 优化点 3: 柱状图
export function SimpleBarChart({
  data,
  dataKey,
  xKey = "name",
  title,
  height = 300,
}: {
  data: ChartDataPoint[]
  dataKey: string
  xKey?: string
  title?: string
  height?: number
}) {
  return (
    <div>
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Bar dataKey={dataKey} fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// 优化点 4: 饼图
export function SimplePieChart({
  data,
  dataKey = "value",
  nameKey = "name",
  title,
  height = 300,
}: {
  data: ChartDataPoint[]
  dataKey?: string
  nameKey?: string
  title?: string
  height?: number
}) {
  return (
    <div>
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey={dataKey}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// 优化点 5: 多系列折线图
export function MultiLineChart({
  data,
  lines,
  xKey = "name",
  title,
  height = 300,
}: {
  data: ChartDataPoint[]
  lines: { key: string; color: string; name: string }[]
  xKey?: string
  title?: string
  height?: number
}) {
  return (
    <div>
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          {lines.map((line) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              stroke={line.color}
              name={line.name}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// 优化点 6: 分组柱状图
export function GroupedBarChart({
  data,
  bars,
  xKey = "name",
  title,
  height = 300,
}: {
  data: ChartDataPoint[]
  bars: { key: string; color: string; name: string }[]
  xKey?: string
  title?: string
  height?: number
}) {
  return (
    <div>
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          {bars.map((bar) => (
            <Bar key={bar.key} dataKey={bar.key} fill={bar.color} name={bar.name} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// 优化点 7: 数据处理 Hook
export function useChartData(initialData: ChartDataPoint[]) {
  const [data, setData] = useState<ChartDataPoint[]>(initialData)

  const addDataPoint = useCallback((point: ChartDataPoint) => {
    setData((prev) => [...prev, point])
  }, [])

  const removeDataPoint = useCallback((name: string) => {
    setData((prev) => prev.filter((p) => p.name !== name))
  }, [])

  const updateDataPoint = useCallback((name: string, updates: Partial<ChartDataPoint>) => {
    setData((prev) =>
      prev.map((p) => (p.name === name ? { ...p, ...updates } : p))
    )
  }, [])

  const total = useMemo(() => {
    return data.reduce((sum, point) => sum + (point.value || 0), 0)
  }, [data])

  const average = useMemo(() => {
    return data.length > 0 ? total / data.length : 0
  }, [total, data.length])

  const max = useMemo(() => {
    return data.length > 0 ? Math.max(...data.map((p) => p.value || 0)) : 0
  }, [data])

  const min = useMemo(() => {
    return data.length > 0 ? Math.min(...data.map((p) => p.value || 0)) : 0
  }, [data])

  return {
    data,
    setData,
    addDataPoint,
    removeDataPoint,
    updateDataPoint,
    total,
    average,
    max,
    min,
  }
}

// 优化点 8: 数据聚合
export function aggregateData(data: ChartDataPoint[], groupBy: keyof ChartDataPoint) {
  const grouped: Record<string, number> = {}
  data.forEach((item) => {
    const key = String(item[groupBy])
    grouped[key] = (grouped[key] || 0) + (item.value || 0)
  })
  return Object.entries(grouped).map(([name, value]) => ({ name, value }))
}

// 优化点 9: 数据排序
export function sortData(data: ChartDataPoint[], key: keyof ChartDataPoint, order: "asc" | "desc" = "asc") {
  return [...data].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    if (typeof aVal === "number" && typeof bVal === "number") {
      return order === "asc" ? aVal - bVal : bVal - aVal
    }
    return 0
  })
}

// 优化点 10: 数据过滤
export function filterData(
  data: ChartDataPoint[],
  predicate: (item: ChartDataPoint) => boolean
) {
  return data.filter(predicate)
}

// 导出示例数据
export const sampleLineData = [
  { name: "1月", value: 400 },
  { name: "2月", value: 300 },
  { name: "3月", value: 600 },
  { name: "4月", value: 800 },
  { name: "5月", value: 500 },
  { name: "6月", value: 900 },
]

export const samplePieData = [
  { name: "产品A", value: 400 },
  { name: "产品B", value: 300 },
  { name: "产品C", value: 300 },
  { name: "产品D", value: 200 },
]

export const sampleMultiLineData = [
  { name: "1月", 产品A: 400, 产品B: 240, 产品C: 240 },
  { name: "2月", 产品A: 300, 产品B: 139, 产品C: 221 },
  { name: "3月", 产品A: 200, 产品B: 980, 产品C: 229 },
  { name: "4月", 产品A: 278, 产品B: 390, 产品C: 200 },
  { name: "5月", 产品A: 189, 产品B: 480, 产品C: 218 },
  { name: "6月", 产品A: 239, 产品B: 380, 产品C: 250 },
]
