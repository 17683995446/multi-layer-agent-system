import React, { useState, useEffect, useRef } from 'react';
import { useSystemStore } from '../stores/systemStore';
import { logger } from '../utils/systemLogger';
import { perfMonitor, PerformanceMetric } from '../utils/performanceMonitor';
import { stressTester, StressTestConfig, StressTestResult, AdvancedStressTester } from '../utils/advancedStressTester';

const PerformanceTestPage: React.FC = () => {
  const [isTesting, setIsTesting] = useState(false);
  const [currentResult, setCurrentResult] = useState<StressTestResult | null>(null);
  const [allResults, setAllResults] = useState<StressTestResult[]>([]);
  const [fps, setFps] = useState<number | null>(null);
  const [memoryUsage, setMemoryUsage] = useState<number | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string>('QUICK');
  const [customConfig, setCustomConfig] = useState<Partial<StressTestConfig>>({});
  const logsEndRef = useRef<HTMLDivElement>(null);

  // 添加日志
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // 滚动日志到底部
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // 监控性能指标
  useEffect(() => {
    const interval = setInterval(() => {
      setFps(perfMonitor.getCurrentFPS());
      setMemoryUsage(perfMonitor.getMemoryUsageMB());
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // 加载历史结果
  useEffect(() => {
    setAllResults(stressTester.getResults());
  }, []);

  // 开始压力测试
  const startTest = async () => {
    setIsTesting(true);
    setCurrentResult(null);
    addLog('Starting stress test...');

    try {
      const preset = (AdvancedStressTester.PRESETS as any)[selectedPreset];
      const config = { ...preset, ...customConfig };
      
      addLog(`Test config: ${JSON.stringify(config, null, 2)}`);
      
      const result = await stressTester.startTest(config);
      setCurrentResult(result);
      setAllResults(stressTester.getResults());
      
      addLog(`Test completed! Success rate: ${((result.successfulOperations / result.totalOperations) * 100).toFixed(2)}%`);
      addLog(`Average response time: ${result.averageResponseTime.toFixed(2)}ms`);
      
    } catch (error) {
      addLog(`Test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  // 停止测试
  const stopTest = () => {
    stressTester.stopTest();
    setIsTesting(false);
    addLog('Test stopped manually');
  };

  // 清除结果
  const clearResults = () => {
    stressTester.clearResults();
    setAllResults([]);
    setCurrentResult(null);
    perfMonitor.clearMetrics();
    setLogs([]);
    addLog('Results cleared');
  };

  // 清除所有数据
  const clearAllData = () => {
    const store = useSystemStore.getState();
    store.clearAllData();
    addLog('All system data cleared');
  };

  // 导出报告
  const exportReport = () => {
    const report = stressTester.generateReport();
    const blob = new Blob([report], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stress-test-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addLog('Report exported');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-blue-400 mb-2">
            🚀 Performance Testing & Stress Test
          </h1>
          <p className="text-gray-400">
            Comprehensive system performance monitoring and stress testing
          </p>
        </div>

        {/* Real-time Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-semibold text-green-400 mb-2">FPS</h3>
            <div className="text-3xl font-mono">
              {fps ? `${fps.toFixed(1)}` : '--'}
              <span className="text-sm text-gray-400 ml-2">fps</span>
            </div>
            <div className="mt-2 h-2 bg-gray-700 rounded">
              <div 
                className="h-full bg-green-500 rounded transition-all"
                style={{ width: `${Math.min(100, (fps || 0) / 60 * 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-semibold text-purple-400 mb-2">Memory Usage</h3>
            <div className="text-3xl font-mono">
              {memoryUsage ? `${memoryUsage.toFixed(1)}` : '--'}
              <span className="text-sm text-gray-400 ml-2">MB</span>
            </div>
            <div className="mt-2 h-2 bg-gray-700 rounded">
              <div 
                className="h-full bg-purple-500 rounded transition-all"
                style={{ width: `${Math.min(100, (memoryUsage || 0) / 1000 * 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h3 className="text-lg font-semibold text-orange-400 mb-2">Test Status</h3>
            <div className="text-2xl font-mono">
              {isTesting ? (
                <span className="text-yellow-400 animate-pulse">▶ Running...</span>
              ) : (
                <span className="text-green-400">⏸ Idle</span>
              )}
            </div>
            <div className="mt-2 text-sm text-gray-400">
              Results: {allResults.length}
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-300">Test Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Preset Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Test Preset
              </label>
              <select
                value={selectedPreset}
                onChange={(e) => setSelectedPreset(e.target.value)}
                disabled={isTesting}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white disabled:opacity-50"
              >
                <option value="QUICK">Quick Validation (10s)</option>
                <option value="NORMAL">Normal Load (60s)</option>
                <option value="HEAVY">Heavy Load (2min)</option>
                <option value="EXTREME">Extreme Chaos (5min)</option>
              </select>
            </div>

            {/* Custom Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Custom Duration (ms)
              </label>
              <input
                type="number"
                value={customConfig.duration || ''}
                onChange={(e) => setCustomConfig({ ...customConfig, duration: Number(e.target.value) })}
                disabled={isTesting}
                placeholder="Leave empty for preset"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white disabled:opacity-50"
              />
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex flex-wrap gap-3">
            {!isTesting ? (
              <button
                onClick={startTest}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold transition-colors"
              >
                🚀 Start Test
              </button>
            ) : (
              <button
                onClick={stopTest}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-colors"
              >
                ⏹ Stop Test
              </button>
            )}
            
            <button
              onClick={clearResults}
              disabled={isTesting}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              🗑 Clear Results
            </button>
            
            <button
              onClick={exportReport}
              disabled={allResults.length === 0 || isTesting}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              📥 Export Report
            </button>
            
            <button
              onClick={clearAllData}
              disabled={isTesting}
              className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              🔄 Clear System Data
            </button>
          </div>
        </div>

        {/* Current Result */}
        {currentResult && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-green-300">
              ✅ Latest Test Result: {currentResult.config.name}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-sm text-gray-400">Duration</div>
                <div className="text-xl font-mono text-white">
                  {((currentResult.endTime - currentResult.startTime) / 1000).toFixed(1)}s
                </div>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-sm text-gray-400">Success Rate</div>
                <div className="text-xl font-mono text-green-400">
                  {currentResult.totalOperations > 0 
                    ? `${((currentResult.successfulOperations / currentResult.totalOperations) * 100).toFixed(2)}%`
                    : 'N/A'}
                </div>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-sm text-gray-400">Avg Response</div>
                <div className="text-xl font-mono text-blue-400">
                  {currentResult.averageResponseTime.toFixed(2)}ms
                </div>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <div className="text-sm text-gray-400">Peak Memory</div>
                <div className="text-xl font-mono text-purple-400">
                  {currentResult.memoryUsage.peak ? `${currentResult.memoryUsage.peak.toFixed(2)}MB` : 'N/A'}
                </div>
              </div>
            </div>
            {currentResult.errors.length > 0 && (
              <div className="mt-4 p-3 bg-red-900/30 border border-red-700 rounded">
                <h3 className="text-red-400 font-semibold mb-2">
                  ⚠ Errors: {currentResult.errors.length}
                </h3>
                <div className="text-sm text-red-300 max-h-32 overflow-y-auto">
                  {currentResult.errors.map((err, i) => (
                    <div key={i} className="mb-1">{err.message}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* All Results */}
        {allResults.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-yellow-300">📊 All Test Results</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 px-3">Test Name</th>
                    <th className="text-left py-2 px-3">Duration</th>
                    <th className="text-left py-2 px-3">Operations</th>
                    <th className="text-left py-2 px-3">Success Rate</th>
                    <th className="text-left py-2 px-3">Avg Response</th>
                    <th className="text-left py-2 px-3">Peak Memory</th>
                    <th className="text-left py-2 px-3">Errors</th>
                  </tr>
                </thead>
                <tbody>
                  {allResults.map((result, index) => (
                    <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/50">
                      <td className="py-2 px-3">{result.config.name}</td>
                      <td className="py-2 px-3">{((result.endTime - result.startTime) / 1000).toFixed(1)}s</td>
                      <td className="py-2 px-3">{result.totalOperations}</td>
                      <td className="py-2 px-3 text-green-400">
                        {result.totalOperations > 0 
                          ? `${((result.successfulOperations / result.totalOperations) * 100).toFixed(2)}%`
                          : 'N/A'}
                      </td>
                      <td className="py-2 px-3">{result.averageResponseTime.toFixed(2)}ms</td>
                      <td className="py-2 px-3">
                        {result.memoryUsage.peak ? `${result.memoryUsage.peak.toFixed(2)}MB` : 'N/A'}
                      </td>
                      <td className="py-2 px-3">
                        <span className={result.errors.length > 0 ? 'text-red-400' : 'text-green-400'}>
                          {result.errors.length}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Logs */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-gray-300">📝 Test Logs</h2>
          <div className="bg-black rounded p-4 h-64 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet. Start a test to see logs.</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="text-gray-300 mb-1">{log}</div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceTestPage;
