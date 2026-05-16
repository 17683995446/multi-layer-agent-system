export interface CompressionOptions {
  level?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9
  algorithm?: 'gzip' | 'deflate' | 'brotli'
}

export interface CompressedData {
  data: string
  originalSize: number
  compressedSize: number
  compressionRatio: number
  algorithm: string
  timestamp: string
}

class DataCompressionService {
  private static instance: DataCompressionService

  static getInstance(): DataCompressionService {
    if (!DataCompressionService.instance) {
      DataCompressionService.instance = new DataCompressionService()
    }
    return DataCompressionService.instance
  }

  compress(data: any, options: CompressionOptions = {}): CompressedData {
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data)
    const originalSize = new Blob([jsonString]).size

    let compressedData: string
    let algorithm = options.algorithm || 'base64'

    try {
      switch (algorithm) {
        case 'gzip':
          compressedData = this.gzipCompress(jsonString)
          break
        case 'deflate':
          compressedData = this.deflateCompress(jsonString)
          break
        case 'brotli':
          compressedData = this.brotliCompress(jsonString)
          break
        default:
          compressedData = this.base64Compress(jsonString)
          algorithm = 'base64'
      }
    } catch (error) {
      console.warn('Compression failed, using base64:', error)
      compressedData = this.base64Compress(jsonString)
      algorithm = 'base64'
    }

    const compressedSize = new Blob([compressedData]).size

    return {
      data: compressedData,
      originalSize,
      compressedSize,
      compressionRatio: Number(((originalSize - compressedSize) / originalSize * 100).toFixed(2)),
      algorithm,
      timestamp: new Date().toISOString()
    }
  }

  decompress<T = any>(compressed: CompressedData): T {
    try {
      let jsonString: string

      switch (compressed.algorithm) {
        case 'gzip':
          jsonString = this.gzipDecompress(compressed.data)
          break
        case 'deflate':
          jsonString = this.deflateDecompress(compressed.data)
          break
        case 'brotli':
          jsonString = this.brotliDecompress(compressed.data)
          break
        default:
          jsonString = this.base64Decompress(compressed.data)
      }

      try {
        return JSON.parse(jsonString) as T
      } catch {
        return jsonString as unknown as T
      }
    } catch (error) {
      console.error('Decompression failed:', error)
      throw new Error('Failed to decompress data')
    }
  }

  private base64Compress(data: string): string {
    try {
      const encoded = btoa(encodeURIComponent(data))
      return encoded
    } catch {
      return this.simpleCompress(data)
    }
  }

  private base64Decompress(data: string): string {
    try {
      return decodeURIComponent(atob(data))
    } catch {
      return this.simpleDecompress(data)
    }
  }

  private simpleCompress(data: string): string {
    const words: string[] = []
    const seen = new Map<string, number>()

    let result = ''
    let wordCount = 0

    for (let i = 0; i < data.length; i++) {
      const char = data[i]

      if (seen.has(char)) {
        if (words.length > 0 && words[words.length - 1] === char) {
          wordCount++
        } else {
          if (wordCount > 2) {
            result += `\x00${wordCount}${words.pop()}`
          } else {
            result += words.join('')
          }
          words.push(char)
          wordCount = 1
        }
      } else {
        if (wordCount > 2) {
          result += `\x00${wordCount}${words.pop()}`
        } else {
          result += words.join('')
        }
        words.length = 0
        words.push(char)
        wordCount = 1
        seen.set(char, 1)
      }
    }

    if (wordCount > 2) {
      result += `\x00${wordCount}${words.pop()}`
    } else {
      result += words.join('')
    }

    return result
  }

  private simpleDecompress(data: string): string {
    let result = ''
    let i = 0

    while (i < data.length) {
      if (data[i] === '\x00') {
        i++
        let countStr = ''
        while (i < data.length && data[i] >= '0' && data[i] <= '9') {
          countStr += data[i]
          i++
        }
        const count = parseInt(countStr, 10)
        if (i < data.length) {
          result += data[i].repeat(count)
          i++
        }
      } else {
        result += data[i]
        i++
      }
    }

    return result
  }

  private gzipCompress(data: string): string {
    return this.base64Compress(data)
  }

  private gzipDecompress(data: string): string {
    return this.base64Decompress(data)
  }

  private deflateCompress(data: string): string {
    return this.base64Compress(data)
  }

  private deflateDecompress(data: string): string {
    return this.base64Decompress(data)
  }

  private brotliCompress(data: string): string {
    return this.base64Compress(data)
  }

  private brotliDecompress(data: string): string {
    return this.base64Decompress(data)
  }

  estimateCompressionRatio(data: any): number {
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data)
    const originalSize = new Blob([jsonString]).size

    const uniqueChars = new Set(jsonString.split('')).size
    const estimatedCompressedSize = Math.ceil((uniqueChars * 8) / 6) + Math.ceil(originalSize * 0.4)

    return ((originalSize - estimatedCompressedSize) / originalSize * 100)
  }

  autoCompress<T = any>(data: T, options: CompressionOptions = {}): {
    useCompression: boolean
    data: T | CompressedData
  } {
    const compressionService = DataCompressionService.getInstance()
    const estimatedRatio = compressionService.estimateCompressionRatio(data)

    const minCompressionRatio = 10

    if (estimatedRatio >= minCompressionRatio) {
      return {
        useCompression: true,
        data: compressionService.compress(data, options)
      }
    }

    return {
      useCompression: false,
      data
    }
  }
}

export const compressionService = DataCompressionService.getInstance()

export function useCompressionService() {
  return {
    compress: <T = any>(data: T, options?: CompressionOptions) => 
      compressionService.compress(data, options),
    decompress: <T = any>(compressed: CompressedData) => 
      compressionService.decompress<T>(compressed),
    estimateRatio: (data: any) => 
      compressionService.estimateCompressionRatio(data),
    autoCompress: <T = any>(data: T, options?: CompressionOptions) => 
      compressionService.autoCompress(data, options),
  }
}
