import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SystemModeIndicatorDisplay } from '@/components/dashboard/system-mode-indicator-display'

describe('SystemModeIndicatorDisplay Component Tests', () => {
  describe('Work Mode Display', () => {
    it('should render work mode correctly', () => {
      render(<SystemModeIndicatorDisplay mode="work" />)
      
      expect(screen.getByText('工作模式')).toBeInTheDocument()
      expect(screen.getByText('系统正在处理任务')).toBeInTheDocument()
    })

    it('should show switch button when onSwitch is provided', async () => {
      const mockSwitch = vi.fn()
      render(<SystemModeIndicatorDisplay mode="work" onSwitch={mockSwitch} />)
      
      const switchButton = screen.getByText('切换到 空闲')
      expect(switchButton).toBeInTheDocument()
      
      await userEvent.click(switchButton)
      expect(mockSwitch).toHaveBeenCalledTimes(1)
    })

    it('should not show switch button when onSwitch is not provided', () => {
      render(<SystemModeIndicatorDisplay mode="work" />)
      
      expect(screen.queryByText('切换到 空闲')).not.toBeInTheDocument()
    })
  })

  describe('Idle Mode Display', () => {
    it('should render idle mode correctly', () => {
      render(<SystemModeIndicatorDisplay mode="idle" />)
      
      expect(screen.getByText('空闲模式')).toBeInTheDocument()
      expect(screen.getByText('系统处于待机状态')).toBeInTheDocument()
    })

    it('should show correct switch button text for idle mode', async () => {
      const mockSwitch = vi.fn()
      render(<SystemModeIndicatorDisplay mode="idle" onSwitch={mockSwitch} />)
      
      const switchButton = screen.getByText('切换到 工作')
      expect(switchButton).toBeInTheDocument()
    })
  })
})
