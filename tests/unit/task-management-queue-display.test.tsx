import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TaskManagementQueueDisplay } from '@/components/tasks/task-management-queue-display'
import { Task } from '@/types'

describe('TaskManagementQueueDisplay Component Tests', () => {
  const mockTasks: Task[] = [
    {
      id: '1',
      name: '数据分析任务',
      status: 'pending',
      priority: 1,
      createdAt: Date.now(),
      layerId: 'layer-1',
      result: undefined,
    },
    {
      id: '2',
      name: '模型训练任务',
      status: 'running',
      priority: 0,
      createdAt: Date.now(),
      executedAt: Date.now(),
      layerId: 'layer-1',
      result: undefined,
    },
    {
      id: '3',
      name: '数据清洗任务',
      status: 'completed',
      priority: 2,
      createdAt: Date.now(),
      completedAt: Date.now(),
      duration: 1500,
      layerId: 'layer-1',
      result: '清洗完成',
    },
  ]

  describe('Task List Rendering', () => {
    it('should render all tasks correctly', () => {
      render(<TaskManagementQueueDisplay tasks={mockTasks} currentTask={null} />)
      
      expect(screen.getByText('数据分析任务')).toBeInTheDocument()
      expect(screen.getByText('模型训练任务')).toBeInTheDocument()
      expect(screen.getByText('数据清洗任务')).toBeInTheDocument()
    })

    it('should display task count', () => {
      render(<TaskManagementQueueDisplay tasks={mockTasks} currentTask={null} />)
      
      expect(screen.getByText('3 个待处理任务')).toBeInTheDocument()
    })

    it('should show empty state when no tasks', () => {
      render(<TaskManagementQueueDisplay tasks={[]} currentTask={null} />)
      
      expect(screen.getByText('暂无待处理任务')).toBeInTheDocument()
      expect(screen.getByText('系统将进入空闲模式')).toBeInTheDocument()
    })
  })

  describe('Task Priority Display', () => {
    it('should display correct priority labels', () => {
      render(<TaskManagementQueueDisplay tasks={mockTasks} currentTask={null} />)
      
      expect(screen.getByText('紧急')).toBeInTheDocument()
      expect(screen.getByText('高')).toBeInTheDocument()
      expect(screen.getByText('中')).toBeInTheDocument()
    })
  })

  describe('Task Status Display', () => {
    it('should show running status correctly', () => {
      render(<TaskManagementQueueDisplay tasks={[mockTasks[1]]} currentTask={mockTasks[1]} />)
      
      expect(screen.getByText(/执行中\.\.\./)).toBeInTheDocument()
    })

    it('should show completed status correctly', () => {
      render(<TaskManagementQueueDisplay tasks={[mockTasks[2]]} currentTask={null} />)
      
      expect(screen.getByText(/完成 · 耗时 \d+ms/)).toBeInTheDocument()
    })

    it('should show pending status correctly', () => {
      render(<TaskManagementQueueDisplay tasks={[mockTasks[0]]} currentTask={null} />)
      
      expect(screen.getByText('等待调度')).toBeInTheDocument()
    })
  })

  describe('Task Click Interaction', () => {
    it('should call onTaskClick when task is clicked', async () => {
      const mockClick = vi.fn()
      render(<TaskManagementQueueDisplay tasks={mockTasks} currentTask={null} onTaskClick={mockClick} />)
      
      const task = screen.getByText('数据分析任务')
      await userEvent.click(task)
      
      expect(mockClick).toHaveBeenCalledWith(mockTasks[0])
    })
  })
})
