import { useEffect } from "react";
import Home from "@/pages/Home";
import { ErrorBoundary } from "react-error-boundary";
import { setupGlobalErrorHandlers } from "@/components/error-handling/global-error-handler";

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
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-colors"
        >
          重新加载
        </button>
      </div>
    </div>
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
      <Home />
    </ErrorBoundary>
  );
}
