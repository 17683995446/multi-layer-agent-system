import { memo } from 'react';
import { motion } from 'framer-motion';
import { Zap, Moon, Activity } from 'lucide-react';
import { SystemMode } from '@/types';

interface ModeIndicatorProps {
  mode: SystemMode;
  onSwitch?: () => void;
}

export const ModeIndicator = memo(function ModeIndicator({ mode, onSwitch }: ModeIndicatorProps) {
  const isWork = mode === 'work';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`
        relative flex items-center gap-4 px-6 py-4 rounded-2xl
        backdrop-blur-xl border
        ${isWork
          ? 'bg-gradient-to-r from-cyan-900/50 to-blue-900/50 border-cyan-500/30'
          : 'bg-gradient-to-r from-purple-900/50 to-indigo-900/50 border-purple-500/30'
        }
      `}
    >
      <motion.div
        animate={{
          scale: isWork ? [1, 1.1, 1] : 1,
          rotate: isWork ? [0, 5, -5, 0] : 0,
        }}
        transition={{
          duration: 2,
          repeat: isWork ? Infinity : 0,
          repeatType: 'reverse',
        }}
        className={`
          w-14 h-14 rounded-xl
          flex items-center justify-center
          ${isWork ? 'bg-cyan-500/20' : 'bg-purple-500/20'}
        `}
      >
        {isWork ? (
          <Zap className="w-7 h-7 text-cyan-400" />
        ) : (
          <Moon className="w-7 h-7 text-purple-400" />
        )}
      </motion.div>

      <div className="flex-1">
        <div className="text-sm text-white/60 mb-1">当前模式</div>
        <div className={`text-2xl font-bold ${isWork ? 'text-cyan-300' : 'text-purple-300'}`}>
          {isWork ? '工作模式' : '空闲模式'}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <Activity className="w-3 h-3 text-white/40" />
          <span className="text-xs text-white/50">
            {isWork ? '系统正在处理任务' : '系统处于待机状态'}
          </span>
        </div>
      </div>

      {onSwitch && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onSwitch}
          className={`
            px-4 py-2 rounded-xl font-medium text-sm
            transition-colors duration-200
            ${isWork
              ? 'bg-purple-500/30 text-purple-200 hover:bg-purple-500/50'
              : 'bg-cyan-500/30 text-cyan-200 hover:bg-cyan-500/50'
            }
          `}
        >
          切换到 {isWork ? '空闲' : '工作'}
        </motion.button>
      )}

      <div className={`
        absolute inset-0 rounded-2xl
        ${isWork ? 'bg-cyan-500/5' : 'bg-purple-500/5'}
        ${isWork ? 'animate-pulse' : ''}
      `} />
    </motion.div>
  );
});
