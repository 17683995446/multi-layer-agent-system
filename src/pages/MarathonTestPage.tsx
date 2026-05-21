import React, { useState, useEffect, useRef } from 'react';
import { useSystemStore } from '@/stores/systemStore';
import { logger } from '@/utils/systemLogger';
import { 
  Play, 
  Square, 
  Clock,
  Activity,
  Database,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface TestPhase {
  name: string;
  duration: number; // 毫秒
  description: string;
  run: () => Promise<boolean>;
}

export const MarathonTestPage: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('');
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [results, setResults] = useState<{
    phase: string;
    status: 'pass' | 'fail' | 'warning';
    message: string;
    timestamp: number;
  }[]>([]);
  
  const store = useSystemStore();
  const startTimeRef = useRef(0);
  const intervalRef = useRef<any>(null);
  
  // 阶段1: 初始化和基线建立
  const phase1Init = async (): Promise<boolean> => {
    logger.info('MARATHON', '=== 阶段1: 初始化和基线建立 ===');
    console.log('🔧 阶段1: 初始化和基线建立 - 开始');
    
    try {
      // 清除所有数据，建立干净环境
      store.clearAllData();
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 验证清理成功
      if (store.tasks.length !== 0) {
        logger.error('MARATHON', '清理任务失败');
        return false;
      }
      
      // 创建初始任务基线
      for (let i = 0; i < 50; i++) {
        store.addTask({
          name: `基线任务 ${i}`,
          priority: Math.floor(Math.random() * 5) as 0 | 1 | 2 | 3 | 4,
          input: { baseline: true, index: i }
        });
      }
      
      // 创建初始记忆基线
      for (let i = 0; i < 30; i++) {
        store.addMemory({
          type: ['experience', 'pattern', 'knowledge'][i % 3] as any,
          content: `基线记忆 ${i}`,
          relevance: Math.random()
        });
      }
      
      logger.info('MARATHON', `基线建立完成: ${store.tasks.length} 任务, ${store.memories.length} 记忆`);
      console.log(`✅ 基线建立完成: ${store.tasks.length} 任务, ${store.memories.length} 记忆`);
      
      return true;
    } catch (error) {
      logger.error('MARATHON', '阶段1失败', { error });
      console.error('❌ 阶段1失败:', error);
      return false;
    }
  };
  
  // 阶段2: 持续负载测试（10分钟）
  const phase2SustainedLoad = async (): Promise<boolean> => {
    logger.info('MARATHON', '=== 阶段2: 持续负载测试 (10分钟) ===');
    console.log('⚡ 阶段2: 持续负载测试 - 开始 (10分钟)');
    
    const duration = 10 * 60 * 1000; // 10分钟
    const interval = 100; // 每100ms一次操作
    const startTime = Date.now();
    let iteration = 0;
    
    try {
      while (Date.now() - startTime < duration) {
        iteration++;
        
        // 随机操作
        const operation = Math.floor(Math.random() * 5);
        
        switch (operation) {
          case 0: // 添加任务
            store.addTask({
              name: `负载任务 ${iteration}`,
              priority: Math.floor(Math.random() * 5) as 0 | 1 | 2 | 3 | 4,
              input: { loadTest: true, iteration }
            });
            break;
            
          case 1: // 添加记忆
            store.addMemory({
              type: 'experience',
              content: `负载记忆 ${iteration}`,
              relevance: Math.random()
            });
            break;
            
          case 2: // 执行随机任务
            const pendingTasks = store.tasks.filter(t => t.status === 'pending');
            if (pendingTasks.length > 0) {
              const randomTask = pendingTasks[Math.floor(Math.random() * pendingTasks.length)];
              store.executeTask(randomTask.id);
            }
            break;
            
          case 3: // 更新任务
            const tasks = store.tasks;
            if (tasks.length > 0) {
              const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
              store.updateTask(randomTask.id, {
                priority: Math.floor(Math.random() * 5) as 0 | 1 | 2 | 3 | 4
              });
            }
            break;
            
          case 4: // 检索记忆
            store.retrieveRelevantMemories('负载', 10);
            break;
        }
        
        // 每100次迭代报告一次状态
        if (iteration % 100 === 0) {
          const elapsed = Math.floor((Date.now() - startTime) / 1000);
          logger.debug('MARATHON', `[${elapsed}s] 迭代 ${iteration}: 任务=${store.tasks.length}, 记忆=${store.memories.length}`);
          console.log(`  [${elapsed}s] 迭代 ${iteration}: 任务=${store.tasks.length}, 记忆=${store.memories.length}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, interval));
      }
      
      logger.info('MARATHON', `持续负载测试完成: ${iteration} 次操作`);
      console.log(`✅ 持续负载测试完成: ${iteration} 次操作`);
      
      return true;
    } catch (error) {
      logger.error('MARATHON', '阶段2失败', { error });
      console.error('❌ 阶段2失败:', error);
      return false;
    }
  };
  
  // 阶段3: 并发风暴测试（5分钟）
  const phase3ConcurrentStorm = async (): Promise<boolean> => {
    logger.info('MARATHON', '=== 阶段3: 并发风暴测试 (5分钟) ===');
    console.log('🌪️ 阶段3: 并发风暴测试 - 开始 (5分钟)');
    
    const duration = 5 * 60 * 1000; // 5分钟
    const startTime = Date.now();
    let wavesCompleted = 0;
    
    try {
      while (Date.now() - startTime < duration) {
        wavesCompleted++;
        logger.info('MARATHON', `并发波浪 ${wavesCompleted} 开始`);
        console.log(`🌊 并发波浪 ${wavesCompleted} 开始`);
        
        // 每次波浪: 同时启动100个任务
        const taskIds: string[] = [];
        for (let i = 0; i < 100; i++) {
          const task = store.addTask({
            name: `并发波浪${wavesCompleted}-任务${i}`,
            priority: Math.floor(Math.random() * 5) as 0 | 1 | 2 | 3 | 4,
            input: { 
              wave: wavesCompleted, 
              index: i,
              delay: 50 + Math.random() * 150 // 50-200ms
            }
          });
          taskIds.push(task.id);
        }
        
        // 同时执行所有任务
        const promises = taskIds.map(id => store.executeTask(id));
        await Promise.allSettled(promises);
        
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        logger.info('MARATHON', `[${elapsed}s] 并发波浪 ${wavesCompleted} 完成: ${store.tasks.filter(t => t.status === 'completed').length} 完成`);
        console.log(`  [${elapsed}s] 并发波浪 ${wavesCompleted} 完成`);
        
        // 波浪间休息2秒
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      logger.info('MARATHON', `并发风暴测试完成: ${wavesCompleted} 个波浪`);
      console.log(`✅ 并发风暴测试完成: ${wavesCompleted} 个波浪`);
      
      return true;
    } catch (error) {
      logger.error('MARATHON', '阶段3失败', { error });
      console.error('❌ 阶段3失败:', error);
      return false;
    }
  };
  
  // 阶段4: 边界攻击测试（3分钟）
  const phase4BoundaryAttack = async (): Promise<boolean> => {
    logger.info('MARATHON', '=== 阶段4: 边界攻击测试 (3分钟) ===');
    console.log('💥 阶段4: 边界攻击测试 - 开始 (3分钟)');
    
    const duration = 3 * 60 * 1000; // 3分钟
    const startTime = Date.now();
    let attacksCount = 0;
    
    try {
      while (Date.now() - startTime < duration) {
        attacksCount++;
        
        // 各种边界攻击
        const attackType = Math.floor(Math.random() * 10);
        
        switch (attackType) {
          case 0: // 空字符串
            store.addTask({ name: '', input: {} });
            break;
            
          case 1: // 超大字符串
            store.addMemory({
              type: 'knowledge',
              content: 'x'.repeat(50000), // 50KB
              relevance: 0.5
            });
            break;
            
          case 2: // 无效优先级
            store.addTask({
              name: '无效优先级',
              priority: Math.floor(Math.random() * 100) - 50 as any // -50 到 49
            });
            break;
            
          case 3: // 无效relevance
            store.addMemory({
              type: 'experience',
              content: '无效relevance测试',
              relevance: Math.random() * 2 - 0.5 as any // -0.5 到 1.5
            });
            break;
            
          case 4: // 特殊字符
            store.addMemory({
              type: 'pattern',
              content: '<script>alert("xss")</script>',
              relevance: 0.9
            });
            break;
            
          case 5: // Unicode
            store.addMemory({
              type: 'knowledge',
              content: '测试😀🎉🔥💻' + 'x'.repeat(1000),
              relevance: 0.8
            });
            break;
            
          case 6: // null/undefined
            store.addMemory({
              type: null as any,
              content: null as any,
              relevance: undefined as any
            } as any);
            break;
            
          case 7: // 循环引用
            try {
              const obj: any = { name: '循环' };
              obj.self = obj;
              store.addTask({
                name: '循环引用测试',
                input: obj
              });
            } catch (e) {
              // 预期失败
            }
            break;
            
          case 8: // NaN/Infinity
            store.addTask({
              name: '数学异常',
              priority: NaN,
              input: { value: Infinity }
            });
            break;
            
          case 9: // 大量空值查询
            store.retrieveRelevantMemories('', 1000);
            break;
        }
        
        if (attacksCount % 50 === 0) {
          logger.debug('MARATHON', `边界攻击: ${attacksCount} 次, 任务=${store.tasks.length}, 记忆=${store.memories.length}`);
          console.log(`  边界攻击: ${attacksCount} 次`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      logger.info('MARATHON', `边界攻击测试完成: ${attacksCount} 次攻击`);
      console.log(`✅ 边界攻击测试完成: ${attacksCount} 次攻击`);
      
      return true;
    } catch (error) {
      logger.error('MARATHON', '阶段4失败', { error });
      console.error('❌ 阶段4失败:', error);
      return false;
    }
  };
  
  // 阶段5: 数据一致性验证（2分钟）
  const phase5DataConsistency = async (): Promise<boolean> => {
    logger.info('MARATHON', '=== 阶段5: 数据一致性验证 (2分钟) ===');
    console.log('🔍 阶段5: 数据一致性验证 - 开始');
    
    try {
      // 1. 验证任务数据一致性
      logger.info('MARATHON', '验证任务数据一致性...');
      const taskIds = new Set(store.tasks.map(t => t.id));
      if (taskIds.size !== store.tasks.length) {
        logger.error('MARATHON', '发现重复的任务ID!');
        console.error('❌ 发现重复的任务ID!');
        return false;
      }
      
      // 2. 验证记忆数据一致性
      logger.info('MARATHON', '验证记忆数据一致性...');
      const memoryIds = new Set(store.memories.map(m => m.id));
      if (memoryIds.size !== store.memories.length) {
        logger.error('MARATHON', '发现重复的记忆ID!');
        console.error('❌ 发现重复的记忆ID!');
        return false;
      }
      
      // 3. 验证存储持久化
      logger.info('MARATHON', '验证存储持久化...');
      const initialTaskCount = store.tasks.length;
      const initialMemoryCount = store.memories.length;
      
      // 模拟刷新页面
      await store.loadSystemState();
      
      if (store.tasks.length !== initialTaskCount) {
        logger.warn('MARATHON', `任务数量不一致: 刷新前=${initialTaskCount}, 刷新后=${store.tasks.length}`);
        console.warn('⚠️ 任务数量不一致');
      }
      
      // 4. 验证指标计算
      logger.info('MARATHON', '验证指标计算...');
      const completedCount = store.tasks.filter(t => t.status === 'completed').length;
      const failedCount = store.tasks.filter(t => t.status === 'failed').length;
      const successRate = store.metrics.totalTasks > 0 
        ? (completedCount / store.metrics.totalTasks) * 100 
        : 0;
      
      logger.info('MARATHON', `指标验证: 完成=${completedCount}, 失败=${failedCount}, 成功率=${successRate.toFixed(2)}%`);
      console.log(`✅ 指标: 完成=${completedCount}, 失败=${failedCount}, 成功率=${successRate.toFixed(2)}%`);
      
      return true;
    } catch (error) {
      logger.error('MARATHON', '阶段5失败', { error });
      console.error('❌ 阶段5失败:', error);
      return false;
    }
  };
  
  // 阶段6: 最终清理和报告（1分钟）
  const phase6CleanupAndReport = async (): Promise<boolean> => {
    logger.info('MARATHON', '=== 阶段6: 最终清理和报告 ===');
    console.log('🧹 阶段6: 最终清理和报告 - 开始');
    
    try {
      // 记录最终状态
      const finalState = {
        tasks: store.tasks.length,
        completedTasks: store.tasks.filter(t => t.status === 'completed').length,
        failedTasks: store.tasks.filter(t => t.status === 'failed').length,
        memories: store.memories.length,
        notifications: store.notifications.length,
        successRate: store.metrics.successRate,
        avgResponseTime: store.metrics.avgResponseTime
      };
      
      logger.info('MARATHON', '最终状态报告', finalState);
      console.log('📊 最终状态报告:');
      console.log(`  任务总数: ${finalState.tasks}`);
      console.log(`  完成: ${finalState.completedTasks}`);
      console.log(`  失败: ${finalState.failedTasks}`);
      console.log(`  记忆: ${finalState.memories}`);
      console.log(`  通知: ${finalState.notifications}`);
      console.log(`  成功率: ${finalState.successRate.toFixed(2)}%`);
      console.log(`  平均响应时间: ${finalState.avgResponseTime.toFixed(2)}ms`);
      
      // 清理
      store.clearAllData();
      logger.info('MARATHON', '清理完成');
      console.log('✅ 清理完成');
      
      return true;
    } catch (error) {
      logger.error('MARATHON', '阶段6失败', { error });
      console.error('❌ 阶段6失败:', error);
      return false;
    }
  };
  
  // 所有测试阶段
  const testPhases: TestPhase[] = [
    { 
      name: '初始化和基线建立', 
      duration: 60000, // 1分钟
      description: '建立测试基线',
      run: phase1Init
    },
    { 
      name: '持续负载测试 (10分钟)', 
      duration: 600000, // 10分钟
      description: '长时间持续负载',
      run: phase2SustainedLoad
    },
    { 
      name: '并发风暴测试 (5分钟)', 
      duration: 300000, // 5分钟
      description: '高并发压力测试',
      run: phase3ConcurrentStorm
    },
    { 
      name: '边界攻击测试 (3分钟)', 
      duration: 180000, // 3分钟
      description: '异常数据注入',
      run: phase4BoundaryAttack
    },
    { 
      name: '数据一致性验证', 
      duration: 120000, // 2分钟
      description: '验证数据完整性',
      run: phase5DataConsistency
    },
    { 
      name: '最终清理和报告', 
      duration: 60000, // 1分钟
      description: '清理并生成报告',
      run: phase6CleanupAndReport
    },
  ];
  
  // 运行马拉松测试
  const runMarathonTest = async () => {
    setIsRunning(true);
    setResults([]);
    startTimeRef.current = Date.now();
    
    logger.info('MARATHON', '='.repeat(80));
    logger.info('MARATHON', '🏃‍♂️ 开始超长时间马拉松测试');
    logger.info('MARATHON', '='.repeat(80));
    console.log('🏃‍♂️'.repeat(20));
    console.log('开始超长时间马拉松测试 (总共约22分钟)');
    console.log('🏃‍♂️'.repeat(20));
    
    const totalDuration = testPhases.reduce((sum, p) => sum + p.duration, 0);
    
    try {
      for (let i = 0; i < testPhases.length; i++) {
        const phase = testPhases[i];
        setCurrentPhase(phase.name);
        
        // 计算进度
        const completedDuration = testPhases.slice(0, i).reduce((sum, p) => sum + p.duration, 0);
        const phaseProgress = (completedDuration / totalDuration) * 100;
        setProgress(phaseProgress);
        
        logger.info('MARATHON', `▶️ 阶段 ${i + 1}/${testPhases.length}: ${phase.name}`);
        console.log(`\n${'='.repeat(60)}`);
        console.log(`阶段 ${i + 1}/${testPhases.length}: ${phase.name}`);
        console.log(`${'='.repeat(60)}\n`);
        
        const startPhaseTime = Date.now();
        const success = await phase.run();
        const phaseDuration = Date.now() - startPhaseTime;
        
        const result = {
          phase: phase.name,
          status: success ? 'pass' as const : 'fail' as const,
          message: success ? `完成 (${(phaseDuration / 1000).toFixed(1)}s)` : '失败',
          timestamp: Date.now()
        };
        
        setResults(prev => [...prev, result]);
        
        logger.info('MARATHON', `✅ 阶段 ${i + 1} ${success ? '通过' : '失败'}`);
        console.log(`\n✅ 阶段 ${i + 1} ${success ? '通过' : '失败'} (${(phaseDuration / 1000).toFixed(1)}s)\n`);
        
        // 阶段间休息
        if (i < testPhases.length - 1) {
          logger.info('MARATHON', '阶段间休息3秒...');
          console.log('休息3秒...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      
      setProgress(100);
      logger.info('MARATHON', '='.repeat(80));
      logger.info('MARATHON', '🏁 马拉松测试完成!');
      logger.info('MARATHON', '='.repeat(80));
      console.log('\n🏁'.repeat(20));
      console.log('马拉松测试完成!');
      console.log('🏁'.repeat(20));
      
    } catch (error) {
      logger.error('MARATHON', '测试过程发生错误', { error });
      console.error('\n❌ 测试过程发生错误:', error);
    } finally {
      setIsRunning(false);
      setCurrentPhase('');
      setElapsedTime(Date.now() - startTimeRef.current);
    }
  };
  
  // 实时计时器
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTimeRef.current);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);
  
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
  };
  
  const passCount = results.filter(r => r.status === 'pass').length;
  const failCount = results.filter(r => r.status === 'fail').length;
  
  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 头部 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-2">
            🏃‍♂️ 超长时间马拉松测试
          </h1>
          <p className="text-slate-400">
            约22分钟的极限测试，包括持续负载、并发风暴、边界攻击等特别复杂的真实场景
          </p>
        </div>

        {/* 测试阶段 */}
        <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Activity size={20} className="text-green-400" />
            测试阶段 (共6个，约22分钟)
          </h2>
          <div className="space-y-3">
            {testPhases.map((phase, index) => {
              const result = results[index];
              const isActive = currentPhase === phase.name;
              
              return (
                <div 
                  key={index}
                  className={`p-4 rounded-xl border transition-all ${
                    isActive ? 'bg-blue-500/10 border-blue-500/50' :
                    result?.status === 'pass' ? 'bg-green-500/10 border-green-500/30' :
                    result?.status === 'fail' ? 'bg-red-500/10 border-red-500/30' :
                    'bg-slate-800/50 border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-slate-600">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-slate-200">
                          {phase.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {phase.description} • {phase.duration / 1000}秒
                        </p>
                      </div>
                    </div>
                    
                    {isActive && (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span className="text-blue-400 text-sm">运行中</span>
                      </div>
                    )}
                    
                    {result && !isActive && (
                      <span className={
                        result.status === 'pass' ? 'text-green-400 text-sm' : 'text-red-400 text-sm'
                      }>
                        {result.status === 'pass' ? '✅' : '❌'} {result.message}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 控制面板 */}
        <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {!isRunning ? (
                <button
                  onClick={runMarathonTest}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg transition-all text-lg"
                >
                  <Play size={24} />
                  开始马拉松测试
                </button>
              ) : (
                <button
                  disabled
                  className="px-8 py-4 bg-slate-700 text-slate-400 font-bold rounded-xl flex items-center gap-2 text-lg"
                >
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  测试运行中...
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-6">
              {/* 进度 */}
              {isRunning && (
                <div className="flex flex-col gap-2">
                  <div className="w-64 h-4 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>进度: {progress.toFixed(1)}%</span>
                    <span>耗时: {formatTime(elapsedTime)}</span>
                  </div>
                </div>
              )}
              
              {/* 统计 */}
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

        {/* 当前状态 */}
        {isRunning && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
              <p className="text-slate-500 text-sm mb-1">任务数</p>
              <p className="text-2xl font-bold text-blue-400">{store.tasks.length}</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
              <p className="text-slate-500 text-sm mb-1">记忆数</p>
              <p className="text-2xl font-bold text-purple-400">{store.memories.length}</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
              <p className="text-slate-500 text-sm mb-1">成功率</p>
              <p className="text-2xl font-bold text-green-400">{store.metrics.successRate.toFixed(1)}%</p>
            </div>
            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
              <p className="text-slate-500 text-sm mb-1">通知</p>
              <p className="text-2xl font-bold text-orange-400">{store.notifications.length}</p>
            </div>
          </div>
        )}

        {/* 测试结果 */}
        {results.length > 0 && (
          <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-slate-200 mb-4">
              📊 测试结果
            </h2>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div 
                  key={index}
                  className={`p-4 rounded-xl border ${
                    result.status === 'pass' 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${
                      result.status === 'pass' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {result.status === 'pass' ? '✅' : '❌'} 
                      {index + 1}. {result.phase}
                    </span>
                    <span className="text-slate-500 text-sm">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mt-1">
                    {result.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarathonTestPage;
