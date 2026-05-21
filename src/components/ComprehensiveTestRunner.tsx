import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSystemStore } from '@/stores/systemStore';
import { Task } from '@/types';

interface TestScenario {
  id: string;
  name: string;
  description: string;
  duration: number;
  tasksPerSecond: number;
  failureRate: number;
  concurrency: number;
}

interface TestResult {
  scenarioId: string;
  scenarioName: string;
  startTime: number;
  endTime?: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  metrics: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    avgResponseTime: number;
    maxResponseTime: number;
    memoryUsage: number[];
    errors: string[];
    warnings: string[];
  };
}

const TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'basic',
    name: '基础功能测试',
    description: '验证系统基本任务添加和处理功能',
    duration: 10000,
    tasksPerSecond: 1,
    failureRate: 0.1,
    concurrency: 1
  },
  {
    id: 'stress',
    name: '压力测试',
    description: '高并发任务处理测试',
    duration: 30000,
    tasksPerSecond: 10,
    failureRate: 0.1,
    concurrency: 5
  },
  {
    id: 'endurance',
    name: '长时间运行测试',
    description: '持续运行60秒，观察系统稳定性和内存使用',
    duration: 60000,
    tasksPerSecond: 5,
    failureRate: 0.1,
    concurrency: 3
  },
  {
    id: 'burst',
    name: '突发流量测试',
    description: '短时间内大量任务同时到达',
    duration: 5000,
    tasksPerSecond: 50,
    failureRate: 0.1,
    concurrency: 10
  },
  {
    id: 'edge-case',
    name: '边界条件测试',
    description: '测试极端情况和错误处理',
    duration: 10000,
    tasksPerSecond: 3,
    failureRate: 0.5,
    concurrency: 2
  },
  {
    id: 'memory-leak',
    name: '内存泄漏检测',
    description: '长时间运行观察内存增长',
    duration: 120000,
    tasksPerSecond: 2,
    failureRate: 0.1,
    concurrency: 2
  }
];

const TASK_NAMES = [
  '数据分析', '数据处理', '用户请求', '系统诊断', '知识图谱构建',
  '模型训练', '数据同步', '批量处理', '报告生成', '系统备份',
  '智能推理', '数据校验', '性能监控', '异常检测', '自动修复'
];

export const ComprehensiveTestRunner: React.FC = () => {
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
    addMemory,
    updateMetrics
  } = useSystemStore();

  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState({
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    avgResponseTime: 0,
    maxResponseTime: 0,
    memoryUsage: [] as number[],
    errors: [] as string[],
    warnings: [] as string[]
  });
  const [logs, setLogs] = useState<string[]>([]);

  const testInterval = useRef<number | null>(null);
  const monitorInterval = useRef<number | null>(null);
  const startTime = useRef<number>(0);
  const responseTimes = useRef<number[]>([]);
  const generatedTasks = useRef<Map<string, number>>(new Map());

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-50), `[${timestamp}] ${message}`]);
  }, []);

  const captureMemory = useCallback(() => {
    if (typeof window !== 'undefined' && 'memory' in (window as unknown as { memory?: { usedJSHeapSize: number } })) {
      const memory = (window as unknown as { memory: { usedJSHeapSize: number } }).memory;
      if (memory) {
        return memory.usedJSHeapSize / (1024 * 1024);
      }
    }
    return 0;
  }, []);

  const runScenario = useCallback(async (scenario: TestScenario) => {
    addLog(`🚀 开始执行测试场景: ${scenario.name}`);
    setActiveScenario(scenario.id);
    
    const result: TestResult = {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      startTime: Date.now(),
      status: 'running',
      metrics: {
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        avgResponseTime: 0,
        maxResponseTime: 0,
        memoryUsage: [],
        errors: [],
        warnings: []
      }
    };

    setTestResults(prev => [...prev, result]);
    startTime.current = Date.now();
    responseTimes.current = [];
    generatedTasks.current.clear();

    // 启动系统
    if (!isRunning) {
      start();
      [1, 2, 3, 4, 5].forEach(id => {
        updateLayerStatus(id, { status: 'active' });
      });
    }

    const taskInterval = 1000 / scenario.tasksPerSecond;
    let taskId = 0;

    // 生成任务
    testInterval.current = window.setInterval(() => {
      if (Date.now() - startTime.current >= scenario.duration) {
        if (testInterval.current) {
          window.clearInterval(testInterval.current);
          testInterval.current = null;
        }
        return;
      }

      // 生成多个任务（根据并发数）
      for (let i = 0; i < scenario.concurrency; i++) {
        const shouldFail = Math.random() < scenario.failureRate;
        const executionTime = 100 + Math.random() * 900;
        
        const task: Task = {
          id: `test-${scenario.id}-${Date.now()}-${taskId++}`,
          name: TASK_NAMES[Math.floor(Math.random() * TASK_NAMES.length)],
          priority: Math.floor(Math.random() * 4),
          status: 'pending',
          input: {
            delay: executionTime,
            shouldFail,
            timestamp: Date.now(),
            testScenario: scenario.id
          },
          createdAt: Date.now()
        };

        try {
          addTask(task);
          generatedTasks.current.set(task.id, Date.now());
          
          result.metrics.totalTasks++;
          setTestResults(prev => prev.map(r => 
            r.scenarioId === scenario.id ? result : r
          ));
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '未知错误';
          result.metrics.errors.push(errorMsg);
          addLog(`❌ 生成任务失败: ${errorMsg}`);
        }
      }
    }, taskInterval);

    // 监控测试进度
    monitorInterval.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime.current;
      const progress = (elapsed / scenario.duration) * 100;

      // 统计当前任务状态
      const currentTasks = tasks;
      const completed = currentTasks.filter(t => 
        t.status === 'completed' && t.input && 
        typeof t.input === 'object' && 
        'testScenario' in t.input && 
        (t.input as { testScenario: string }).testScenario === scenario.id
      ).length;
      
      const failed = currentTasks.filter(t => 
        t.status === 'failed' && t.input && 
        typeof t.input === 'object' && 
        'testScenario' in t.input && 
        (t.input as { testScenario: string }).testScenario === scenario.id
      ).length;

      // 收集响应时间
      currentTasks.forEach(task => {
        if (task.status === 'completed' && generatedTasks.current.has(task.id)) {
          const startTime = generatedTasks.current.get(task.id)!;
          const duration = (task.executedAt || Date.now()) - startTime;
          responseTimes.current.push(duration);
          generatedTasks.current.delete(task.id);
        }
      });

      // 更新内存使用
      const memory = captureMemory();
      if (memory > 0) {
        result.metrics.memoryUsage.push(memory);
      }

      // 更新指标
      if (responseTimes.current.length > 0) {
        result.metrics.avgResponseTime = 
          responseTimes.current.reduce((sum, time) => sum + time, 0) / responseTimes.current.length;
        result.metrics.maxResponseTime = Math.max(...responseTimes.current);
      }
      result.metrics.completedTasks = completed;
      result.metrics.failedTasks = failed;

      setCurrentMetrics({ ...result.metrics });
      setTestResults(prev => prev.map(r => 
        r.scenarioId === scenario.id ? { ...result } : r
      ));

      addLog(`📊 进度: ${Math.round(progress)}% | 任务: ${result.metrics.totalTasks} | 完成: ${completed} | 失败: ${failed}`);

      // 检查是否完成
      if (elapsed >= scenario.duration && !testInterval.current) {
        completeScenario(scenario, result);
      }
    }, 1000);
  }, [addTask, start, updateLayerStatus, tasks, addLog, captureMemory]);

  const completeScenario = useCallback((scenario: TestScenario, result: TestResult) => {
    result.status = 'completed';
    result.endTime = Date.now();

    if (monitorInterval.current) {
      window.clearInterval(monitorInterval.current);
      monitorInterval.current = null;
    }

    const duration = result.endTime - result.startTime;
    const successRate = result.metrics.totalTasks > 0 
      ? (result.metrics.completedTasks / result.metrics.totalTasks * 100).toFixed(2)
      : '0';

    addLog(`✅ ${scenario.name} 完成!`);
    addLog(`   总任务: ${result.metrics.totalTasks}`);
    addLog(`   成功率: ${successRate}%`);
    addLog(`   平均响应时间: ${result.metrics.avgResponseTime.toFixed(2)}ms`);
    addLog(`   最大响应时间: ${result.metrics.maxResponseTime.toFixed(2)}ms`);
    addLog(`   错误数: ${result.metrics.errors.length}`);
    
    if (result.metrics.memoryUsage.length > 0) {
      const avgMemory = result.metrics.memoryUsage.reduce((sum, m) => sum + m, 0) / result.metrics.memoryUsage.length;
      const maxMemory = Math.max(...result.metrics.memoryUsage);
      addLog(`   平均内存: ${avgMemory.toFixed(2)}MB | 最大内存: ${maxMemory.toFixed(2)}MB`);
    }

    setTestResults(prev => prev.map(r => 
      r.scenarioId === scenario.id ? result : r
    ));
    setActiveScenario(null);

    // 检查问题并警告
    if (result.metrics.errors.length > 0) {
      addLog(`⚠️ 发现 ${result.metrics.errors.length} 个错误`);
    }
    if (result.metrics.failedTasks / result.metrics.totalTasks > 0.3) {
      addLog(`⚠️ 失败率过高: ${(result.metrics.failedTasks / result.metrics.totalTasks * 100).toFixed(2)}%`);
    }
  }, [addLog]);

  const stopTest = useCallback(() => {
    if (testInterval.current) {
      window.clearInterval(testInterval.current);
      testInterval.current = null;
    }
    if (monitorInterval.current) {
      window.clearInterval(monitorInterval.current);
      monitorInterval.current = null;
    }
    
    stop();
    [1, 2, 3, 4, 5].forEach(id => {
      updateLayerStatus(id, { status: 'idle' });
    });
    
    setActiveScenario(null);
    addLog('🛑 测试已停止');
  }, [stop, updateLayerStatus, addLog]);

  useEffect(() => {
    return () => {
      if (testInterval.current) window.clearInterval(testInterval.current);
      if (monitorInterval.current) window.clearInterval(monitorInterval.current);
    };
  }, []);

  return (
    <div className="bg-slate-900/80 backdrop-blur-lg border border-slate-700 rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          🧪 综合测试运行器
        </h2>
        {activeScenario && (
          <button
            onClick={stopTest}
            className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            停止测试
          </button>
        )}
      </div>

      {/* 测试场景选择 */}
      <div className="grid grid-cols-2 gap-3">
        {TEST_SCENARIOS.map(scenario => (
          <button
            key={scenario.id}
            onClick={() => runScenario(scenario)}
            disabled={activeScenario !== null}
            className={`p-4 rounded-xl border transition-all ${
              activeScenario === scenario.id
                ? 'bg-blue-500/20 border-blue-500/50'
                : activeScenario
                  ? 'bg-slate-800/50 border-slate-700 cursor-not-allowed opacity-50'
                  : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg font-semibold text-white">{scenario.name}</span>
              {activeScenario === scenario.id && (
                <span className="px-2 py-0.5 bg-blue-500/30 text-blue-400 text-xs rounded-full animate-pulse">
                  运行中
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">{scenario.description}</p>
            <div className="mt-2 text-xs text-slate-500">
              时长: {scenario.duration / 1000}秒 | 
              速率: {scenario.tasksPerSecond}/秒 | 
              失败率: {scenario.failureRate * 100}%
            </div>
          </button>
        ))}
      </div>

      {/* 实时指标 */}
      {activeScenario && (
        <div className="bg-slate-800/50 rounded-xl p-4 space-y-4">
          <h3 className="font-semibold text-white">实时指标</h3>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-900/50 rounded-lg p-3">
              <div className="text-slate-500 text-xs mb-1">总任务</div>
              <div className="text-2xl font-bold text-white">{currentMetrics.totalTasks}</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3">
              <div className="text-slate-500 text-xs mb-1">已完成</div>
              <div className="text-2xl font-bold text-green-400">{currentMetrics.completedTasks}</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3">
              <div className="text-slate-500 text-xs mb-1">失败</div>
              <div className="text-2xl font-bold text-red-400">{currentMetrics.failedTasks}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/50 rounded-lg p-3">
              <div className="text-slate-500 text-xs mb-1">平均响应时间</div>
              <div className="text-xl font-bold text-blue-400">
                {currentMetrics.avgResponseTime.toFixed(2)}ms
              </div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3">
              <div className="text-slate-500 text-xs mb-1">最大响应时间</div>
              <div className="text-xl font-bold text-yellow-400">
                {currentMetrics.maxResponseTime.toFixed(2)}ms
              </div>
            </div>
          </div>

          {currentMetrics.memoryUsage.length > 0 && (
            <div className="bg-slate-900/50 rounded-lg p-3">
              <div className="text-slate-500 text-xs mb-2">内存使用</div>
              <div className="flex items-end gap-1 h-16">
                {currentMetrics.memoryUsage.slice(-30).map((mem, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-gradient-to-t from-purple-500 to-cyan-500 rounded-t"
                    style={{ height: `${Math.min(100, (mem / Math.max(...currentMetrics.memoryUsage)) * 100)}%` }}
                  />
                ))}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                当前: {currentMetrics.memoryUsage[currentMetrics.memoryUsage.length - 1]?.toFixed(2) || 0}MB
              </div>
            </div>
          )}

          {currentMetrics.errors.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <div className="text-red-400 text-sm font-semibold mb-2">
                错误 ({currentMetrics.errors.length})
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {currentMetrics.errors.slice(-10).map((error, i) => (
                  <div key={i} className="text-xs text-red-300">
                    • {error}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 测试日志 */}
      <div className="bg-slate-800/50 rounded-xl p-4">
        <h3 className="font-semibold text-white mb-3">测试日志</h3>
        <div className="bg-slate-900/50 rounded-lg p-3 max-h-64 overflow-y-auto font-mono text-sm space-y-1">
          {logs.length === 0 ? (
            <div className="text-slate-500">暂无日志...</div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className={`${
                log.includes('❌') ? 'text-red-400' :
                log.includes('⚠️') ? 'text-yellow-400' :
                log.includes('✅') ? 'text-green-400' :
                log.includes('📊') ? 'text-blue-400' :
                'text-slate-400'
              }`}>
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 历史结果 */}
      {testResults.length > 0 && (
        <div className="bg-slate-800/50 rounded-xl p-4">
          <h3 className="font-semibold text-white mb-3">测试结果历史</h3>
          <div className="space-y-2">
            {testResults.map((result, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border ${
                  result.status === 'completed'
                    ? 'bg-green-500/10 border-green-500/30'
                    : result.status === 'failed'
                      ? 'bg-red-500/10 border-red-500/30'
                      : result.status === 'running'
                        ? 'bg-blue-500/10 border-blue-500/30'
                        : 'bg-slate-700/50 border-slate-600/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-white">{result.scenarioName}</div>
                  <div className={`text-xs px-2 py-1 rounded ${
                    result.status === 'completed' ? 'bg-green-500/30 text-green-400' :
                    result.status === 'failed' ? 'bg-red-500/30 text-red-400' :
                    result.status === 'running' ? 'bg-blue-500/30 text-blue-400' :
                    'bg-slate-600/30 text-slate-400'
                  }`}>
                    {result.status === 'completed' ? '✓ 完成' :
                     result.status === 'failed' ? '✗ 失败' :
                     result.status === 'running' ? '⟳ 运行中' : '⏸ 待运行'}
                  </div>
                </div>
                {result.status !== 'pending' && (
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-slate-500">总任务</div>
                      <div className="text-white font-semibold">{result.metrics.totalTasks}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">成功率</div>
                      <div className={`font-semibold ${
                        result.metrics.totalTasks > 0 && 
                        result.metrics.completedTasks / result.metrics.totalTasks > 0.8
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}>
                        {result.metrics.totalTasks > 0
                          ? `${(result.metrics.completedTasks / result.metrics.totalTasks * 100).toFixed(1)}%`
                          : '0%'}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">平均响应</div>
                      <div className="text-blue-400 font-semibold">
                        {result.metrics.avgResponseTime.toFixed(0)}ms
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
