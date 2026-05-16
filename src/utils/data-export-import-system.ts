import { useState, useCallback, useMemo } from "react"

// ========== TOP 17: 高级数据导出导入系统 (10个优化点) ==========

// 数据类型定义
interface ExportData {
  data: any
  metadata: {
    exportedAt: Date
    version: string
    format: string
    checksum?: string
  }
}

interface ImportResult {
  success: boolean
  data?: any
  errors: ImportError[]
  warnings: string[]
  stats: {
    total: number
    imported: number
    skipped: number
    failed: number
  }
}

interface ImportError {
  row: number
  field: string
  message: string
  severity: "error" | "warning"
}

// 支持的导出格式
type ExportFormat = "json" | "csv" | "xml" | "xlsx" | "pdf"

// 优化点 1: JSON 导出
export function exportToJSON(data: any, pretty: boolean = true): string {
  const exportData: ExportData = {
    data,
    metadata: {
      exportedAt: new Date(),
      version: "1.0.0",
      format: "json",
    },
  }

  return pretty ? JSON.stringify(exportData, null, 2) : JSON.stringify(exportData)
}

export function downloadJSON(data: any, filename: string = "export.json") {
  const content = exportToJSON(data)
  downloadFile(content, filename, "application/json")
}

// 优化点 2: CSV 导出
export function exportToCSV(
  data: any[],
  headers?: string[]
): { headers: string[]; rows: string[][] } {
  if (data.length === 0) {
    return { headers: [], rows: [] }
  }

  const csvHeaders = headers || Object.keys(data[0])
  const rows = data.map((item) =>
    csvHeaders.map((header) => {
      const value = item[header]
      if (value === null || value === undefined) return ""
      if (typeof value === "string") {
        return value.includes(",") || value.includes('"') || value.includes("\n")
          ? `"${value.replace(/"/g, '""')}"`
          : value
      }
      return String(value)
    })
  )

  return { headers: csvHeaders, rows }
}

export function downloadCSV(data: any[], filename: string = "export.csv") {
  const { headers, rows } = exportToCSV(data)
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n")

  downloadFile(csvContent, filename, "text/csv")
}

// 优化点 3: Excel 导出 (简化版)
export async function exportToExcel(data: any[]): Promise<Blob> {
  const { headers, rows } = exportToCSV(data)
  const worksheet = [headers, ...rows]
  const csvContent = worksheet.map((row) => row.join(",")).join("\n")

  return new Blob([csvContent], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
}

// 优化点 4: 文件下载工具
function downloadFile(
  content: string | Blob,
  filename: string,
  mimeType: string
) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// 优化点 5: JSON 导入
export function importFromJSON<T>(content: string): ImportResult {
  try {
    const parsed = JSON.parse(content)
    const data = parsed.data || parsed

    return {
      success: true,
      data: data as T,
      errors: [],
      warnings: [],
      stats: {
        total: Array.isArray(data) ? data.length : 1,
        imported: Array.isArray(data) ? data.length : 1,
        skipped: 0,
        failed: 0,
      },
    }
  } catch (error) {
    return {
      success: false,
      errors: [
        {
          row: 0,
          field: "",
          message: `JSON解析失败: ${(error as Error).message}`,
          severity: "error",
        },
      ],
      warnings: [],
      stats: {
        total: 0,
        imported: 0,
        skipped: 0,
        failed: 1,
      },
    }
  }
}

// 优化点 6: CSV 导入
export function importFromCSV<T>(
  content: string,
  options?: {
    delimiter?: string
    hasHeader?: boolean
    onRowValidate?: (row: any, index: number) => boolean
  }
): ImportResult {
  const delimiter = options?.delimiter || ","
  const lines = content.split("\n").filter((line) => line.trim())

  if (lines.length === 0) {
    return {
      success: false,
      errors: [{ row: 0, field: "", message: "CSV文件为空", severity: "error" }],
      warnings: [],
      stats: { total: 0, imported: 0, skipped: 0, failed: 0 },
    }
  }

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim())
        current = ""
      } else {
        current += char
      }
    }
    result.push(current.trim())

    return result
  }

  const parseResult = parseCSVLine(lines[0])
  const hasHeader = options?.hasHeader !== false
  const headers = hasHeader ? parseResult : parseResult.map((_, i) => `field${i}`)

  const dataRows = hasHeader ? lines.slice(1) : lines
  const importedData: T[] = []
  const errors: ImportError[] = []
  const warnings: string[] = []

  dataRows.forEach((line, index) => {
    const values = parseCSVLine(line)
    const rowData: any = {}

    headers.forEach((header, i) => {
      rowData[header] = values[i] || ""
    })

    if (options?.onRowValidate) {
      const isValid = options.onRowValidate(rowData, index)
      if (!isValid) {
        errors.push({
          row: index + 1,
          field: "",
          message: "行验证失败",
          severity: "warning",
        })
        warnings.push(`第 ${index + 1} 行验证失败`)
      } else {
        importedData.push(rowData as T)
      }
    } else {
      importedData.push(rowData as T)
    }
  })

  return {
    success: errors.filter((e) => e.severity === "error").length === 0,
    data: importedData,
    errors,
    warnings,
    stats: {
      total: dataRows.length,
      imported: importedData.length,
      skipped: warnings.length,
      failed: errors.filter((e) => e.severity === "error").length,
    },
  }
}

// 优化点 7: 文件上传处理
export function useFileUpload(options?: {
  accept?: string
  maxSize?: number
  onUpload?: (file: File) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0]
      if (!selectedFile) return

      if (options?.maxSize && selectedFile.size > options.maxSize) {
        setError(`文件大小超过限制 (最大 ${options.maxSize} bytes)`)
        return
      }

      setFile(selectedFile)
      setError(null)
      options?.onUpload?.(selectedFile)
    },
    [options]
  )

  const uploadFile = useCallback(
    async (uploadFn: (file: File) => Promise<any>) => {
      if (!file) return

      setUploading(true)
      setError(null)

      try {
        const result = await uploadFn(file)
        return result
      } catch (err) {
        setError((err as Error).message)
        throw err
      } finally {
        setUploading(false)
      }
    },
    [file]
  )

  return {
    file,
    uploading,
    error,
    handleFileSelect,
    uploadFile,
    clearFile: () => setFile(null),
  }
}

// 优化点 8: 批量导出
export async function batchExport(
  datasets: { name: string; data: any[] }[],
  format: ExportFormat = "csv"
): Promise<Blob> {
  const timestamp = new Date().toISOString().split("T")[0]
  const results: { [key: string]: any } = {}

  for (const dataset of datasets) {
    results[dataset.name] = dataset.data
  }

  const content = exportToJSON(results)

  return new Blob([content], { type: "application/json" })
}

// 优化点 9: 数据转换
export function transformData<T>(
  data: any[],
  transformers: {
    [K in keyof T]?: (value: any, item: any) => T[K]
  }
): T[] {
  return data.map((item) => {
    const result: any = {}
    Object.keys(transformers).forEach((key) => {
      const transformer = transformers[key as keyof T]
      if (transformer) {
        result[key] = transformer(item[key], item)
      } else {
        result[key] = item[key]
      }
    })
    return result as T
  })
}

// 优化点 10: 导出历史记录
export function useExportHistory(maxItems: number = 50) {
  const [history, setHistory] = useState<
    Array<{
      id: string
      filename: string
      format: ExportFormat
      exportedAt: Date
      size: number
    }>
  >([])

  const addToHistory = useCallback(
    (filename: string, format: ExportFormat, size: number) => {
      const entry = {
        id: `export-${Date.now()}`,
        filename,
        format,
        exportedAt: new Date(),
        size,
      }

      setHistory((prev) => {
        const newHistory = [entry, ...prev]
        if (newHistory.length > maxItems) {
          return newHistory.slice(0, maxItems)
        }
        return newHistory
      })
    },
    [maxItems]
  )

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  const exportHistoryToJSON = useCallback(() => {
    return exportToJSON(history)
  }, [history])

  return {
    history,
    addToHistory,
    clearHistory,
    exportHistoryToJSON,
  }
}

// 辅助函数: 验证导入数据
export function validateImportData<T>(
  data: T[],
  schema: {
    required?: (keyof T)[]
    optional?: (keyof T)[]
    custom?: (item: T) => boolean
  }
): { valid: boolean; invalidItems: T[] } {
  const invalidItems: T[] = []

  for (const item of data) {
    if (schema.required) {
      for (const field of schema.required) {
        if (item[field] === null || item[field] === undefined) {
          invalidItems.push(item)
          break
        }
      }
    }

    if (schema.custom && !schema.custom(item)) {
      if (!invalidItems.includes(item)) {
        invalidItems.push(item)
      }
    }
  }

  return {
    valid: invalidItems.length === 0,
    invalidItems,
  }
}
