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
    <Card className="overflow-hidden p-0">
      <div className="border-b border-border px-5 py-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--chart-6)]" />
          Term Snapshots
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Compare against past assessments
        </p>
      </div>

      <div className="p-4 space-y-3">
        {/* Snapshot List */}
        {snapshots.length === 0 ? (
          <div className="py-6 text-center">
            <svg
              className="mx-auto mb-3 h-12 w-12 text-muted-foreground/50"
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
            <p className="text-xs text-muted-foreground">
              No snapshots yet. Create one to save current scores.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {snapshots.map((snapshot) => (
              <div
                key={snapshot.id}
                className={`group relative cursor-pointer rounded-lg border transition-colors duration-150 ${
                  comparisonSnapshotId === snapshot.id
                    ? 'border-[color:var(--chart-6)] bg-[color-mix(in_oklch,var(--chart-6)_12%,transparent)]'
                    : 'border-border bg-muted hover:border-input hover:bg-accent/40'
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
                      className="text-xs font-medium text-[color:var(--chart-2)] transition-colors hover:opacity-80"
                    >
                      Save
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(null);
                        setEditName('');
                      }}
                      className="text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {comparisonSnapshotId === snapshot.id && (
                          <svg className="h-4 w-4 flex-shrink-0 text-[color:var(--chart-6)]" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                        <p className="truncate text-sm font-medium text-foreground">
                          {snapshot.name}
                        </p>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
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
                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
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
                        className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
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
          <div className="space-y-2 border-t border-border pt-2">
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
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors duration-150 hover:border-input hover:bg-accent/40 hover:text-foreground"
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
