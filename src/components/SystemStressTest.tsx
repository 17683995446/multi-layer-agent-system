import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSystemStore } from '@/stores/systemStore';
import { Task } from '@/types';
import { toast } from 'sonner';

interface StressTestConfig {
  taskCount: number;
  delayRange: [number, number];
  priorityDistribution: { [key: number]: number };
  failureRate: number;
  duration: number; // in seconds
}

interface TestMetrics {
  generatedTasks: number;
  completedTasks: number;
  failedTasks: number;
  pendingTasks: number;
  avgCompletionTime: number;
  maxCompletionTime: number;
  minCompletionTime: number;
  memoryUsage?: number;
  errors: string[];
  warnings: string[];
}

const DEFAULT_CONFIG: StressTestConfig = {
  taskCount: 100,
  delayRange: [100, 2000],
  priorityDistribution: { 0: 0.1, 1: 0.4, 2: 0.3, 3: 0.2 },
  failureRate: 0.05,
  duration: 60,
};

const TASK_NAMES = [
  '数据同步', '模型训练', '知识图谱构建', '系统诊断', '报告生成',
  '数据清洗', '批量处理', '实时分析', '缓存预热', '备份归档',
  '统计计算', '机器学习', '智能推理', '数据校验', '用户请求'
];

export const SystemStressTest: React.FC = () => {
  const {
    tasks,
    currentTask,
    metrics,
    addTask,
    updateTask,
    start,
    stop,
    isRunning,
    updateLayerStatus,
  } = useSystemStore();

  const [config, setConfig] = useState<StressTestConfig>(DEFAULT_CONFIG);
  const [isTesting, setIsTesting] = useState(false);
  const [testMetrics, setTestMetrics] = useState<TestMetrics>({
    generatedTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    pendingTasks: 0,
    avgCompletionTime: 0,
    maxCompletionTime: 0,
    minCompletionTime: Infinity,
    errors: [],
    warnings: [],
  });
  const [testProgress, setTestProgress] = useState(0);
  const [testLog, setTestLog] = useState<string[]>([]);

  const taskStartTimes = useRef<Map<string, number>>(new Map());
  const completionTimes = useRef<number[]>([]);
  const testInterval = useRef<number | null>(null);
  const taskGenerator = useRef<number | null>(null);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestLog(prev => [...prev, `[${timestamp}] ${message}`]);
  }, []);

  const generateRandomPriority = useCallback((): number => {
    const rand = Math.random();
    let cumulative = 0;
    for (const [priority, prob] of Object.entries(config.priorityDistribution)) {
      cumulative += prob;
      if (rand <= cumulative) {
        const p = parseInt(priority);
        return isNaN(p) ? 1 : p;
      }
    }
    return 1;
  }, [config.priorityDistribution]);

  const generateRandomDelay = useCallback((): number => {
    const [min, max] = config.delayRange;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }, [config.delayRange]);

  const generateTask = useCallback((): Task => {
    const name = TASK_NAMES[Math.floor(Math.random() * TASK_NAMES.length)];
    const priority = generateRandomPriority();
    const delay = generateRandomDelay();
    
    return {
      id: `stress-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      priority,
      status: 'pending',
      input: { 
        delay, 
        shouldFail: Math.random() < config.failureRate,
        timestamp: Date.now(),
        stressTest: true,
      },
      createdAt: Date.now(),
    };
  }, [generateRandomPriority, generateRandomDelay, config.failureRate]);

  const startStressTest = useCallback(async () => {
    setIsTesting(true);
    setTestMetrics({
      generatedTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      pendingTasks: 0,
      avgCompletionTime: 0,
      maxCompletionTime: 0,
      minCompletionTime: Infinity,
      errors: [],
      warnings: [],
    });
    setTestProgress(0);
    setTestLog([]);
    taskStartTimes.current.clear();
    completionTimes.current = [];
    
    addLog('🚀 开始压力测试');
    addLog(`配置: ${config.taskCount} 任务, ${config.duration} 秒, 失败率: ${config.failureRate}`);

    // 启动系统
    if (!isRunning) {
      start();
      // 激活所有层级
      [1, 2, 3, 4, 5].forEach(id => {
        updateLayerStatus(id, { status: 'active' });
      });
    }

    // 开始生成任务
    let generated = 0;
    const tasksPerSecond = config.taskCount / config.duration;
    const taskInterval = 1000 / tasksPerSecond;
    
    const startTime = Date.now();
    const endTime = startTime + config.duration * 1000;

    taskGenerator.current = window.setInterval(() => {
      if (Date.now() >= endTime || generated >= config.taskCount) {
        if (taskGenerator.current) {
          window.clearInterval(taskGenerator.current);
          taskGenerator.current = null;
        }
        return;
      }

      try {
        const task = generateTask();
        addTask(task);
        taskStartTimes.current.set(task.id, Date.now());
        generated++;
        
        setTestMetrics(prev => ({ ...prev, generatedTasks: generated }));
        
        if (generated % 10 === 0) {
          addLog(`✅ 已生成 ${generated} 个任务`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : '未知错误';
        addLog(`❌ 生成任务失败: ${errorMsg}`);
        setTestMetrics(prev => ({
          ...prev,
          errors: [...prev.errors, errorMsg],
        }));
      }
    }, Math.max(10, taskInterval));

    // 监控测试进度
    testInterval.current = window.setInterval(() => {
      const elapsed = Math.min((Date.now() - startTime) / 1000, config.duration);
      const progress = (elapsed / config.duration) * 100;
      setTestProgress(progress);
      
      // 统计当前状态
      const pending = tasks.filter(t => t.status === 'pending').length;
      const completed = tasks.filter(t => t.status === 'completed').length;
      const failed = tasks.filter(t => t.status === 'failed').length;
      
      setTestMetrics(prev => ({
        ...prev,
        pendingTasks: pending,
        completedTasks: completed,
        failedTasks: failed,
      }));

      // 检查完成的任务
      tasks.forEach(task => {
        if ((task.status === 'completed' || task.status === 'failed') && 
            taskStartTimes.current.has(task.id)) {
          const tStartTime = taskStartTimes.current.get(task.id)!;
          const tEndTime = task.executedAt || Date.now();
          const duration = tEndTime - tStartTime;
          
          if (task.status === 'completed') {
            completionTimes.current.push(duration);
          }
          
          taskStartTimes.current.delete(task.id);
        }
      });

      // 更新平均完成时间
      if (completionTimes.current.length > 0) {
        const total = completionTimes.current.reduce((sum, time) => sum + time, 0);
        const avg = total / completionTimes.current.length;
        const max = Math.max(...completionTimes.current);
        const min = Math.min(...completionTimes.current);
        
        setTestMetrics(prev => ({
          ...prev,
          avgCompletionTime: avg,
          maxCompletionTime: max,
          minCompletionTime: min,
        }));
      }

      // 检查是否完成
      if (Date.now() >= endTime && !taskGenerator.current) {
        // 给一些时间让任务队列完成
        const pendingCount = tasks.filter(t => t.status === 'pending').length;
        if (pendingCount === 0) {
          stopStressTest();
        }
      }
    }, 500);
  }, [config, isRunning, start, updateLayerStatus, addTask, tasks, addLog, generateTask]);

  const stopStressTest = useCallback(() => {
    setIsTesting(false);
    
    if (taskGenerator.current) {
      window.clearInterval(taskGenerator.current);
      taskGenerator.current = null;
    }
    
    if (testInterval.current) {
      window.clearInterval(testInterval.current);
      testInterval.current = null;
    }
    
    addLog('🛑 压力测试已停止');
    setTestProgress(100);
    
    const finalMetrics = testMetrics;
    addLog(`📊 结果: ${finalMetrics.completedTasks} 完成, ${finalMetrics.failedTasks} 失败`);
    
    toast.success('压力测试完成');
  }, [addLog, testMetrics]);

  useEffect(() => {
    return () => {
      if (taskGenerator.current) window.clearInterval(taskGenerator.current);
      if (testInterval.current) window.clearInterval(testInterval.current);
    };
  }, []);

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mt-6">
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        ⚡ 系统压力测试
      </h3>
      
      {/* 配置区域 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm text-slate-400 mb-1">任务数量</label>
          <input
            type="number"
            value={config.taskCount}
            onChange={(e) => setConfig({ ...config, taskCount: parseInt(e.target.value) || 0 })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
            disabled={isTesting}
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">测试时长 (秒)</label>
          <input
            type="number"
            value={config.duration}
            onChange={(e) => setConfig({ ...config, duration: parseInt(e.target.value) || 0 })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
            disabled={isTesting}
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">最小延迟 (ms)</label>
          <input
            type="number"
            value={config.delayRange[0]}
            onChange={(e) => setConfig({ 
              ...config, 
              delayRange: [parseInt(e.target.value) || 0, config.delayRange[1]] 
            })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
            disabled={isTesting}
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">最大延迟 (ms)</label>
          <input
            type="number"
            value={config.delayRange[1]}
            onChange={(e) => setConfig({ 
              ...config, 
              delayRange: [config.delayRange[0], parseInt(e.target.value) || 0] 
            })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
            disabled={isTesting}
          />
        </div>
        <div>
          <label className="block text-sm text-slate-400 mb-1">失败率</label>
          <input
            type="number"
            value={config.failureRate}
            step={0.01}
            min={0}
            max={1}
            onChange={(e) => setConfig({ ...config, failureRate: parseFloat(e.target.value) || 0 })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
            disabled={isTesting}
          />
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={isTesting ? stopStressTest : startStressTest}
          className={`px-6 py-2 rounded-lg font-medium ${
            isTesting
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
          }`}
        >
          {isTesting ? '🛑 停止测试' : '⚡ 开始压力测试'}
        </button>
      </div>

      {/* 进度条 */}
      {isTesting && (
        <div className="mb-6">
          <div className="flex justify-between text-sm text-slate-400 mb-1">
            <span>测试进度</span>
            <span>{Math.round(testProgress)}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${testProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* 测试指标 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900 rounded-lg p-4">
          <p className="text-slate-500 text-sm">已生成任务</p>
          <p className="text-2xl font-bold text-white">{testMetrics.generatedTasks}</p>
        </div>
        <div className="bg-slate-900 rounded-lg p-4">
          <p className="text-slate-500 text-sm">已完成</p>
          <p className="text-2xl font-bold text-green-400">{testMetrics.completedTasks}</p>
        </div>
        <div className="bg-slate-900 rounded-lg p-4">
          <p className="text-slate-500 text-sm">失败</p>
          <p className="text-2xl font-bold text-red-400">{testMetrics.failedTasks}</p>
        </div>
      </div>

      {completionTimes.current.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-900 rounded-lg p-4">
            <p className="text-slate-500 text-sm">平均耗时</p>
            <p className="text-xl font-bold text-blue-400">
              {Math.round(testMetrics.avgCompletionTime)}ms
            </p>
          </div>
          <div className="bg-slate-900 rounded-lg p-4">
            <p className="text-slate-500 text-sm">最大耗时</p>
            <p className="text-xl font-bold text-yellow-400">
              {Math.round(testMetrics.maxCompletionTime)}ms
            </p>
          </div>
          <div className="bg-slate-900 rounded-lg p-4">
            <p className="text-slate-500 text-sm">最小耗时</p>
            <p className="text-xl font-bold text-cyan-400">
              {Math.round(testMetrics.minCompletionTime)}ms
            </p>
          </div>
        </div>
      )}

      {/* 日志区域 */}
      <div>
        <h4 className="text-sm font-semibold text-slate-400 mb-2">测试日志</h4>
        <div className="bg-slate-900 rounded-lg p-3 max-h-40 overflow-y-auto">
          {testLog.length === 0 ? (
            <p className="text-slate-500 text-sm">暂无日志...</p>
          ) : (
            testLog.slice(-20).map((log, i) => (
              <p key={i} className="text-sm text-slate-300 mb-1">{log}</p>
            ))
          )}
        </div>
      </div>

      {/* 错误和警告 */}
      {testMetrics.errors.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-red-400 mb-2">发现的问题</h4>
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            {testMetrics.errors.map((error, i) => (
              <p key={i} className="text-sm text-red-300 mb-1">• {error}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
