import React, { useState, useEffect, useRef } from 'react';
import { chaosTestRunner, ChaosTestConfig } from '@/utils/chaosTestRunner';
import { useSystemStore } from '@/stores/systemStore';
import { Zap, AlertTriangle, Play, Square, RefreshCw, Activity } from 'lucide-react';

export const ChaosTestPanel: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [issues, setIssues] = useState<any[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [operations, setOperations] = useState(0);
  const [selectedConfig, setSelectedConfig] = useState<ChaosTestConfig>({
    name: 'Medium Chaos',
    duration: 30000,
    concurrency: 3,
    chaosLevel: 'medium'
  });

  const store = useSystemStore();

  const testConfigs: ChaosTestConfig[] = [
    { name: 'Quick Check', duration: 10000, concurrency: 1, chaosLevel: 'low' },
    { name: 'Medium Chaos', duration: 30000, concurrency: 3, chaosLevel: 'medium' },
    { name: 'High Chaos', duration: 60000, concurrency: 5, chaosLevel: 'high' },
    { name: 'Extreme Chaos', duration: 120000, concurrency: 10, chaosLevel: 'extreme' }
  ];

  const startTest = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setStartTime(Date.now());
    setIssues([]);
    setOperations(0);

    console.clear();
    console.log('🎮 CHAOS TESTING INITIATED');
    console.log(`Config: ${selectedConfig.name}`);

    try {
      const discoveredIssues = await chaosTestRunner.runChaosTest(selectedConfig);
      setIssues(discoveredIssues);
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const clearState = () => {
    store.clearAllData();
    setIssues([]);
    setOperations(0);
    console.log('State cleared!');
  };

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isRunning && startTime) {
      timer = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 1000);
    }
    return () => timer && clearInterval(timer);
  }, [isRunning, startTime]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    return `${seconds}s`;
  };

  const issuesBySeverity = {
    critical: issues.filter(i => i.severity === 'critical'),
    high: issues.filter(i => i.severity === 'high'),
    medium: issues.filter(i => i.severity === 'medium'),
    low: issues.filter(i => i.severity === 'low')
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 via-yellow-500 to-purple-600 bg-clip-text text-transparent mb-2">
          🔧 Chaos Engineering Test Center
        </h1>
        <p className="text-gray-400 text-lg">
          打破系统边界，发现隐藏的问题
        </p>
      </div>

      {/* Main Control Panel */}
      <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Test Configuration
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {testConfigs.map((config) => (
                <button
                  key={config.name}
                  onClick={() => setSelectedConfig(config)}
                  className={`p-3 rounded-xl border transition-all ${
                    selectedConfig.name === config.name 
                      ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400' 
                      : 'border-slate-700 hover:border-slate-500 text-slate-300'
                  }`}
                >
                  <div className="font-semibold text-sm">{config.name}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {formatTime(config.duration)} · {config.concurrency}x concurrency
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Current State
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-slate-400 text-xs mb-1">Tasks</div>
                <div className="text-2xl font-bold text-slate-200">{store.tasks.length}</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-slate-400 text-xs mb-1">Memories</div>
                <div className="text-2xl font-bold text-slate-200">{store.memories.length}</div>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-slate-400 text-xs mb-1">Notifications</div>
                <div className="text-2xl font-bold text-slate-200">{store.notifications.length}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          {!isRunning ? (
            <button
              onClick={startTest}
              className="flex-1 bg-gradient-to-r from-purple-600 to-red-600 hover:from-purple-700 hover:to-red-700 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg"
            >
              <Play className="w-6 h-6" />
              Start Chaos Test
            </button>
          ) : (
            <button
              className="flex-1 bg-slate-700 text-slate-300 font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 cursor-not-allowed"
            >
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Running... {formatTime(elapsedTime)}
            </button>
          )}
          <button
            onClick={clearState}
            className="px-6 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-4 rounded-xl flex items-center gap-2 transition-all"
          >
            <RefreshCw className="w-5 h-5" />
            Clear State
          </button>
        </div>
      </div>

      {/* Results Section */}
      {issues.length > 0 && (
        <div className="mb-6">
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <div className="text-red-400 text-xs font-semibold uppercase mb-1">Critical</div>
              <div className="text-3xl font-bold text-red-400">{issuesBySeverity.critical.length}</div>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
              <div className="text-orange-400 text-xs font-semibold uppercase mb-1">High</div>
              <div className="text-3xl font-bold text-orange-400">{issuesBySeverity.high.length}</div>
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
              <div className="text-yellow-400 text-xs font-semibold uppercase mb-1">Medium</div>
              <div className="text-3xl font-bold text-yellow-400">{issuesBySeverity.medium.length}</div>
            </div>
            <div className="bg-slate-500/10 border border-slate-500/30 rounded-xl p-4">
              <div className="text-slate-400 text-xs font-semibold uppercase mb-1">Low</div>
              <div className="text-3xl font-bold text-slate-400">{issuesBySeverity.low.length}</div>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-yellow-400" />
              Issues Detected
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {issues.map((issue, index) => (
                <div
                  key={issue.id}
                  className={`border-l-4 p-4 rounded-lg ${
                    issue.severity === 'critical' ? 'border-red-500 bg-red-500/10' :
                    issue.severity === 'high' ? 'border-orange-500 bg-orange-500/10' :
                    issue.severity === 'medium' ? 'border-yellow-500 bg-yellow-500/10' :
                    'border-slate-500 bg-slate-500/10'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-bold mr-2 ${
                        issue.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                        issue.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                        issue.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {issue.severity.toUpperCase()}
                      </span>
                      <span className="text-sm text-slate-300">{issue.type}</span>
                      <p className="text-slate-200 mt-1">{issue.description}</p>
                    </div>
                    <span className="text-xs text-slate-500 ml-4">
                      {new Date(issue.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {issue.context && (
                    <pre className="text-xs text-slate-400 mt-2 bg-slate-900/50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(issue.context, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-blue-400 mb-3">How to Use</h3>
        <ol className="text-slate-400 space-y-2 list-decimal list-inside">
          <li>Select a chaos level and start the test</li>
          <li>Watch the browser console for detailed output</li>
          <li>Examine issues discovered in the results</li>
          <li>Fix the root causes systematically</li>
          <li>Run again to verify fixes</li>
        </ol>
      </div>
    </div>
  );
};
