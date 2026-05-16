import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Task } from '@/types';

interface TaskDetailModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

const statusConfig = {
  pending: {
    color: 'text-slate-400',
    bg: 'bg-slate-500/20',
    icon: Clock,
    label: '等待中',
  },
  running: {
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/20',
    icon: AlertTriangle,
    label: '执行中',
  },
  completed: {
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/20',
    icon: CheckCircle,
    label: '已完成',
  },
  failed: {
    color: 'text-red-400',
    bg: 'bg-red-500/20',
    icon: XCircle,
    label: '失败',
  },
};

const priorityLabels = ['紧急', '高', '中', '低'];
const priorityColors = [
  'border-red-500 bg-red-500/20 text-red-300',
  'border-orange-500 bg-orange-500/20 text-orange-300',
  'border-yellow-500 bg-yellow-500/20 text-yellow-300',
  'border-emerald-500 bg-emerald-500/20 text-emerald-300',
];

export function TaskDetailModal({ task, isOpen, onClose }: TaskDetailModalProps) {
  const config = statusConfig[task.status];
  const StatusIcon = config.icon;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-slate-700">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center`}>
                    <StatusIcon className={`w-6 h-6 ${config.color}`} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-white truncate">{task.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                        {config.label}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}>
                        {priorityLabels[task.priority]}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                    <div className="text-sm text-slate-400 mb-1">任务ID</div>
                    <div className="text-sm font-mono text-white truncate">{task.id}</div>
                  </div>
                  <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                    <div className="text-sm text-slate-400 mb-1">创建时间</div>
                    <div className="text-sm text-white">{formatDate(task.createdAt)}</div>
                  </div>
                  {task.executedAt && (
                    <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                      <div className="text-sm text-slate-400 mb-1">执行时间</div>
                      <div className="text-sm text-white">{formatDate(task.executedAt)}</div>
                    </div>
                  )}
                  {task.duration && (
                    <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/30">
                      <div className="text-sm text-slate-400 mb-1">耗时</div>
                      <div className="text-sm text-white">{formatDuration(task.duration)}</div>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-medium text-slate-300 mb-3">输入参数</h4>
                  <pre className="bg-slate-900/70 rounded-xl p-4 text-xs font-mono text-slate-300 overflow-x-auto border border-slate-700/30">
                    {JSON.stringify(task.input, null, 2)}
                  </pre>
                </div>

                {task.output && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-300 mb-3">输出结果</h4>
                    <pre className="bg-slate-900/70 rounded-xl p-4 text-xs font-mono text-slate-300 overflow-x-auto border border-slate-700/30">
                      {JSON.stringify(task.output, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
