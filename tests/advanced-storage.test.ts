import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataCompressor } from '../src/storage/advanced-storage';

describe('DataCompressor', () => {
  describe('Basic Compression', () => {
    it('should compress and decompress simple objects', () => {
      const data = {
        id: 'test-1',
        name: 'Test Task',
        type: 'task',
        status: 'pending',
        timestamp: Date.now(),
      };

      const compressed = DataCompressor.compress(data);
      const decompressed = DataCompressor.decompress(compressed);

      expect(decompressed.id).toBe(data.id);
      expect(decompressed.name).toBe(data.name);
      expect(decompressed.type).toBe(data.type);
    });

    it('should compress arrays', () => {
      const data = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
        { id: '3', name: 'Item 3' },
      ];

      const compressed = DataCompressor.compress(data);
      const decompressed = DataCompressor.decompress(compressed);

      expect(decompressed.length).toBe(3);
      expect(decompressed[0].id).toBe('1');
    });

    it('should handle large data', () => {
      const data = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        name: `Item ${i}`,
        description: `This is a description for item ${i} that is somewhat long to test compression`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: i % 2 === 0 ? 'active' : 'inactive',
        priority: i % 5,
      }));

      const originalString = JSON.stringify(data);
      const compressed = DataCompressor.compress(data);

      expect(compressed.length).toBeLessThanOrEqual(originalString.length);

      const decompressed = DataCompressor.decompress(compressed);
      expect(decompressed.length).toBe(1000);
    });

    it('should handle strings directly', () => {
      const data = 'This is a test string with some keywords like task, memory, status, active, pending';

      const compressed = DataCompressor.compress(data);
      const decompressed = DataCompressor.decompress(compressed);

      expect(decompressed).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON gracefully', () => {
      const result = DataCompressor.decompress('invalid-json-{data}');
      expect(result).toBeTruthy();
    });

    it('should not fail on null or undefined', () => {
      expect(() => DataCompressor.compress(null)).not.toThrow();
      expect(() => DataCompressor.compress(undefined)).not.toThrow();
    });

    it('should work with complex nested objects', () => {
      const data = {
        level1: {
          level2: {
            level3: {
              data: 'test',
              items: [1, 2, 3],
              nested: {
                more: {
                  even: {
                    deeper: 'hello'
                  }
                }
              }
            }
          }
        }
      };

      const compressed = DataCompressor.compress(data);
      const decompressed = DataCompressor.decompress(compressed);

      expect(decompressed.level1.level2.level3.deeper).toBe('hello');
    });
  });

  describe('Dictionary Compression', () => {
    it('should compress common JSON keywords', () => {
      const data = {
        tasks: [
          { id: '1', name: 'Task 1', status: 'active', priority: 'high' },
          { id: '2', name: 'Task 2', status: 'pending', priority: 'medium' },
          { id: '3', name: 'Task 3', status: 'completed', priority: 'low' },
        ],
        memories: [
          { id: 'm1', content: 'Memory 1', type: 'experience', relevance: 0.5 },
        ],
        strategies: [],
        notifications: [],
      };

      const original = JSON.stringify(data);
      const compressed = DataCompressor.compress(data);

      expect(compressed.length).toBeLessThan(original.length);
    });

    it('should preserve boolean values', () => {
      const data = {
        active: true,
        completed: false,
        enabled: true,
        deleted: false,
      };

      const compressed = DataCompressor.compress(data);
      const decompressed = DataCompressor.decompress(compressed);

      expect(decompressed.active).toBe(true);
      expect(decompressed.completed).toBe(false);
    });

    it('should preserve numeric values', () => {
      const data = {
        count: 42,
        average: 3.14,
        total: 1000,
        min: -10,
        max: 100,
      };

      const compressed = DataCompressor.compress(data);
      const decompressed = DataCompressor.decompress(compressed);

      expect(decompressed.count).toBe(42);
      expect(decompressed.average).toBe(3.14);
      expect(decompressed.min).toBe(-10);
    });
  });
});

describe('Storage Utilities', () => {
  describe('Basic Operations', () => {
    it('should handle edge cases in data', () => {
      const edgeCases = [
        { empty: {} },
        { emptyArray: [] },
        { nullValue: null },
        { undefinedValue: undefined },
        { largeNumber: 9007199254740991 },
        { smallNumber: -9007199254740991 },
      ];

      for (const testCase of edgeCases) {
        const compressed = DataCompressor.compress(testCase);
        const decompressed = DataCompressor.decompress(compressed);
        expect(decompressed).toBeTruthy();
      }
    });

    it('should handle unicode characters', () => {
      const data = {
        text: 'Hello 世界! Привет! مرحبا! 🌍🚀',
        description: 'Test with various characters',
      };

      const compressed = DataCompressor.compress(data);
      const decompressed = DataCompressor.decompress(compressed);

      expect(decompressed.text).toBe(data.text);
    });
  });
});
