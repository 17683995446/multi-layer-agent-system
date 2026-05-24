import { logger } from './systemLogger';

// Error Severity Levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Error Classification
export interface ClassifiedError {
  id: string;
  timestamp: number;
  error: Error;
  severity: ErrorSeverity;
  context: Record<string, any>;
  retryable: boolean;
}

// Circuit Breaker States
export enum CircuitState {
  CLOSED = 'closed',    // Normal operation
  OPEN = 'open',        // Stop all requests
  HALF_OPEN = 'half_open' // Test if service is recovered
}

// Circuit Breaker Configuration
export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenMaxRequests: number;
}

// Retry Policy
export interface RetryPolicy {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: Set<string>;
}

const DEFAULT_CIRCUIT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeout: 30000,
  halfOpenMaxRequests: 3
};

const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableErrors: new Set([
    'StorageError',
    'NetworkError',
    'TimeoutError',
    'TemporaryError'
  ])
};

export class ErrorHandlingManager {
  private static instance: ErrorHandlingManager;
  private errorHistory: ClassifiedError[] = [];
  private maxErrorHistory: number = 1000;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private subscribers: Set<(error: ClassifiedError) => void> = new Set();

  private constructor() {
    logger.info('ERROR', 'ErrorHandlingManager initialized');
  }

  static getInstance(): ErrorHandlingManager {
    if (!ErrorHandlingManager.instance) {
      ErrorHandlingManager.instance = new ErrorHandlingManager();
    }
    return ErrorHandlingManager.instance;
  }

  // Classify and record an error
  classifyError(
    error: Error,
    context: Record<string, any> = {},
    retryable: boolean = false
  ): ClassifiedError {
    const severity = this.determineSeverity(error);
    const classified: ClassifiedError = {
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      error,
      severity,
      context,
      retryable
    };

    this.errorHistory.push(classified);
    if (this.errorHistory.length > this.maxErrorHistory) {
      this.errorHistory = this.errorHistory.slice(-this.maxErrorHistory);
    }

    this.notifySubscribers(classified);
    this.logError(classified);

    return classified;
  }

  private determineSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase();
    
    if (message.includes('corrupt') || 
        message.includes('fatal') || 
        message.includes('crash')) {
      return ErrorSeverity.CRITICAL;
    }
    
    if (message.includes('storage') || 
        message.includes('database') ||
        message.includes('timeout')) {
      return ErrorSeverity.HIGH;
    }
    
    if (message.includes('invalid') || 
        message.includes('missing')) {
      return ErrorSeverity.MEDIUM;
    }
    
    return ErrorSeverity.LOW;
  }

  private logError(classified: ClassifiedError): void {
    const logMessage = `[${classified.severity.toUpperCase()}] ${classified.error.message}`;
    
    switch (classified.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        logger.error('ERROR', logMessage, classified.context);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn('ERROR', logMessage, classified.context);
        break;
      default:
        logger.debug('ERROR', logMessage, classified.context);
    }
  }

  // Get or create a circuit breaker
  getCircuitBreaker(
    name: string,
    config: Partial<CircuitBreakerConfig> = {}
  ): CircuitBreaker {
    if (!this.circuitBreakers.has(name)) {
      this.circuitBreakers.set(
        name,
        new CircuitBreaker(name, { ...DEFAULT_CIRCUIT_CONFIG, ...config })
      );
    }
    return this.circuitBreakers.get(name)!;
  }

  // Execute with circuit breaker and retry
  async executeWithProtection<T>(
    operationName: string,
    operation: () => Promise<T>,
    retryPolicy: Partial<RetryPolicy> = {}
  ): Promise<T> {
    const circuitBreaker = this.getCircuitBreaker(operationName);
    const policy = { ...DEFAULT_RETRY_POLICY, ...retryPolicy };
    
    return circuitBreaker.execute(async () => {
      return this.executeWithRetry(operation, policy);
    });
  }

  // Execute with retry
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    policy: RetryPolicy
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= policy.maxRetries; attempt++) {
      try {
        logger.debug('ERROR', `Operation attempt ${attempt + 1}/${policy.maxRetries + 1}`);
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        const classified = this.classifyError(
          lastError,
          { attempt: attempt + 1, maxRetries: policy.maxRetries },
          true
        );
        
        if (attempt === policy.maxRetries) {
          break;
        }
        
        if (!policy.retryableErrors.has(lastError.name) && !classified.retryable) {
          throw lastError;
        }
        
        const delay = this.calculateBackoff(attempt, policy);
        logger.info('ERROR', `Retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }

  private calculateBackoff(attempt: number, policy: RetryPolicy): number {
    const delay = policy.initialDelayMs * Math.pow(policy.backoffMultiplier, attempt);
    return Math.min(delay, policy.maxDelayMs);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Subscribe to error events
  subscribe(callback: (error: ClassifiedError) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(error: ClassifiedError): void {
    this.subscribers.forEach(callback => {
      try {
        callback(error);
      } catch (err) {
        logger.error('ERROR', 'Error notifying subscriber:', err);
      }
    });
  }

  // Get error statistics
  getErrorStats() {
    const stats = {
      total: this.errorHistory.length,
      bySeverity: {
        [ErrorSeverity.LOW]: 0,
        [ErrorSeverity.MEDIUM]: 0,
        [ErrorSeverity.HIGH]: 0,
        [ErrorSeverity.CRITICAL]: 0
      },
      recentErrors: this.errorHistory.slice(-20)
    };
    
    this.errorHistory.forEach(err => {
      stats.bySeverity[err.severity]++;
    });
    
    return stats;
  }

  // Clear error history
  clearHistory(): void {
    this.errorHistory = [];
    logger.info('ERROR', 'Error history cleared');
  }
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private successCount: number = 0;
  private lastFailureTime: number = 0;
  private name: string;
  private config: CircuitBreakerConfig;

  constructor(name: string, config: CircuitBreakerConfig) {
    this.name = name;
    this.config = config;
    logger.debug('ERROR', `CircuitBreaker '${name}' initialized in CLOSED state`);
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.config.resetTimeout) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
        logger.info('ERROR', `CircuitBreaker '${this.name}' transitioning to HALF_OPEN`);
      } else {
        throw new Error(`Circuit breaker '${this.name}' is OPEN`);
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.halfOpenMaxRequests) {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        logger.info('ERROR', `CircuitBreaker '${this.name}' recovered, transitioning to CLOSED`);
      }
    }
  }

  private onFailure(): void {
    this.lastFailureTime = Date.now();
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      logger.warn('ERROR', `CircuitBreaker '${this.name}' tripped in HALF_OPEN, transitioning to OPEN`);
    } else {
      this.failureCount++;
      if (this.failureCount >= this.config.failureThreshold) {
        this.state = CircuitState.OPEN;
        logger.error('ERROR', `CircuitBreaker '${this.name}' tripped! Threshold ${this.config.failureThreshold} reached`);
      }
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getStats() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime
    };
  }

  forceReset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    logger.info('ERROR', `CircuitBreaker '${this.name}' force reset to CLOSED`);
  }
}

export const errorHandler = ErrorHandlingManager.getInstance();
