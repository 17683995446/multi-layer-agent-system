# System Code Architecture Analysis
## 代码分层与模块依赖深度分析报告

## 📊 System Architecture Overview
系统采用8层代理架构，配合Zustand状态管理，基于React + TypeScript + Vite

---

## 🏗️ Code Layers Structure

### Layer 1: Presentation Layer (表现层)
- **Files**: 
  - `src/pages/*.tsx`: 页面组件
  - `src/components/*.tsx`: UI组件
  - `src/components/*/*.tsx`: 功能组件组
- **Responsibilities**:
  - 用户界面渲染
  - 事件处理
  - 数据展示
- **Dependencies**: Zustand store, Utils

### Layer 2: State Management Layer (状态管理层)
- **File**: `src/stores/systemStore.ts`
- **Responsibilities**:
  - 全局状态管理
  - 状态变更逻辑
  - 持久化协调
- **Dependencies**: SafeStorage, SystemLogger, Types

### Layer 3: Storage Layer (存储层)
- **File**: `src/storage/safeStorage.ts`
- **Responsibilities**:
  - 数据序列化/反序列化
  - 安全存储操作
  - 缓存管理
  - 空间监控
- **Dependencies**: Types, localStorage API

### Layer 4: Utils Layer (工具层)
- **Files**:
  - `src/utils/systemLogger.ts`: 系统日志
  - `src/utils/performance-monitor.ts`: 性能监控
  - `src/utils/advancedStressTester.ts`: 压力测试
  - `src/utils/*.ts`: 其他工具
- **Responsibilities**:
  - 通用功能提供
  - 跨模块复用
- **Dependencies**: 大多独立，部分依赖类型

### Layer 5: Types Layer (类型层)
- **File**: `src/types/index.ts`
- **Responsibilities**:
  - TypeScript类型定义
  - 接口规范
- **Dependencies**: 无

### Layer 6: Engine Layer (引擎层)
- **File**: `src/engine/systemEngine.ts`
- **Responsibilities**:
  - 核心业务逻辑
  - 8层代理协调
- **Dependencies**: SystemStore, Utils

---

## 🔗 Module Dependencies Graph

```
Types ← All Layers
  ↑
Utils ← Engine, Store
  ↑
Storage ← Store
  ↑
Store ← Engine, Components
  ↑
Components ← Pages
  ↑
Pages (Entry Points)
```

---

## 🔄 Call Flow & Entry/Exit Points

### Primary Entry Points
1. `src/main.tsx`: 应用启动入口
   - 初始化React
   - 挂载App
   - 配置Provider

2. `src/stores/systemStore.ts`: Zustand store初始化
   - 从SafeStorage加载状态
   - 初始化默认值
   - 创建store实例

### Key Call Chains
1. **Task Creation**: User → AddTaskModal → systemStore.addTask() → SafeStorage.setTasks()
2. **Task Execution**: ExecuteTask → systemStore.updateTask() → layer management
3. **Data Persistence**: State Change → systemStore Action → SafeStorage.set*()

---

## 📈 Data Flow Diagram

```
User Input
  ↓
UI Components
  ↓
System Store Actions
  ↓
[Cache Check] → [State Update]
  ↓
SafeStorage
  ↓
localStorage (Persistence)
  ↓
[State Refresh] → [UI Re-render]
```
