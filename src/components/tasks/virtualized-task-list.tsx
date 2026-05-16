import { memo, useCallback, useRef, useEffect } from 'react'
import { FixedSizeList as List, ListChildComponentProps } from 'react-window'
import { motion, AnimatePresence } from 'framer-motion'
import { ListTodo, Clock, CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react'
import { Task } from '@/types'

interface VirtualizedTaskListProps {
  tasks: Task[]
  height: number
  itemHeight?: number
  currentTask?: Task | null
  onTaskClick?: (task: Task) => void
  onScrollPositionChange?: (scrollOffset: number) => void
  scrollOffset?: number
}

const taskPriorityLabels = ['紧急', '高', '中', '低']
const taskPriorityColors = ['text-red-400', 'text-orange-400', 'text-yellow-400', 'text-green-400']

const taskStatusIconMap = {
  pending: Clock,
  running: AlertCircle,
  completed: CheckCircle,
  failed: XCircle,
}

const taskStatusColorMap = {
  pending: 'bg-slate-500/30 text-slate-300',
  running: 'bg-cyan-500/30 text-cyan-300 animate-pulse',
  completed: 'bg-emerald-500/30 text-emerald-300',
  failed: 'bg-red-500/30 text-red-300',
}

interface TaskItemData {
  tasks: Task[]
  currentTask: Task | null | undefined
  onTaskClick: ((task: Task) => void) | undefined
}

const TaskItem = memo(({ index, style, data }: ListChildComponentProps<TaskItemData>) => {
  const { tasks, currentTask, onTaskClick } = data
  const task = tasks[index]

  if (!task) return null

  const StatusIcon = taskStatusIconMap[task.status]
  const isCurrentlyActiveTask = currentTask?.id === task.id

  return (
    <div style={style} className="px-2">
      <motion.div
        layout
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.2 }}
        onClick={() => onTaskClick?.(task)}
        className={`
          relative p-3 rounded-xl border transition-all cursor-pointer group
          ${isCurrentlyActiveTask
            ? 'bg-cyan-500/10 border-cyan-500/50'
            : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/70'
          }
        `}
      >
        <div className="flex items-start gap-3">
          <div className={`
            w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
            ${taskStatusColorMap[task.status]}
          `}>
            <StatusIcon className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-white truncate text-sm">{task.name}</span>
              <div className="flex items-center gap-2 ml-2">
                <span className={`
                  text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0
                  ${taskPriorityColors[task.priority]}
                  bg-white/5
                `}>
                  {taskPriorityLabels[task.priority]}
                </span>
                <Eye className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </div>
            </div>

            <div className="text-xs text-slate-400">
              {task.status === 'running' && task.executedAt && (
                <>执行中... 已运行 {((Date.now() - task.executedAt) / 1000).toFixed(1)}s</>
              )}
              {task.status === 'completed' && task.duration && (
                <>完成 · 耗时 {task.duration}ms</>
              )}
              {task.status === 'failed' && (
                <span className="text-red-400">执行失败</span>
              )}
              {task.status === 'pending' && (
                <>等待调度</>
              )}
            </div>

            {isCurrentlyActiveTask && (
              <div className="mt-2">
                <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
})

TaskItem.displayName = 'TaskItem'

export const VirtualizedTaskList = memo(function VirtualizedTaskList({
  tasks,
  height,
  itemHeight = 80,
  currentTask,
  onTaskClick,
  onScrollPositionChange,
  scrollOffset = 0,
}: VirtualizedTaskListProps) {
  const listRef = useRef<List>(null)
  const lastScrollPosition = useRef(scrollOffset)

  useEffect(() => {
    if (listRef.current && scrollOffset > 0 && scrollOffset !== lastScrollPosition.current) {
      listRef.current.scrollTo(scrollOffset)
      lastScrollPosition.current = scrollOffset
    }
  }, [scrollOffset])

  const handleScroll = useCallback(({ scrollOffset: newOffset }: { scrollOffset: number }) => {
    lastScrollPosition.current = newOffset
    if (onScrollPositionChange) {
      onScrollPositionChange(newOffset)
    }
  }, [onScrollPositionChange])

  const itemData: TaskItemData = {
    tasks,
    currentTask,
    onTaskClick,
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center" style={{ height }}>
        <ListTodo className="w-12 h-12 text-slate-600 mb-4" />
        <div className="text-slate-400 text-lg mb-2">暂无待处理任务</div>
        <div className="text-sm text-slate-500">系统将进入空闲模式</div>
      </div>
    )
  }

  return (
    <List
      ref={listRef}
      height={height}
      width="100%"
      itemCount={tasks.length}
      itemSize={itemHeight}
      itemData={itemData}
      onScroll={handleScroll}
      overscanCount={5}
      className="scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800"
    >
      {TaskItem}
    </List>
  )
})

interface InfiniteTaskListProps {
  tasks: Task[]
  height: number
  itemHeight?: number
  hasMore?: boolean
  isLoading?: boolean
  currentTask?: Task | null
  onTaskClick?: (task: Task) => void
  onLoadMore?: () => void
}

export const InfiniteTaskList = memo(function InfiniteTaskList({
  tasks,
  height,
  itemHeight = 80,
  hasMore = false,
  isLoading = false,
  currentTask,
  onTaskClick,
  onLoadMore,
}: InfiniteTaskListProps) {
  const handleItemsRendered = useCallback(({ visibleRowStartIndex, visibleRowStopIndex }: any) => {
    if (hasMore && !isLoading && visibleRowStopIndex >= tasks.length - 5) {
      onLoadMore?.()
    }
  }, [hasMore, isLoading, tasks.length, onLoadMore])

  return (
    <div className="relative">
      <VirtualizedTaskList
        tasks={tasks}
        height={height}
        itemHeight={itemHeight}
        currentTask={currentTask}
        onTaskClick={onTaskClick}
      />
      
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent"
          >
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-slate-400">加载更多...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})
