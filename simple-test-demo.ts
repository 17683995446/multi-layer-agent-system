// 简单的测试脚本
// 这是一个使用我们系统的示例

console.log('🧪 开始单元测试示例...\n')

// 简单的 oxford-comma-list 实现（为了测试）
function getOxfordCommaList(list: string[]): string {
  if (list.length === 0) return ''
  if (list.length === 1) return list[0]
  if (list.length === 2) return list.join(' and ')
  return list.slice(0, -1).join(', ') + ', and ' + list[list.length - 1]
}

// 测试函数
function testOxfordComma() {
  console.log('📝 测试 Oxford Comma List 函数:')
  
  const testCases = [
    { input: [], expected: '' },
    { input: ['apples'], expected: 'apples' },
    { input: ['apples', 'strawberries'], expected: 'apples and strawberries' },
    { input: ['apples', 'strawberries', 'blueberries'], expected: 'apples, strawberries, and blueberries' },
  ]
  
  let passed = 0
  let failed = 0
  
  testCases.forEach((test, index) => {
    const result = getOxfordCommaList(test.input)
    const success = result === test.expected
    if (success) {
      console.log(`   ✅ 测试 ${index + 1} 成功: "${result}"`)
      passed++
    } else {
      console.log(`   ❌ 测试 ${index + 1} 失败: 期望 "${test.expected}", 得到 "${result}"`)
      failed++
    }
  })
  
  return { passed, failed, total: testCases.length }
}

function testMathFunctions() {
  console.log('\n📐 测试数学函数:')
  
  const testCases = [
    { func: () => 2 + 2, expected: 4, name: '加法' },
    { func: () => 10 - 3, expected: 7, name: '减法' },
    { func: () => 5 * 4, expected: 20, name: '乘法' },
  ]
  
  let passed = 0
  let failed = 0
  
  testCases.forEach((test, index) => {
    const result = test.func()
    const success = result === test.expected
    if (success) {
      console.log(`   ✅ 测试 ${index + 1} (${test.name}) 成功: ${result}`)
      passed++
    } else {
      console.log(`   ❌ 测试 ${index + 1} (${test.name}) 失败: 期望 ${test.expected}, 得到 ${result}`)
      failed++
    }
  })
  
  return { passed, failed, total: testCases.length }
}

// 运行所有测试
const oxfordResults = testOxfordComma()
const mathResults = testMathFunctions()

console.log('\n📊 测试报告总结:')
console.log(`   Oxford Comma: ${oxfordResults.passed}/${oxfordResults.total} 个测试通过`)
console.log(`   数学函数: ${mathResults.passed}/${mathResults.total} 个测试通过`)

const totalPassed = oxfordResults.passed + mathResults.passed
const total = oxfordResults.total + mathResults.total
console.log(`   总计: ${totalPassed}/${total} 个测试通过`)

if (totalPassed === total) {
  console.log('\n🎉 所有测试通过!')
  process.exit(0)
} else {
  console.log('\n❌ 部分测试失败')
  process.exit(1)
}
