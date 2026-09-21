'use client';

import { useState } from 'react';
import { checkAndStoreAnomalies } from '@/app/actions/algorithmActions';

export default function AnomalyAlertBanner({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{ count: number; message: string } | null>(null);
  const [visible, setVisible] = useState(true);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const result = await checkAndStoreAnomalies(userId);
      if (result.success) {
        setAlertInfo({
          count: result.anomaliesDetected || 0,
          message: result.anomaliesDetected 
            ? `We found ${result.anomaliesDetected} unusually high expenses (Z-Score > 2.5) in your recent history.` 
            : 'Your spending looks perfectly normal.'
        });
      } else {
        setAlertInfo({ count: 0, message: result.message || 'Analysis completed with no significant outliers.' });
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (!visible) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg p-4 mb-4 flex justify-between items-center shadow-sm relative">
      <button 
        onClick={() => setVisible(false)}
        className="absolute top-2 right-2 text-amber-500 hover:text-amber-700 dark:text-amber-600 dark:hover:text-amber-400 p-1 rounded transition-colors"
        aria-label="Dismiss alert"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>

      <div className="pr-8">
        <h3 className="font-bold text-amber-900 dark:text-amber-500 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          Smart Spending Analysis
        </h3>
        <p className="text-amber-800 dark:text-amber-600/80 text-sm mt-1">
          {alertInfo?.message || "Run our statistical anomaly detector to find irregular spending."}
        </p>
      </div>
      
      {!alertInfo && (
        <button 
          onClick={runAnalysis}
          disabled={loading}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-60 ml-4 shrink-0"
        >
          {loading ? 'Scanning...' : 'Scan Now'}
        </button>
      )}
    </div>
  );
}
