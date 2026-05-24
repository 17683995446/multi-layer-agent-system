import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  ErrorHandlingManager, 
  CircuitBreaker, 
  CircuitState,
  ErrorSeverity,
  errorHandler 
} from '../src/utils/error-handling-manager';

describe('ErrorHandlingManager', () => {
  beforeEach(() => {
    // Reset state between tests
    errorHandler.clearHistory();
  });

  describe('Error Classification', () => {
    it('should classify errors by severity', () => {
      const criticalError = new Error('Fatal system crash detected');
      const highError = new Error('Storage operation timeout');
      const mediumError = new Error('Invalid parameter provided');
      const lowError = new Error('Minor warning');

      const criticalClassified = errorHandler.classifyError(criticalError);
      const highClassified = errorHandler.classifyError(highError);
      const mediumClassified = errorHandler.classifyError(mediumError);
      const lowClassified = errorHandler.classifyError(lowError);

      expect(criticalClassified.severity).toBe(ErrorSeverity.CRITICAL);
      expect(highClassified.severity).toBe(ErrorSeverity.HIGH);
      expect(mediumClassified.severity).toBe(ErrorSeverity.MEDIUM);
      expect(lowClassified.severity).toBe(ErrorSeverity.LOW);
    });

    it('should record error context', () => {
      const context = { operation: 'test', userId: 123 };
      const error = new Error('Test error');
      
      const classified = errorHandler.classifyError(error, context);
      
      expect(classified.context).toEqual(context);
      expect(classified.id).toBeTruthy();
      expect(classified.timestamp).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Circuit Breaker', () => {
    it('should start in CLOSED state', () => {
      const breaker = new CircuitBreaker('test', {
        failureThreshold: 3,
        resetTimeout: 1000,
        halfOpenMaxRequests: 1
      });
      
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should execute successful operations', async () => {
      const breaker = new CircuitBreaker('test', {
        failureThreshold: 3,
        resetTimeout: 1000,
        halfOpenMaxRequests: 1
      });
      
      const result = await breaker.execute(async () => 'success');
      
      expect(result).toBe('success');
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should trip after failure threshold reached', async () => {
      const breaker = new CircuitBreaker('test', {
        failureThreshold: 2,
        resetTimeout: 10000,
        halfOpenMaxRequests: 1
      });
      
      // First failure
      await expect(
        breaker.execute(async () => { throw new Error('Fail 1'); })
      ).rejects.toThrow();
      
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
      
      // Second failure - should trip
      await expect(
        breaker.execute(async () => { throw new Error('Fail 2'); })
      ).rejects.toThrow();
      
      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('Retry Mechanism', () => {
    it('should retry failed operations', async () => {
      let attemptCount = 0;
      
      const operation = async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('StorageError'); // This is in our retryable list
        }
        return 'success';
      };
      
      const result = await errorHandler.executeWithProtection(
        'retry-test',
        operation,
        { maxRetries: 3 }
      );
      
      expect(result).toBe('success');
      expect(attemptCount).toBe(3);
    });

    it('should fail after max retries', async () => {
      let attemptCount = 0;
      
      const operation = async () => {
        attemptCount++;
        throw new Error('StorageError');
      };
      
      await expect(
        errorHandler.executeWithProtection(
          'max-retry-test',
          operation,
          { maxRetries: 2 }
        )
      ).rejects.toThrow();
      
      expect(attemptCount).toBe(3); // Initial + 2 retries
    });
  });

  describe('Statistics', () => {
    it('should track error statistics', () => {
      errorHandler.classifyError(new Error('Test 1'));
      errorHandler.classifyError(new Error('Test 2'));
      
      const stats = errorHandler.getErrorStats();
      
      expect(stats.total).toBe(2);
      expect(stats.recentErrors.length).toBe(2);
    });

    it('should clear error history', () => {
      errorHandler.classifyError(new Error('Test'));
      errorHandler.clearHistory();
      
      const stats = errorHandler.getErrorStats();
      
      expect(stats.total).toBe(0);
    });
  });
});
