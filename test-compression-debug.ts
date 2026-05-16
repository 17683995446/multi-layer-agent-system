import { compressionService } from './src/utils/data-compression-service'

const originalData = 'Test data for decompression verification'
const compressed = compressionService.compress(originalData)
console.log('Compressed data:', compressed.data)
console.log('Algorithm:', compressed.algorithm)
console.log('Original size:', compressed.originalSize)
console.log('Compressed size:', compressed.compressedSize)

try {
  const decompressed = compressionService.decompress<string>(compressed)
  console.log('Decompressed:', decompressed)
  console.log('Match:', decompressed === originalData)
} catch (error) {
  console.error('Error:', error)
}
