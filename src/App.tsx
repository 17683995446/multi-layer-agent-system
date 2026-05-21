import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from '@/pages/Home';
import TestDashboard from '@/pages/TestDashboard';
import QuickTest from '@/pages/QuickTest';
import ChaosTest from '@/pages/ChaosTest';
import MassiveTest from '@/pages/MassiveTest';
import DiagnosticTestPage from '@/pages/DiagnosticTestPage';
import ExtremeTestPage from '@/pages/ExtremeTestPage';
import MarathonTestPage from '@/pages/MarathonTestPage';
import { ErrorBoundary } from 'react-error-boundary';
import { setupGlobalErrorHandlers } from '@/components/error-handling/global-error-handler';
import { 
  Home as HomeIcon, 
  Beaker, 
  Menu, 
  X,
  Activity,
  Zap,
  Flame,
  Thermometer,
  AlertOctagon,
  Trophy
} from 'lucide-react';
import { clsx } from 'clsx';

function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-slate-100 mb-3">
          系统出现错误
        </h2>
        <p className="text-slate-400 mb-6">
          {error.message}
        </p>
        <button
          onClick={resetErrorBoundary}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-all"
        >
          重新加载
        </button>
      </div>
    </div>
  );
}

function Navigation() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { path: '/', name: '主页', icon: HomeIcon, description: '系统主界面' },
    { path: '/quick-test', name: '快速测试', icon: Activity, description: '快速发现问题' },
    { path: '/chaos-test', name: '混乱测试', icon: Zap, description: '极端条件测试' },
    { path: '/massive-test', name: '大规模测试', icon: Flame, description: '极限压力测试' },
    { path: '/diagnostic', name: '诊断测试', icon: Thermometer, description: '深度问题诊断' },
    { path: '/extreme', name: '极限测试', icon: AlertOctagon, description: '特别复杂场景测试' },
    { path: '/marathon', name: '马拉松测试', icon: Trophy, description: '超长时间测试 ⭐' },
    { path: '/test', name: '测试中心', icon: Beaker, description: '综合测试' }
  ];

  return (
    <nav className="bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <span className="text-xl font-bold text-white">AI</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100">自主智能系统</h1>
              <p className="text-xs text-slate-500">Autonomous Intelligence</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={clsx(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-800">
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={clsx(
                      "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                      isActive
                        ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs opacity-70">{item.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function AppContent() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950">
        <Navigation />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/quick-test" element={<QuickTest />} />
          <Route path="/chaos-test" element={<ChaosTest />} />
          <Route path="/massive-test" element={<MassiveTest />} />
          <Route path="/diagnostic" element={<DiagnosticTestPage />} />
          <Route path="/extreme" element={<ExtremeTestPage />} />
          <Route path="/marathon" element={<MarathonTestPage />} />
          <Route path="/test" element={<TestDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default function App() {
  useEffect(() => {
    setupGlobalErrorHandlers();
  }, []);

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
    >
      <AppContent />
    </ErrorBoundary>
  );
}
