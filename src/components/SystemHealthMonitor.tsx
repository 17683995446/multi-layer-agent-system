import React, { useEffect } from 'react';
import { useSystemStore } from '@/stores/systemStore';
import { bugDetector } from '@/utils/automated-bug-detector';

export const SystemHealthMonitor: React.FC = () => {
  const {
    layers,
    metrics,
    notifications,
    updateLayerStatus,
    addNotification
  } = useSystemStore();
  
  useEffect(() => {
    // 启动bug检测
    bugDetector.startMonitoring(5000);
    
    return () => {
      bugDetector.stopMonitoring();
    };
  }, []);
  
  useEffect(() => {
    const interval = setInterval(() => {
      layers.forEach((layer, index) => {
        if (layer.status !== 'processing') {
          const newMetrics = {
            cpuUsage: 20 + Math.random() * 30,
            memoryUsage: 30 + Math.random() * 40,
            taskCount: layer.metrics.taskCount,
            avgResponseTime: layer.metrics.avgResponseTime,
            successRate: layer.metrics.successRate
          };
          
          if (index === 4 && layer.status === 'active' && Math.random() > 0.9) {
            updateLayerStatus(layer.id, {
              status: 'processing',
              metrics: newMetrics
            });
          } else {
            updateLayerStatus(layer.id, {
              metrics: newMetrics
            });
          }
        }
      });
    }, 3000);
    
    return () => {
      clearInterval(interval);
    };
  }, [layers, updateLayerStatus]);
  
  return (
    <div className="fixed bottom-4 right-4 bg-slate-900/95 border border-emerald-500/30 rounded-lg p-4 w-80 z-50 shadow-2xl">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
        <h3 className="text-emerald-400 font-semibold text-sm">系统健康监控</h3>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between text-slate-300">
          <span>任务总数:</span>
          <span className="text-cyan-400">{metrics.totalTasks}</span>
        </div>
        <div className="flex justify-between text-slate-300">
          <span>成功率:</span>
          <span className="text-green-400">{metrics.successRate.toFixed(1)}%</span>
        </div>
        <div className="flex justify-between text-slate-300">
          <span>通知数:</span>
          <span className="text-yellow-400">{notifications.length}</span>
        </div>
        <div className="flex justify-between text-slate-300">
          <span>层级状态:</span>
          <span className="text-purple-400">
            {layers.filter(l => l.status === 'active').length} 活跃 / {layers.length}
          </span>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-slate-700">
        <div className="text-slate-500 text-xs">
          监控间隔: 5秒
        </div>
      </div>
    </div>
  );
};
