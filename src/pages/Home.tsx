import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Task } from '@/types';
import { useSystemStore } from '@/stores/systemStore';
import { Toaster, toast } from 'sonner';

const taskNames = [
  '数据分析任务', '数据处理', '用户请求', '系统诊断',
  '知识图谱构建', '模型训练', '数据同步', '批量处理',
  '报告生成', '系统备份', '智能推理', '数据校验'
];

export default function Home() {
  const {
    layers,
    tasks,
    currentTask,
    metrics,
    memories,
    strategies,
    notifications,
    isRunning,
    addTask,
    setCurrentTask,
    updateLayerStatus,
    updateMetrics,
    addMemory,
    updateTask,
    startSystem,
    stopSystem,
    storageWarning,
    lastError,
    setLastError,
    executeTask
  } = useSystemStore();

  const [queueProcessing, setQueueProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'system' | 'metrics'>('system');

  const handleQuickAdd = useCallback(() => {
    const newTask: Task = {
      id: `task-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      name: taskNames[Math.floor(Math.random() * taskNames.length)],
      priority: Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3 | 4,
      status: 'pending',
      input: { timestamp: Date.now(), source: 'user' },
      createdAt: Date.now()
    };
    
    addTask(newTask);
    toast.success('新任务已添加');
  }, [addTask]);

  const handleBatchAdd = useCallback(() => {
    const count = 5 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      const newTask: Task = {
        id: `task-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
        name: taskNames[Math.floor(Math.random() * taskNames.length)],
        priority: Math.floor(Math.random() * 4) as 0 | 1 | 2 | 3 | 4,
        status: 'pending',
        input: { timestamp: Date.now(), batch: true },
        createdAt: Date.now()
      };
      addTask(newTask);
    }
    toast.success(`已批量添加 ${count} 个任务`);
  }, [addTask]);

  // 自动处理队列
  useEffect(() => {
    if (!isRunning) return;
    
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    if (pendingTasks.length > 0 && !queueProcessing && !currentTask) {
      const process = async () => {
        setQueueProcessing(true);
        for (const task of pendingTasks) {
          await executeTask(task.id);
        }
        setQueueProcessing(false);
      };
      process();
    }
  }, [isRunning, tasks, queueProcessing, currentTask, executeTask]);

  const stats = [
    {
      label: '总任务',
      value: metrics.totalTasks,
      icon: '📊',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      label: '完成率',
      value: `${metrics.totalTasks > 0 ? Math.min(100, Math.round((metrics.completedTasks / metrics.totalTasks) * 100)) : 0}%`,
      icon: '✅',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10'
    },
    {
      label: '运行中',
      value: isRunning ? '是' : '否',
      icon: '⏱️',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    },
    {
      label: '队列',
      value: tasks.filter(t => t.status === 'pending').length,
      icon: '📋',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    }
  ];

  const getButtonClass = (isRunning: boolean, isStart: boolean) => {
    const baseClass = 'px-6 py-3 rounded-lg font-medium transition-all';
    if (isStart) {
      return isRunning 
        ? `${baseClass} bg-slate-700 cursor-not-allowed` 
        : `${baseClass} bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg shadow-cyan-500/20 transform hover:scale-105`;
    } else {
      return !isRunning 
        ? `${baseClass} bg-slate-700 cursor-not-allowed` 
        : `${baseClass} bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 shadow-lg shadow-orange-500/20`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 text-slate-100">
      <Toaster position="top-right" theme="dark" />
      
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                多层级自主智能体系统
              </h1>
              <p className="text-slate-400 mt-2">
                企业级智能任务处理和知识进化系统
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={startSystem}
                disabled={isRunning}
                className={getButtonClass(isRunning, true)}
              >
                {isRunning ? (
                  <span className="animate-pulse">⏸️ 系统运行中</span>
                ) : (
                  <span>▶️ 启动系统</span>
                )}
              </button>
              
              <button
                onClick={stopSystem}
                disabled={!isRunning}
                className={getButtonClass(isRunning, false)}
              >
                {!isRunning ? (
                  <span>⏸️ 已停止</span>
                ) : (
                  <span>⏸️ 停止系统</span>
                )}
              </button>
            </div>
          </div>
          
          {storageWarning && (
            <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-amber-400 font-medium">⚠️ 存储空间警告：存储容量即将用尽，请考虑清理旧数据</p>
            </div>
          )}
          
          {lastError && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 font-medium">❌ {lastError}</p>
              <button 
                className="text-red-300 text-sm hover:text-red-200"
                onClick={() => setLastError(null)}
              >
                清除
              </button>
            </div>
          )}
        </header>

        <div className="flex gap-4 mb-6 border-b border-slate-700 pb-2">
          <button
            onClick={() => setActiveTab('system')}
            className={activeTab === 'system' 
              ? 'px-4 py-2 rounded-t-lg font-medium bg-slate-800 text-white' 
              : 'px-4 py-2 rounded-t-lg font-medium text-slate-400 hover:text-white'}
          >
            🖥️ 系统界面
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={activeTab === 'metrics' 
              ? 'px-4 py-2 rounded-t-lg font-medium bg-slate-800 text-white' 
              : 'px-4 py-2 rounded-t-lg font-medium text-slate-400 hover:text-white'}
          >
            📈 数据指标
          </button>
        </div>

        {activeTab === 'system' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-slate-500 text-sm mb-2">{stat.label}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </div>
                      <div className={`${stat.bgColor} p-3 rounded-xl text-2xl`}>
                        {stat.icon}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <h2 className="text-xl font-semibold text-slate-300 mb-4">层级系统 ({layers.length} 层架构)</h2>
                <div className="space-y-4">
                  {layers.map((layer, idx) => (
                    <div key={layer.id} className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">
                            <span className="text-blue-400 mr-2">{layer.id}.</span>
                            {layer.name}
                          </h3>
                          <p className="text-slate-500 text-sm">
                            {layer.modules.join(' • ')}
                          </p>
                          <div className="flex gap-4 mt-2 text-xs text-slate-400">
                            <span>CPU: {Math.round(layer.metrics.cpuUsage * 100)}%</span>
                            <span>Memory: {Math.round(layer.metrics.memoryUsage * 100)}%</span>
                            <span>成功率: {Math.round(layer.metrics.successRate * 100)}%</span>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          layer.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          layer.status === 'processing' ? 'bg-blue-500/20 text-blue-400 animate-pulse' :
                          layer.status === 'idle' ? 'bg-slate-700 text-slate-400' :
                          'bg-red-500/20 text-red-400'}`}
                        >
                          {layer.status === 'active' ? '运行中' :
                           layer.status === 'processing' ? '处理中' :
                           layer.status === 'idle' ? '空闲' : '错误'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    onClick={handleQuickAdd}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-6 py-3 rounded-xl font-medium shadow-lg shadow-purple-500/20 hover:scale-105 transition-all"
                  >
                    <span className="mr-2">➕</span>
                    快速添加任务
                  </button>
                  <button
                    onClick={handleBatchAdd}
                    className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 px-6 py-3 rounded-xl font-medium shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
                  >
                    <span className="mr-2">📦</span>
                    批量添加任务
                  </button>
                </div>

                {notifications.length > 0 && (
                  <div className="mt-6 bg-slate-900 border border-slate-800 p-4 rounded-xl">
                    <h3 className="font-semibold text-white mb-3">最近通知</h3>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {notifications.slice(0, 5).map((notification) => (
                        <div 
                          key={notification.id} 
                          className={`p-2 rounded text-sm ${
                            notification.type === 'success' ? 'bg-green-500/10 text-green-400' :
                            notification.type === 'error' ? 'bg-red-500/10 text-red-400' :
                            notification.type === 'warning' ? 'bg-yellow-500/10 text-yellow-400' :
                            'bg-slate-800 text-slate-300'}`}
                        >
                          {notification.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold mb-4">系统指标</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">总任务</span>
                      <span className="font-semibold">{metrics.totalTasks}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">已完成</span>
                      <span className="font-semibold text-green-400">{metrics.completedTasks}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">失败</span>
                      <span className="font-semibold text-red-400">{metrics.failedTasks}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">平均响应时间</span>
                      <span className="font-semibold">{Math.round(metrics.avgResponseTime)}ms</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">知识增长</span>
                      <span className="font-semibold text-cyan-400">{metrics.knowledgeGrowth}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold mb-4">任务队列</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {tasks.slice(-10).reverse().map(task => (
                      <div key={task.id} className="flex items-center justify-between p-2 bg-slate-800/50 rounded">
                        <div>
                          <p className="text-sm font-medium">{task.name}</p>
                          <p className="text-xs text-slate-500">优先级: {task.priority}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          task.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          task.status === 'running' ? 'bg-blue-500/20 text-blue-400' :
                          task.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                          'bg-slate-700 text-slate-400'}`}
                        >
                          {task.status === 'pending' ? '等待中' :
                           task.status === 'running' ? '执行中' :
                           task.status === 'completed' ? '完成' : '失败'}
                        </span>
                      </div>
                    ))}
                    {tasks.length === 0 && (
                      <div className="text-center text-slate-500 py-4">暂无任务</div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold mb-4">知识库</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">记忆条目</span>
                      <span>{memories.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">策略数量</span>
                      <span>{strategies.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'metrics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
              <h3 className="text-lg font-semibold mb-4">任务统计</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">总任务</span>
                  <span className="text-2xl font-bold text-blue-400">{metrics.totalTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">已完成</span>
                  <span className="text-2xl font-bold text-green-400">{metrics.completedTasks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">失败</span>
                  <span className="text-2xl font-bold text-red-400">{metrics.failedTasks}</span>
                </div>
                <div className="pt-4 border-t border-slate-700">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">成功率</span>
                    <span className="text-white">{Math.round(metrics.successRate)}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all"
                      style={{ width: `${Math.min(100, metrics.successRate)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
              <h3 className="text-lg font-semibold mb-4">系统性能</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">平均响应时间</span>
                  <span className="text-xl font-bold text-cyan-400">{Math.round(metrics.avgResponseTime)}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">知识增长</span>
                  <span className="text-xl font-bold text-purple-400">{metrics.knowledgeGrowth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">进化步骤</span>
                  <span className="text-xl font-bold text-orange-400">{metrics.evolutionSteps}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
