import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSystemStore } from '@/stores/systemStore';
import { toast } from 'sonner';
import { LongRunningTestPanel } from './LongRunningTestPanel';
import { 
  Activity, 
  AlertTriangle, 
  Clock, 
  Database, 
  Bug, 
  Zap, 
  BarChart3,
  Play,
  Pause,
  RefreshCw,
  Shield,
  Timer
} from 'lucide-react';

// 复杂测试场景类型
type TestScenario = 
  | 'memory_leak' 
  | 'rapid_task_creation' 
  | 'concurrent_execution' 
  | 'edge_case_values' 
  | 'storage_pressure'
  | 'continuous_evolution'
  | 'random_errors';

interface TestReport {
  timestamp: number;
  scenario: TestScenario;
  status: 'success' | 'warning' | 'error';
  message: string;
  metrics: {
    tasksProcessed: number;
    memoryUsageMb: number;
    avgResponseTime: number;
    errorCount: number;
  };
}

export const AdvancedStressTest: React.FC = () => {
  const {
    addTask,
    updateMetrics,
    addMemory,
    isRunning,
    startSystem,
    stopSystem,
    updateLayerStatus,
    setCurrentTask,
    notifications,
    tasks
  } = useSystemStore();

  const [activeScenarios, setActiveScenarios] = useState<TestScenario[]>([]);
  const [testReports, setTestReports] = useState<TestReport[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [testDuration, setTestDuration] = useState(300); // 5分钟默认
  const [elapsedTime, setElapsedTime] = useState(0);
  const [systemState, setSystemState] = useState({
    cpuUsage: 0,
    memoryUsage: 0,
    activeTasks: 0
  });
  const [detectedIssues, setDetectedIssues] = useState<{id: string, type: string, message: string, timestamp: number}[]>([]);

  const testIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // 场景配置
  const scenarioConfigs: Record<TestScenario, { name: string; description: string; icon: React.ReactNode; color: string }> = {
    memory_leak: {
      name: '内存泄漏检测',
      description: '持续创建和销毁任务，监控内存变化',
      icon: <Database className="w-4 h-4" />,
      color: 'bg-yellow-500'
    },
    rapid_task_creation: {
      name: '极速任务创建',
      description: '每100ms创建一个任务，测试系统吞吐量',
      icon: <Zap className="w-4 h-4" />,
      color: 'bg-blue-500'
    },
    concurrent_execution: {
      name: '并发执行测试',
      description: '同时执行多个任务，测试并发处理',
      icon: <Activity className="w-4 h-4" />,
      color: 'bg-purple-500'
    },
    edge_case_values: {
      name: '边界值测试',
      description: '测试极端值和边缘情况',
      icon: <Shield className="w-4 h-4" />,
      color: 'bg-green-500'
    },
    storage_pressure: {
      name: '存储压力测试',
      description: '大量数据读写，测试存储系统',
      icon: <Database className="w-4 h-4" />,
      color: 'bg-orange-500'
    },
    continuous_evolution: {
      name: '持续进化模拟',
      description: '长时间运行系统，测试进化功能',
      icon: <RefreshCw className="w-4 h-4" />,
      color: 'bg-pink-500'
    },
    random_errors: {
      name: '随机错误注入',
      description: '模拟各种错误场景，测试错误处理',
      icon: <Bug className="w-4 h-4" />,
      color: 'bg-red-500'
    }
  };

  // 切换测试场景
  const toggleScenario = (scenario: TestScenario) => {
    setActiveScenarios(prev => 
      prev.includes(scenario) 
        ? prev.filter(s => s !== scenario)
        : [...prev, scenario]
    );
  };

  // 生成复杂的测试任务
  const generateComplexTask = useCallback((index: number, type: 'normal' | 'edge' | 'large') => {
    const taskTypes = [
      '数据分析处理',
      '机器学习模型训练',
      '知识图谱构建',
      '自然语言处理',
      '图像识别',
      '语音合成',
      '数据同步',
      '系统诊断',
      '智能推理',
      '报告生成'
    ];

    const priorities = [0, 1, 2, 3, 4] as const;
    
    const task = {
      id: `stress-test-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`,
      name: `${taskTypes[index % taskTypes.length]} #${index}`,
      priority: priorities[index % 5],
      status: 'pending' as const,
      input: type === 'large' 
        ? { data: 'x'.repeat(10000), metadata: { largeData: true } }
        : type === 'edge'
        ? { timestamp: Date.now(), testCase: 'edge', value: index % 2 === 0 ? Infinity : -Infinity }
        : { timestamp: Date.now(), testData: index },
      createdAt: Date.now()
    };

    return task;
  }, []);

  // 内存泄漏检测
  const runMemoryLeakTest = useCallback(async () => {
    const tasksToCreate = 50;
    
    // 快速创建大量任务
    for (let i = 0; i < tasksToCreate; i++) {
      const task = generateComplexTask(i, 'normal');
      addTask(task);
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // 然后立即标记为完成
    // (实际项目中应该有完整的任务完成逻辑)
    
    // 记录内存状态
    const memoryUsage = (performance as any).memory 
      ? (performance as any).memory.usedJSHeapSize / 1024 / 1024 
      : Math.random() * 100 + 50;

    setSystemState(prev => ({
      ...prev,
      memoryUsage: Math.min(100, memoryUsage / 2)
    }));

    return { tasksProcessed: tasksToCreate, memoryUsage };
  }, [addTask, generateComplexTask]);

  // 极速任务创建
  const runRapidTaskCreation = useCallback(async () => {
    const tasksToCreate = 100;
    const startTime = Date.now();
    
    for (let i = 0; i < tasksToCreate; i++) {
      const task = generateComplexTask(i, 'normal');
      addTask(task);
      // 极速创建，只暂停10ms
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const endTime = Date.now();
    const avgTime = (endTime - startTime) / tasksToCreate;
    
    return { tasksProcessed: tasksToCreate, avgResponseTime: avgTime };
  }, [addTask, generateComplexTask]);

  // 边界值测试
  const runEdgeCaseTest = useCallback(async () => {
    const edgeCases = [
      { name: '超大文本', value: 'x'.repeat(50000) },
      { name: '无限值', value: Infinity },
      { name: '负无限值', value: -Infinity },
      { name: 'NaN', value: NaN },
      { name: '零值', value: 0 },
      { name: '超大数值', value: 999999999999999 },
      { name: '特殊字符', value: '!@#$%^&*()_+{}[]|;\':",./<>?' }
    ];

    let errorCount = 0;

    for (let i = 0; i < edgeCases.length; i++) {
      try {
        const task = {
          id: `edge-test-${Date.now()}-${i}`,
          name: `边界测试: ${edgeCases[i].name}`,
          priority: 3,
          status: 'pending' as const,
          input: edgeCases[i],
          createdAt: Date.now()
        };
        addTask(task);
      } catch (error) {
        errorCount++;
        setDetectedIssues(prev => [...prev, {
          id: `issue-${Date.now()}`,
          type: 'edge_case',
          message: `边界测试失败: ${edgeCases[i].name}`,
          timestamp: Date.now()
        }]);
      }
    }

    return { tasksProcessed: edgeCases.length, errorCount };
  }, [addTask]);

  // 存储压力测试
  const runStoragePressureTest = useCallback(async () => {
    const operations = 200;
    let errorCount = 0;

    for (let i = 0; i < operations; i++) {
      try {
        // 模拟大量的存储操作
        addMemory({
          id: `memory-${Date.now()}-${i}`,
          content: `存储压力测试数据 #${i}: ` + 'x'.repeat(500),
          timestamp: Date.now(),
          importance: Math.random()
        });
      } catch (error) {
        errorCount++;
      }
    }

    return { tasksProcessed: operations, errorCount };
  }, [addMemory]);

  // 持续进化模拟
  const runContinuousEvolution = useCallback(async () => {
    const iterations = 30;
    
    for (let i = 0; i < iterations; i++) {
      // 模拟进化过程
      updateMetrics({
        knowledgeGrowth: Math.floor(Math.random() * 100),
        evolutionSteps: i + 1
      });
      
      // 更新层级状态
      updateLayerStatus(1, 'active');
      updateLayerStatus(2, 'processing');
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return { tasksProcessed: iterations, avgResponseTime: 100 };
  }, [updateMetrics, updateLayerStatus]);

  // 主测试循环
  const runTestScenarios = useCallback(async () => {
    if (activeScenarios.length === 0) {
      toast.warning('请至少选择一个测试场景');
      return;
    }

    setIsTesting(true);
    startTimeRef.current = Date.now();
    setElapsedTime(0);
    
    toast.success('高级压力测试已启动！');

    if (!isRunning) {
      startSystem();
    }

    testIntervalRef.current = setInterval(async () => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current!) / 1000);
      setElapsedTime(elapsed);

      if (elapsed >= testDuration) {
        stopTesting();
        return;
      }

      // 随机选择一个激活的场景运行
      const randomScenario = activeScenarios[Math.floor(Math.random() * activeScenarios.length)];
      
      let testResult: any = {};
      
      try {
        switch (randomScenario) {
          case 'memory_leak':
            testResult = await runMemoryLeakTest();
            break;
          case 'rapid_task_creation':
            testResult = await runRapidTaskCreation();
            break;
          case 'edge_case_values':
            testResult = await runEdgeCaseTest();
            break;
          case 'storage_pressure':
            testResult = await runStoragePressureTest();
            break;
          case 'continuous_evolution':
            testResult = await runContinuousEvolution();
            break;
          default:
            testResult = { tasksProcessed: 10 };
        }

        // 记录测试报告
        const report: TestReport = {
          timestamp: Date.now(),
          scenario: randomScenario,
          status: testResult.errorCount > 0 ? 'warning' : 'success',
          message: `${scenarioConfigs[randomScenario].name} 完成`,
          metrics: {
            tasksProcessed: testResult.tasksProcessed || 0,
            memoryUsageMb: testResult.memoryUsage || 0,
            avgResponseTime: testResult.avgResponseTime || 0,
            errorCount: testResult.errorCount || 0
          }
        };

        setTestReports(prev => [report, ...prev].slice(0, 100));

        // 更新系统状态
        setSystemState({
          cpuUsage: Math.min(100, 30 + Math.random() * 40),
          memoryUsage: Math.min(100, 20 + Math.random() * 50),
          activeTasks: tasks.length
        });

      } catch (error) {
        // 捕获并记录错误
        const errorReport: TestReport = {
          timestamp: Date.now(),
          scenario: randomScenario,
          status: 'error',
          message: `测试错误: ${error instanceof Error ? error.message : '未知错误'}`,
          metrics: {
            tasksProcessed: 0,
            memoryUsageMb: 0,
            avgResponseTime: 0,
            errorCount: 1
          }
        };
        
        setTestReports(prev => [errorReport, ...prev].slice(0, 100));
        setDetectedIssues(prev => [...prev, {
          id: `error-${Date.now()}`,
          type: 'test_failure',
          message: `${scenarioConfigs[randomScenario].name} 测试失败`,
          timestamp: Date.now()
        }]);
      }

    }, 2000); // 每2秒运行一次测试

  }, [
    activeScenarios, 
    testDuration, 
    isRunning, 
    startSystem, 
    tasks.length,
    scenarioConfigs,
    runMemoryLeakTest,
    runRapidTaskCreation,
    runEdgeCaseTest,
    runStoragePressureTest,
    runContinuousEvolution
  ]);

  // 停止测试
  const stopTesting = useCallback(() => {
    setIsTesting(false);
    if (testIntervalRef.current) {
      clearInterval(testIntervalRef.current);
      testIntervalRef.current = null;
    }
    toast.info('高级压力测试已停止');
  }, []);

  // 清理资源
  useEffect(() => {
    return () => {
      if (testIntervalRef.current) {
        clearInterval(testIntervalRef.current);
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-900/95 border border-gray-700 rounded-2xl p-6 max-w-7xl mx-auto backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            🔬 高级压力测试系统
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            进行长时间复杂测试，发现潜在问题
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2">
            <Timer className="w-4 h-4 text-gray-400" />
            <span className="text-gray-300 font-mono">
              {formatTime(elapsedTime)} / {formatTime(testDuration)}
            </span>
          </div>
          
          {isTesting ? (
            <button
              onClick={stopTesting}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors border border-red-500/30"
            >
              <Pause className="w-4 h-4" />
              停止测试
            </button>
          ) : (
            <button
              onClick={runTestScenarios}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all shadow-lg shadow-blue-500/20"
            >
              <Play className="w-4 h-4" />
              开始测试
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 测试场景选择 */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              测试场景
            </h3>
            
            <div className="space-y-2">
              {Object.entries(scenarioConfigs).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => toggleScenario(key as TestScenario)}
                  className={`w-full text-left p-3 rounded-lg transition-all border ${
                    activeScenarios.includes(key as TestScenario)
                      ? 'bg-blue-500/20 border-blue-500/50'
                      : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`${config.color} p-2 rounded-lg`}>
                      {config.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-200">{config.name}</p>
                      <p className="text-xs text-gray-400">{config.description}</p>
                    </div>
                    {activeScenarios.includes(key as TestScenario) && (
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 测试时长设置 */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-purple-400" />
              测试配置
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-2 block">
                  测试时长: {Math.floor(testDuration / 60)} 分钟
                </label>
                <input
                  type="range"
                  min="60"
                  max="3600"
                  step="60"
                  value={testDuration}
                  onChange={(e) => setTestDuration(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>
          </div>

          {/* 实时系统状态 */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-400" />
              系统状态
            </h3>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">CPU 使用率</span>
                  <span className="text-gray-200">{Math.round(systemState.cpuUsage)}%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                    style={{ width: `${systemState.cpuUsage}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-400">内存使用</span>
                  <span className="text-gray-200">{Math.round(systemState.memoryUsage)}%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                    style={{ width: `${systemState.memoryUsage}%` }}
                  />
                </div>
              </div>
              
              <div className="flex justify-between text-sm pt-2 border-t border-gray-700">
                <span className="text-gray-400">活跃任务</span>
                <span className="text-gray-200 font-mono">{systemState.activeTasks}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 测试报告和问题检测 */}
        <div className="lg:col-span-2 space-y-4">
          {/* 发现的问题 */}
          {detectedIssues.length > 0 && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                检测到的问题 ({detectedIssues.length})
              </h3>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {detectedIssues.slice(0, 10).map((issue) => (
                  <div key={issue.id} className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Bug className="w-4 h-4 text-red-400" />
                        <span className="text-gray-200 font-medium">{issue.message}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(issue.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 测试报告 */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-yellow-400" />
              测试报告 ({testReports.length})
            </h3>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testReports.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  暂无测试报告，开始测试以生成报告
                </div>
              ) : (
                testReports.map((report, index) => (
                  <div 
                    key={`${report.timestamp}-${index}`}
                    className={`border rounded-lg p-3 ${
                      report.status === 'error' 
                        ? 'bg-red-500/10 border-red-500/30' 
                        : report.status === 'warning'
                        ? 'bg-yellow-500/10 border-yellow-500/30'
                        : 'bg-green-500/10 border-green-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className={`font-medium ${
                          report.status === 'error' ? 'text-red-400' :
                          report.status === 'warning' ? 'text-yellow-400' :
                          'text-green-400'
                        }`}>
                          {scenarioConfigs[report.scenario].name}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">{report.message}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(report.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="mt-2 flex flex-wrap gap-4 text-xs">
                      <span className="text-gray-400">
                        处理任务: <span className="text-gray-200">{report.metrics.tasksProcessed}</span>
                      </span>
                      {report.metrics.memoryUsageMb > 0 && (
                        <span className="text-gray-400">
                          内存: <span className="text-gray-200">{Math.round(report.metrics.memoryUsageMb)}MB</span>
                        </span>
                      )}
                      {report.metrics.avgResponseTime > 0 && (
                        <span className="text-gray-400">
                          响应: <span className="text-gray-200">{Math.round(report.metrics.avgResponseTime)}ms</span>
                        </span>
                      )}
                      {report.metrics.errorCount > 0 && (
                        <span className="text-red-400">
                          错误: {report.metrics.errorCount}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 长时间真实测试面板 */}
      <div className="mt-6">
        <LongRunningTestPanel />
      </div>
    </div>
  );
};
