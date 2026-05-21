import React, { useState } from 'react';
import { deepStressRunner, DEEP_STRESS_SCENARIOS, DeepStressTestScenario } from '@/utils/deep-stress-runner';
import { healthMonitor } from '@/utils/deep-health-monitor';
import {
  Play,
  Square,
  Activity,
  Cpu,
  HardDrive,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Timer,
  Target,
  TrendingUp
} from 'lucide-react';

export const DeepStressTestPanel: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<DeepStressTestScenario>(DEEP_STRESS_SCENARIOS[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const metrics = healthMonitor.getMetrics();
  const issues = healthMonitor.getIssues();
  
  React.useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (isRunning && startTime) {
      timer = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isRunning, startTime]);
  
  const startTest = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setStartTime(Date.now());
    setElapsedTime(0);
    
    await deepStressRunner.runScenario(selectedScenario);
    
    setIsRunning(false);
    setStartTime(null);
  };
  
  const stopTest = () => {
    deepStressRunner.stop();
    setIsRunning(false);
    setStartTime(null);
  };
  
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const currentMetrics = metrics.slice(-1)[0];
  const memoryUsage = currentMetrics?.memory?.usedJSHeapSize || 0;
  const fps = currentMetrics?.fps || 60;
  const domNodes = currentMetrics?.domNodes || 0;
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent mb-2">
          Deep Stress Test Center
        </h1>
        <p className="text-slate-400">
          Multi-dimensional pressure testing with comprehensive analysis
        </p>
      </div>
      
      {/* Test Configuration */}
      <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full ${isRunning ? 'bg-red-500 animate-pulse' : 'bg-slate-500'}`} />
            <h2 className="text-xl font-semibold text-white">
              {isRunning ? 'Test Running' : 'Configure Test'}
            </h2>
          </div>
          
          {isRunning && (
            <div className="flex items-center gap-2 text-yellow-400">
              <Timer className="w-4 h-4" />
              <span className="font-mono text-lg">{formatDuration(elapsedTime)}</span>
              <span className="text-sm text-slate-400">
                / {formatDuration(selectedScenario.duration * 1000)}
              </span>
            </div>
          )}
        </div>
        
        {/* Scenario Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-400 mb-2">Test Scenario</label>
          <select
            value={selectedScenario.name}
            onChange={(e) => {
              const scenario = DEEP_STRESS_SCENARIOS.find(s => s.name === e.target.value);
              if (scenario) setSelectedScenario(scenario);
            }}
            disabled={isRunning}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {DEEP_STRESS_SCENARIOS.map((scenario) => (
              <option key={scenario.name} value={scenario.name}>
                {scenario.name} ({(scenario.duration / 60).toFixed(0)} min)
              </option>
            ))}
          </select>
        </div>
        
        {/* Scenario Details */}
        <div className="bg-slate-800/50 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Test Dimensions</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {selectedScenario.dimensions.cpu && (
              <div className="bg-slate-900/50 rounded p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-slate-400">CPU</span>
                </div>
                <div className="text-sm text-white">
                  {selectedScenario.dimensions.cpu.operationsPerSecond} ops/s
                </div>
                <div className="text-xs text-slate-500 capitalize">
                  {selectedScenario.dimensions.cpu.complexity}
                </div>
              </div>
            )}
            
            {selectedScenario.dimensions.memory && (
              <div className="bg-slate-900/50 rounded p-3">
                <div className="flex items-center gap-2 mb-1">
                  <HardDrive className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-slate-400">Memory</span>
                </div>
                <div className="text-sm text-white">
                  {selectedScenario.dimensions.memory.allocationRate} alloc/s
                </div>
                <div className="text-xs text-slate-500">
                  Max: {selectedScenario.dimensions.memory.maxSize}
                </div>
              </div>
            )}
            
            {selectedScenario.dimensions.storage && (
              <div className="bg-slate-900/50 rounded p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-slate-400">Storage</span>
                </div>
                <div className="text-sm text-white">
                  {selectedScenario.dimensions.storage.writeRate} write/s
                </div>
                <div className="text-xs text-slate-500">
                  {selectedScenario.dimensions.storage.readRate} read/s
                </div>
              </div>
            )}
            
            {selectedScenario.dimensions.concurrent && (
              <div className="bg-slate-900/50 rounded p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs text-slate-400">Concurrent</span>
                </div>
                <div className="text-sm text-white">
                  {selectedScenario.dimensions.concurrent.parallelTasks} tasks
                </div>
                <div className="text-xs text-slate-500 capitalize">
                  {selectedScenario.dimensions.concurrent.synchronizationLevel} sync
                </div>
              </div>
            )}
            
            {selectedScenario.dimensions.error && (
              <div className="bg-slate-900/50 rounded p-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-slate-400">Error</span>
                </div>
                <div className="text-sm text-white">
                  {(selectedScenario.dimensions.error.failureRate * 100).toFixed(0)}% rate
                </div>
                <div className="text-xs text-slate-500">
                  {(selectedScenario.dimensions.error.recoveryTime / 1000).toFixed(1)}s recovery
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-4">
          {!isRunning ? (
            <button
              onClick={startTest}
              className="flex-1 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all"
            >
              <Play className="w-5 h-5" />
              Start Deep Stress Test
            </button>
          ) : (
            <button
              onClick={stopTest}
              className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all"
            >
              <Square className="w-5 h-5" />
              Stop Test
            </button>
          )}
        </div>
      </div>
      
      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-medium text-slate-400">FPS</span>
          </div>
          <div className={`text-2xl font-bold ${fps >= 60 ? 'text-green-400' : fps >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
            {fps}
          </div>
        </div>
        
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-medium text-slate-400">Memory</span>
          </div>
          <div className="text-2xl font-bold text-purple-300">
            {memoryUsage > 0 ? `${(memoryUsage / 1024 / 1024).toFixed(1)} MB` : '-'}
          </div>
        </div>
        
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-yellow-400" />
            <span className="text-sm font-medium text-slate-400">DOM Nodes</span>
          </div>
          <div className="text-2xl font-bold text-yellow-300">{domNodes}</div>
        </div>
        
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <span className="text-sm font-medium text-slate-400">Issues</span>
          </div>
          <div className={`text-2xl font-bold ${issues.length > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {issues.length}
          </div>
        </div>
      </div>
      
      {/* Health Metrics Chart */}
      <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4 mb-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          System Health History (Last 60 samples)
        </h3>
        <div className="space-y-2">
          {metrics.slice(-60).map((metric, index) => (
            <div key={index} className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 w-20">
                {new Date(metric.timestamp).toLocaleTimeString()}
              </span>
              <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all"
                  style={{ width: `${Math.min(100, (metric.memory.usedJSHeapSize || 0) / 1024 / 1024)}%` }}
                />
              </div>
              <span className="text-slate-400 w-24">
                Memory: {(metric.memory.usedJSHeapSize || 0) > 0 ? `${((metric.memory.usedJSHeapSize || 0) / 1024 / 1024).toFixed(0)}MB` : '-'}
              </span>
              <span className="text-slate-400 w-16">
                FPS: {metric.fps}
              </span>
              <span className="text-slate-400 w-16">
                DOM: {metric.domNodes}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Issues List */}
      {issues.length > 0 && (
        <div className="bg-slate-900/50 border border-red-500/30 rounded-xl p-4 mb-6">
          <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Detected Issues ({issues.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className={`p-3 rounded-lg border ${
                  issue.severity === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                  issue.severity === 'high' ? 'bg-orange-500/10 border-orange-500/30' :
                  issue.severity === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30' :
                  'bg-slate-500/10 border-slate-500/30'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        issue.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                        issue.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                        issue.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {issue.severity.toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-500">
                        {issue.type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300">{issue.description}</p>
                    {issue.details && Object.keys(issue.details).length > 0 && (
                      <div className="mt-2 text-xs text-slate-500">
                        {Object.entries(issue.details).slice(0, 3).map(([key, value]) => (
                          <span key={key} className="mr-3">
                            {key}: {typeof value === 'number' ? value.toFixed(2) : String(value)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 ml-4">
                    {new Date(issue.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Instructions */}
      <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-red-400 mb-2 flex items-center gap-2">
          <Target className="w-4 h-4" />
          Deep Stress Testing Methodology
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-400">
          <div>
            <h4 className="font-semibold text-slate-300 mb-2">Test Approach:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Multi-dimensional simultaneous pressure</li>
              <li>10-15 minutes sustained load testing</li>
              <li>Error injection and recovery verification</li>
              <li>Real-time performance monitoring</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-300 mb-2">What We Look For:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Memory leaks and growth patterns</li>
              <li>Performance degradation over time</li>
              <li>State consistency under load</li>
              <li>Error handling and recovery</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
