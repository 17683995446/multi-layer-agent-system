import React, { useState, useEffect } from 'react';
import { bugDetector, BugReport, SystemMetrics } from '@/utils/automated-bug-detector';
import { 
  Bug, 
  Activity, 
  AlertTriangle, 
  Play, 
  Pause, 
  Download, 
  Trash2, 
  Eye, 
  Clock,
  Cpu,
  Database,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { toast } from 'sonner';

export const BugMonitorDashboard: React.FC = () => {
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [metricsHistory, setMetricsHistory] = useState<SystemMetrics[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [selectedReport, setSelectedReport] = useState<BugReport | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  useEffect(() => {
    // 初始化数据
    setBugReports(bugDetector.getBugReports());
    setMetricsHistory(bugDetector.getMetricsHistory());

    // 订阅新报告
    const unsubscribe = bugDetector.subscribe((report) => {
      setBugReports(prev => [report, ...prev]);
    });

    return unsubscribe;
  }, []);

  const toggleMonitoring = () => {
    if (isMonitoring) {
      bugDetector.stopMonitoring();
      toast.info('Bug monitoring stopped');
    } else {
      bugDetector.startMonitoring(3000);
      toast.success('Bug monitoring started');
    }
    setIsMonitoring(!isMonitoring);
  };

  const exportReports = () => {
    const data = bugDetector.exportReports();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bug-reports-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Bug reports exported');
  };

  const clearReports = () => {
    if (confirm('Are you sure you want to clear all bug reports?')) {
      bugDetector.clearReports();
      setBugReports([]);
      setMetricsHistory([]);
      toast.info('Bug reports cleared');
    }
  };

  const formatTimestamp = (ts: number): string => {
    return new Date(ts).toLocaleString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatBytes = (bytes: number): string => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 border-red-500/30';
      case 'high': return 'bg-orange-500/10 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/10 border-yellow-500/30';
      case 'low': return 'bg-blue-500/10 border-blue-500/30';
      default: return 'bg-gray-500/10 border-gray-500/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'memory_leak': return <Database className="w-4 h-4" />;
      case 'performance_issue': return <Activity className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      case 'unexpected_behavior': return <Bug className="w-4 h-4" />;
      case 'storage_issue': return <Database className="w-4 h-4" />;
      default: return <Bug className="w-4 h-4" />;
    }
  };

  const filteredReports = bugReports.filter(report => {
    if (filterSeverity !== 'all' && report.severity !== filterSeverity) return false;
    if (filterType !== 'all' && report.type !== filterType) return false;
    return true;
  });

  const stats = {
    total: bugReports.length,
    critical: bugReports.filter(r => r.severity === 'critical').length,
    high: bugReports.filter(r => r.severity === 'high').length,
    medium: bugReports.filter(r => r.severity === 'medium').length,
    low: bugReports.filter(r => r.severity === 'low').length
  };

  const latestMetrics = metricsHistory[0];

  return (
    <div className="bg-slate-900/80 border border-slate-700 rounded-2xl p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Bug className="w-6 h-6 text-purple-400" />
            Bug 监控中心
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            自动检测和记录系统问题
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleMonitoring}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all",
              isMonitoring
                ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                : "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
            )}
          >
            {isMonitoring ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isMonitoring ? '停止监控' : '开始监控'}
          </button>

          <button
            onClick={exportReports}
            disabled={bugReports.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            导出
          </button>

          <button
            onClick={clearReports}
            disabled={bugReports.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium bg-slate-700 text-slate-400 border border-slate-600 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            清空
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{stats.total}</p>
          <p className="text-xs text-slate-400">总计</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-400">{stats.critical}</p>
          <p className="text-xs text-red-400/70">严重</p>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-orange-400">{stats.high}</p>
          <p className="text-xs text-orange-400/70">高</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{stats.medium}</p>
          <p className="text-xs text-yellow-400/70">中</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{stats.low}</p>
          <p className="text-xs text-blue-400/70">低</p>
        </div>
      </div>

      {/* Real-time Metrics */}
      {latestMetrics && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            实时系统指标
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">内存使用</p>
                <p className="text-sm font-medium text-white">{formatBytes(latestMetrics.memoryUsage)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">CPU (模拟)</p>
                <p className="text-sm font-medium text-white">{Math.round(latestMetrics.cpuUsage)}%</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">DOM 节点</p>
                <p className="text-sm font-medium text-white">{latestMetrics.domNodes}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">响应时间</p>
                <p className="text-sm font-medium text-white">{Math.round(latestMetrics.responseTime)}ms</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">所有严重程度</option>
          <option value="critical">严重</option>
          <option value="high">高</option>
          <option value="medium">中</option>
          <option value="low">低</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-slate-800 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">所有类型</option>
          <option value="error">错误</option>
          <option value="memory_leak">内存泄漏</option>
          <option value="performance_issue">性能问题</option>
          <option value="unexpected_behavior">异常行为</option>
          <option value="storage_issue">存储问题</option>
        </select>
      </div>

      {/* Bug Reports List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredReports.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Bug className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无 Bug 报告</p>
            <p className="text-sm mt-1">开始监控以检测问题</p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={clsx(
                "border rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.01]",
                getSeverityBg(report.severity)
              )}
              onClick={() => setSelectedReport(report)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div className={clsx("p-2 rounded-lg", getSeverityColor(report.severity))}>
                    {getTypeIcon(report.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-white truncate">{report.title}</h4>
                      <span className={clsx(
                        "px-2 py-0.5 rounded-full text-xs font-medium",
                        getSeverityBg(report.severity),
                        report.severity === 'critical' ? 'text-red-400' :
                        report.severity === 'high' ? 'text-orange-400' :
                        report.severity === 'medium' ? 'text-yellow-400' :
                        'text-blue-400'
                      )}>
                        {report.severity}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-2">{report.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(report.timestamp)}
                      </span>
                      <span>{report.type}</span>
                    </div>
                  </div>
                </div>
                <Eye className="w-4 h-4 text-slate-500" />
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Report Detail Modal */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            >
              <div className="p-6 border-b border-slate-700 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={clsx("p-2 rounded-lg", getSeverityColor(selectedReport.severity))}>
                      {getTypeIcon(selectedReport.type)}
                    </div>
                    <h3 className="text-lg font-bold text-white">{selectedReport.title}</h3>
                  </div>
                  <p className="text-sm text-slate-400">{selectedReport.description}</p>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-96 space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-400 mb-2">详细信息</h4>
                  <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">ID</span>
                      <span className="text-slate-300 font-mono">{selectedReport.id}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">类型</span>
                      <span className="text-slate-300">{selectedReport.type}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">严重程度</span>
                      <span className={clsx(
                        "font-medium",
                        selectedReport.severity === 'critical' ? 'text-red-400' :
                        selectedReport.severity === 'high' ? 'text-orange-400' :
                        selectedReport.severity === 'medium' ? 'text-yellow-400' :
                        'text-blue-400'
                      )}>
                        {selectedReport.severity}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">时间</span>
                      <span className="text-slate-300">{formatTimestamp(selectedReport.timestamp)}</span>
                    </div>
                  </div>
                </div>

                {selectedReport.stackTrace && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-400 mb-2">堆栈跟踪</h4>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <pre className="text-xs text-red-300 overflow-x-auto whitespace-pre-wrap">
                        {selectedReport.stackTrace}
                      </pre>
                    </div>
                  </div>
                )}

                {Object.keys(selectedReport.metadata).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-400 mb-2">元数据</h4>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <pre className="text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(selectedReport.metadata, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-slate-700 flex justify-end gap-2">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
