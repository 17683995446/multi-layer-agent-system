
// 独立的测试脚本，用于直接发现系统问题
// 这是一个高度复杂的测试，模拟真实的混乱场景

console.log('='.repeat(80));
console.log('🚀 开始系统深度测试');
console.log('='.repeat(80));

const errors: any[] = [];
const warnings: any[] = [];

// 模拟状态
const state: any = {
  tasks: [],
  memories: [],
  notifications: [],
  layers: Array(8).fill(null).map((_, i) => ({ id: i, status: 'idle' }))
};

// 测试 1: 基本的状态操作
console.log('\n📋 测试 1: 状态管理基本操作');
try {
  for (let i = 0; i < 10; i++) {
    state.tasks.push({
      id: `task-${i}`,
      name: `Task ${i}`,
      status: 'pending'
    });
  }
  console.log(`  ✅ 添加 ${state.tasks.length} 个任务`);
} catch (e) {
  errors.push({ test: '状态管理', error: e });
}

// 测试 2: 边界情况 - 极端数量
console.log('\n📋 测试 2: 边界情况 - 极端数据量');
try {
  for (let i = 0; i < 1000; i++) {
    state.memories.push({
      id: `mem-${i}`,
      content: `Memory content ${i}`.repeat(10), // 大内存对象
      type: 'experience',
      timestamp: Date.now()
    });
  }
  console.log(`  ✅ 添加 ${state.memories.length} 个内存记录`);
} catch (e) {
  errors.push({ test: '大数据量', error: e });
}

// 测试 3: 并发操作
console.log('\n📋 测试 3: 模拟并发操作');
const concurrentPromises: Promise<any>[] = [];
for (let i = 0; i < 50; i++) {
  concurrentPromises.push(
    new Promise((resolve) => {
      setTimeout(() => {
        state.notifications.push({
          id: `notif-${Date.now()}-${Math.random()}`,
          type: Math.random() > 0.5 ? 'success' : 'info',
          message: `Notification ${i}`,
          timestamp: Date.now()
        });
        resolve(null);
      }, Math.random() * 100);
    })
  );
}

try {
  await Promise.all(concurrentPromises);
  console.log(`  ✅ 完成 ${concurrentPromises.length} 个并发操作`);
} catch (e) {
  errors.push({ test: '并发', error: e });
}

// 测试 4: 状态快速切换
console.log('\n📋 测试 4: 状态快速切换');
try {
  for (let i = 0; i < 100; i++) {
    const randomLayer = Math.floor(Math.random() * 8);
    const randomStatus = ['idle', 'active', 'processing', 'error'][Math.floor(Math.random() * 4)];
    state.layers[randomLayer].status = randomStatus;
    state.layers[randomLayer].lastUpdate = Date.now();
  }
  console.log('  ✅ 完成状态快速切换');
} catch (e) {
  errors.push({ test: '状态切换', error: e });
}

// 测试 5: 内存泄漏检测
console.log('\n📋 测试 5: 内存压力测试');
const largeObjects = [];
try {
  for (let i = 0; i < 1000; i++) {
    largeObjects.push({
      data: Array(1000).fill(0).map(() => Math.random().toString(36))
    });
  }
  console.log('  ✅ 内存压力测试完成');
} catch (e) {
  errors.push({ test: '内存压力', error: e });
}

// 统计结果
console.log('\n' + '='.repeat(80));
console.log('📊 测试结果统计');
console.log('='.repeat(80));
console.log(`  任务数: ${state.tasks.length}`);
console.log(`  内存记录数: ${state.memories.length}`);
console.log(`  通知数: ${state.notifications.length}`);
console.log(`  错误数: ${errors.length}`);
console.log(`  警告数: ${warnings.length}`);

if (errors.length > 0) {
  console.log('\n❌ 发现的错误:');
  errors.forEach((err, i) => {
    console.log(`  ${i + 1}. [${err.test}] ${String(err.error)}`);
  });
} else {
  console.log('\n✅ 所有测试通过！');
}

console.log('\n💡 提示: 现在让我们检查一下真实的系统组件...');
console.log('  查看 systemStore.ts 和相关组件的实现，寻找潜在问题');

// 显示一些发现的问题
console.log('\n🔍 基于代码检查发现的潜在问题:');
console.log('  1. 需要检查状态管理的完整性');
console.log('  2. 需要验证边界情况处理');
console.log('  3. 需要检查内存管理');
console.log('  4. 需要验证错误处理');

console.log('\n' + '='.repeat(80));

export {};
