import React, { useEffect } from 'react';
import { testRunner } from '@/utils/comprehensive-test-runner';
import { Zap, Play } from 'lucide-react';

interface AutoTestStarterProps {
  autoStart?: boolean;
  onTestComplete?: (results: any[]) => void;
}

export const AutoTestStarter: React.FC<AutoTestStarterProps> = ({ 
  autoStart = false, 
  onTestComplete 
}) => {
  const [isRunning, setIsRunning] = React.useState(false);
  const [hasStarted, setHasStarted] = React.useState(false);

  const startTest = async () => {
    if (isRunning || hasStarted) return;
    
    setIsRunning(true);
    setHasStarted(true);
    
    console.clear();
    console.log('%c🚀 AUTO-TEST STARTED', 'color: #ff0000; font-size: 20px; font-weight: bold;');
    console.log('%cStarting comprehensive system test...', 'color: #ff6600; font-size: 14px;');
    
    const startTime = Date.now();
    
    try {
      await testRunner.runComprehensiveTest();
      const results = testRunner.getResults();
      
      const endTime = Date.now();
      const totalDuration = endTime - startTime;
      
      console.log('%c✅ AUTO-TEST COMPLETED', 'color: #00ff00; font-size: 20px; font-weight: bold;');
      console.log(`%cTotal duration: ${(totalDuration / 1000).toFixed(2)}s`, 'color: #00cc00; font-size: 14px;');
      console.log('%cResults:', 'color: #0066ff; font-size: 14px; font-weight: bold;');
      console.table(results.map(r => ({
        Scenario: r.scenario,
        Success: r.success ? '✓' : '✗',
        Operations: r.operations,
        Errors: r.errors,
        Warnings: r.warnings,
        Duration: `${r.endTime - r.startTime}ms`
      })));
      
      const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);
      const totalWarnings = results.reduce((sum, r) => sum + r.warnings, 0);
      
      if (totalErrors > 0) {
        console.log(`%c⚠️ Found ${totalErrors} errors and ${totalWarnings} warnings`, 'color: #ff6600; font-size: 16px;');
        results.forEach(r => {
          if (r.issues.length > 0) {
            console.group(`❌ Issues in ${r.scenario}`);
            r.issues.forEach(issue => console.log(`  - ${issue}`));
            console.groupEnd();
          }
        });
      } else {
        console.log('%c🎉 No errors found! System is stable.', 'color: #00ff00; font-size: 16px;');
      }
      
      if (onTestComplete) {
        onTestComplete(results);
      }
    } catch (error) {
      console.error('%c❌ AUTO-TEST FAILED', 'color: #ff0000; font-size: 20px; font-weight: bold;');
      console.error(error);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    if (autoStart && !hasStarted) {
      startTest();
    }
  }, [autoStart, hasStarted]);

  return (
    <div className="fixed bottom-20 right-4 z-50">
      {!hasStarted ? (
        <button
          onClick={startTest}
          disabled={isRunning}
          className={`
            px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg
            ${isRunning 
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white'}
          `}
        >
          {isRunning ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Zap className="w-5 h-5" />
              Start Auto-Test
            </>
          )}
        </button>
      ) : (
        <div className={`
          px-6 py-3 rounded-xl font-semibold flex items-center gap-2 shadow-lg
          ${isRunning 
            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' 
            : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'}
        `}>
          {isRunning ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Test Running...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Test Complete - Check Console
            </>
          )}
        </div>
      )}
    </div>
  );
};
