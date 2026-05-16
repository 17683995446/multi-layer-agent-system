import { describe, it, expect, beforeEach } from 'vitest'
import { errorReporter, ErrorReportingService } from '@/utils/error-reporting-service'

describe('ErrorReportingService Tests', () => {
  beforeEach(() => {
    errorReporter.clearErrors()
  })

  describe('Basic Error Reporting', () => {
    it('should report an error and return unique ID', () => {
      const errorId = errorReporter.reportError('Test error message')
      
      expect(errorId).toMatch(/^err_\d+_[a-z0-9]+$/)
    })

    it('should store reported errors', () => {
      errorReporter.reportError('Error 1')
      errorReporter.reportError('Error 2')
      
      const errors = errorReporter.getErrors()
      
      expect(errors.length).toBe(2)
    })

    it('should report warnings', () => {
      const warningId = errorReporter.reportWarning('Warning message')
      
      expect(warningId).toMatch(/^err_\d+_[a-z0-9]+$/)
      
      const errors = errorReporter.getErrors()
      const warning = errors.find(e => e.level === 'warning')
      
      expect(warning).toBeDefined()
      expect(warning?.message).toBe('Warning message')
    })

    it('should report info messages', () => {
      const infoId = errorReporter.reportInfo('Info message')
      
      expect(infoId).toMatch(/^err_\d+_[a-z0-9]+$/)
    })
  })

  describe('Error Retrieval', () => {
    it('should get errors with limit', () => {
      for (let i = 0; i < 10; i++) {
        errorReporter.reportError(`Error ${i}`)
      }
      
      const errors = errorReporter.getErrors(5)
      
      expect(errors.length).toBe(5)
    })

    it('should get error by ID', () => {
      const errorId = errorReporter.reportError('Specific error')
      
      const error = errorReporter.getErrorById(errorId)
      
      expect(error).toBeDefined()
      expect(error?.message).toBe('Specific error')
    })

    it('should return undefined for non-existent error ID', () => {
      const error = errorReporter.getErrorById('non-existent-id')
      
      expect(error).toBeUndefined()
    })
  })

  describe('Error Statistics', () => {
    it('should calculate error statistics', () => {
      errorReporter.reportError('Error 1')
      errorReporter.reportError('Error 2')
      errorReporter.reportWarning('Warning 1')
      errorReporter.reportInfo('Info 1')
      
      const stats = errorReporter.getStats()
      
      expect(stats.totalErrors).toBe(4)
      expect(stats.errorsByLevel.error).toBe(2)
      expect(stats.errorsByLevel.warning).toBe(1)
      expect(stats.errorsByLevel.info).toBe(1)
    })

    it('should identify top errors', () => {
      errorReporter.reportError('Common error')
      errorReporter.reportError('Common error')
      errorReporter.reportError('Common error')
      errorReporter.reportError('Rare error')
      
      const stats = errorReporter.getStats()
      
      expect(stats.topErrors.length).toBeGreaterThan(0)
      expect(stats.topErrors[0].message).toBe('Common error')
      expect(stats.topErrors[0].count).toBe(3)
    })

    it('should track error trends', () => {
      errorReporter.reportError('Error today')
      
      const stats = errorReporter.getStats()
      
      expect(stats.errorTrends).toBeDefined()
      expect(stats.errorTrends.length).toBeGreaterThan(0)
    })
  })

  describe('Error Management', () => {
    it('should clear all errors', () => {
      errorReporter.reportError('Error 1')
      errorReporter.reportError('Error 2')
      
      errorReporter.clearErrors()
      
      const errors = errorReporter.getErrors()
      
      expect(errors.length).toBe(0)
    })

    it('should delete specific error', () => {
      const errorId = errorReporter.reportError('Error to delete')
      
      errorReporter.deleteError(errorId)
      
      const error = errorReporter.getErrorById(errorId)
      
      expect(error).toBeUndefined()
    })
  })

  describe('Error Export/Import', () => {
    it('should export errors as JSON', () => {
      errorReporter.reportError('Error 1')
      errorReporter.reportError('Error 2')
      
      const exported = errorReporter.exportErrors()
      
      expect(exported).toBeTruthy()
      const parsed = JSON.parse(exported)
      expect(parsed.length).toBe(2)
    })

    it('should import valid error reports', () => {
      const validData = JSON.stringify([
        {
          id: 'test-1',
          message: 'Imported error',
          timestamp: new Date().toISOString()
        }
      ])
      
      const count = errorReporter.importErrors(validData)
      
      expect(count).toBe(1)
      
      const error = errorReporter.getErrorById('test-1')
      expect(error).toBeDefined()
      expect(error?.message).toBe('Imported error')
    })

    it('should reject invalid error data', () => {
      const invalidData = 'invalid json'
      
      const count = errorReporter.importErrors(invalidData)
      
      expect(count).toBe(0)
    })
  })

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ErrorReportingService.getInstance()
      const instance2 = ErrorReportingService.getInstance()
      
      expect(instance1).toBe(instance2)
    })
  })
})
