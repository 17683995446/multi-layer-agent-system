import { useSystemStore } from '@/stores/systemStore';

export interface UserBehaviorProfile {
  name: string;
  description: string;
  taskFrequency: number; // Tasks per minute
  taskVariety: number; // 0-1, variety of task types
  errorRate: number; // 0-1, likelihood of error conditions
  activitySpikes: boolean; // Whether to simulate traffic spikes
  notificationFrequency: number; // Notifications per minute
  memoryUsage: 'low' | 'medium' | 'high';
}

export const BEHAVIOR_PROFILES: Record<string, UserBehaviorProfile> = {
  normalUser: {
    name: 'Normal User',
    description: 'A typical user with moderate activity',
    taskFrequency: 5,
    taskVariety: 0.5,
    errorRate: 0.05,
    activitySpikes: false,
    notificationFrequency: 2,
    memoryUsage: 'low'
  },
  powerUser: {
    name: 'Power User',
    description: 'An active user with heavy usage',
    taskFrequency: 15,
    taskVariety: 0.8,
    errorRate: 0.1,
    activitySpikes: true,
    notificationFrequency: 5,
    memoryUsage: 'medium'
  },
  stressTest: {
    name: 'Stress Test',
    description: 'Extreme usage for stress testing',
    taskFrequency: 60,
    taskVariety: 1.0,
    errorRate: 0.2,
    activitySpikes: true,
    notificationFrequency: 20,
    memoryUsage: 'high'
  }
};

export class UserBehaviorSimulator {
  private isRunning = false;
  private intervals: NodeJS.Timeout[] = [];
  private store: ReturnType<typeof useSystemStore.getState>;
  
  constructor() {
    this.store = useSystemStore.getState();
  }
  
  start(profile: UserBehaviorProfile, durationMinutes: number = 5) {
    if (this.isRunning) {
      console.warn('[BehaviorSimulator] Already running');
      return;
    }
    
    this.isRunning = true;
    console.log(`[BehaviorSimulator] Starting simulation: ${profile.name}`);
    
    // Calculate timing in milliseconds
    const taskInterval = 60000 / profile.taskFrequency;
    const notificationInterval = 60000 / profile.notificationFrequency;
    
    // Start task simulator
    const taskTimer = setInterval(() => {
      this.simulateTask(profile);
    }, taskInterval);
    this.intervals.push(taskTimer);
    
    // Start notification simulator
    if (profile.notificationFrequency > 0) {
      const notificationTimer = setInterval(() => {
        this.simulateNotification(profile);
      }, notificationInterval);
      this.intervals.push(notificationTimer);
    }
    
    // Start memory activity simulator
    const memoryTimer = setInterval(() => {
      this.simulateMemoryActivity(profile);
    }, 2000);
    this.intervals.push(memoryTimer);
    
    // Start layer activity simulator
    const layerTimer = setInterval(() => {
      this.simulateLayerActivity();
    }, 5000);
    this.intervals.push(layerTimer);
    
    // Auto-stop after duration
    if (durationMinutes > 0) {
      const stopTimer = setTimeout(() => {
        this.stop();
      }, durationMinutes * 60000);
      this.intervals.push(stopTimer);
    }
  }
  
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    this.intervals.forEach(timer => clearTimeout(timer));
    this.intervals = [];
    
    console.log('[BehaviorSimulator] Stopped');
  }
  
  private simulateTask(profile: UserBehaviorProfile) {
    const taskTypes = ['data_processing', 'analysis', 'reporting', 'integration', 'learning', 'optimization'];
    const randomType = taskTypes[Math.floor(Math.random() * taskTypes.length)];
    
    const task = this.store.addTask({
      name: `${randomType}_${Date.now()}`,
      description: `Simulated ${randomType} task`,
      priority: Math.floor(Math.random() * 5) + 1,
      input: {
        complexity: Math.random(),
        shouldFail: Math.random() < profile.errorRate
      }
    });
    
    // Randomly execute some tasks immediately
    if (Math.random() < 0.7) {
      setTimeout(() => {
        this.store.executeTask(task.id).catch(err => {
          console.log('[BehaviorSimulator] Task execution error:', err);
        });
      }, Math.random() * 2000);
    }
  }
  
  private simulateNotification(profile: UserBehaviorProfile) {
    const notificationTypes: ('info' | 'success' | 'warning' | 'error')[] = ['info', 'success', 'warning', 'error'];
    const type = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
    
    const messages = {
      info: ['System update available', 'New feature released', 'Background job completed', 'Data sync finished'],
      success: ['Task completed successfully', 'Backup finished', 'Deployment succeeded', 'Data imported'],
      warning: ['High system load', 'Storage almost full', 'Slow network detected', 'Certificate expiring'],
      error: ['Connection lost', 'Task failed', 'Server error', 'Authentication failed']
    };
    
    const messageList = messages[type];
    const message = messageList[Math.floor(Math.random() * messageList.length)];
    
    this.store.addNotification({
      type,
      message,
      read: false
    });
  }
  
  private simulateMemoryActivity(profile: UserBehaviorProfile) {
    if (profile.memoryUsage === 'low' && Math.random() > 0.3) return;
    if (profile.memoryUsage === 'medium' && Math.random() > 0.6) return;
    
    const memoryTypes = ['experience', 'knowledge', 'strategy', 'insight'];
    const randomType = memoryTypes[Math.floor(Math.random() * memoryTypes.length)] as any;
    
    // Generate content based on memory usage level
    let content = 'Memory entry ';
    let repeatCount = 1;
    
    if (profile.memoryUsage === 'high') {
      repeatCount = 10;
    } else if (profile.memoryUsage === 'medium') {
      repeatCount = 5;
    }
    
    content = content.repeat(repeatCount);
    
    this.store.addMemory({
      type: randomType,
      content,
      relevance: Math.random(),
      metadata: {
        source: 'simulation',
        timestamp: Date.now()
      }
    });
  }
  
  private simulateLayerActivity() {
    // Simulate layer status changes
    const layers = this.store.layers;
    if (layers.length > 0) {
      const randomLayerId = Math.floor(Math.random() * layers.length);
      const layer = layers[randomLayerId];
      
      const statuses = ['idle', 'active', 'processing', 'idle', 'active'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)] as any;
      
      this.store.updateLayerStatus(layer.id, {
        status: randomStatus,
        metrics: {
          ...layer.metrics,
          cpuUsage: 20 + Math.random() * 60,
          memoryUsage: 30 + Math.random() * 50
        }
      });
    }
  }
  
  isActive() {
    return this.isRunning;
  }
}

export const behaviorSimulator = new UserBehaviorSimulator();
