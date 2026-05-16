import { memo } from 'react';
import { motion } from 'framer-motion';
import { Shield, Heart, Database, Monitor, Wifi, AlertTriangle } from 'lucide-react';

interface GlobalGuardProps {
  isHealthy?: boolean;
}

export const GlobalGuard = memo(function GlobalGuard({ isHealthy = true }: GlobalGuardProps) {
  const modules = [
    { name: '保活监控', icon: Wifi, status: 'active', desc: '心跳检测' },
    { name: '故障自愈', icon: Heart, status: 'active', desc: '自动恢复' },
    { name: '数据备份', icon: Database, status: 'active', desc: '实时同步' },
    { name: '系统监控', icon: Monitor, status: 'active', desc: '性能追踪' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 blur-xl" />

      <div className="relative bg-gradient-to-r from-emerald-900/50 to-teal-900/50 backdrop-blur-xl rounded-2xl border border-emerald-500/30 p-5 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.1),transparent_70%)]" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="relative"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-emerald-400" />
                </div>
                {isHealthy && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.div>
              <div>
                <div className="text-lg font-bold text-white">全局保障层</div>
                <div className="text-sm text-emerald-300/70">
                  全程高可用支撑 · 后台运行
                </div>
              </div>
            </div>

            {!isHealthy && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-300">系统告警</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {modules.map((module, index) => {
              const Icon = module.icon;
              return (
                <motion.div
                  key={module.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center"
                >
                  <div className="w-8 h-8 mx-auto mb-2 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-sm font-medium text-white mb-1">{module.name}</div>
                  <div className="text-xs text-emerald-300/60">{module.desc}</div>
                  <div className="mt-2 flex items-center justify-center gap-1">
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                    />
                    <span className="text-xs text-emerald-400">在线</span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-emerald-500/20">
            <div className="flex items-center justify-between text-sm">
              <span className="text-emerald-300/70">保障状态</span>
              <motion.span
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-emerald-400 font-medium"
              >
                所有模块运行正常
              </motion.span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
