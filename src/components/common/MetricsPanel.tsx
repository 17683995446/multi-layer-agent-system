import { memo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, CheckCircle, XCircle, Clock, Activity } from 'lucide-react';
import { SystemMetrics } from '@/types';

interface MetricsPanelProps {
  metrics: SystemMetrics;
}

export const MetricsPanel = memo(function MetricsPanel({ metrics }: MetricsPanelProps) {
  const cards = [
    {
      label: '总任务数',
      value: metrics.totalTasks,
      icon: Activity,
      color: 'cyan',
      gradient: 'from-cyan-500/20 to-blue-500/20',
    },
    {
      label: '成功率',
      value: `${(metrics.successRate * 100).toFixed(1)}%`,
      icon: CheckCircle,
      color: 'emerald',
      gradient: 'from-emerald-500/20 to-green-500/20',
    },
    {
      label: '失败任务',
      value: metrics.failedTasks,
      icon: XCircle,
      color: 'red',
      gradient: 'from-red-500/20 to-orange-500/20',
    },
    {
      label: '平均响应',
      value: `${metrics.avgResponseTime.toFixed(0)}ms`,
      icon: Clock,
      color: 'amber',
      gradient: 'from-amber-500/20 to-yellow-500/20',
    },
  ];

  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    cyan: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    red: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
    amber: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-5"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <div className="text-lg font-bold text-white">系统指标</div>
          <div className="text-sm text-slate-400">实时性能监控</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {cards.map((card, index) => {
          const Icon = card.icon;
          const colors = colorMap[card.color];

          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`
                p-4 rounded-xl
                bg-gradient-to-br ${card.gradient}
                border ${colors.border}
              `}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-8 h-8 rounded-lg ${colors.bg} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${colors.text}`} />
                </div>
              </div>
              <div className={`text-2xl font-bold ${colors.text}`}>{card.value}</div>
              <div className="text-xs text-slate-400 mt-1">{card.label}</div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-5 pt-4 border-t border-slate-700/50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">系统运行时间</span>
          <span className="text-cyan-400 font-medium">
            {Math.floor(metrics.uptime / 3600)}h {Math.floor((metrics.uptime % 3600) / 60)}m
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-slate-400">系统状态</span>
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-emerald-400 font-medium flex items-center gap-1"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            在线运行
          </motion.span>
        </div>
      </div>
    </motion.div>
  );
});
