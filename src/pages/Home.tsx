import React, { useState, useEffect } from "react";
import {
  Zap,
  Layers,
  Play,
  Pause,
  Settings,
  BarChart3,
  ShieldCheck,
  MessageSquare,
  Users,
  Bell,
  ChevronRight,
  CheckCircle2,
  Clock,
  Cpu,
  Server,
  Database,
  Brain,
  Eye,
  TrendingUp,
  Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useSystemStore } from "@/stores/systemStore";
import { LayerCard } from "@/components/layers/LayerCard";
import { TaskQueue } from "@/components/common/TaskQueue";
import { MetricsPanel } from "@/components/common/MetricsPanel";
import { EvolutionPanel } from "@/components/common/EvolutionPanel";
import { AddTaskModal } from "@/components/common/AddTaskModal";
import { TaskDetailModal } from "@/components/common/TaskDetailModal";
import { Task } from "@/types";

const taskNames = [
  "数据采集任务",
  "模型推理任务",
  "日志分析任务",
  "报告生成任务",
  "系统诊断任务",
  "配置更新任务",
  "备份同步任务",
  "监控告警任务",
];

type ViewMode = "dashboard" | "analytics" | "settings";

export default function Home() {
  const {
    mode,
    layers,
    tasks,
    currentTask,
    metrics,
    evolution,
    memories,
    strategies,
    knowledge,
    isRunning,
    addTask,
    updateTask,
    setCurrentTask,
    updateLayerStatus,
    updateMetrics,
    updateEvolution,
    start,
    stop,
  } = useSystemStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (isRunning) {
      toast.success("系统已启动");
    }
  }, [isRunning]);

  const handleQuickAddTask = () => {
    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: taskNames[Math.floor(Math.random() * taskNames.length)],
      priority: Math.floor(Math.random() * 4),
      status: "pending",
      input: { timestamp: Date.now() },
      createdAt: Date.now(),
    };
    addTask(newTask);
    toast.success("任务已添加");
  };

  const handleToggleSystem = () => {
    if (isRunning) {
      stop();
      toast.info("系统已停止");
    } else {
      start();
    }
  };

  const stats = [
    {
      label: "总任务",
      value: metrics.totalTasks || 0,
      icon: Database,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "成功率",
      value: `${((metrics.successRate || 0) * 100).toFixed(1)}%`,
      icon: CheckCircle2,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      label: "运行时间",
      value: formatDuration(metrics.uptime || 0),
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      label: "响应时间",
      value: `${(metrics.avgResponseTime || 0).toFixed(0)}ms`,
      icon: Activity,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  const menuItems = [
    { id: "dashboard", label: "仪表盘", icon: Layers },
    { id: "analytics", label: "分析中心", icon: BarChart3 },
    { id: "settings", label: "系统设置", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Toaster 
        position="top-right" 
        theme="dark" 
        toastOptions={{
          style: {
            background: "#1e293b",
            color: "#f8fafc",
            border: "1px solid #334155",
          },
        }}
      />

      <div className="flex h-screen overflow-hidden">
        <Sidebar 
          open={sidebarOpen}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          menuItems={menuItems}
        />

        <main className="flex-1 overflow-hidden flex flex-col">
          <Header
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            onToggleSystem={handleToggleSystem}
            isRunning={isRunning}
          />

          <div className="flex-1 overflow-auto p-4 lg:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={viewMode}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {viewMode === "dashboard" && (
                  <DashboardView
                    layers={layers}
                    tasks={tasks}
                    currentTask={currentTask}
                    metrics={metrics}
                    evolution={evolution}
                    memories={memories}
                    strategies={strategies}
                    knowledge={knowledge}
                    isRunning={isRunning}
                    mode={mode}
                    stats={stats}
                    onQuickAddTask={handleQuickAddTask}
                    onShowAddModal={() => setShowAddModal(true)}
                    onTaskClick={setSelectedTask}
                  />
                )}
                {viewMode === "analytics" && <AnalyticsView />}
                {viewMode === "settings" && <SettingsView />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <AddTaskModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={(task) => {
          addTask(task);
          setShowAddModal(false);
        }}
      />

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}

function Sidebar({
  open,
  viewMode,
  onViewModeChange,
  menuItems,
}: {
  open: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  menuItems: { id: string; label: string; icon: any }[];
}) {
  return (
    <motion.aside
      initial={false}
      animate={{ width: open ? 260 : 80 }}
      className="bg-slate-900 border-r border-slate-800 flex flex-col h-full"
    >
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
          <Zap className="w-5 h-5 text-white" />
        </div>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="font-bold text-lg">Agent System</h1>
            <p className="text-xs text-slate-500">企业级智能体</p>
          </motion.div>
        )}
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = item.id === viewMode;
          return (
            <button
              key={item.id}
              onClick={() => onViewModeChange(item.id as ViewMode)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {open && <span className="font-medium">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
          {open && (
            <div className="overflow-hidden">
              <p className="font-medium truncate">管理员</p>
              <p className="text-xs text-slate-500 truncate">admin@system</p>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}

function Header({
  sidebarOpen,
  onToggleSidebar,
  onToggleSystem,
  isRunning,
}: {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onToggleSystem: () => void;
  isRunning: boolean;
}) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 px-4 lg:px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Layers className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold hidden sm:block">
          多层级自主智能体系统
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSystem}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg
            ${isRunning
              ? "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
              : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            }
          `}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4" />
              <span className="hidden sm:inline">停止系统</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span className="hidden sm:inline">启动系统</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
}

function DashboardView({
  layers,
  tasks,
  currentTask,
  metrics,
  evolution,
  memories,
  strategies,
  knowledge,
  isRunning,
  mode,
  stats,
  onQuickAddTask,
  onShowAddModal,
  onTaskClick,
}: any) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat: any, index: number) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <StatCard {...stat} />
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">
              系统层级架构
            </h3>
            <div className="space-y-2">
              {layers.map((layer: any, index: number) => (
                <LayerCard
                  key={layer.id}
                  layer={layer}
                  isActive={layer.status === "active"}
                  index={index}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <MetricsPanel metrics={metrics} />
          <div className="flex gap-2">
            <button
              onClick={onQuickAddTask}
              className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              快速添加
            </button>
            <button
              onClick={onShowAddModal}
              className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              自定义
            </button>
          </div>
          <TaskQueue
            tasks={tasks}
            currentTask={currentTask}
            onTaskClick={onTaskClick}
          />
          <EvolutionPanel
            evolution={evolution}
            memories={memories}
            strategies={strategies}
            knowledge={knowledge}
          />
        </div>
      </div>
    </div>
  );
}

function AnalyticsView() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">数据分析中心</h2>
          <p className="text-slate-500 mt-1">
            深入分析系统性能和任务执行情况
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">性能趋势</h3>
          <div className="h-64 flex items-center justify-center text-slate-600">
            图表区域（使用 Recharts）
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">资源使用</h3>
          <div className="space-y-4">
            <ResourceBar label="CPU" value={65} color="blue" />
            <ResourceBar label="内存" value={45} color="purple" />
            <ResourceBar label="存储" value={30} color="green" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">任务分布</h3>
          <div className="h-48 flex items-center justify-center text-slate-600">
            饼图区域
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4">错误日志</h3>
          <div className="h-48 flex items-center justify-center text-slate-600">
            日志分析区域
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsView() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold">系统设置</h2>
        <p className="text-slate-500 mt-1">
          配置系统参数和偏好
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            基本设置
          </h3>
          <div className="space-y-4">
            <SettingItem label="自动保存" description="自动保存系统状态" />
            <SettingItem label="实时更新" description="启用实时数据同步" />
            <SettingItem label="通知提醒" description="接收系统通知" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            安全设置
          </h3>
          <div className="space-y-4">
            <SettingItem label="权限控制" description="启用精细权限管理" />
            <SettingItem label="数据加密" description="加密敏感数据" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5" />
            性能设置
          </h3>
          <div className="space-y-4">
            <SettingItem label="虚拟滚动" description="提升大数据列表渲染性能" />
            <SettingItem label="缓存策略" description="优化内存使用和访问速度" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bgColor,
}: {
  label: string;
  value: string | number;
  icon: any;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{label}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
        </div>
        <div className={`${bgColor} ${color} p-3 rounded-xl`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

function ResourceBar({ label, value, color }: { label: string; value: number; color: string }) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-500",
    purple: "bg-purple-500",
    green: "bg-emerald-500",
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-600">{value}%</span>
      </div>
      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
        <motion.div
          className={`h-full ${colorClasses[color]}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function SettingItem({ label, description }: { label: string; description: string }) {
  const [enabled, setEnabled] = useState(true);

  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="font-medium">{label}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <button
        onClick={() => setEnabled(!enabled)}
        className={`w-12 h-6 rounded-full transition-colors relative ${
          enabled ? "bg-cyan-500" : "bg-slate-700"
        }`}
      >
        <motion.div
          className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full"
          animate={{ x: enabled ? 24 : 0 }}
        />
      </button>
    </div>
  );
}

function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.floor(seconds / 86400)}d`;
}
