import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Plus, Zap } from 'lucide-react';
import { useSystemStore } from '@/stores/systemStore';
import { LayerCard } from '@/components/layers/LayerCard';
import { ModeIndicator } from '@/components/common/ModeIndicator';
import { TaskQueue } from '@/components/common/TaskQueue';
import { MetricsPanel } from '@/components/common/MetricsPanel';
import { EvolutionPanel } from '@/components/common/EvolutionPanel';
import { GlobalGuard } from '@/components/common/GlobalGuard';
import { FlowConnection } from '@/components/visualization/FlowConnection';
import { AddTaskModal } from '@/components/common/AddTaskModal';
import { TaskDetailModal } from '@/components/common/TaskDetailModal';
import { HistoryPanel } from '@/components/common/HistoryPanel';
import { Task } from '@/types';

const taskNames = [
  '数据采集任务',
  '模型推理任务',
  '日志分析任务',
  '报告生成任务',
  '系统诊断任务',
  '配置更新任务',
  '备份同步任务',
  '监控告警任务',
];

export default function Dashboard() {
  const {
    mode,
    layers,
    tasks,
    currentTask,
    metrics,
    evolution,
    memories,
    strategies,
    knowledge,
    isRunning,
    systemStartTime,
    setMode,
    addTask,
    updateTask,
    setCurrentTask,
    updateLayerStatus,
    updateMetrics,
    updateEvolution,
    start,
    stop,
  } = useSystemStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleQuickAddTask = useCallback(() => {
    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: taskNames[Math.floor(Math.random() * taskNames.length)],
      priority: Math.floor(Math.random() * 4),
      status: 'pending',
      input: { timestamp: Date.now() },
      createdAt: Date.now(),
    };
    addTask(newTask);
  }, [addTask]);

  const handleToggleSystem = useCallback(() => {
    if (isRunning) {
      stop();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else {
      start();
      intervalRef.current = setInterval(() => {
        const store = useSystemStore.getState();
        const pendingTasks = store.tasks.filter(t => t.status === 'pending');

        if (pendingTasks.length > 0 && store.currentTask === null) {
          const nextTask = pendingTasks.sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority;
            return a.createdAt - b.createdAt;
          })[0];

          setCurrentTask(nextTask);
          updateTask(nextTask.id, { status: 'running', executedAt: Date.now() });
          updateLayerStatus(3, { status: 'active' });
          updateLayerStatus(4, { status: 'active' });
          setMode('work');
        } else if (pendingTasks.length === 0 && store.currentTask === null) {
          setMode('idle');
          updateLayerStatus(3, { status: 'idle' });
          updateLayerStatus(4, { status: 'idle' });
          updateLayerStatus(6, { status: 'active' });

          if (Math.random() > 0.7) {
            updateEvolution({
              memoriesProcessed: store.evolution.memoriesProcessed + 1,
              lastEvolution: Date.now(),
            });
          }
        }

        if (store.currentTask) {
          const elapsed = Date.now() - store.currentTask.executedAt!;
          if (elapsed > 2000) {
            const success = Math.random() > 0.2;

            if (success) {
              updateTask(store.currentTask.id, {
                status: 'completed',
                output: { result: 'success' },
                duration: elapsed,
              });
              updateLayerStatus(5, { status: 'active' });
              updateMetrics({
                completedTasks: store.metrics.completedTasks + 1,
                successRate: (store.metrics.completedTasks + 1) / (store.metrics.totalTasks || 1),
              });
            } else {
              updateTask(store.currentTask.id, {
                status: 'failed',
                output: { error: 'Execution failed' },
                duration: elapsed,
              });
              updateMetrics({
                failedTasks: store.metrics.failedTasks + 1,
              });
            }

            updateLayerStatus(4, { status: 'idle' });
            updateLayerStatus(5, { status: 'idle' });
            updateLayerStatus(6, { status: 'idle' });
            setCurrentTask(null);
          }
        }

        updateMetrics({
          uptime: Math.floor((Date.now() - store.systemStartTime) / 1000),
          avgResponseTime: 50 + Math.random() * 100,
        });
      }, 500);
    }
  }, [isRunning, start, stop, setCurrentTask, updateTask, updateLayerStatus, updateMetrics, updateEvolution, setMode]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.1),transparent_50%)]" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(139,92,246,0.1),transparent_50%)]" />

      <div className="relative z-10">
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/50 border-b border-slate-800/50">
          <div className="max-w-full mx-auto px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">多层级自主智能体</h1>
                  <p className="text-xs text-slate-400 hidden sm:block">Multi-Layer Agent System</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 flex-wrap"
              >
                <ModeIndicator mode={mode} />

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleQuickAddTask}
                  disabled={!isRunning}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-sm
                    transition-all duration-200
                    ${isRunning
                      ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30'
                      : 'bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-700/50'
                    }
                  `}
                >
                  <Plus className="w-3.5 h-3.5" />
                  快速添加
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddModal(true)}
                  disabled={!isRunning}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-sm
                    transition-all duration-200
                    ${isRunning
                      ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/30'
                      : 'bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-700/50'
                    }
                  `}
                >
                  <Plus className="w-3.5 h-3.5" />
                  自定义
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleToggleSystem}
                  className={`
                    flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm
                    transition-all duration-200 shadow-lg
                    ${isRunning
                      ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white hover:from-red-600 hover:to-orange-600'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600'
                    }
                  `}
                >
                  {isRunning ? (
                    <>
                      <Pause className="w-3.5 h-3.5" />
                      停止
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      启动
                    </>
                  )}
                </motion.button>
              </motion.div>
            </div>
          </div>
        </header>

        <main className="max-w-full mx-auto px-4 py-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <div>
                <h2 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">
                  系统层级架构
                </h2>
                <div className="space-y-2">
                  {layers.map((layer, index) => (
                    <div key={layer.id}>
                      <LayerCard
                        layer={layer}
                        isActive={layer.status === 'active'}
                        index={index}
                      />
                      {index < layers.length - 1 && (
                        <FlowConnection
                          isActive={isRunning && (mode === 'work' ? index < 4 : index >= 2)}
                          direction="down"
                          label={
                            index === 2 && mode === 'work' ? '工作流' :
                            index === 2 && mode === 'idle' ? '空闲流' :
                            index === 4 ? '反馈' :
                            undefined
                          }
                          type={index === 2 ? (mode === 'work' ? 'work' : 'idle') : 'feedback'}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <GlobalGuard isHealthy={isRunning} />
            </div>

            <div className="space-y-6">
              <MetricsPanel metrics={metrics} />
              <TaskQueue tasks={tasks} currentTask={currentTask} onTaskClick={setSelectedTask} />
              <HistoryPanel tasks={tasks} onTaskClick={setSelectedTask} />
              <EvolutionPanel
                evolution={evolution}
                memories={memories}
                strategies={strategies}
                knowledge={knowledge}
              />
            </div>
          </div>
        </main>

        <AddTaskModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={(task) => {
            addTask(task);
            setShowAddModal(false);
          }}
        />

        {selectedTask && (
          <TaskDetailModal
            task={selectedTask}
            isOpen={!!selectedTask}
            onClose={() => setSelectedTask(null)}
          />
        )}
      </div>
    </div>
  );
}
