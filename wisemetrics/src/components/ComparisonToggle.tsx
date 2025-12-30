'use client';

import { useState, useEffect } from 'react';

interface Snapshot {
  id: string;
  name: string;
  snapshotDate: string;
}

interface Props {
  classId?: string;
  psychStudentId?: string;
  onComparisonChange?: (snapshotId: string | null) => void;
}

export function ComparisonToggle({ classId, psychStudentId, onComparisonChange }: Props) {
  const [isComparing, setIsComparing] = useState(false);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isComparing) {
      fetchSnapshots();
    }
  }, [isComparing, classId, psychStudentId]);

  async function fetchSnapshots() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (classId) params.set('classId', classId);
      if (psychStudentId) params.set('psychStudentId', psychStudentId);

      const res = await fetch(`/api/snapshots?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      
      const data = await res.json();
      setSnapshots(data);
      
      if (data.length > 0 && !selectedSnapshot) {
        setSelectedSnapshot(data[0].id);
        onComparisonChange?.(data[0].id); // ✅ Call the callback here
      } else if (data.length === 0) {
        setIsComparing(false);
        alert('No snapshots available. Please finalize a term first.');
      }
    } catch (error) {
      console.error('Error fetching snapshots:', error);
      setIsComparing(false);
    } finally {
      setLoading(false);
    }
  }

  function handleToggle() {
    const newValue = !isComparing;
    setIsComparing(newValue);
    
    if (!newValue) {
      setSelectedSnapshot('');
      onComparisonChange?.(null); // ✅ Call the callback when turning off
    }
  }

  function handleSnapshotChange(snapshotId: string) {
    setSelectedSnapshot(snapshotId);
    onComparisonChange?.(snapshotId); // ✅ Call the callback when changing snapshot
  }

  return (
    <div className="flex items-center gap-3">
      {/* Toggle Switch */}
      <label className="flex items-center gap-2 cursor-pointer group">
        <div className="relative">
          <input
            type="checkbox"
            checked={isComparing}
            onChange={handleToggle}
            disabled={loading}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
        </div>
        <span className="text-xs font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
          Compare
        </span>
      </label>

      {/* Dropdown - only show when comparing */}
      {isComparing && (
        <>
          {loading ? (
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </div>
          ) : snapshots.length === 0 ? (
            <span className="text-xs text-amber-400">No snapshots</span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">vs</span>
              <select
                value={selectedSnapshot}
                onChange={(e) => handleSnapshotChange(e.target.value)}
                className="px-2 py-1 bg-slate-800/80 border border-slate-700 rounded text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500 hover:border-slate-600 transition-colors cursor-pointer"
              >
                {snapshots.map((snapshot) => (
                  <option key={snapshot.id} value={snapshot.id}>
                    {snapshot.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </>
      )}
    </div>
  );
}
