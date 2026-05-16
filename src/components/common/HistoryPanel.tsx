import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
} from 'lucide-react';
import { Task } from '@/types';

interface HistoryPanelProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

const statusIcons = {
  pending: Clock,
  running: AlertTriangle,
  completed: CheckCircle,
  failed: XCircle,
};

const statusColors = {
  pending: 'text-slate-400',
  running: 'text-cyan-400',
  completed: 'text-emerald-400',
  failed: 'text-red-400',
};

const statusBgColors = {
  pending: 'bg-slate-500/20',
  running: 'bg-cyan-500/20',
  completed: 'bg-emerald-500/20',
  failed: 'bg-red-500/20',
};

const priorityLabels = ['紧急', '高', '中', '低'];
const priorityColors = [
  'border-red-500 bg-red-500/20 text-red-300',
  'border-orange-500 bg-orange-500/20 text-orange-300',
  'border-yellow-500 bg-yellow-500/20 text-yellow-300',
  'border-emerald-500 bg-emerald-500/20 text-emerald-300',
];

export function HistoryPanel({ tasks, onTaskClick }: HistoryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filter, setFilter] = useState<'all' | 'completed' | 'failed'>('all');

  const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'failed');
  const filteredTasks = completedTasks.filter(t =>
    filter === 'all' ? true : t.status === filter
  ).sort((a, b) => b.createdAt - a.createdAt);

  const recentTasks = isExpanded ? filteredTasks : filteredTasks.slice(0, 3);

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return `${Math.floor(diff / 86400000)}天前`;
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const stats = {
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed').length,
    successRate: tasks.length > 0
      ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)
      : 0,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden"
    >
      <div className="p-5 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <History className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-lg font-bold text-white">执行历史</div>
              <div className="text-sm text-slate-400">
                共 {completedTasks.length} 条记录
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-emerald-400">{stats.completed}</div>
            <div className="text-xs text-emerald-300/70">成功</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-red-400">{stats.failed}</div>
            <div className="text-xs text-red-300/70">失败</div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.successRate}%</div>
            <div className="text-xs text-blue-300/70">成功率</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'completed', 'failed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`
                px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                ${filter === f
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-slate-800/30 text-slate-400 border border-transparent hover:bg-slate-700/30'
                }
              `}
            >
              {f === 'all' ? '全部' : f === 'completed' ? '成功' : '失败'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto custom-scrollbar">
        <AnimatePresence>
          {recentTasks.length > 0 ? (
            recentTasks.map((task, index) => {
              const StatusIcon = statusIcons[task.status];

              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => onTaskClick?.(task)}
                  className="p-4 border-b border-slate-700/30 last:border-0 hover:bg-slate-800/30 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                      ${statusBgColors[task.status]}
                    `}>
                      <StatusIcon className={`w-4 h-4 ${statusColors[task.status]}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-white truncate">{task.name}</span>
                        <span className={`
                          text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0
                          ${priorityColors[task.priority]}
                        `}>
                          {priorityLabels[task.priority]}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{formatTime(task.createdAt)}</span>
                        <span>{formatDuration(task.duration)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="p-8 text-center">
              <History className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <div className="text-slate-400 text-sm">暂无历史记录</div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {filteredTasks.length > 3 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-3 flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800/30 transition-colors border-t border-slate-700/30"
        >
          {isExpanded ? (
            <>
              <ArrowUp className="w-4 h-4" />
              收起
            </>
          ) : (
            <>
              <ArrowDown className="w-4 h-4" />
              查看更多 ({filteredTasks.length - 3}条)
            </>
          )}
        </button>
      )}
    </motion.div>
  );
}
