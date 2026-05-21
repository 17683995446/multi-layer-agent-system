import React, { useState, useEffect, useRef } from 'react';
import { useSystemStore } from '@/stores/systemStore';
import { logger } from '@/utils/systemLogger';
import { AlertTriangle, Play, Square, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'pending';
  message?: string;
  duration?: number;
  error?: any;
}

export const DiagnosticTestPage: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [logMessages, setLogMessages] = useState<{
    timestamp: number;
    level: string;
    message: string;
    data?: any;
  }[]>([]);
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState('');
  const loggerRef = useRef<any[]>([]);

  const store = useSystemStore();

  // 收集日志
  useEffect(() => {
    if (isRunning) {
      logger.setCallback((log: any) => {
        setLogMessages(prev => [...prev, {
          timestamp: log.timestamp,
          level: log.level,
          message: log.message,
          data: log.data
        }]);
      });
    } else {
      logger.setCallback(undefined);
    }
  }, [isRunning]);

  const addResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  // 测试套件
  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setLogMessages([]);
    setProgress(0);

    logger.info('TEST', '🚀 开始深度诊断测试');
    console.log('='.repeat(80));
    console.log('🚀 开始深度诊断测试');
    console.log('='.repeat(80));

    try {
      // 测试1: 基础状态管理
      await runTest('测试1: 基础状态管理', testBasicStateManagement);
      setProgress(10);

      // 测试2: 任务创建和管理
      await runTest('测试2: 任务创建和管理', testTaskManagement);
      setProgress(25);

      // 测试3: 并发操作测试
      await runTest('测试3: 并发操作测试', testConcurrentOperations);
      setProgress(45);

      // 测试4: 记忆管理测试
      await runTest('测试4: 记忆管理测试', testMemoryManagement);
      setProgress(65);

      // 测试5: 任务执行测试
      await runTest('测试5: 任务执行测试', testTaskExecution);
      setProgress(80);

      // 测试6: 边界条件测试
      await runTest('测试6: 边界条件测试', testBoundaryConditions);
      setProgress(90);

      // 测试7: 清理和恢复
      await runTest('测试7: 清理和恢复', testCleanupAndRestore);
      setProgress(100);

    } catch (error) {
      logger.error('TEST', '测试过程中发生错误', { error });
      addResult({
        name: '全局测试',
        status: 'fail',
        message: '测试过程中发生未捕获错误',
        error
      });
    } finally {
      setIsRunning(false);
      logger.info('TEST', '🏁 所有测试完成');
    }
  };

  const runTest = async (name: string, testFn: () => Promise<void>) => {
    setCurrentTest(name);
    logger.info('TEST', `开始 ${name}`);

    const startTime = Date.now();
    try {
      await testFn();
      const duration = Date.now() - startTime;
      logger.info('TEST', `✅ ${name} 通过 (${duration}ms)`);
      addResult({
        name,
        status: 'pass',
        duration
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error('TEST', `❌ ${name} 失败`, { error });
      addResult({
        name,
        status: 'fail',
        message: error instanceof Error ? error.message : String(error),
        duration,
        error
      });
    }
  };

  // 测试1: 基础状态管理
  const testBasicStateManagement = async () => {
    logger.debug('TEST', '检查初始状态');
    
    // 检查初始状态
    if (!store.layers || store.layers.length !== 8) {
      throw new Error(`期望8层, 实际${store.layers?.length || 0}层`);
    }
    
    if (!store.memories || !Array.isArray(store.memories)) {
      throw new Error('记忆状态无效');
    }
    
    if (!store.tasks || !Array.isArray(store.tasks)) {
      throw new Error('任务状态无效');
    }
    
    logger.debug('TEST', '基础状态检查通过');
  };

  // 测试2: 任务创建和管理
  const testTaskManagement = async () => {
    logger.debug('TEST', '测试任务创建');
    
    const initialCount = store.tasks.length;
    const testTask = store.addTask({
      name: '测试任务',
      priority: 2,
      input: { test: true }
    });
    
    if (!testTask.id) {
      throw new Error('任务创建失败 - 没有ID');
    }
    
    if (store.tasks.length !== initialCount + 1) {
      throw new Error(`任务计数错误: 期望${initialCount + 1}, 实际${store.tasks.length}`);
    }
    
    // 测试任务更新
    store.updateTask(testTask.id, { status: 'running' });
    const updated = store.tasks.find(t => t.id === testTask.id);
    
    if (!updated || updated.status !== 'running') {
      throw new Error('任务更新失败');
    }
    
    // 测试任务删除
    store.removeTask(testTask.id);
    
    if (store.tasks.find(t => t.id === testTask.id)) {
      throw new Error('任务删除失败');
    }
    
    logger.debug('TEST', '任务管理测试通过');
  };

  // 测试3: 并发操作
  const testConcurrentOperations = async () => {
    logger.debug('TEST', '测试并发操作');
    
    const operations: Promise<any>[] = [];
    
    for (let i = 0; i < 20; i++) {
      operations.push(Promise.resolve().then(() => {
        store.addTask({
          name: `并发任务 ${i}`,
          priority: Math.floor(Math.random() * 5) as 0 | 1 | 2 | 3 | 4,
          input: { concurrent: true, index: i }
        });
      }));
    }
    
    await Promise.all(operations);
    
    logger.debug('TEST', '并发操作测试完成');
  };

  // 测试4: 记忆管理
  const testMemoryManagement = async () => {
    logger.debug('TEST', '测试记忆管理');
    
    const initialCount = store.memories.length;
    
    // 测试记忆创建
    const memory = store.addMemory({
      type: 'experience',
      content: '测试记忆',
      relevance: 0.8
    });
    
    if (!memory.id) {
      throw new Error('记忆创建失败');
    }
    
    if (store.memories.length !== initialCount + 1) {
      throw new Error('记忆计数错误');
    }
    
    // 测试记忆检索
    const results = store.retrieveRelevantMemories('测试', 10);
    if (!Array.isArray(results)) {
      throw new Error('记忆检索失败');
    }
    
    logger.debug('TEST', '记忆管理测试通过');
  };

  // 测试5: 任务执行
  const testTaskExecution = async () => {
    logger.debug('TEST', '测试任务执行');
    
    const task = store.addTask({
      name: '执行测试任务',
      priority: 1,
      input: { executionTest: true, delay: 100 }
    });
    
    const startTime = Date.now();
    await store.executeTask(task.id);
    const endTime = Date.now();
    
    const executed = store.tasks.find(t => t.id === task.id);
    
    if (!executed) {
      throw new Error('执行后任务未找到');
    }
    
    if (executed.status !== 'completed' && executed.status !== 'failed') {
      throw new Error(`任务未完成, 状态: ${executed.status}`);
    }
    
    logger.debug('TEST', `任务执行测试通过, 耗时${endTime - startTime}ms`);
  };

  // 测试6: 边界条件
  const testBoundaryConditions = async () => {
    logger.debug('TEST', '测试边界条件');
    
    // 测试空任务
    try {
      store.addTask({ name: '' });
    } catch (e) {
      // 可能会或不会失败，取决于实现
      logger.debug('TEST', '空任务测试完成');
    }
    
    // 测试大数据量
    const largeMemory = store.addMemory({
      type: 'knowledge',
      content: 'x'.repeat(10000), // 10K字符串
      relevance: 0.5
    });
    
    if (!largeMemory.id) {
      throw new Error('大记忆创建失败');
    }
    
    logger.debug('TEST', '边界条件测试通过');
  };

  // 测试7: 清理和恢复
  const testCleanupAndRestore = async () => {
    logger.debug('TEST', '测试清理和恢复');
    
    // 先创建一些状态
    store.addTask({ name: '清理测试任务' });
    store.addMemory({ type: 'experience', content: '清理测试', relevance: 0.5 });
    store.addNotification({ type: 'info', message: '清理测试通知', read: false });
    
    // 清理
    store.clearAllData();
    
    // 验证清理
    if (store.tasks.length !== 0) {
      throw new Error('任务未清理');
    }
    
    if (store.memories.length !== 0) {
      throw new Error('记忆未清理');
    }
    
    logger.debug('TEST', '清理和恢复测试通过');
  };

  const clearState = () => {
    store.clearAllData();
    setTestResults([]);
    setLogMessages([]);
    setProgress(0);
    logger.info('TEST', '状态已清除');
  };

  const passCount = testResults.filter(r => r.status === 'pass').length;
  const failCount = testResults.filter(r => r.status === 'fail').length;

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent mb-2">
            🔬 深度诊断测试中心
          </h1>
          <p className="text-slate-400">
            系统性发现和修复系统问题
          </p>
        </div>

        {/* 控制面板 */}
        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {!isRunning ? (
                <button
                  onClick={runAllTests}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-xl flex items-center gap-2 shadow-lg transition-all"
                >
                  <Play size={20} />
                  开始测试
                </button>
              ) : (
                <button
                  disabled
                  className="px-8 py-3 bg-slate-700 text-slate-400 font-semibold rounded-xl flex items-center gap-2 cursor-not-allowed"
                >
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {currentTest}
                </button>
              )}
              <button
                onClick={clearState}
                disabled={isRunning}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-semibold rounded-xl flex items-center gap-2 transition-all"
              >
                <RefreshCw size={20} />
                清除状态
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              {isRunning && (
                <div className="flex items-center gap-2">
                  <div className="w-32 h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-slate-400 text-sm">{progress}%</span>
                </div>
              )}
              <div className="flex gap-4 text-sm">
                <span className="text-green-400 flex items-center gap-1">
                  <CheckCircle size={16} />
                  {passCount} 通过
                </span>
                <span className="text-red-400 flex items-center gap-1">
                  <XCircle size={16} />
                  {failCount} 失败
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 结果展示 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 测试结果 */}
          <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <AlertTriangle size={20} className="text-yellow-400" />
              测试结果
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <div className="text-slate-500 text-center py-8">
                  还没有测试结果，点击"开始测试"
                </div>
              ) : (
                testResults.map((result, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-xl border ${
                      result.status === 'pass' 
                        ? 'bg-green-500/10 border-green-500/30' 
                        : 'bg-red-500/10 border-red-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-medium ${
                        result.status === 'pass' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {result.status === 'pass' ? '✅' : '❌'} {result.name}
                      </span>
                      {result.duration && (
                        <span className="text-slate-500 text-sm flex items-center gap-1">
                          <Clock size={14} />
                          {result.duration}ms
                        </span>
                      )}
                    </div>
                    {result.message && (
                      <p className="text-slate-400 text-sm mt-2">
                        {result.message}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 实时日志 */}
          <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-slate-200 mb-4">
              📝 实时日志
            </h2>
            <div className="bg-slate-950 rounded-xl p-4 max-h-96 overflow-y-auto font-mono text-sm">
              {logMessages.length === 0 ? (
                <div className="text-slate-600 text-center py-8">
                  日志将在此显示
                </div>
              ) : (
                logMessages.map((log, index) => (
                  <div key={index} className="mb-1">
                    <span className="text-slate-500">
                      [{new Date(log.timestamp).toLocaleTimeString()}]
                    </span>
                    <span className={`ml-2 font-medium ${
                      log.level === 'ERROR' ? 'text-red-400' :
                      log.level === 'WARN' ? 'text-yellow-400' :
                      log.level === 'INFO' ? 'text-blue-400' :
                      'text-slate-400'
                    }`}>
                      [{log.level}]
                    </span>
                    <span className="ml-2 text-slate-300">
                      {log.message}
                    </span>
                    {log.data && (
                      <pre className="text-slate-500 text-xs mt-1 overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 系统状态 */}
        <div className="mt-6 bg-slate-900/50 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-slate-200 mb-4">
            📊 系统状态
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-slate-500 text-sm">任务数</p>
              <p className="text-2xl font-bold text-blue-400">{store.tasks.length}</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-slate-500 text-sm">记忆数</p>
              <p className="text-2xl font-bold text-purple-400">{store.memories.length}</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-slate-500 text-sm">通知数</p>
              <p className="text-2xl font-bold text-orange-400">{store.notifications.length}</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-4">
              <p className="text-slate-500 text-sm">层数</p>
              <p className="text-2xl font-bold text-green-400">{store.layers.length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticTestPage;
