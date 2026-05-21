import React, { useState, useEffect } from 'react';
import { massiveChaosRunner, MassiveChaosConfig, ChaosIssue } from '@/utils/massiveChaosRunner';
import { useSystemStore } from '@/stores/systemStore';
import { Zap, Activity, AlertTriangle, Play, Square, RefreshCw, Timer, Cpu, Database } from 'lucide-react';

export const MassiveChaosPanel: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [issues, setIssues] = useState<ChaosIssue[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [operations, setOperations] = useState(0);
  const [selectedConfig, setSelectedConfig] = useState<MassiveChaosConfig>({
    name: 'Massive Test',
    duration: 60000,
    concurrency: 20,
    operationsPerSecond: 50,
    chaosLevel: 'massive'
  });

  const store = useSystemStore();

  const testConfigs: MassiveChaosConfig[] = [
    { 
      name: 'Massive Test', 
      duration: 60000, 
      concurrency: 20, 
      operationsPerSecond: 50, 
      chaosLevel: 'massive' 
    },
    { 
      name: 'Extreme Test', 
      duration: 120000, 
      concurrency: 50, 
      operationsPerSecond: 100, 
      chaosLevel: 'extreme' 
    },
    { 
      name: 'Apocalyptic Test', 
      duration: 300000, 
      concurrency: 100, 
      operationsPerSecond: 200, 
      chaosLevel: 'apocalyptic' 
    }
  ];

  const startTest = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setElapsedTime(0);
    setIssues([]);
    setOperations(0);

    console.clear();
    console.log('🔥🔥🔥 MASSIVE CHAOS TEST STARTING...');

    const startTime = Date.now();
    const timer = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 1000);

    try {
      const discoveredIssues = await massiveChaosRunner.runMassiveChaosTest(selectedConfig);
      setIssues(discoveredIssues);
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      clearInterval(timer);
      setIsRunning(false);
    }
  };

  const stopTest = () => {
    massiveChaosRunner.stop();
    setIsRunning(false);
  };

  const clearState = () => {
    store.clearAllData();
    setIssues([]);
    setOperations(0);
    console.log('State cleared!');
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
        <h1 className="text-5xl font-bold bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent mb-2">
          💥 Massive Chaos Engineering Center
        </h1>
        <p className="text-gray-400 text-xl">
          极端压力测试 - 发现系统极限和隐藏问题
        </p>
      </div>

      {/* Control Panel */}
      <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/50 border-2 border-red-500/30 rounded-3xl p-8 mb-6 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-slate-200 flex items-center gap-3">
              <Zap className="w-8 h-8 text-yellow-400" />
              Test Configuration
            </h3>
            <div className="space-y-3">
              {testConfigs.map((config) => (
                <button
                  key={config.name}
                  onClick={() => setSelectedConfig(config)}
                  disabled={isRunning}
                  className={`w-full p-4 rounded-xl border-2 transition-all ${
                    selectedConfig.name === config.name 
                      ? 'border-red-500 bg-red-500/10 text-red-400' 
                      : 'border-slate-700 hover:border-slate-500 text-slate-300'
                  } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="font-bold text-lg">{config.name}</div>
                  <div className="text-sm text-slate-500 mt-1 grid grid-cols-2 gap-2">
                    <span>⏱️ {config.duration / 60000} min</span>
                    <span>👥 {config.concurrency} workers</span>
                    <span>⚡ {config.operationsPerSecond} ops/s</span>
                    <span>🔥 {config.chaosLevel}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-slate-200 flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-400" />
              Live Metrics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl p-4 border border-blue-500/30">
                <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold mb-2">
                  <Timer className="w-4 h-4" />
                  Elapsed Time
                </div>
                <div className="text-3xl font-bold text-white">{formatTime(elapsedTime)}</div>
              </div>
              <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl p-4 border border-green-500/30">
                <div className="flex items-center gap-2 text-green-400 text-sm font-semibold mb-2">
                  <Cpu className="w-4 h-4" />
                  Operations
                </div>
                <div className="text-3xl font-bold text-white">{operations.toLocaleString()}</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-xl p-4 border border-orange-500/30">
                <div className="flex items-center gap-2 text-orange-400 text-sm font-semibold mb-2">
                  <Database className="w-4 h-4" />
                  Tasks
                </div>
                <div className="text-3xl font-bold text-white">{store.tasks.length}</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl p-4 border border-purple-500/30">
                <div className="flex items-center gap-2 text-purple-400 text-sm font-semibold mb-2">
                  <Activity className="w-4 h-4" />
                  Memories
                </div>
                <div className="text-3xl font-bold text-white">{store.memories.length}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          {!isRunning ? (
            <button
              onClick={startTest}
              className="flex-1 bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 hover:from-red-700 hover:via-orange-700 hover:to-yellow-700 text-white font-bold py-6 px-8 rounded-2xl flex items-center justify-center gap-4 transition-all shadow-xl text-xl"
            >
              <Play className="w-8 h-8" />
              Start Massive Chaos Test
            </button>
          ) : (
            <button
              onClick={stopTest}
              className="flex-1 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 to-red-900 text-white font-bold py-6 px-8 rounded-2xl flex items-center justify-center gap-4 transition-all shadow-xl text-xl"
            >
              <Square className="w-8 h-8" />
              Stop Test
            </button>
          )}
          <button
            onClick={clearState}
            disabled={isRunning}
            className="px-8 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-6 rounded-2xl flex items-center gap-3 transition-all text-lg"
          >
            <RefreshCw className="w-6 h-6" />
            Clear All
          </button>
        </div>
      </div>

      {/* Results Section */}
      {issues.length > 0 && (
        <div className="mb-6">
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-red-500/20 border-2 border-red-500/50 rounded-2xl p-6">
              <div className="text-red-400 text-sm font-bold uppercase mb-2">Critical</div>
              <div className="text-5xl font-black text-red-400">{issuesBySeverity.critical.length}</div>
            </div>
            <div className="bg-orange-500/20 border-2 border-orange-500/50 rounded-2xl p-6">
              <div className="text-orange-400 text-sm font-bold uppercase mb-2">High</div>
              <div className="text-5xl font-black text-orange-400">{issuesBySeverity.high.length}</div>
            </div>
            <div className="bg-yellow-500/20 border-2 border-yellow-500/50 rounded-2xl p-6">
              <div className="text-yellow-400 text-sm font-bold uppercase mb-2">Medium</div>
              <div className="text-5xl font-black text-yellow-400">{issuesBySeverity.medium.length}</div>
            </div>
            <div className="bg-slate-500/20 border-2 border-slate-500/50 rounded-2xl p-6">
              <div className="text-slate-400 text-sm font-bold uppercase mb-2">Low</div>
              <div className="text-5xl font-black text-slate-400">{issuesBySeverity.low.length}</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/50 border border-slate-700 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-slate-200 mb-6 flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
              Issues Detected ({issues.length})
            </h3>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {issues.map((issue, index) => (
                <div
                  key={issue.id}
                  className={`border-l-4 p-5 rounded-lg ${
                    issue.severity === 'critical' ? 'border-red-500 bg-red-500/10' :
                    issue.severity === 'high' ? 'border-orange-500 bg-orange-500/10' :
                    issue.severity === 'medium' ? 'border-yellow-500 bg-yellow-500/10' :
                    'border-slate-500 bg-slate-500/10'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <span className={`inline-block px-3 py-1 rounded-lg text-sm font-bold mr-3 ${
                        issue.severity === 'critical' ? 'bg-red-500/30 text-red-400' :
                        issue.severity === 'high' ? 'bg-orange-500/30 text-orange-400' :
                        issue.severity === 'medium' ? 'bg-yellow-500/30 text-yellow-400' :
                        'bg-slate-500/30 text-slate-400'
                      }`}>
                        {issue.severity.toUpperCase()}
                      </span>
                      <span className="text-base text-slate-300 mr-3">{issue.type}</span>
                      <span className="text-xs text-slate-500">#{index + 1}</span>
                      <p className="text-slate-200 mt-2 text-lg">{issue.description}</p>
                    </div>
                    <span className="text-sm text-slate-500 ml-4">
                      {new Date(issue.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {issue.context && (
                    <pre className="text-xs text-slate-400 mt-3 bg-slate-900/50 p-3 rounded overflow-x-auto">
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
      <div className="bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10 border-2 border-red-500/20 rounded-2xl p-8">
        <h3 className="text-2xl font-bold text-red-400 mb-4">⚠️ Warning: Extreme Testing</h3>
        <div className="text-slate-400 space-y-3 text-lg">
          <p>• <strong className="text-red-400">Massive Test</strong>: 1 minute, 20 workers, 50 ops/sec - Good for initial testing</p>
          <p>• <strong className="text-orange-400">Extreme Test</strong>: 2 minutes, 50 workers, 100 ops/sec - Push system limits</p>
          <p>• <strong className="text-yellow-400">Apocalyptic Test</strong>: 5 minutes, 100 workers, 200 ops/sec - Find critical bugs</p>
          <p className="mt-4 text-yellow-400">• Open browser console (F12) to see detailed test output</p>
          <p>• Monitor browser performance during test execution</p>
          <p>• Test may consume significant memory and CPU</p>
        </div>
      </div>
    </div>
  );
};
