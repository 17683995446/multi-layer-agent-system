import React, { useState, useEffect } from 'react';
import { longRunningTestSystem } from '@/utils/long-running-test';
import { Play, Pause, RotateCcw, Activity, BarChart3, AlertCircle, Terminal } from 'lucide-react';

export const LongRunningTestPanel: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // 同步状态
    const checkStatus = () => {
      setIsRunning(longRunningTestSystem.getIsRunning());
      setResults(longRunningTestSystem.getTestResults());
      setStats(longRunningTestSystem.getTestStats());
    };

    checkStatus();
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const startTest = () => {
    longRunningTestSystem.startTest();
    setIsRunning(true);
  };

  const stopTest = () => {
    longRunningTestSystem.stopTest();
    setIsRunning(false);
  };

  const clearResults = () => {
    if (confirm('确定要清除所有测试结果吗？')) {
      // 重新初始化
      window.location.reload();
    }
  };

  return (
    <div className="bg-gray-900/80 border border-gray-700 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-cyan-400" />
            长时间真实测试
          </h3>
          <p className="text-gray-400 text-sm">
            自动运行真实场景，发现系统问题
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {isRunning ? (
            <button
              onClick={stopTest}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all"
            >
              <Pause className="w-4 h-4" />
              停止测试
            </button>
          ) : (
            <button
              onClick={startTest}
              className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-all"
            >
              <Play className="w-4 h-4" />
              开始测试
            </button>
          )}
          <button
            onClick={clearResults}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-600 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            重置
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">运行状态</p>
            <p className={`text-lg font-bold ${isRunning ? 'text-green-400' : 'text-gray-400'}`}>
              {isRunning ? '运行中' : '已停止'}
            </p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">运行时间</p>
            <p className="text-lg font-bold text-blue-400">
              {Math.floor(stats.uptime / 60)}分{stats.uptime % 60}秒
            </p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">总事件</p>
            <p className="text-lg font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">成功</p>
            <p className="text-lg font-bold text-green-400">{stats.success}</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">警告</p>
            <p className="text-lg font-bold text-yellow-400">{stats.warning}</p>
          </div>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">任务数</p>
            <p className="text-lg font-bold text-cyan-400">{stats.taskCount}</p>
          </div>
        </div>
      )}

      {/* Log Display */}
      <div className="bg-gray-950 border border-gray-700 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-700 bg-gray-800/50">
          <Terminal className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">测试日志</span>
        </div>
        <div className="h-64 overflow-y-auto p-4 font-mono text-sm">
          {results.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>暂无测试日志</p>
              <p className="text-xs mt-1">点击"开始测试"开始</p>
            </div>
          ) : (
            results.slice().reverse().map((result, idx) => (
              <div key={idx} className="mb-1">
                <span className="text-gray-600 text-xs mr-2">
                  [{new Date(result.timestamp).toLocaleTimeString()}]
                </span>
                <span className={
                  result.type === 'success' ? 'text-green-400' :
                  result.type === 'warning' ? 'text-yellow-400' :
                  'text-red-400'
                }>
                  {result.type === 'success' ? '✅' : result.type === 'warning' ? '⚠️' : '❌'}
                </span>
                <span className="text-gray-300 ml-2">{result.message}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Tips */}
      <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-blue-400 font-medium mb-1">测试说明</h4>
            <p className="text-sm text-gray-400">
              此测试系统会模拟真实用户行为，包括：添加任务、执行任务、添加记忆、更新指标等。
              长时间运行可发现内存泄漏、性能问题和边界错误。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
