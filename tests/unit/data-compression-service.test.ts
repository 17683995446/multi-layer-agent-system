import { describe, it, expect } from 'vitest'
import { compressionService, CompressedData } from '@/utils/data-compression-service'

describe('DataCompressionService Tests', () => {
  describe('Basic Compression', () => {
    it('should compress simple string data', () => {
      const originalData = 'Hello, World! This is a test string for compression.'
      
      const result = compressionService.compress(originalData)
      
      expect(result.data).toBeTruthy()
      expect(result.originalSize).toBeGreaterThan(0)
      expect(result.compressedSize).toBeGreaterThan(0)
      expect(result.algorithm).toBe('base64')
      expect(result.timestamp).toBeTruthy()
    })

    it('should compress object data', () => {
      const originalData = {
        name: 'Test Task',
        status: 'pending',
        priority: 2,
        metadata: {
          createdAt: new Date().toISOString(),
          tags: ['test', 'unit']
        }
      }
      
      const result = compressionService.compress(originalData)
      
      expect(result.data).toBeTruthy()
      expect(result.originalSize).toBeGreaterThan(0)
      expect(result.compressedSize).toBeGreaterThan(0)
    })

    it('should decompress compressed data correctly', () => {
      const originalData = 'Test data for decompression verification'
      
      const compressed = compressionService.compress(originalData)
      const decompressed = compressionService.decompress<string>(compressed)
      
      expect(decompressed).toBe(originalData)
    })

    it('should decompress object data correctly', () => {
      const originalData = {
        id: 'test-123',
        tasks: [1, 2, 3, 4, 5],
        nested: {
          deep: {
            value: 'nested'
          }
        }
      }
      
      const compressed = compressionService.compress(originalData)
      const decompressed = compressionService.decompress<typeof originalData>(compressed)
      
      expect(decompressed).toEqual(originalData)
    })
  })

  describe('Compression with Context', () => {
    it('should include compression metadata', () => {
      const data = 'Test data with metadata'
      
      const result = compressionService.compress(data, {
        level: 6,
        algorithm: 'gzip'
      })
      
      expect(result.data).toBeTruthy()
      expect(result.originalSize).toBeGreaterThan(0)
      expect(result.compressedSize).toBeGreaterThan(0)
      expect(result.compressionRatio).toBeDefined()
      expect(typeof result.compressionRatio).toBe('number')
    })

    it('should calculate compression ratio', () => {
      const largeData = {
        items: Array.from({ length: 100 }, (_, i) => ({
          id: i,
          value: 'x'.repeat(100),
          timestamp: Date.now()
        }))
      }
      
      const result = compressionService.compress(largeData)
      
      expect(result.compressionRatio).toBeLessThan(100)
    })
  })

  describe('Compression Ratio Estimation', () => {
    it('should estimate compression ratio for simple data', () => {
      const simpleData = 'abc'
      
      const ratio = compressionService.estimateCompressionRatio(simpleData)
      
      expect(ratio).toBeDefined()
      expect(typeof ratio).toBe('number')
    })

    it('should estimate compression ratio for complex data', () => {
      const complexData = {
        deeply: {
          nested: {
            structure: {
              with: {
                many: {
                  levels: {
                    of: {
                      nesting: {
                        and: {
                          repetition: 'test-test-test-test-test'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      
      const ratio = compressionService.estimateCompressionRatio(complexData)
      
      expect(ratio).toBeDefined()
      expect(ratio).toBeGreaterThan(0)
    })
  })

  describe('Auto Compression', () => {
    it('should use compression for highly compressible data', () => {
      const highlyRedundantData = {
        items: Array.from({ length: 100 }, () => ({
          type: 'task',
          status: 'pending',
          data: 'x'.repeat(50)
        }))
      }
      
      const result = compressionService.autoCompress(highlyRedundantData)
      
      expect(result.useCompression).toBe(true)
      expect('data' in result).toBe(true)
    })

    it('should attempt compression for various data', () => {
      const variousData = {
        items: Array.from({ length: 10 }, (_, i) => ({
          id: Math.random().toString(36),
          value: Math.random().toString(36).repeat(20),
          timestamp: Date.now()
        }))
      }
      
      const result = compressionService.autoCompress(variousData)
      
      expect(result).toBeDefined()
      expect(result.useCompression !== undefined).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      const result = compressionService.compress('')
      
      expect(result.data).toBe('')
      expect(result.originalSize).toBe(0)
      expect(result.compressedSize).toBe(0)
    })

    it('should handle empty object', () => {
      const result = compressionService.compress({})
      
      expect(result.data).toBeTruthy()
      expect(result.originalSize).toBeGreaterThan(0)
    })

    it('should handle null and undefined values', () => {
      const dataWithNulls = {
        nullValue: null,
        undefinedValue: undefined,
        normalValue: 'test'
      }
      
      const result = compressionService.compress(dataWithNulls)
      const decompressed = compressionService.decompress(result)
      
      expect(decompressed).toEqual(dataWithNulls)
    })

    it('should handle special characters', () => {
      const specialChars = {
        emoji: '🎉🎊🎁',
        unicode: '中文测试',
        html: '<script>alert("xss")</script>',
        special: '!@#$%^&*()_+-=[]{}|;:,.<>?'
      }
      
      const result = compressionService.compress(specialChars)
      const decompressed = compressionService.decompress(result)
      
      expect(decompressed).toEqual(specialChars)
    })
  })

  describe('Performance', () => {
    it('should compress data quickly', () => {
      const data = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Task ${i}`,
        status: 'pending'
      }))
      
      const startTime = performance.now()
      const result = compressionService.compress(data)
      const endTime = performance.now()
      
      expect(endTime - startTime).toBeLessThan(100)
      expect(result.data).toBeTruthy()
    })

    it('should decompress data quickly', () => {
      const originalData = Array.from({ length: 500 }, (_, i) => ({
        id: i,
        data: 'x'.repeat(100)
      }))
      
      const compressed = compressionService.compress(originalData)
      
      const startTime = performance.now()
      const decompressed = compressionService.decompress(compressed)
      const endTime = performance.now()
      
      expect(endTime - startTime).toBeLessThan(50)
      expect(decompressed).toEqual(originalData)
    })
  })
})
