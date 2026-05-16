import { memo } from 'react';
import { motion } from 'framer-motion';

interface FlowConnectionProps {
  isActive?: boolean;
  direction?: 'down' | 'up' | 'right';
  label?: string;
  type?: 'work' | 'idle' | 'feedback';
}

export const FlowConnection = memo(function FlowConnection({
  isActive = true,
  direction = 'down',
  label,
  type = 'work',
}: FlowConnectionProps) {
  const colorClasses = {
    work: 'from-cyan-400 to-blue-500',
    idle: 'from-purple-400 to-indigo-500',
    feedback: 'from-emerald-400 to-teal-500',
  };

  const isVertical = direction === 'down' || direction === 'up';

  return (
    <div className={`
      flex ${isVertical ? 'flex-col items-center' : 'flex-row items-center'}
      ${isVertical ? 'py-2' : 'px-4'}
    `}>
      {label && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: isActive ? 1 : 0.5 }}
          className={`
            text-xs px-2 py-0.5 rounded-full mb-1
            ${type === 'work' ? 'bg-cyan-500/20 text-cyan-300' : ''}
            ${type === 'idle' ? 'bg-purple-500/20 text-purple-300' : ''}
            ${type === 'feedback' ? 'bg-emerald-500/20 text-emerald-300' : ''}
          `}
        >
          {label}
        </motion.span>
      )}

      <div className={`
        relative
        ${isVertical ? 'w-0.5 h-16' : 'h-0.5 w-16'}
        bg-gradient-to-r ${isVertical ? 'flex-col' : ''} ${isVertical ? 'bg-gradient-to-b' : 'bg-gradient-to-r'} ${colorClasses[type]}
        ${isActive ? 'opacity-100' : 'opacity-30'}
      `}>
        {isActive && (
          <motion.div
            className={`
              absolute w-2 h-2 rounded-full
              bg-white shadow-lg shadow-white/50
            `}
            animate={
              direction === 'down' ? { top: ['0%', '100%'], opacity: [0, 1, 0] } :
              direction === 'up' ? { top: ['100%', '0%'], opacity: [0, 1, 0] } :
              direction === 'right' ? { left: ['0%', '100%'], opacity: [0, 1, 0] } :
              { left: ['100%', '0%'], opacity: [0, 1, 0] }
            }
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              top: direction === 'down' ? 0 : direction === 'up' ? 'auto' : 'auto',
              bottom: direction === 'up' ? 0 : 'auto',
            }}
          />
        )}
      </div>
    </div>
  );
});
