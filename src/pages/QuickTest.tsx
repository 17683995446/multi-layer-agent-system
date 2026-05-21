import React, { useState } from 'react';
import { directTestRunner } from '@/utils/direct-test-runner';
import { useSystemStore } from '@/stores/systemStore';

export default function QuickTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const store = useSystemStore();
  
  const handleRunTest = async () => {
    setIsRunning(true);
    
    try {
      console.log('%c📝 To view detailed test output:', 'color: #00ccff; font-size: 14px;');
      console.log('1. Open browser developer tools (F12)');
      console.log('2. Go to the Console tab');
      
      const results = await directTestRunner.runShortTest();
      setTestResults(results);
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };
  
  const handleClearState = () => {
    // Clear store
    const storeState = useSystemStore.getState();
    storeState.clearAllData();
    console.log('%c🗑️ All data cleared!', 'color: #ff6600; font-size: 14px;');
    setTestResults(null);
  };
  
  const successRate = testResults 
    ? (testResults.successfulOperations / testResults.totalOperations * 100).toFixed(1) 
    : 0;
    
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-cyan-500 bg-clip-text text-transparent mb-2">
          🔧 Quick System Test
        </h1>
        <p className="text-gray-400 mb-8">
          Fast 2-3 minute test to identify basic system issues
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={handleRunTest}
            disabled={isRunning}
            className={`p-6 rounded-xl font-semibold text-lg transition-all ${
              isRunning 
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-green-500 to-cyan-600 hover:from-green-600 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {isRunning ? (
              <div className="flex items-center justify-center gap-3">
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                Running Test...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                ▶ Start Quick Test
              </div>
            )}
          </button>
          
          <button
            onClick={handleClearState}
            className="p-6 rounded-xl font-semibold text-lg bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl transition-all"
          >
            🗑️ Clear All State
          </button>
        </div>
        
        <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-300 mb-4">📊 Current System State</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Tasks</div>
              <div className="text-2xl font-bold text-blue-400">{store.tasks.length}</div>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Memories</div>
              <div className="text-2xl font-bold text-purple-400">{store.memories.length}</div>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Notifications</div>
              <div className="text-2xl font-bold text-yellow-400">{store.notifications.length}</div>
            </div>
            
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-gray-400 text-sm mb-1">Layers</div>
              <div className="text-2xl font-bold text-green-400">{store.layers.length}</div>
            </div>
          </div>
        </div>
        
        {testResults && (
          <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-300 mb-4">📋 Test Results</h2>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Duration</div>
                <div className="text-xl font-bold text-cyan-400">
                  {((testResults.endTime - testResults.startTime) / 1000).toFixed(1)}s
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Total Ops</div>
                <div className="text-xl font-bold text-white">{testResults.totalOperations}</div>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Success</div>
                <div className={`text-xl font-bold ${parseFloat(successRate) > 90 ? 'text-green-400' : parseFloat(successRate) > 70 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {successRate}%
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Success</div>
                <div className="text-xl font-bold text-green-400">{testResults.successfulOperations}</div>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-1">Failed</div>
                <div className="text-xl font-bold text-red-400">{testResults.failedOperations}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="text-blue-400 text-sm mb-1">Tasks Added</div>
                <div className="text-2xl font-bold text-white">{testResults.metrics.tasksAdded}</div>
              </div>
              
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <div className="text-purple-400 text-sm mb-1">Tasks Executed</div>
                <div className="text-2xl font-bold text-white">{testResults.metrics.tasksCompleted}</div>
              </div>
              
              <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
                <div className="text-cyan-400 text-sm mb-1">Memories Added</div>
                <div className="text-2xl font-bold text-white">{testResults.metrics.memoriesAdded}</div>
              </div>
              
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <div className="text-yellow-400 text-sm mb-1">Notifications</div>
                <div className="text-2xl font-bold text-white">{testResults.metrics.notificationsSent}</div>
              </div>
            </div>
            
            {testResults.errors.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-red-400 mb-2">❌ Issues Found ({testResults.errors.length})</h3>
                <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {testResults.errors.slice(0, 10).map((error: string, index: number) => (
                    <li key={index} className="text-red-300 text-sm">{error}</li>
                  ))}
                  {testResults.errors.length > 10 && (
                    <li className="text-gray-500 text-sm">...and {testResults.errors.length - 10} more</li>
                  )}
                </ul>
              </div>
            )}
            
            {testResults.errors.length === 0 && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="text-green-400 text-center">✅ No issues found! System looks good!</div>
              </div>
            )}
          </div>
        )}
        
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6 mt-6">
          <h3 className="text-blue-400 font-semibold mb-3">📝 How to Use</h3>
          <ol className="text-gray-400 space-y-2 list-decimal list-inside">
            <li>Click "Start Quick Test" to run the test</li>
            <li>Watch the browser console for detailed output (F12)</li>
            <li>Review the results in the "Test Results" section</li>
            <li>If issues found, fix them and re-run the test</li>
            <li>Click "Clear All State" to reset for another test</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
