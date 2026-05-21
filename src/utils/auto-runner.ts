export class AutoRunner {
  private isRunning = false;
  
  async runAutomatedTest(scenarioName: string = 'Full System Burn-in'): Promise<void> {
    if (this.isRunning) {
      console.warn('[AutoRunner] Test already running');
      return;
    }
    
    this.isRunning = true;
    
    console.clear();
    console.log('%c🚀 AUTO RUNNER STARTED', 'color: #00ff00; font-size: 20px; font-weight: bold;');
    console.log(`%cScenario: ${scenarioName}`, 'color: #00ccff; font-size: 14px;');
    console.log('%cThis will run automatically. Check console for progress...', 'color: #ffcc00; font-size: 12px;');
    
    // Wait for the app to initialize
    await this.sleep(2000);
    
    // Try to start the test from the UI
    const startButton = document.querySelector('button:contains("Start")') as HTMLButtonElement;
    
    if (startButton) {
      console.log('%c✅ Found start button, clicking...', 'color: #00ff00; font-size: 12px;');
      startButton.click();
      
      // Monitor the test progress
      this.monitorProgress();
    } else {
      console.log('%c⚠️ Could not find start button. Please start test manually.', 'color: #ff6600; font-size: 12px;');
      console.log('%cNavigate to http://localhost:5173/test and click "Start Deep Stress Test"', 'color: #ff6600; font-size: 12px;');
    }
    
    this.isRunning = false;
  }
  
  private async monitorProgress(): Promise<void> {
    let lastIssueCount = 0;
    
    const monitor = setInterval(async () => {
      // Check for issues
      const issues = (window as any).__healthIssues || [];
      
      if (issues.length > lastIssueCount) {
        console.log(`%c⚠️ New issue detected! Total: ${issues.length}`, 'color: #ff6600; font-size: 11px;');
        lastIssueCount = issues.length;
      }
      
      // Check if test is still running
      const isRunning = document.querySelector('.animate-pulse') !== null;
      
      if (!isRunning) {
        console.log('%c✅ Test appears to have completed', 'color: #00ff00; font-size: 12px;');
        clearInterval(monitor);
        this.generateFinalSummary();
      }
    }, 5000);
  }
  
  private generateFinalSummary(): void {
    console.group('%c📊 FINAL TEST SUMMARY', 'color: #00ccff; font-size: 18px; font-weight: bold;');
    
    console.log('%cNext Steps:', 'color: #00ff00; font-size: 14px;');
    console.log('1. Review all issues in the Issues panel');
    console.log('2. Analyze memory growth patterns');
    console.log('3. Check console for final report');
    console.log('4. Address critical and high severity issues');
    console.log('5. Run test again to verify fixes');
    
    console.groupEnd();
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Quick test mode - runs a shorter test
  async runQuickTest(): Promise<void> {
    console.log('%c⚡ QUICK TEST MODE', 'color: #ffcc00; font-size: 16px;');
    console.log('%cThis will run a 1-minute test to quickly identify obvious issues', 'color: #ffcc00; font-size: 12px;');
    
    // Navigate to test page
    window.location.href = '/test';
    
    // Wait for page to load
    await this.sleep(3000);
    
    // Select a shorter scenario
    const select = document.querySelector('select') as HTMLSelectElement;
    if (select) {
      // Find shortest scenario
      const options = Array.from(select.options);
      if (options.length > 0) {
        select.selectedIndex = options.length - 1; // Usually shortest
      }
    }
    
    await this.sleep(1000);
    
    // Click start
    const startButton = Array.from(document.querySelectorAll('button')).find(
      btn => btn.textContent?.includes('Start')
    ) as HTMLButtonElement;
    
    if (startButton) {
      startButton.click();
      console.log('%c✅ Quick test started', 'color: #00ff00; font-size: 12px;');
    }
  }
}

export const autoRunner = new AutoRunner();

// Make it globally available for console access
if (typeof window !== 'undefined') {
  (window as any).__autoRunner = autoRunner;
  console.log('%c🔧 AutoRunner available. Run __autoRunner.runQuickTest() or __autoRunner.runAutomatedTest()', 'color: #00ccff; font-size: 12px;');
}
