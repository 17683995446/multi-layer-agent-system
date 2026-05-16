import { memo } from 'react';
import { motion } from 'framer-motion';
import { Activity, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { LayerState } from '@/types';

interface MultiLayerAgentCardProps {
  layer: LayerState;
  isActive?: boolean;
  index: number;
}

const layerStatusConfiguration = {
  idle: { color: 'from-slate-700 to-slate-800', icon: Clock, glow: 'shadow-slate-500/20', text: '待机' },
  active: { color: 'from-cyan-600 to-blue-600', icon: Activity, glow: 'shadow-cyan-500/40', text: '运行' },
  error: { color: 'from-red-600 to-orange-600', icon: AlertCircle, glow: 'shadow-red-500/40', text: '异常' },
};

export const MultiLayerAgentCard = memo(function MultiLayerAgentCard({ layer, isActive, index }: MultiLayerAgentCardProps) {
  const config = layerStatusConfiguration[layer.status];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className={`relative group`}
    >
      <div
        className={`
          relative overflow-hidden rounded-2xl
          bg-gradient-to-br ${config.color}
          p-6 min-h-[180px]
          transition-all duration-300
          ${isActive ? `shadow-2xl ${config.glow} scale-[1.02]` : 'shadow-lg'}
        `}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`
                w-10 h-10 rounded-xl
                bg-white/10 backdrop-blur-sm
                flex items-center justify-center
                ${isActive ? 'animate-pulse' : ''}
              `}>
                <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-300' : 'text-white/70'}`} />
              </div>
              <div>
                <div className="text-sm font-medium text-white/60">层级 {layer.id}</div>
                <div className="text-lg font-bold text-white">{layer.name}</div>
              </div>
            </div>

            <div className={`
              px-3 py-1 rounded-full text-xs font-medium
              ${layer.status === 'active' ? 'bg-cyan-500/30 text-cyan-200' : ''}
              ${layer.status === 'idle' ? 'bg-slate-500/30 text-slate-200' : ''}
              ${layer.status === 'error' ? 'bg-red-500/30 text-red-200' : ''}
            `}>
              {config.text}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs text-white/50">子模块</div>
            <div className="flex flex-wrap gap-1">
              {layer.modules.map((module, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 + i * 0.05 }}
                  className="px-2 py-0.5 rounded-md bg-white/10 text-white/80 text-xs"
                >
                  {module}
                </motion.span>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-white/50">处理任务</div>
                <div className="text-lg font-bold text-white">{layer.metrics.tasksProcessed}</div>
              </div>
              <div>
                <div className="text-xs text-white/50">成功率</div>
                <div className="text-lg font-bold text-emerald-300">
                  {(layer.metrics.successRate * 100).toFixed(0)}%
                </div>
              </div>
              <div>
                <div className="text-xs text-white/50">平均耗时</div>
                <div className="text-lg font-bold text-amber-300">
                  {layer.metrics.avgDuration.toFixed(0)}ms
                </div>
              </div>
            </div>
          </div>
        </div>

        {isActive && (
          <motion.div
            className="absolute top-2 right-2"
            animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </motion.div>
        )}

        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </motion.div>
  );
});
