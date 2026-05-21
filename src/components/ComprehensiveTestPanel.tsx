import React, { useState } from 'react';
import { testRunner } from '@/utils/comprehensive-test-runner';
import { 
  Play, 
  Square, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Activity,
  Zap,
  Cpu,
  HardDrive,
  Bell
} from 'lucide-react';

interface TestStatus {
  isRunning: boolean;
  currentScenario: string;
  progress: number;
  results: any[];
  issues: string[];
}

export const ComprehensiveTestPanel: React.FC = () => {
  const [status, setStatus] = useState<TestStatus>({
    isRunning: false,
    currentScenario: '',
    progress: 0,
    results: [],
    issues: []
  });

  const handleStartTest = async () => {
    setStatus({
      isRunning: true,
      currentScenario: 'Preparing...',
      progress: 0,
      results: [],
      issues: []
    });

    const consoleDiv = document.getElementById('test-console');
    if (consoleDiv) {
      consoleDiv.innerHTML = '';
    }

    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      originalLog(...args);
      if (consoleDiv) {
        const line = document.createElement('div');
        line.className = 'text-cyan-300 text-xs font-mono mb-1';
        line.textContent = args.join(' ');
        consoleDiv.appendChild(line);
        consoleDiv.scrollTop = consoleDiv.scrollHeight;
      }
    };

    console.error = (...args) => {
      originalError(...args);
      if (consoleDiv) {
        const line = document.createElement('div');
        line.className = 'text-red-400 text-xs font-mono mb-1';
        line.textContent = '❌ ' + args.join(' ');
        consoleDiv.appendChild(line);
        consoleDiv.scrollTop = consoleDiv.scrollHeight;
      }
    };

    console.warn = (...args) => {
      originalWarn(...args);
      if (consoleDiv) {
        const line = document.createElement('div');
        line.className = 'text-yellow-400 text-xs font-mono mb-1';
        line.textContent = '⚠️ ' + args.join(' ');
        consoleDiv.appendChild(line);
        consoleDiv.scrollTop = consoleDiv.scrollHeight;
      }
    };

    try {
      await testRunner.runComprehensiveTest();
      const results = testRunner.getResults();
      const allIssues = results.flatMap(r => r.issues);
      
      setStatus({
        isRunning: false,
        currentScenario: 'Completed',
        progress: 100,
        results,
        issues: allIssues
      });
    } catch (error) {
      setStatus({
        isRunning: false,
        currentScenario: 'Failed',
        progress: 0,
        results: [],
        issues: [error instanceof Error ? error.message : 'Unknown error']
      });
    } finally {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    }
  };

  const handleStopTest = () => {
    setStatus({
      ...status,
      isRunning: false,
      currentScenario: 'Stopped by user'
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Comprehensive System Test</h3>
              <p className="text-xs text-slate-400">Extreme stress testing and bug discovery</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {!status.isRunning ? (
              <button
                onClick={handleStartTest}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium flex items-center gap-2 transition-all"
              >
                <Play className="w-4 h-4" />
                Start Test
              </button>
            ) : (
              <button
                onClick={handleStopTest}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-medium flex items-center gap-2 transition-all border border-red-500/30"
              >
                <Square className="w-4 h-4" />
                Stop Test
              </button>
            )}
          </div>
        </div>
        
        {status.isRunning && (
          <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <div className="flex items-center gap-2 text-purple-300">
              <Activity className="w-4 h-4 animate-pulse" />
              <span className="text-sm font-medium">Running: {status.currentScenario}</span>
            </div>
            <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                style={{ width: `${status.progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
        <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Test Console
        </h4>
        <div 
          id="test-console"
          className="bg-slate-950 border border-slate-800 rounded-lg p-4 h-96 overflow-y-auto font-mono text-xs"
        >
          <div className="text-slate-500 text-center py-8">
            Click "Start Test" to begin comprehensive system testing...
          </div>
        </div>
      </div>

      {status.results.length > 0 && (
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
          <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Test Results Summary
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span className="text-xs text-green-400 font-medium">Successful</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {status.results.filter(r => r.success).length}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-xs text-red-400 font-medium">Failed</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {status.results.filter(r => !r.success).length}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-cyan-400 font-medium">Total Errors</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {status.results.reduce((sum, r) => sum + r.errors, 0)}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-yellow-400 font-medium">Total Warnings</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {status.results.reduce((sum, r) => sum + r.warnings, 0)}
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            {status.results.map((result, index) => (
              <div 
                key={index}
                className={`border rounded-lg p-4 ${
                  result.success 
                    ? 'bg-green-500/5 border-green-500/20' 
                    : 'bg-red-500/5 border-red-500/20'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span className="text-sm font-medium text-white">{result.scenario}</span>
                  </div>
                  <span className="text-xs text-slate-400">
                    {result.endTime - result.startTime}ms
                  </span>
                </div>
                
                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div className="flex items-center gap-1 text-slate-400">
                    <Zap className="w-3 h-3" />
                    <span>{result.operations} ops</span>
                  </div>
                  <div className="flex items-center gap-1 text-red-400">
                    <XCircle className="w-3 h-3" />
                    <span>{result.errors} errors</span>
                  </div>
                  <div className="flex items-center gap-1 text-yellow-400">
                    <AlertTriangle className="w-3 h-3" />
                    <span>{result.warnings} warnings</span>
                  </div>
                  <div className="flex items-center gap-1 text-cyan-400">
                    <HardDrive className="w-3 h-3" />
                    <span>{(result.memoryPeak / 1024 / 1024).toFixed(2)}MB</span>
                  </div>
                </div>
                
                {result.issues.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <div className="text-xs text-red-400 font-medium mb-2">Issues Found:</div>
                    <div className="space-y-1">
                      {result.issues.map((issue, i) => (
                        <div key={i} className="text-xs text-red-300">
                          • {issue}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {status.issues.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
          <h4 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            System Issues Detected ({status.issues.length})
          </h4>
          <div className="space-y-2">
            {status.issues.map((issue, index) => (
              <div key={index} className="text-xs text-red-300 bg-slate-900/50 rounded-lg p-3">
                {index + 1}. {issue}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
