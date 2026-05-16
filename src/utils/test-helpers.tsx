// 单元测试报告 - 系统功能验证
import { useState } from 'react'

// 模拟系统状态管理工具
export function useTestSystem() {
  const [testResults, setTestResults] = useState<any[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [activeTestName, setActiveTestName] = useState<string | null>(null)

  const runTest = async (name: string, testFunction: () => Promise<boolean>) => {
    setIsRunning(true)
    setActiveTestName(name)
    
    const startTime = Date.now()
    
    try {
      const result = await testFunction()
      const duration = Date.now() - startTime
      
      setTestResults(prev => [...prev, {
        name,
        passed: result,
        duration,
        timestamp: new Date().toLocaleTimeString()
      }])
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      
      setTestResults(prev => [...prev, {
        name,
        passed: false,
        duration,
        error: String(error),
        timestamp: new Date().toLocaleTimeString()
      }])
      
      return false
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  const getStats = () => {
    const passed = testResults.filter(t => t.passed).length
    const failed = testResults.filter(t => !t.passed).length
    const total = testResults.length
    const avgDuration = total > 0 
      ? testResults.reduce((sum, t) => sum + t.duration, 0) / total 
      : 0
    
    return { passed, failed, total, avgDuration }
  }

  return {
    testResults,
    isRunning,
    activeTestName,
    runTest,
    clearResults,
    getStats
  }
}

// 测试用例示例
export const testCases = [
  {
    name: "字符串格式化测试",
    description: "测试基本的字符串操作",
    test: async () => {
      const str = "Hello, World!"
      return str.length === 13 && str.includes("Hello")
    }
  },
  {
    name: "数组操作测试",
    description: "测试数组的 map 和 filter",
    test: async () => {
      const arr = [1, 2, 3, 4, 5]
      const doubled = arr.map(n => n * 2)
      const filtered = doubled.filter(n => n > 4)
      return JSON.stringify(doubled) === "[2,4,6,8,10]" && filtered.length === 3
    }
  },
  {
    name: "异步 Promise 测试",
    description: "测试异步操作",
    test: async () => {
      await new Promise(resolve => setTimeout(resolve, 50))
      return true
    }
  }
]
