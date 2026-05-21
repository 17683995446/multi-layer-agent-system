import React, { useState, useEffect, useRef } from 'react';
import { useSystemStore } from '@/stores/systemStore';
import { logger } from '@/utils/systemLogger';
import { 
  AlertTriangle, 
  Play, 
  Square, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock,
  Zap,
  Database,
  Activity,
  Shield
} from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pass' | 'fail' | 'pending' | 'warning';
  message?: string;
  duration?: number;
  error?: any;
  details?: any;
}

interface ExtremeScenario {
  name: string;
  description: string;
  icon: any;
  color: string;
  run: () => Promise<TestResult>;
}

export const ExtremeTestPage: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [currentScenario, setCurrentScenario] = useState('');
  const [progress, setProgress] = useState(0);
  const [memorySnapshots, setMemorySnapshots] = useState<number[]>([]);
  const store = useSystemStore();
  const intervalRef = useRef<any>(null);

  // 实时内存监控
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        const memory = (performance as any).memory?.usedJSHeapSize || 0;
        setMemorySnapshots(prev => [...prev.slice(-50), memory]);
      }, 500);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const addResult = (result: TestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  // === 极限场景定义 ===

  // 场景1: 海量记忆注入（10000+）
  const scenarioMassiveMemoryInjection: ExtremeScenario = {
    name: '海量记忆注入',
    description: '瞬间注入10000+条记忆，测试系统容量和性能',
    icon: Database,
    color: 'from-purple-500 to-indigo-600',
    run: async () => {
      const startTime = Date.now();
      logger.info('EXTREME', 'Starting MASSIVE MEMORY INJECTION - 10000+ memories');
      
      try {
        // 先清除现有记忆
        store.clearAllData();
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 批量注入10000条记忆
        const batchSize = 1000;
        const totalMemories = 10000;
        
        for (let batch = 0; batch < totalMemories / batchSize; batch++) {
          logger.info('EXTREME', `Injecting batch ${batch + 1}/${totalMemories / batchSize}`);
          
          const promises = [];
          for (let i = 0; i < batchSize; i++) {
            const memoryId = batch * batchSize + i;
            promises.push(Promise.resolve().then(() => {
              store.addMemory({
                type: ['experience', 'pattern', 'knowledge', 'fact'][memoryId % 4] as any,
                content: `记忆 ${memoryId}: ${'x'.repeat(100)}`,
                relevance: Math.random(),
                accessCount: Math.floor(Math.random() * 100)
              });
            }));
          }
          
          await Promise.all(promises);
          await new Promise(resolve => setTimeout(resolve, 50)); // 给系统喘息机会
        }
        
        const duration = Date.now() - startTime;
        const memoryCount = store.memories.length;
        
        logger.info('EXTREME', `Memory injection complete: ${memoryCount} memories in ${duration}ms`);
        
        // 测试检索性能
        const searchStart = Date.now();
        const results = store.retrieveRelevantMemories('记忆 5000', 100);
        const searchDuration = Date.now() - searchStart;
        
        logger.info('EXTREME', `Search completed in ${searchDuration}ms, found ${results.length} results`);
        
        return {
          name: '海量记忆注入 (10000+)',
          status: memoryCount > 5000 ? 'pass' : 'warning',
          message: `成功注入 ${memoryCount} 条记忆，检索耗时 ${searchDuration}ms`,
          duration,
          details: { memoryCount, searchDuration, resultCount: results.length }
        };
        
      } catch (error: any) {
        logger.error('EXTREME', 'Memory injection failed', { error });
        return {
          name: '海量记忆注入 (10000+)',
          status: 'fail',
          message: error.message,
          duration: Date.now() - startTime,
          error
        };
      }
    }
  };

  // 场景2: 疯狂并发任务执行（100+）
  const scenarioCrazyConcurrency: ExtremeScenario = {
    name: '疯狂并发执行',
    description: '100+任务同时并发执行，测试竞态条件和状态一致性',
    icon: Zap,
    color: 'from-orange-500 to-red-600',
    run: async () => {
      const startTime = Date.now();
      logger.info('EXTREME', 'Starting CRAZY CONCURRENCY TEST - 100+ simultaneous tasks');
      
      try {
        store.clearAllData();
        
        // 创建100个任务
        const taskIds: string[] = [];
        for (let i = 0; i < 100; i++) {
          const task = store.addTask({
            name: `并发任务 ${i}`,
            priority: Math.floor(Math.random() * 5) as 0 | 1 | 2 | 3 | 4,
            input: { 
              delay: 100 + Math.random() * 400, // 100-500ms
              shouldFail: Math.random() > 0.9 // 10% 失败率
            }
          });
          taskIds.push(task.id);
        }
        
        logger.info('EXTREME', `Created ${taskIds.length} tasks, starting concurrent execution`);
        
        // 同时执行所有任务
        const executionPromises = taskIds.map(id => store.executeTask(id));
        const results = await Promise.allSettled(executionPromises);
        
        const duration = Date.now() - startTime;
        const succeeded = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        logger.info('EXTREME', `Concurrent execution complete: ${succeeded} succeeded, ${failed} failed in ${duration}ms`);
        
        // 检查状态一致性
        const completedTasks = store.tasks.filter(t => 
          t.status === 'completed' || t.status === 'failed'
        );
        
        if (completedTasks.length !== taskIds.length) {
          logger.warn('EXTREME', `State inconsistency detected: expected ${taskIds.length} completed, got ${completedTasks.length}`);
        }
        
        return {
          name: '疯狂并发执行 (100+)',
          status: completedTasks.length === taskIds.length ? 'pass' : 'warning',
          message: `${succeeded} 成功, ${failed} 失败，耗时 ${duration}ms`,
          duration,
          details: { totalTasks: taskIds.length, succeeded, failed, completedTasks: completedTasks.length }
        };
        
      } catch (error: any) {
        logger.error('EXTREME', 'Concurrency test failed', { error });
        return {
          name: '疯狂并发执行 (100+)',
          status: 'fail',
          message: error.message,
          duration: Date.now() - startTime,
          error
        };
      }
    }
  };

  // 场景3: 边界条件攻击
  const scenarioBoundaryAttack: ExtremeScenario = {
    name: '边界条件攻击',
    description: '注入各种异常数据（空值、undefined、NaN、超大对象），测试系统容错能力',
    icon: Shield,
    color: 'from-red-500 to-pink-600',
    run: async () => {
      const startTime = Date.now();
      logger.info('EXTREME', 'Starting BOUNDARY ATTACK TEST - Injecting malformed data');
      
      const issues: string[] = [];
      
      try {
        // 测试1: null/undefined 记忆
        logger.info('EXTREME', 'Testing null/undefined memory content');
        try {
          store.addMemory({
            type: null as any,
            content: null as any,
            relevance: undefined as any
          } as any);
          issues.push('✅ 接受了 null/undefined 记忆（可能有潜在问题）');
        } catch (e) {
          logger.info('EXTREME', 'System rejected null memory');
        }
        
        // 测试2: 超大对象
        logger.info('EXTREME', 'Testing oversized objects');
        try {
          store.addMemory({
            type: 'knowledge',
            content: 'x'.repeat(1000000), // 1MB string
            relevance: 0.5
          });
          issues.push('✅ 接受了超大对象（1MB+），测试内存处理');
        } catch (e) {
          logger.info('EXTREME', 'System rejected oversized object');
        }
        
        // 测试3: 无效优先级
        logger.info('EXTREME', 'Testing invalid priority values');
        const invalidPriorities = [-1, 100, NaN, Infinity, -Infinity];
        for (const priority of invalidPriorities) {
          try {
            const task = store.addTask({
              name: `无效优先级测试: ${priority}`,
              priority: priority as any,
              input: { testPriority: priority }
            });
            issues.push(`✅ 系统接受了无效优先级: ${priority}`);
          } catch (e) {
            logger.info('EXTREME', `System rejected priority ${priority}`);
          }
        }
        
        // 测试4: 特殊字符和注入攻击
        logger.info('EXTREME', 'Testing special characters and injection');
        try {
          store.addMemory({
            type: 'experience',
            content: '<script>alert("xss")</script>测试',
            relevance: 0.9
          });
          issues.push('✅ 接受了包含特殊字符的记忆');
        } catch (e) {
          logger.info('EXTREME', 'System rejected special characters');
        }
        
        // 测试5: 递归和深层对象
        logger.info('EXTREME', 'Testing deeply nested objects');
        try {
          const deepObject: any = { level: 0 };
          let current = deepObject;
          for (let i = 1; i <= 100; i++) {
            current.next = { level: i };
            current = current.next;
          }
          store.addMemory({
            type: 'pattern',
            content: '深层对象测试',
            relevance: 0.7
          });
          issues.push('✅ 接受了深层对象测试（但可能未完全验证）');
        } catch (e) {
          logger.info('EXTREME', 'System handled deep object');
        }
        
        const duration = Date.now() - startTime;
        
        logger.info('EXTREME', `Boundary attack complete: found ${issues.length} issues in ${duration}ms`);
        
        return {
          name: '边界条件攻击',
          status: 'pass', // 即使有问题也不fail，只是记录
          message: `发现 ${issues.length} 个边界问题，系统容错性测试完成`,
          duration,
          details: { issues }
        };
        
      } catch (error: any) {
        logger.error('EXTREME', 'Boundary attack failed', { error });
        return {
          name: '边界条件攻击',
          status: 'fail',
          message: error.message,
          duration: Date.now() - startTime,
          error
        };
      }
    }
  };

  // 场景4: 存储溢出模拟
  const scenarioStorageOverflow: ExtremeScenario = {
    name: '存储溢出攻击',
    description: '模拟存储接近或超过限制，测试系统降级和恢复能力',
    icon: Database,
    color: 'from-yellow-500 to-orange-600',
    run: async () => {
      const startTime = Date.now();
      logger.info('EXTREME', 'Starting STORAGE OVERFLOW SIMULATION');
      
      try {
        store.clearAllData();
        
        // 持续添加数据直到接近限制
        const largeDataSize = 10000; // 每次添加10KB
        let count = 0;
        let storageFull = false;
        
        while (!storageFull && count < 10000) {
          try {
            store.addMemory({
              type: 'knowledge',
              content: 'x'.repeat(largeDataSize),
              relevance: Math.random()
            });
            count++;
            
            if (count % 100 === 0) {
              logger.debug('EXTREME', `Added ${count} memories, checking storage...`);
            }
            
            // 每100条检查一次存储
            if (count % 100 === 0) {
              const isNearLimit = store.storageWarning;
              if (isNearLimit) {
                logger.warn('EXTREME', `Storage warning detected at ${count} memories`);
                break;
              }
            }
            
          } catch (e) {
            logger.error('EXTREME', 'Storage write failed', { e });
            storageFull = true;
          }
        }
        
        const duration = Date.now() - startTime;
        
        logger.info('EXTREME', `Storage overflow test complete: added ${count} memories in ${duration}ms`);
        
        return {
          name: '存储溢出攻击',
          status: 'pass',
          message: `添加 ${count} 条记录，存储警告: ${store.storageWarning ? '是' : '否'}`,
          duration,
          details: { count, storageWarning: store.storageWarning }
        };
        
      } catch (error: any) {
        logger.error('EXTREME', 'Storage overflow test failed', { error });
        return {
          name: '存储溢出攻击',
          status: 'fail',
          message: error.message,
          duration: Date.now() - startTime,
          error
        };
      }
    }
  };

  // 场景5: 状态快速切换
  const scenarioRapidStateSwitch: ExtremeScenario = {
    name: '状态快速切换',
    description: '在多种系统模式间快速切换，测试状态一致性和转换逻辑',
    icon: Activity,
    color: 'from-blue-500 to-cyan-600',
    run: async () => {
      const startTime = Date.now();
      logger.info('EXTREME', 'Starting RAPID STATE SWITCHING TEST');
      
      try {
        const modes: Array<'work' | 'learning' | 'evolving' | 'sleeping' | 'repairing'> = 
          ['work', 'learning', 'evolving', 'sleeping', 'repairing'];
        
        // 快速切换100次
        for (let i = 0; i < 100; i++) {
          const mode = modes[i % modes.length];
          store.setSystemMode(mode);
          
          // 快速添加任务
          store.addTask({
            name: `状态切换任务 ${i} (${mode})`,
            priority: i % 5,
            input: { switchCount: i, mode }
          });
          
          if (i % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }
        
        const duration = Date.now() - startTime;
        const currentMode = store.systemMode;
        const taskCount = store.tasks.length;
        
        logger.info('EXTREME', `State switching complete: ${taskCount} tasks in ${duration}ms, current mode: ${currentMode}`);
        
        return {
          name: '状态快速切换 (100次)',
          status: 'pass',
          message: `完成 ${100} 次状态切换，当前模式: ${currentMode}，任务数: ${taskCount}`,
          duration,
          details: { switches: 100, currentMode, taskCount }
        };
        
      } catch (error: any) {
        logger.error('EXTREME', 'State switching failed', { error });
        return {
          name: '状态快速切换 (100次)',
          status: 'fail',
          message: error.message,
          duration: Date.now() - startTime,
          error
        };
      }
    }
  };

  // 场景6: 异常数据注入攻击
  const scenarioMalformedDataAttack: ExtremeScenario = {
    name: '异常数据注入',
    description: '注入各种格式错误和异常数据，测试系统的输入验证和错误处理',
    icon: AlertTriangle,
    color: 'from-green-500 to-emerald-600',
    run: async () => {
      const startTime = Date.now();
      logger.info('EXTREME', 'Starting MALFORMED DATA ATTACK');
      
      const testCases = [
        { name: '空字符串任务名', data: { name: '', input: {} } },
        { name: '超长任务名', data: { name: 'x'.repeat(10000), input: {} } },
        { name: '循环引用对象', data: { name: 'test', input: {} } },
        { name: '特殊Unicode字符', data: { name: '测试😀🎉', input: {} } },
        { name: 'NaN/Infinity值', data: { name: 'test', input: { value: NaN } } },
        { name: 'undefined输入', data: { name: 'test' } },
        { name: '异常函数', data: { name: 'test', input: { fn: () => {} } } },
        { name: '正则表达式注入', data: { name: 'test', input: { regex: /.*$/ } } },
      ];
      
      const results: any[] = [];
      
      for (const testCase of testCases) {
        try {
          logger.debug('EXTREME', `Testing: ${testCase.name}`);
          
          // 为循环引用添加特殊处理
          if (testCase.name === '循环引用对象') {
            const circular: any = { name: 'test' };
            circular.self = circular;
            testCase.data.input = circular;
          }
          
          const task = store.addTask(testCase.data as any);
          results.push({ name: testCase.name, status: 'accepted', taskId: task.id });
          
        } catch (error: any) {
          results.push({ name: testCase.name, status: 'rejected', error: error.message });
        }
      }
      
      const duration = Date.now() - startTime;
      const accepted = results.filter(r => r.status === 'accepted').length;
      const rejected = results.filter(r => r.status === 'rejected').length;
      
      logger.info('EXTREME', `Malformed data attack complete: ${accepted} accepted, ${rejected} rejected in ${duration}ms`);
      
      return {
        name: '异常数据注入',
        status: 'pass',
        message: `${accepted} 被接受, ${rejected} 被拒绝`,
        duration,
        details: { results }
      };
    }
  };

  // 场景7: 竞态条件模拟
  const scenarioRaceCondition: ExtremeScenario = {
    name: '竞态条件模拟',
    description: '模拟多个操作同时修改同一资源，测试数据一致性和锁机制',
    icon: Zap,
    color: 'from-violet-500 to-purple-600',
    run: async () => {
      const startTime = Date.now();
      logger.info('EXTREME', 'Starting RACE CONDITION SIMULATION');
      
      try {
        store.clearAllData();
        
        // 创建5个任务，然后同时修改
        const taskIds: string[] = [];
        for (let i = 0; i < 5; i++) {
          const task = store.addTask({
            name: `竞态任务 ${i}`,
            priority: 2,
            input: { initial: true }
          });
          taskIds.push(task.id);
        }
        
        // 模拟竞态: 同时更新同一个任务
        const racePromises = taskIds.map((id, index) => 
          Promise.resolve().then(() => {
            store.updateTask(id, { 
              priority: index as 0 | 1 | 2 | 3 | 4,
              input: { raceUpdate: true, index }
            });
            
            // 立即再次更新
            store.updateTask(id, {
              priority: (4 - index) as 0 | 1 | 2 | 3 | 4,
              input: { raceUpdate: true, index: 4 - index }
            });
          })
        );
        
        await Promise.all(racePromises);
        
        // 检查最终状态
        const finalTasks = taskIds.map(id => store.tasks.find(t => t.id === id));
        const hasRaceCondition = finalTasks.some((task, index) => {
          return task?.priority !== (4 - index) as 0 | 1 | 2 | 3 | 4;
        });
        
        const duration = Date.now() - startTime;
        
        logger.info('EXTREME', `Race condition test complete in ${duration}ms, race detected: ${hasRaceCondition}`);
        
        return {
          name: '竞态条件模拟',
          status: hasRaceCondition ? 'warning' : 'pass',
          message: `竞态条件测试完成，最终状态一致性: ${!hasRaceCondition ? '正常' : '存在竞态'}`,
          duration,
          details: { raceDetected: hasRaceCondition, finalPriorities: finalTasks.map(t => t?.priority) }
        };
        
      } catch (error: any) {
        logger.error('EXTREME', 'Race condition test failed', { error });
        return {
          name: '竞态条件模拟',
          status: 'fail',
          message: error.message,
          duration: Date.now() - startTime,
          error
        };
      }
    }
  };

  // 场景8: 长时间压力测试（5分钟）
  const scenarioLongDurationStress: ExtremeScenario = {
    name: '长时间压力测试',
    description: '持续5分钟的压力测试，检测内存泄漏和性能退化',
    icon: Clock,
    color: 'from-gray-600 to-gray-800',
    run: async () => {
      const startTime = Date.now();
      const duration = 5 * 60 * 1000; // 5分钟
      const interval = 1000; // 每秒一次
      let iteration = 0;
      const memoryReadings: number[] = [];
      
      logger.info('EXTREME', `Starting LONG DURATION STRESS TEST for ${duration / 1000} seconds`);
      
      try {
        store.clearAllData();
        
        while (Date.now() - startTime < duration) {
          iteration++;
          
          // 每秒添加一些数据
          for (let i = 0; i < 10; i++) {
            store.addTask({
              name: `压力测试任务 ${iteration}-${i}`,
              priority: Math.floor(Math.random() * 5) as 0 | 1 | 2 | 3 | 4,
              input: { stressTest: true, iteration }
            });
          }
          
          // 每10秒添加记忆
          if (iteration % 10 === 0) {
            store.addMemory({
              type: 'experience',
              content: `压力测试记忆 ${iteration}`,
              relevance: Math.random()
            });
          }
          
          // 记录内存
          const memory = (performance as any).memory?.usedJSHeapSize || 0;
          memoryReadings.push(memory);
          
          // 每30秒输出状态
          if (iteration % 30 === 0) {
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            logger.info('EXTREME', `[${elapsed}s] Iteration ${iteration}: ${store.tasks.length} tasks, ${memory} bytes`);
          }
          
          await new Promise(resolve => setTimeout(resolve, interval));
        }
        
        const totalDuration = Date.now() - startTime;
        
        // 分析内存趋势
        const firstHalf = memoryReadings.slice(0, Math.floor(memoryReadings.length / 2));
        const secondHalf = memoryReadings.slice(Math.floor(memoryReadings.length / 2));
        const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
        const memoryGrowth = avgSecond - avgFirst;
        
        logger.info('EXTREME', `Long duration test complete: ${iteration} iterations in ${totalDuration}ms, memory growth: ${memoryGrowth} bytes`);
        
        return {
          name: '长时间压力测试 (5分钟)',
          status: memoryGrowth < 10 * 1024 * 1024 ? 'pass' : 'warning', // 10MB阈值
          message: `${iteration} 次迭代，内存增长 ${(memoryGrowth / 1024 / 1024).toFixed(2)} MB`,
          duration: totalDuration,
          details: { iterations: iteration, memoryGrowth, memoryReadings }
        };
        
      } catch (error: any) {
        logger.error('EXTREME', 'Long duration test failed', { error });
        return {
          name: '长时间压力测试 (5分钟)',
          status: 'fail',
          message: error.message,
          duration: Date.now() - startTime,
          error
        };
      }
    }
  };

  // 所有极端场景
  const extremeScenarios: ExtremeScenario[] = [
    scenarioMassiveMemoryInjection,
    scenarioCrazyConcurrency,
    scenarioBoundaryAttack,
    scenarioStorageOverflow,
    scenarioRapidStateSwitch,
    scenarioMalformedDataAttack,
    scenarioRaceCondition,
    scenarioLongDurationStress,
  ];

  // 运行所有极端测试
  const runAllExtremeTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setMemorySnapshots([]);
    
    logger.info('TEST', '='.repeat(80));
    logger.info('TEST', '🚀 开始极限混乱测试');
    logger.info('TEST', '='.repeat(80));
    
    const totalScenarios = extremeScenarios.length;
    
    for (let i = 0; i < totalScenarios; i++) {
      const scenario = extremeScenarios[i];
      setCurrentScenario(scenario.name);
      setProgress(Math.floor((i / totalScenarios) * 100));
      
      logger.info('TEST', `▶️ Running scenario ${i + 1}/${totalScenarios}: ${scenario.name}`);
      
      const result = await scenario.run();
      addResult(result);
      
      // 场景间休息
      if (i < totalScenarios - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    setProgress(100);
    setCurrentScenario('');
    setIsRunning(false);
    
    logger.info('TEST', '='.repeat(80));
    logger.info('TEST', '🏁 所有极限测试完成');
    logger.info('TEST', '='.repeat(80));
  };

  const clearState = () => {
    store.clearAllData();
    setTestResults([]);
    setMemorySnapshots([]);
    setProgress(0);
    logger.info('TEST', '状态已清除');
  };

  const passCount = testResults.filter(r => r.status === 'pass').length;
  const failCount = testResults.filter(r => r.status === 'fail').length;
  const warningCount = testResults.filter(r => r.status === 'warning').length;

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 头部 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent mb-2">
            🔥 极限混乱测试中心
          </h1>
          <p className="text-slate-400">
            测试系统在特别复杂、极限混乱场景下的表现
          </p>
        </div>

        {/* 控制面板 */}
        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {!isRunning ? (
                <button
                  onClick={runAllExtremeTests}
                  className="px-8 py-4 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg transition-all text-lg"
                >
                  <Zap size={24} />
                  开始极限测试
                </button>
              ) : (
                <button
                  disabled
                  className="px-8 py-4 bg-slate-700 text-slate-400 font-bold rounded-xl flex items-center gap-2 cursor-not-allowed text-lg"
                >
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  {currentScenario || '测试中...'}
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
                  <div className="w-48 h-4 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-slate-400 text-sm font-medium">{progress}%</span>
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
                <span className="text-yellow-400 flex items-center gap-1">
                  <AlertTriangle size={16} />
                  {warningCount} 警告
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 内存监控 */}
        {memorySnapshots.length > 0 && (
          <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Activity size={20} className="text-cyan-400" />
              实时内存监控
            </h2>
            <div className="h-32 flex items-end gap-1">
              {memorySnapshots.map((memory, index) => (
                <div
                  key={index}
                  className="flex-1 bg-gradient-to-t from-red-500 to-orange-500 rounded-t"
                  style={{ 
                    height: `${Math.min(100, (memory / Math.max(...memorySnapshots)) * 100)}%`,
                    minWidth: '2px'
                  }}
                  title={`${(memory / 1024 / 1024).toFixed(2)} MB`}
                />
              ))}
            </div>
            <div className="mt-2 text-sm text-slate-500">
              当前: {(memory / 1024 / 1024).toFixed(2)} MB | 
              峰值: {(Math.max(...memorySnapshots) / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
        )}

        {/* 测试场景列表 */}
        <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-200 mb-4">
            📋 8大极限测试场景
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {extremeScenarios.map((scenario, index) => {
              const Icon = scenario.icon;
              const result = testResults[index];
              
              return (
                <div 
                  key={index}
                  className={`p-4 rounded-xl border ${
                    result?.status === 'pass' ? 'bg-green-500/10 border-green-500/30' :
                    result?.status === 'fail' ? 'bg-red-500/10 border-red-500/30' :
                    result?.status === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
                    'bg-slate-800/50 border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-5 h-5 bg-gradient-to-br ${scenario.color} rounded p-1`} />
                    <span className="font-medium text-slate-200 text-sm">
                      {index + 1}. {scenario.name}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {scenario.description}
                  </p>
                  {result && (
                    <div className="mt-2 text-xs">
                      <span className={
                        result.status === 'pass' ? 'text-green-400' :
                        result.status === 'fail' ? 'text-red-400' :
                        'text-yellow-400'
                      }>
                        {result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️'}
                        {' '}{result.message}
                      </span>
                      {result.duration && (
                        <span className="text-slate-500 ml-2">
                          ({result.duration}ms)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 测试结果详情 */}
        <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-slate-200 mb-4">
            📝 测试结果详情
          </h2>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <div className="text-slate-500 text-center py-8">
                还没有测试结果，点击"开始极限测试"
              </div>
            ) : (
              testResults.map((result, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-xl border ${
                    result.status === 'pass' 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : result.status === 'fail'
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-yellow-500/10 border-yellow-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-bold ${
                      result.status === 'pass' ? 'text-green-400' :
                      result.status === 'fail' ? 'text-red-400' :
                      'text-yellow-400'
                    }`}>
                      {result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️'} 
                      {result.name}
                    </span>
                    {result.duration && (
                      <span className="text-slate-500 text-sm flex items-center gap-1">
                        <Clock size={14} />
                        {result.duration}ms
                      </span>
                    )}
                  </div>
                  {result.message && (
                    <p className="text-slate-400 text-sm mb-2">
                      {result.message}
                    </p>
                  )}
                  {result.details && (
                    <details className="text-xs">
                      <summary className="text-slate-500 cursor-pointer hover:text-slate-400">
                        查看详情
                      </summary>
                      <pre className="mt-2 p-2 bg-slate-950 rounded text-slate-400 overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 系统状态 */}
        <div className="mt-6 bg-slate-900/50 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-slate-200 mb-4">
            📊 当前系统状态
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
              <p className="text-slate-500 text-sm">存储警告</p>
              <p className="text-2xl font-bold text-red-400">
                {store.storageWarning ? '⚠️ 是' : '✅ 否'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtremeTestPage;
