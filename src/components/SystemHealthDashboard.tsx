import React, { useState, useEffect } from 'react';
import { diagnostics } from '../utils/advanced-diagnostics';

export const SystemHealthDashboard: React.FC = () => {
  const [healthScore, setHealthScore] = useState<any>(null);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = () => {
      try {
        const score = diagnostics.calculateHealthScore();
        const diag = diagnostics.performFullDiagnosis();
        setHealthScore(score);
        setDiagnosis(diag);
      } catch (error) {
        console.error('[DASHBOARD] Failed to load health data', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 10000); // 每10秒刷新

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-green-400';
      case 'fair': return 'bg-yellow-400';
      case 'warning': return 'bg-orange-400';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-50';
      case 'high': return 'text-orange-500 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-500 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-4"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <span className="text-3xl">🩺</span>
        System Health Dashboard
      </h2>

      {healthScore && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-700">Overall Health Score</h3>
            <span className="text-sm text-gray-500">
              Last updated: {new Date(healthScore.lastUpdated).toLocaleTimeString()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-1">
              <div className="text-center p-6 border rounded-lg">
                <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center text-3xl font-bold text-white mb-2 ${getStatusColor(healthScore.status)}`}>
                  {healthScore.overall}
                </div>
                <p className="text-sm text-gray-600 font-medium capitalize">{healthScore.status}</p>
              </div>
            </div>

            <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard label="Performance" value={healthScore.performance} max={100} />
              <MetricCard label="Reliability" value={healthScore.reliability} max={100} />
              <MetricCard label="Memory" value={healthScore.memory} max={100} />
              <MetricCard label="Errors" value={healthScore.errors} max={100} />
            </div>
          </div>

          {healthScore.recommendations.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                💡 Recommendations
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                {healthScore.recommendations.slice(0, 3).map((rec: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-blue-500">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {diagnosis && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                📊 Bottlenecks
              </h4>
              <p className="text-2xl font-bold text-gray-800">{diagnosis.bottlenecks.length}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                📈 Trend
              </h4>
              <p className="text-xl font-bold text-gray-800 capitalize">{diagnosis.performanceTrend}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                🔧 Self-Healing
              </h4>
              <p className="text-2xl font-bold text-gray-800">{diagnosis.selfHealing.executed}</p>
              <p className="text-xs text-gray-500">actions executed</p>
            </div>
          </div>

          {diagnosis.bottlenecks.length > 0 && (
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                ⚠️ Detected Bottlenecks
              </h4>
              <div className="space-y-3">
                {diagnosis.bottlenecks.map((b: any, i: number) => (
                  <div key={i} className={`p-3 rounded-lg border ${getSeverityColor(b.severity)}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold capitalize">{b.type}</span>
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        b.severity === 'critical' ? 'bg-red-200 text-red-800' :
                        b.severity === 'high' ? 'bg-orange-200 text-orange-800' :
                        b.severity === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-blue-200 text-blue-800'
                      }`}>
                        {b.severity}
                      </span>
                    </div>
                    <p className="text-sm opacity-80">{b.description}</p>
                    {b.possibleFixes.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                        <p className="text-xs font-semibold opacity-70">Suggested fixes:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {b.possibleFixes.slice(0, 2).map((fix: string, j: number) => (
                            <span key={j} className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded">
                              {fix}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>✅ System monitoring active • Auto-diagnostics running</p>
      </div>
    </div>
  );
};

function MetricCard({ label, value, max }: { label: string; value: number; max: number }) {
  const percent = (value / max) * 100;
  const color = percent >= 80 ? 'text-green-600 bg-green-50' :
                 percent >= 60 ? 'text-yellow-600 bg-yellow-50' :
                 'text-red-600 bg-red-50';

  return (
    <div className={`p-4 rounded-lg border ${color}`}>
      <p className="text-sm font-medium opacity-70">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full transition-all duration-300"
          style={{ 
            width: `${percent}%`,
            backgroundColor: percent >= 80 ? '#22c55e' : percent >= 60 ? '#eab308' : '#ef4444'
          }}
        />
      </div>
    </div>
  );
}
