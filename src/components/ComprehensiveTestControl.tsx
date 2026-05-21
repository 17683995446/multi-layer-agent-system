import React, { useState, useEffect } from 'react';
import { healthMonitor } from '@/utils/deep-health-monitor';
import { behaviorSimulator, BEHAVIOR_PROFILES, UserBehaviorProfile } from '@/utils/user-behavior-simulator';
import { useSystemStore } from '@/stores/systemStore';
import {
  Play,
  Square,
  Pause,
  Activity,
  Cpu,
  HardDrive,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Settings,
  Timer
} from 'lucide-react';

export const ComprehensiveTestControl: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<UserBehaviorProfile>(BEHAVIOR_PROFILES.stressTest);
  const [testDuration, setTestDuration] = useState(10); // minutes
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const {
    layers,
    metrics,
    notifications,
    tasks
  } = useSystemStore();
  
  useEffect(() => {
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
  
  const startTest = () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setStartTime(Date.now());
    setElapsedTime(0);
    
    console.clear();
    console.log('%c🧪 COMPREHENSIVE SYSTEM TEST STARTING', 'color: #00ff00; font-size: 20px; font-weight: bold;');
    console.log(`%cProfile: ${selectedProfile.name}`, 'color: #00ccff; font-size: 14px;');
    console.log(`%cDuration: ${testDuration} minutes`, 'color: #00ccff; font-size: 14px;');
    
    // Start health monitoring
    healthMonitor.start(1000);
    
    // Start behavior simulation
    behaviorSimulator.start(selectedProfile, testDuration);
  };
  
  const stopTest = () => {
    if (!isRunning) return;
    
    setIsRunning(false);
    setStartTime(null);
    
    console.log('%c🛑 TEST STOPPED', 'color: #ff6600; font-size: 18px; font-weight: bold;');
    
    // Stop everything
    behaviorSimulator.stop();
    healthMonitor.stop();
    
    // Show results
    const issues = healthMonitor.getIssues();
    console.group('📋 ISSUE SUMMARY');
    console.log(`Total issues: ${issues.length}`);
    const critical = issues.filter(i => i.severity === 'critical').length;
    const high = issues.filter(i => i.severity === 'high').length;
    const medium = issues.filter(i => i.severity === 'medium').length;
    const low = issues.filter(i => i.severity === 'low').length;
    console.log(`Critical: ${critical}, High: ${high}, Medium: ${medium}, Low: ${low}`);
    console.groupEnd();
  };
  
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const currentMemoryUsage = healthMonitor.getMetrics().slice(-1)[0]?.memory?.usedJSHeapSize;
  const currentFPS = healthMonitor.getMetrics().slice(-1)[0]?.fps || 60;
  const currentDOMNodes = healthMonitor.getMetrics().slice(-1)[0]?.domNodes || 0;
  const issues = healthMonitor.getIssues();
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-pink-500 bg-clip-text text-transparent mb-2">
          Comprehensive System Test
        </h1>
        <p className="text-slate-400">
          Long-duration stress testing with real user behavior simulation
        </p>
      </div>
      
      {/* Test Control Panel */}
      <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
            <h2 className="text-xl font-semibold text-white">
              {isRunning ? 'Test Running' : 'Ready to Test'}
            </h2>
          </div>
          
          {isRunning && (
            <div className="flex items-center gap-2 text-yellow-400">
              <Timer className="w-4 h-4" />
              <span className="font-mono text-lg">{formatDuration(elapsedTime)}</span>
            </div>
          )}
        </div>
        
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Profile Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Test Profile</label>
            <select
              value={Object.keys(BEHAVIOR_PROFILES).find(
                key => BEHAVIOR_PROFILES[key as keyof typeof BEHAVIOR_PROFILES].name === selectedProfile.name
              ) || 'stressTest'}
              onChange={(e) => setSelectedProfile(BEHAVIOR_PROFILES[e.target.value as keyof typeof BEHAVIOR_PROFILES])}
              disabled={isRunning}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {Object.entries(BEHAVIOR_PROFILES).map(([key, profile]) => (
                <option key={key} value={key}>
                  {profile.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Duration (minutes)</label>
            <input
              type="number"
              value={testDuration}
              onChange={(e) => setTestDuration(Math.max(1, Math.min(60, parseInt(e.target.value) || 5)))}
              disabled={isRunning}
              min="1"
              max="60"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-end gap-3">
            {!isRunning ? (
              <button
                onClick={startTest}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                <Play className="w-5 h-5" />
                Start Test
              </button>
            ) : (
              <button
                onClick={stopTest}
                className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                <Square className="w-5 h-5" />
                Stop Test
              </button>
            )}
          </div>
        </div>
        
        {/* Profile Description */}
        <div className="bg-slate-800/50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-2">{selectedProfile.name}</h3>
          <p className="text-sm text-slate-400 mb-3">{selectedProfile.description}</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-900/50 rounded p-2">
              <div className="text-slate-500">Tasks/Min</div>
              <div className="text-slate-300 font-semibold">{selectedProfile.taskFrequency}</div>
            </div>
            <div className="bg-slate-900/50 rounded p-2">
              <div className="text-slate-500">Notifications/Min</div>
              <div className="text-slate-300 font-semibold">{selectedProfile.notificationFrequency}</div>
            </div>
            <div className="bg-slate-900/50 rounded p-2">
              <div className="text-slate-500">Error Rate</div>
              <div className="text-slate-300 font-semibold">{selectedProfile.errorRate * 100}%</div>
            </div>
            <div className="bg-slate-900/50 rounded p-2">
              <div className="text-slate-500">Memory Usage</div>
              <div className="text-slate-300 font-semibold capitalize">{selectedProfile.memoryUsage}</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-medium text-slate-400">FPS</span>
          </div>
          <div className={`text-2xl font-bold ${currentFPS >= 60 ? 'text-green-400' : currentFPS >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
            {currentFPS}
          </div>
        </div>
        
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="w-5 h-5 text-purple-400" />
            <span className="text-sm font-medium text-slate-400">Memory</span>
          </div>
          <div className="text-2xl font-bold text-purple-300">
            {currentMemoryUsage ? `${(currentMemoryUsage / 1024 / 1024).toFixed(1)} MB` : '-'}
          </div>
        </div>
        
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-yellow-400" />
            <span className="text-sm font-medium text-slate-400">DOM Nodes</span>
          </div>
          <div className="text-2xl font-bold text-yellow-300">{currentDOMNodes}</div>
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
      
      {/* System State */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Tasks
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800/50 rounded p-3 text-center">
              <div className="text-2xl font-bold text-slate-300">{tasks.length}</div>
              <div className="text-xs text-slate-500">Total</div>
            </div>
            <div className="bg-slate-800/50 rounded p-3 text-center">
              <div className="text-2xl font-bold text-green-400">{tasks.filter(t => t.status === 'completed').length}</div>
              <div className="text-xs text-slate-500">Completed</div>
            </div>
            <div className="bg-slate-800/50 rounded p-3 text-center">
              <div className="text-2xl font-bold text-red-400">{tasks.filter(t => t.status === 'failed').length}</div>
              <div className="text-xs text-slate-500">Failed</div>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-4">
          <h3 className="text-lg font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-400" />
            System Metrics
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800/50 rounded p-3 text-center">
              <div className="text-2xl font-bold text-blue-400">{metrics.totalTasks}</div>
              <div className="text-xs text-slate-500">Total Tasks</div>
            </div>
            <div className="bg-slate-800/50 rounded p-3 text-center">
              <div className="text-2xl font-bold text-emerald-400">{metrics.successRate.toFixed(0)}%</div>
              <div className="text-xs text-slate-500">Success Rate</div>
            </div>
            <div className="bg-slate-800/50 rounded p-3 text-center">
              <div className="text-2xl font-bold text-slate-300">{notifications.length}</div>
              <div className="text-xs text-slate-500">Notifications</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Issues List */}
      {issues.length > 0 && (
        <div className="bg-slate-900/50 border border-red-500/30 rounded-xl p-4 mb-6">
          <h3 className="text-lg font-semibold text-red-400 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Detected Issues ({issues.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {issues.slice(-10).map((issue, index) => (
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
                  <div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      issue.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                      issue.severity === 'high' ? 'bg-orange-500/20 text-orange-400' :
                      issue.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {issue.severity.toUpperCase()}
                    </span>
                    <p className="text-sm text-slate-300 mt-1">{issue.description}</p>
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(issue.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Instructions */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-blue-400 mb-2">Testing Instructions</h3>
        <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
          <li>Select a test profile and duration</li>
          <li>Click "Start Test" to begin simulation</li>
          <li>Monitor real-time metrics and any detected issues</li>
          <li>After test completes, review console for final report</li>
          <li>Analyze any issues and optimize the system</li>
        </ol>
      </div>
    </div>
  );
};
