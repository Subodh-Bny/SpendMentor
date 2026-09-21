'use client';

import { useState } from 'react';
import { checkAndStoreAnomalies } from '@/app/actions/algorithmActions';

interface FlaggedExpense {
  id: string;
  description: string;
  amount: number;
  date: string | null;
  z_score: number | null;
}

export default function AnomalyAlertBanner({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    count: number;
    flagged: FlaggedExpense[];
    allClear: boolean;
  } | null>(null);
  const [visible, setVisible] = useState(true);
  const [expanded, setExpanded] = useState(true);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const res = await checkAndStoreAnomalies(userId);
      if (res.success) {
        setResult({
          count: res.anomaliesDetected || 0,
          flagged: (res as any).flaggedDetails ?? [],
          allClear: (res.anomaliesDetected || 0) === 0,
        });
      } else {
        setResult({ count: 0, flagged: [], allClear: true });
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (!visible) return null;

  const hasAnomalies = result && result.count > 0;

  return (
    <div className={`rounded-lg border shadow-sm mb-4 transition-colors
      ${hasAnomalies
        ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50'
        : result
          ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50'
          : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50'
      }`}
    >
      {/* Header row */}
      <div className="flex justify-between items-center p-4 relative">
        {/* <button
          onClick={() => setVisible(false)}
          className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded transition-colors"
          aria-label="Dismiss"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button> */}

        <div className="flex items-start gap-3 pr-6">
          {hasAnomalies ? (
            <svg className="text-amber-600 mt-0.5 shrink-0" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
          ) : result ? (
            <svg className="text-emerald-600 mt-0.5 shrink-0" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>
          ) : (
            <svg className="text-amber-600 mt-0.5 shrink-0" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          )}
          <div>
            <h3 className={`font-bold text-sm ${hasAnomalies ? 'text-amber-900 dark:text-amber-400' : result ? 'text-emerald-800 dark:text-emerald-400' : 'text-amber-900 dark:text-amber-400'}`}>
              Smart Spending Analysis
            </h3>
            <p className={`text-sm mt-0.5 ${hasAnomalies ? 'text-amber-800 dark:text-amber-600' : result ? 'text-emerald-700 dark:text-emerald-500' : 'text-amber-800 dark:text-amber-600'}`}>
              {hasAnomalies
                ? `${result.count} unusually high expense${result.count > 1 ? 's' : ''} detected (Z-Score > 2.5) — review them below.`
                : result
                  ? 'Your spending looks perfectly normal. No irregular transactions found.'
                  : 'Detect irregular or unusually high expenses in your spending history.'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasAnomalies && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="text-xs text-amber-700 dark:text-amber-500 hover:underline"
            >
              {expanded ? 'Hide' : `Show ${result.count}`}
            </button>
          )}
          {!result && (
            <button
              onClick={runAnalysis}
              disabled={loading}
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-60"
            >
              {loading ? 'Scanning...' : 'Scan Now'}
            </button>
          )}
          {result && (
            <button
              onClick={() => { setResult(null); runAnalysis(); }}
              disabled={loading}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-2 py-1 rounded border border-slate-200 dark:border-slate-700"
            >
              {loading ? '...' : 'Re-scan'}
            </button>
          )}
        </div>
      </div>

      {/* Flagged expense list */}
      {hasAnomalies && expanded && (
        <div className="border-t border-amber-200 dark:border-amber-800/50 px-4 pb-4 pt-3">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-500 uppercase tracking-wider mb-2">
            Flagged Transactions
          </p>
          <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {result.flagged.map((exp) => (
              <li key={exp.id} className="flex justify-between items-center rounded-lg bg-amber-100/70 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-amber-600 dark:text-amber-400 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4" /><path d="M12 17h.01" /><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /></svg>
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{exp.description}</p>
                    {exp.date && <p className="text-xs text-slate-500">{exp.date}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  {exp.z_score !== null && (
                    <span className="text-xs font-mono bg-amber-200 dark:bg-amber-800/50 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded">
                      z={exp.z_score.toFixed(2)}
                    </span>
                  )}
                  <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                    Rs. {exp.amount.toLocaleString()}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
