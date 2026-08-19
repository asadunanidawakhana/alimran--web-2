'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Key,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Server,
  Zap,
  ShieldCheck,
  XCircle,
  Layers,
  Info,
} from 'lucide-react';
import { showToast } from '@/components/ToastNotification';

export default function KeyPoolMonitor() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusData, setStatusData] = useState<any>(null);

  const fetchStatus = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/ai/pool-status');
      const data = await res.json();
      if (data.success) {
        setStatusData(data.summary);
      } else {
        showToast({
          type: 'error',
          title: 'Pool Status Error',
          message: data.message || 'Failed to fetch status',
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Connection Error',
        message: err.message || 'Could not connect to pool status API',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const timer = setInterval(fetchStatus, 30000); // auto-poll every 30s
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Key className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Gemini Key Pool Manager</h2>
            <p className="text-xs text-gray-500 font-medium">
              Real-time monitor for centralized server-side Gemini API keys, rate-limits &amp; quota failover.
            </p>
          </div>
        </div>

        <button
          onClick={fetchStatus}
          disabled={refreshing}
          className="inline-flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-4 py-2.5 rounded-xl border border-blue-200 transition-all text-xs active:scale-95 disabled:opacity-50 self-start sm:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Status'}</span>
        </button>
      </div>

      {/* Metrics Cards */}
      {statusData && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Pool</span>
              <Layers className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-gray-900 mt-2">{statusData.totalKeys}</p>
            <span className="text-[10px] text-gray-400 font-semibold">Configured keys</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Available</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-600 mt-2">{statusData.availableKeys}</p>
            <span className="text-[10px] text-emerald-600/80 font-semibold">Ready for requests</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-amber-100 bg-amber-50/20 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Cooldown</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-amber-600 mt-2">{statusData.cooldownKeys}</p>
            <span className="text-[10px] text-amber-600/80 font-semibold">Rate-limited</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-rose-100 bg-rose-50/20 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Exhausted</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl font-black text-rose-600 mt-2">{statusData.exhaustedKeys}</p>
            <span className="text-[10px] text-rose-600/80 font-semibold">Daily limit hit</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Invalid</span>
              <XCircle className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-black text-slate-700 mt-2">{statusData.invalidKeys}</p>
            <span className="text-[10px] text-slate-400 font-semibold">Revoked / Bad</span>
          </div>
        </div>
      )}

      {/* Keys List Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-600" />
            Key Pool Status Table
          </h3>
          <span className="text-[11px] font-semibold text-gray-400">
            Keys are strictly masked for security
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400 text-xs font-semibold">
            Loading key pool metrics...
          </div>
        ) : statusData && statusData.keys.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-400 font-bold uppercase tracking-wider border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Key ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Successes</th>
                  <th className="py-3 px-4">Errors</th>
                  <th className="py-3 px-4">Cooldown Left</th>
                  <th className="py-3 px-4">Last Used</th>
                  <th className="py-3 px-4">Last Log</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {statusData.keys.map((k: any) => (
                  <tr key={k.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-gray-900 flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-blue-600" />
                      {k.id}
                    </td>
                    <td className="py-3.5 px-4">
                      {k.status === 'available' && (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Available
                        </span>
                      )}
                      {k.status === 'cooldown' && (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Cooldown
                        </span>
                      )}
                      {k.status === 'exhausted' && (
                        <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Exhausted
                        </span>
                      )}
                      {k.status === 'invalid' && (
                        <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Invalid
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-600">{k.successCount}</td>
                    <td className="py-3.5 px-4 font-bold text-rose-600">{k.errorCount}</td>
                    <td className="py-3.5 px-4 font-medium text-gray-600">
                      {k.cooldownRemainingSeconds > 0 ? `${k.cooldownRemainingSeconds}s` : '—'}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-gray-500">{k.lastUsed || 'Never'}</td>
                    <td className="py-3.5 px-4 text-gray-400 max-w-xs truncate" title={k.lastError || 'None'}>
                      {k.lastError ? (
                        <span className="text-rose-500 font-mono text-[11px]">{k.lastError}</span>
                      ) : (
                        <span className="text-gray-400">Normal</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center space-y-2">
            <p className="text-sm font-bold text-gray-700">No Keys Configured in Pool</p>
            <p className="text-xs text-gray-500">
              Add keys to your environment configuration (e.g. <code>GEMINI_KEY_1</code>, <code>GEMINI_KEY_2</code>).
            </p>
          </div>
        )}
      </div>

      {/* Guide Card */}
      <div className="bg-blue-50/60 border border-blue-100 rounded-3xl p-5 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1 text-xs text-blue-950 leading-relaxed">
          <p className="font-bold">How to Add or Scale Keys:</p>
          <p className="text-blue-800">
            You can add any number of keys in your server environment (<code>.env.local</code> or Hosting Settings) using:
          </p>
          <pre className="bg-blue-900 text-blue-100 p-2.5 rounded-xl font-mono text-[11px] overflow-x-auto mt-1">
GEMINI_KEY_1=your_key_here
GEMINI_KEY_2=your_key_here
GEMINI_KEY_3=your_key_here
          </pre>
          <p className="text-[11px] text-blue-700">
            The key pool automatically loads them without restarting or code modifications. Keys are never exposed to students or browser client code.
          </p>
        </div>
      </div>
    </div>
  );
}
