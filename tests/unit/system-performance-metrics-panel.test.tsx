import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SystemPerformanceMetricsPanel } from '@/components/dashboard/system-performance-metrics-panel'
import { SystemMetrics } from '@/types'

describe('SystemPerformanceMetricsPanel Component Tests', () => {
  const mockMetrics: SystemMetrics = {
    totalTasks: 156,
    successRate: 0.923,
    failedTasks: 12,
    avgResponseTime: 234.5,
    uptime: 45234,
  }

  describe('Metrics Display', () => {
    it('should render all metric values correctly', () => {
      render(<SystemPerformanceMetricsPanel metrics={mockMetrics} />)
      
      expect(screen.getByText('156')).toBeInTheDocument()
      expect(screen.getByText('92.3%')).toBeInTheDocument()
      expect(screen.getByText('12')).toBeInTheDocument()
      expect(screen.getByText('235ms')).toBeInTheDocument()
    })

    it('should render metric labels correctly', () => {
      render(<SystemPerformanceMetricsPanel metrics={mockMetrics} />)
      
      expect(screen.getByText('总任务数')).toBeInTheDocument()
      expect(screen.getByText('成功率')).toBeInTheDocument()
      expect(screen.getByText('失败任务')).toBeInTheDocument()
      expect(screen.getByText('平均响应')).toBeInTheDocument()
    })
  })

  describe('Uptime Display', () => {
    it('should calculate and display uptime correctly', () => {
      render(<SystemPerformanceMetricsPanel metrics={mockMetrics} />)
      
      const hours = Math.floor(mockMetrics.uptime / 3600)
      const minutes = Math.floor((mockMetrics.uptime % 3600) / 60)
      
      expect(screen.getByText(`${hours}h ${minutes}m`)).toBeInTheDocument()
    })
  })

  describe('System Status', () => {
    it('should display online status', () => {
      render(<SystemPerformanceMetricsPanel metrics={mockMetrics} />)
      
      expect(screen.getByText('在线运行')).toBeInTheDocument()
    })
  })
})
