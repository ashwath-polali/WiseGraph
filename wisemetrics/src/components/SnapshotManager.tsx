'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { usePsychEvaluation } from '@/components/PsychEvaluationClient';

interface Snapshot {
  id: string;
  name: string;
  snapshotDate: string;
}

interface Props {
  classId?: string;
  psychStudentId?: string;
}

export function SnapshotManager({ classId, psychStudentId }: Props) {
  const { comparisonSnapshotId, setComparisonSnapshotId } = usePsychEvaluation();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newSnapshotName, setNewSnapshotName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetchSnapshots();
  }, [classId, psychStudentId]);

  async function fetchSnapshots() {
    try {
      const params = new URLSearchParams();
      if (classId) params.set('classId', classId);
      if (psychStudentId) params.set('psychStudentId', psychStudentId);

      const res = await fetch(`/api/snapshots?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      
      const data = await res.json();
      setSnapshots(data);
    } catch (error) {
      console.error('Error fetching snapshots:', error);
    }
  }

  async function handleCreate() {
    if (!newSnapshotName.trim()) return;

    try {
      const res = await fetch('/api/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSnapshotName,
          classId,
          psychStudentId,
        }),
      });

      if (!res.ok) throw new Error('Failed to create');

      setNewSnapshotName('');
      setIsCreating(false);
      fetchSnapshots();
    } catch (error) {
      console.error('Error creating snapshot:', error);
      alert('Failed to create snapshot. Make sure there are scores to save.');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this snapshot? This cannot be undone.')) return;

    try {
      const res = await fetch(`/api/snapshots?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      // If we're deleting the selected snapshot, clear selection
      if (id === comparisonSnapshotId) {
        setComparisonSnapshotId(null);
      }

      fetchSnapshots();
    } catch (error) {
      console.error('Error deleting snapshot:', error);
      alert('Failed to delete snapshot');
    }
  }

  async function handleRename(id: string) {
    if (!editName.trim()) return;

    try {
      const res = await fetch('/api/snapshots', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, name: editName }),
      });

      if (!res.ok) throw new Error('Failed to rename');

      setEditingId(null);
      setEditName('');
      fetchSnapshots();
    } catch (error) {
      console.error('Error renaming snapshot:', error);
      alert('Failed to rename snapshot');
    }
  }

  function handleSnapshotClick(id: string) {
    const newSelectedId = comparisonSnapshotId === id ? null : id;
    setComparisonSnapshotId(newSelectedId);
  }

  return (
    <Card className="border border-slate-800/80 bg-slate-900/60 backdrop-blur-sm shadow-xl">
      <div className="p-5 border-b border-slate-800/60">
        <h3 className="text-sm font-bold text-slate-50 uppercase tracking-wider flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.6)]" />
          Term Snapshots
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Compare against past assessments
        </p>
      </div>

      <div className="p-4 space-y-3">
        {/* Snapshot List */}
        {snapshots.length === 0 ? (
          <div className="text-center py-6">
            <svg
              className="w-12 h-12 mx-auto text-slate-600 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            <p className="text-xs text-slate-500">
              No snapshots yet. Create one to save current scores.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {snapshots.map((snapshot) => (
              <div
                key={snapshot.id}
                className={`group relative rounded-lg border transition-all cursor-pointer ${
                  comparisonSnapshotId === snapshot.id
                    ? 'border-violet-400 bg-violet-400/10'
                    : 'border-slate-700/50 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/60'
                }`}
                onClick={() => handleSnapshotClick(snapshot.id)}
              >
                {editingId === snapshot.id ? (
                  <div className="p-3 flex items-center gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 h-7 text-xs"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter') handleRename(snapshot.id);
                        if (e.key === 'Escape') {
                          setEditingId(null);
                          setEditName('');
                        }
                      }}
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRename(snapshot.id);
                      }}
                      className="text-emerald-400 hover:text-emerald-300 text-xs"
                    >
                      Save
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(null);
                        setEditName('');
                      }}
                      className="text-slate-400 hover:text-slate-300 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {comparisonSnapshotId === snapshot.id && (
                          <svg className="w-4 h-4 text-violet-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        <p className="text-sm font-medium text-slate-100 truncate">
                          {snapshot.name}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {new Date(snapshot.snapshotDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(snapshot.id);
                          setEditName(snapshot.name);
                        }}
                        className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-700/50 rounded transition-colors"
                        title="Rename"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(snapshot.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700/50 rounded transition-colors"
                        title="Delete"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Create New Snapshot */}
        {isCreating ? (
          <div className="space-y-2 pt-2 border-t border-slate-700/50">
            <Input
              placeholder="Snapshot name (e.g., Term 1, Q2)"
              value={newSnapshotName}
              onChange={(e) => setNewSnapshotName(e.target.value)}
              className="text-xs"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') {
                  setIsCreating(false);
                  setNewSnapshotName('');
                }
              }}
            />
            <div className="flex gap-2">
              <Button
                onClick={handleCreate}
                className="flex-1 text-xs py-1.5"
              >
                Create
              </Button>
              <Button
                onClick={() => {
                  setIsCreating(false);
                  setNewSnapshotName('');
                }}
                variant="secondary"
                className="flex-1 text-xs py-1.5"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full mt-2 py-2 px-3 rounded-lg border border-dashed border-slate-700 text-slate-400 hover:text-slate-300 hover:border-slate-600 hover:bg-slate-800/40 transition-all text-xs font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Snapshot
          </button>
        )}
      </div>
    </Card>
  );
}
