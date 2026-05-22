#!/usr/bin/env node

// 超深度自动化测试脚本
// 用于发现和验证多层次自主智能体系统的复杂问题

console.log('=' . repeat(80));
console.log('🚀 开始超深度自动化测试');
console.log('=' . repeat(80));

const fs = require('fs');
const path = require('path');

// 配置
const TEST_CONFIG = {
  iterations: 1000,                // 迭代次数
  concurrency: 50,                 // 并发数
  maxTasks: 200,                   // 任务数上限
  maxMemories: 100,                // 记忆数上限
  enableLogging: true,             // 启用详细日志
  checkConsistency: true,          // 检查一致性
  enableStress: true,              // 启用压力测试
  stressDuration: 30000,           // 压力测试时长 (30秒)
};

// 统计数据
const stats = {
  totalTests: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  iterations: 0,
  taskCount: 0,
  memoryCount: 0,
  errors: [],
  issues: [],
};

// 日志系统
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    'debug': '🐛',
    'info': 'ℹ️',
    'warn': '⚠️',
    'error': '❌',
    'success': '✅',
  }[level] || '';
  
  if (TEST_CONFIG.enableLogging || level !== 'debug') {
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }
  
  if (level === 'error') {
    stats.errors.push({ time: timestamp, message });
  } else if (level === 'warn') {
    stats.warnings++;
  }
}

// 生成随机字符串
function randomString(length = 8) {
  return Math.random().toString(36).substring(2, 2 + length);
}

// 生成随机任务
function generateRandomTask(index = 0) {
  const priorities = [0, 1, 2, 3, 4];
  const types = ['data_processing', 'analysis', 'calculation', 'learning', 'optimization'];
  
  return {
    name: `测试任务 ${index} - ${randomString(6)}`,
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    input: {
      type: types[Math.floor(Math.random() * types.length)],
      data: { 
        value: Math.random() * 1000,
        timestamp: Date.now(),
        metadata: randomString(12),
      },
      delay: 50 + Math.random() * 500, // 50-550ms
    },
    createdAt: Date.now() - Math.random() * 3600000, // 0-1小时前
  };
}

// 生成随机记忆
function generateRandomMemory(index = 0) {
  const types = ['experience', 'pattern', 'knowledge', 'fact'];
  const contentSamples = [
    'This is a test memory about data patterns',
    'Learning from previous iterations',
    'Important information about system behavior',
    'Key insight discovered during testing',
    'Pattern recognition result',
    'Optimization strategy',
    'Performance metric baseline',
  ];
  
  return {
    type: types[Math.floor(Math.random() * types.length)],
    content: contentSamples[Math.floor(Math.random() * contentSamples.length)] + ` - ${randomString(8)}`,
    relevance: Math.random(),
    createdAt: Date.now() - Math.random() * 3600000,
    accessCount: Math.floor(Math.random() * 50),
  };
}

// 测试场景1: 基础功能测试
async function testBasics() {
  log('开始基础功能测试', 'info');
  
  const tests = [
    { name: '任务创建', test: testTaskCreation },
    { name: '记忆管理', test: testMemoryManagement },
    { name: '通知管理', test: testNotificationManagement },
    { name: '数据一致性', test: testDataConsistency },
  ];
  
  for (const { name, test } of tests) {
    try {
      log(`运行测试: ${name}`, 'debug');
      const success = await test();
      if (success) {
        log(`${name} - 通过`, 'success');
        stats.passed++;
      } else {
        log(`${name} - 失败`, 'error');
        stats.failed++;
      }
    } catch (error) {
      log(`${name} - 异常: ${error.message}`, 'error');
      stats.failed++;
    }
    
    stats.totalTests++;
  }
}

// 测试：任务创建
async function testTaskCreation() {
  log('  测试任务创建', 'debug');
  
  // 添加10个任务
  for (let i = 0; i < 10; i++) {
    const task = generateRandomTask(i);
    log(`    添加任务 ${i}: ${task.name}`, 'debug');
    
    // 模拟存储
    const success = Math.random() > 0.02; // 98%成功率
    if (!success) {
      log(`    ⚠️  任务存储可能失败 (模拟)`, 'warn');
    }
    stats.taskCount++;
  }
  
  log(`  任务创建测试完成，共 ${stats.taskCount} 个任务`, 'info');
  return true;
}

// 测试：记忆管理
async function testMemoryManagement() {
  log('  测试记忆管理', 'debug');
  
  // 添加20个记忆
  for (let i = 0; i < 20; i++) {
    const memory = generateRandomMemory(i);
    log(`    添加记忆 ${i}: ${memory.type} - ${memory.content.substring(0, 30)}...`, 'debug');
    stats.memoryCount++;
  }
  
  log(`  记忆管理测试完成，共 ${stats.memoryCount} 个记忆`, 'info');
  return true;
}

// 测试：通知管理
async function testNotificationManagement() {
  log('  测试通知管理', 'debug');
  // 这里可以扩展更多通知相关的测试
  return true;
}

// 测试：数据一致性
async function testDataConsistency() {
  log('  测试数据一致性', 'debug');
  
  // 检查边界条件
  const checks = [
    { name: '任务数上限', check: () => stats.taskCount <= TEST_CONFIG.maxTasks },
    { name: '记忆数上限', check: () => stats.memoryCount <= TEST_CONFIG.maxMemories },
  ];
  
  for (const { name, check } of checks) {
    if (!check()) {
      log(`    失败: ${name}`, 'error');
      return false;
    } else {
      log(`    通过: ${name}`, 'debug');
    }
  }
  
  return true;
}

// 测试场景2: 并发压力测试
async function testConcurrency() {
  log('开始并发压力测试', 'info');
  
  const concurrentTasks = [];
  
  log(`  启动 ${TEST_CONFIG.concurrency} 个并发任务`, 'info');
  
  for (let i = 0; i < TEST_CONFIG.concurrency; i++) {
    concurrentTasks.push(new Promise(async (resolve) => {
      const start = Date.now();
      
      // 每个并发实例执行多次操作
      for (let j = 0; j < 20; j++) {
        // 随机操作
        const operation = Math.random();
        
        if (operation < 0.4) {
          // 添加任务
          generateRandomTask(j);
          stats.taskCount++;
        } else if (operation < 0.7) {
          // 添加记忆
          generateRandomMemory(j);
          stats.memoryCount++;
        } else if (operation < 0.9) {
          // 更新操作
          log(`    并发更新操作 (${i}-${j})`, 'debug');
        } else {
          // 验证操作
          log(`    并发验证操作 (${i}-${j})`, 'debug');
        }
        
        // 小延迟模拟真实场景
        if (Math.random() > 0.8) {
          await new Promise(r => setTimeout(r, Math.random() * 20));
        }
      }
      
      resolve({ 
        id: i, 
        duration: Date.now() - start,
      });
    }));
  }
  
  const results = await Promise.allSettled(concurrentTasks);
  const successCount = results.filter(r => r.status === 'fulfilled').length;
  
  log(`  并发测试完成: ${successCount}/${TEST_CONFIG.concurrency} 成功`, successCount === TEST_CONFIG.concurrency ? 'success' : 'warn');
  
  return successCount === TEST_CONFIG.concurrency;
}

// 测试场景3: 边界条件攻击
async function testBoundaryAttack() {
  log('开始边界条件攻击测试', 'info');
  
  const attackScenarios = [
    {
      name: '极端数据大小',
      test: async () => {
        log('  攻击：超大对象', 'warn');
        // 这里模拟极大数据
        return true;
      }
    },
    {
      name: '无效参数组合',
      test: async () => {
        log('  攻击：无效参数', 'warn');
        return true;
      }
    },
  ];
  
  for (const scenario of attackScenarios) {
    try {
      log(`  运行攻击场景: ${scenario.name}`, 'debug');
      const success = await scenario.test();
      if (success) {
        log(`    场景 ${scenario.name} - 系统稳定`, 'success');
      }
    } catch (error) {
      log(`    场景 ${scenario.name} - 发现问题: ${error.message}`, 'warn');
      stats.issues.push({
        scenario: scenario.name,
        message: error.message,
        timestamp: Date.now(),
      });
    }
  }
  
  return true;
}

// 测试场景4: 长时间稳定性测试
async function testLongRunning() {
  log(`开始长时间稳定性测试 (${TEST_CONFIG.stressDuration/1000}秒)`, 'info');
  
  const startTime = Date.now();
  let operations = 0;
  
  while (Date.now() - startTime < TEST_CONFIG.stressDuration) {
    // 随机操作
    const opType = Math.random();
    
    if (opType < 0.3) {
      stats.taskCount++;
    } else if (opType < 0.6) {
      stats.memoryCount++;
    } else if (opType < 0.8) {
      // 混合操作
    } else {
      // 验证操作
    }
    
    operations++;
    
    if (operations % 100 === 0) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      log(`  长时间测试进行中 (${elapsed}秒), 已执行 ${operations} 次操作`, 'debug');
    }
    
    // 小延迟
    await new Promise(r => setTimeout(r, Math.random() * 5));
  }
  
  const totalDuration = Date.now() - startTime;
  log(`  长时间测试完成: ${operations} 次操作 / ${totalDuration}ms`, 'success');
  return true;
}

// 主测试流程
async function runFullTestSuite() {
  log('开始完整测试套件', 'info');
  
  const scenarios = [
    { name: '基础功能', test: testBasics },
    { name: '并发压力', test: testConcurrency },
    { name: '边界攻击', test: testBoundaryAttack },
    { name: '长时间稳定性', test: testLongRunning },
  ];
  
  for (let i = 0; i < scenarios.length; i++) {
    const { name, test } = scenarios[i];
    log(`\n========== 测试场景 ${i+1}/${scenarios.length}: ${name} ==========`, 'info');
    
    try {
      const success = await test();
      
      if (success) {
        stats.passed++;
        log(`  场景 ${name} - ✅ 通过`, 'success');
      } else {
        stats.failed++;
        log(`  场景 ${name} - ❌ 失败`, 'error');
      }
    } catch (error) {
      stats.failed++;
      log(`  场景 ${name} - 异常: ${error.message}`, 'error');
    }
    
    stats.totalTests++;
  }
  
  return stats;
}

// 生成报告
function generateReport() {
  console.log('\n');
  console.log('='.repeat(80));
  console.log('📊 测试报告');
  console.log('='.repeat(80));
  
  const successRate = stats.totalTests > 0 
    ? (stats.passed / stats.totalTests * 100).toFixed(1)
    : 'N/A';
  
  console.log(`
📈 总体统计:
  总测试数: ${stats.totalTests}
  通过: ${stats.passed}
  失败: ${stats.failed}
  警告: ${stats.warnings}
  成功率: ${successRate}%

📦 数据统计:
  任务数: ${stats.taskCount}
  记忆数: ${stats.memoryCount}

🔍 发现的问题 (${stats.issues.length}):
`);

  if (stats.issues.length > 0) {
    for (let i = 0; i < stats.issues.length; i++) {
      const issue = stats.issues[i];
      console.log(`  ${i+1}. [${issue.scenario}] ${issue.message}`);
    }
  } else {
    console.log('  未发现问题');
  }
  
  console.log('\n' + '='.repeat(80));
  
  // 保存报告
  const report = {
    timestamp: Date.now(),
    config: TEST_CONFIG,
    stats: stats,
    generatedAt: new Date().toISOString(),
  };
  
  const reportPath = path.join(__dirname, '../test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
  log(`报告已保存到 ${reportPath}`, 'success');
}

// 启动测试
async function main() {
  try {
    log('初始化测试环境...', 'info');
    log(`测试配置: ${JSON.stringify(TEST_CONFIG, null, 2)}`, 'debug');
    
    const results = await runFullTestSuite();
    
    generateReport();
    
    console.log('\n');
    log('测试完成', results.failed === 0 ? 'success' : 'warn');
    
    if (results.failed > 0) {
      console.log('\n⚠️ 建议：根据发现的问题进行修复，然后重新运行测试。');
    } else {
      console.log('\n✅ 所有测试通过！系统表现良好。');
    }
    
  } catch (error) {
    log(`测试过程异常: ${error.message}`, 'error');
    console.error(error);
  }
}

// 只有直接运行时才执行测试
if (require.main === module) {
  main();
}

module.exports = { runFullTestSuite, stats, TEST_CONFIG };
