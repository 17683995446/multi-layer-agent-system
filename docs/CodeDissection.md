# 代码拆解分析文档

## 一、整体架构分层

```
┌─────────────────────────────────────────┐
│       用户界面层 (UI Layer)              │
│  - Home, Dashboard, Test Pages         │
│  - Components (Tasks, Layers, etc)      │
└────────────────────┬────────────────────┘
                     │
┌────────────────────▼────────────────────┐
│     应用服务层 (App Layer)               │
│  - Routing (React Router)               │
│  - Theme Management                      │
│  - Error Boundary                       │
│  - Global Event Handlers                │
└────────────────────┬────────────────────┘
                     │
┌────────────────────▼────────────────────┐
│    状态管理层 (State Layer)              │
│  - Zustand Store (systemStore.ts)       │
│  - Memory, Tasks, Layers, Metrics       │
└────────────────────┬────────────────────┘
                     │
┌────────────────────▼────────────────────┐
│    存储层 (Storage Layer)                │
│  - SafeStorage (localStorage)          │
│  - Backup & Restore                     │
└─────────────────────────────────────────┘
```

---

## 二、核心模块依赖分析

### 2.1 systemStore.ts 模块依赖

```
useSystemStore (Zustand)
  │
  ├── 数据结构定义
  │   ├── Task
  │   ├── LayerState
  │   ├── MemoryEntry
  │   ├── StrategyEntry
  │   ├── KnowledgeNode/KnowledgeEdge
  │   ├── SystemMetrics
  │   └── SystemNotification
  │
  ├── 存储依赖
  │   └── SafeStorage
  │       ├── get/set Tasks
  │       ├── get/set Layers
  │       ├── get/set Metrics
  │       ├── get/set Memories
  │       ├── get/set Strategies
  │       └── clearAll()
  │
  ├── 日志依赖
  │   └── logger (systemLogger.ts)
  │
  └── 功能模块
      ├── 系统控制 (setSystemMode, startSystem, stopSystem)
      ├── 任务管理 (addTask, updateTask, removeTask, executeTask)
      ├── 记忆管理 (addMemory, updateMemory, retrieveRelevantMemories)
      ├── 策略管理 (addStrategy, updateStrategy, getOptimalStrategy)
      ├── 知识图谱 (addKnowledgeNode, addKnowledgeEdge, updateKnowledgeGraph)
      ├── 通知管理 (addNotification, markNotificationRead, clearNotifications)
      └── 持久化 (saveSystemState, loadSystemState, exportData, importData)
```

### 2.2 SafeStorage.ts 模块依赖

```
SafeStorage
  │
  ├── STORAGE_KEYS (常量定义)
  │   ├── TASKS
  │   ├── LAYERS
  │   ├── METRICS
  │   ├── EVOLUTION
  │   ├── MEMORIES
  │   ├── STRATEGIES
  │   ├── KNOWLEDGE
  │   └── SYSTEM_STATE
  │
  ├── 容量管理
  │   ├── STORAGE_WARNING_THRESHOLD (5MB)
  │   ├── STORAGE_HARD_LIMIT (8MB)
  │   ├── hasAvailableSpace()
  │   ├── getCurrentUsage()
  │   ├── isNearLimit()
  │   └── getTotalAvailableSpace()
  │
  ├── 序列化
  │   ├── serialize()
  │   └── deserialize()
  │
  ├── 数据存取
  │   ├── set()
  │   ├── get()
  │   ├── remove()
  │   └── clearAll()
  │
  └── 清理机制
      └── clearOldData()
          ├── 限制任务数量
          └── 限制记忆数量
```

---

## 三、核心调用链路分析

### 3.1 任务执行完整链路

```
用户操作
    ↓
Home.handleQuickAdd()
    ↓
store.addTask()
    ↓
├─→ 日志: logger.info('TASK', 'addTask: Task added successfully')
├─→ 验证: 检查任务数量
├─→ 清理: 超过限制时清理旧任务
├─→ 存储: SafeStorage.setTasks()
└─→ 更新: Zustand set({ tasks: newTasks })
    ↓
(可选) 用户点击执行
    ↓
store.executeTask(taskId)
    ↓
├─→ 查找: const task = store.tasks.find(...)
├─→ 检查: task.status === 'running' (防重复)
├─→ 更新: store.updateTask(taskId, { status: 'running', startedAt: ... })
├─→ 执行: await new Promise(resolve => setTimeout(delay))
├─→ 判断: task.input.shouldFail OR Math.random() > 0.9
├─→ 结果: 
│   ├─ 成功: status: 'completed', completedAt, duration
│   └─ 失败: status: 'failed', error, completedAt, duration
├─→ 通知: store.addNotification()
└─→ 更新指标: metrics.totalTasks, completedTasks/failedTasks, avgResponseTime, successRate
    ↓
更新UI: 任务列表刷新
```

### 3.2 记忆管理完整链路

```
store.addMemory()
    ↓
├─→ 创建: MemoryEntry对象
├─→ 检查: 记忆数量 > 100
│   └─→ 是: relevance排序，删除旧的
├─→ 存储: SafeStorage.setMemories()
└─→ 更新: Zustand set({ memories: newMemories })

store.retrieveRelevantMemories(query, limit)
    ↓
├─→ 过滤: memory.content.toLowerCase().includes(query.toLowerCase())
├─→ 排序: relevance降序
└─→ 切片: .slice(0, limit)
```

### 3.3 系统启动停止链路

```
store.startSystem()
    ↓
├─→ 更新: set({ isRunning: true, systemStartTime: Date.now() })
└─→ 通知: addNotification({ type: 'info', message: '系统已启动' })

store.stopSystem()
    ↓
├─→ 更新: set({ isRunning: false })
└─→ 通知: addNotification({ type: 'info', message: '系统已停止' })
```

### 3.4 数据清理链路

```
store.clearAllData()
    ↓
├─→ 重置: 所有状态到初始值
│   ├─ tasks: []
│   ├─ currentTask: null
│   ├─ memories: []
│   ├─ notifications: []
│   ├─ layers: initializeLayers()
│   ├─ strategies: []
│   ├─ knowledgeGraph: initializeKnowledgeGraph()
│   ├─ systemMode: 'idle'
│   ├─ evolutionState: ...
│   ├─ metrics: initializeMetrics()
│   ├─ performanceHistory: []
│   ├─ lastError: null
│   └─ storageWarning: false
└─→ 存储: SafeStorage.clearAll()
```

---

## 四、数据流与状态变更图

### 4.1 状态流转

```
┌─────────────────────────────────────────────────────────────────┐
│                         初始状态                                  │
│  - tasks: loaded from storage                                     │
│  - layers: 8层级初始化                                             │
│  - memories: loaded from storage                                  │
│  - metrics: 初始化指标                                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
    addTask()                      addMemory()
         │                               │
         ▼                               ▼
┌──────────────────────┐     ┌─────────────────────────┐
│ 任务添加             │     │ 记忆添加               │
│ - tasks.length ↑     │     │ - memories.length ↑    │
│ - metrics.totalTasks│     │ - relevance排序        │
└────────────┬─────────┘     └────────────┬────────────┘
             │                            │
             ▼                            ▼
    executeTask()                   retrieveRelevantMemories()
             │                            │
             ▼                            ▼
┌──────────────────────┐     ┌─────────────────────────┐
│ 任务执行             │     │ 记忆检索               │
│ - status 变更        │     │ - 过滤+排序+切片        │
│ - 执行计时           │     └────────────┬────────────┘
│ - metrics 更新       │                  │
└────────────┬─────────┘                  │
             │                            ▼
             └───────────────────────────┬───────────────────┘
                                         │
                                 clearAllData()
                                         │
                                         ▼
                                ┌─────────────────┐
                                │ 所有状态重置    │
                                └─────────────────┘
```
