import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListTodo, Clock, CheckCircle, XCircle, AlertCircle, Eye } from 'lucide-react';
import { Task } from '@/types';

interface TaskQueueProps {
  tasks: Task[];
  currentTask: Task | null;
  onTaskClick?: (task: Task) => void;
}

const priorityLabels = ['紧急', '高', '中', '低'];
const priorityColors = ['text-red-400', 'text-orange-400', 'text-yellow-400', 'text-green-400'];

const statusIcons = {
  pending: Clock,
  running: AlertCircle,
  completed: CheckCircle,
  failed: XCircle,
};

const statusColors = {
  pending: 'bg-slate-500/30 text-slate-300',
  running: 'bg-cyan-500/30 text-cyan-300 animate-pulse',
  completed: 'bg-emerald-500/30 text-emerald-300',
  failed: 'bg-red-500/30 text-red-300',
};

export const TaskQueue = memo(function TaskQueue({ tasks, currentTask, onTaskClick }: TaskQueueProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-5"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
          <ListTodo className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <div className="text-lg font-bold text-white">任务队列</div>
          <div className="text-sm text-slate-400">
            {tasks.length} 个待处理任务
          </div>
        </div>
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {tasks.map((task, index) => {
            const StatusIcon = statusIcons[task.status];
            const isCurrent = currentTask?.id === task.id;

            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => onTaskClick?.(task)}
                className={`
                  relative p-4 rounded-xl border transition-all cursor-pointer group
                  ${isCurrent
                    ? 'bg-cyan-500/10 border-cyan-500/50'
                    : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/70'
                  }
                `}
              >
                <div className="flex items-start gap-3">
                  <div className={`
                    w-8 h-8 rounded-lg flex items-center justify-center
                    ${statusColors[task.status]}
                  `}>
                    <StatusIcon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-white truncate">{task.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`
                          text-xs font-medium px-2 py-0.5 rounded-full
                          ${priorityColors[task.priority]}
                          bg-white/5
                        `}>
                          {priorityLabels[task.priority]}
                        </span>
                        <Eye className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
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

                    {isCurrent && (
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
            );
          })}
        </AnimatePresence>

        {tasks.length === 0 && (
          <div className="py-12 text-center">
            <ListTodo className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <div className="text-slate-400">暂无待处理任务</div>
            <div className="text-xs text-slate-500 mt-1">系统将进入空闲模式</div>
          </div>
        )}
      </div>
    </motion.div>
  );
});
