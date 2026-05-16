import { memo } from 'react';
import { motion } from 'framer-motion';
import { Brain, Sparkles, BookOpen, Lightbulb, TrendingUp } from 'lucide-react';
import { EvolutionState, MemoryEntry, StrategyEntry, KnowledgeEntry } from '@/types';

interface IdleEvolutionSystemPanelProps {
  evolution: EvolutionState;
  memories: MemoryEntry[];
  strategies: StrategyEntry[];
  knowledge: KnowledgeEntry[];
}

export const IdleEvolutionSystemPanel = memo(function IdleEvolutionSystemPanel({
  evolution,
  memories,
  strategies,
  knowledge,
}: IdleEvolutionSystemPanelProps) {
  const evolutionStatisticsItems = [
    { label: '记忆碎片', value: evolution.memoriesProcessed, icon: Brain, color: 'text-cyan-400' },
    { label: '策略优化', value: evolution.strategiesOptimized, icon: TrendingUp, color: 'text-purple-400' },
    { label: '新知识', value: evolution.knowledgeGained, icon: BookOpen, color: 'text-amber-400' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-5"
    >
      <div className="flex items-center gap-3 mb-5">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center"
        >
          <Sparkles className="w-5 h-5 text-purple-400" />
        </motion.div>
        <div>
          <div className="text-lg font-bold text-white">空闲进化</div>
          <div className="text-sm text-purple-300/70">持续自我优化中</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {evolutionStatisticsItems.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="text-center p-3 rounded-xl bg-purple-500/10 border border-purple-500/20"
            >
              <Icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
              <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-slate-400">{stat.label}</div>
            </motion.div>
          );
        })}
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-slate-300">最近学习</span>
          </div>
          <div className="space-y-2">
            {knowledge.slice(0, 2).map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 rounded-lg bg-white/5 border border-white/10"
              >
                <div className="text-sm font-medium text-white mb-1">{item.topic}</div>
                <div className="text-xs text-slate-400 line-clamp-2">{item.content}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-purple-400">{item.source}</span>
                  <span className="text-xs text-slate-500">
                    置信度 {item.confidence.toFixed(0)}%
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-slate-300">核心策略</span>
          </div>
          <div className="space-y-2">
            {strategies.slice(0, 2).map((strategy) => (
              <motion.div
                key={strategy.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 rounded-lg bg-white/5 border border-white/10"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{strategy.name}</span>
                  <span className="text-xs text-emerald-400">
                    {strategy.successRate.toFixed(0)}% 成功率
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-1 mt-2">
                  <motion.div
                    className="bg-gradient-to-r from-cyan-500 to-purple-500 h-1 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${strategy.successRate * 100}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-purple-500/20">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">上次进化</span>
          <span className="text-purple-300">
            {new Date(evolution.lastEvolution).toLocaleTimeString()}
          </span>
        </div>
      </div>
    </motion.div>
  );
});
