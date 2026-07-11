'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ResetPasswordClient } from '@/components/ResetPasswordClient';

type ViewMode = 'polar' | 'bell' | 'concentric';

type TeacherSettings = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string | Date;
  school?: string;
  defaultClassId?: string;
  defaultStudentView?: ViewMode;
};

type ClassOption = {
  id: string;
  name: string;
  subject: string;
};

interface Props {
  teacher: TeacherSettings | null;
  classes: ClassOption[];
  accountType?: string;
  teacherId?: string;
}

export function SettingsClient({ teacher, classes, accountType, teacherId }: Props) {
  const router = useRouter();

  const [name, setName] = useState(teacher?.name ?? '');
  const [email, setEmail] = useState(teacher?.email ?? '');
  const [school, setSchool] = useState(teacher?.school ?? '');
  const [defaultClassId, setDefaultClassId] = useState(
    teacher?.defaultClassId ?? ''
  );
  const [defaultStudentView, setDefaultStudentView] = useState<ViewMode>(
    teacher?.defaultStudentView ?? 'polar'
  );
  const [status, setStatus] = useState<'idle' | 'saving' | 'success' | 'error'>(
    'idle'
  );
  const [loading, setLoading] = useState(false);
  const [dangerExpanded, setDangerExpanded] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!teacher) return;
    setStatus('saving');

    try {
      const accountRes = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
        }),
      });

      if (!accountRes.ok) {
        throw new Error(await accountRes.text());
      }

      setStatus('success');
      router.refresh();
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  }

  async function handleSwitchMode() {
    if (!confirm(`Switch to ${accountType === 'psychologist' ? 'Teacher' : 'Psychologist'} mode? We'll take you to that portal.`)) {
      return;
    }

    setLoading(true);
    try {
      const newMode = accountType === 'psychologist' ? 'teacher' : 'psychologist';
      const res = await fetch('/api/teacher', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountType: newMode }),
      });

      if (!res.ok) throw new Error('Failed to switch mode');

      const redirectUrl = newMode === 'psychologist' ? '/psych/dashboard' : '/dashboard';
      router.push(redirectUrl);
    } catch (err) {
      console.error('Error switching mode:', err);
      alert("We couldn't switch modes. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (!confirm('Delete your account? This permanently removes your classes, students, and scores. There is no undo.')) {
      return;
    }

    if (!confirm('Last check. This cannot be reversed.')) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/teacher', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) throw new Error('Failed to delete account');

      router.push('/login');
    } catch (err) {
      console.error('Error deleting account:', err);
      alert("We couldn't delete your account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account info */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Account</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs text-muted-foreground">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-muted-foreground">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-[11px] text-muted-foreground">
              Joined{' '}
              {teacher
                ? new Date(teacher.createdAt).toLocaleDateString()
                : 'recently'}
              .
            </p>
            <div className="mt-1">
              <p className="text-[11px] text-muted-foreground mb-1">
                Send yourself a one‑time link to reset your password.
              </p>
              <ResetPasswordClient initialEmail={teacher?.email ?? ''} />
            </div>
          </div>
        </section>

        {/* App defaults (only for teacher mode) */}
        {classes.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">App defaults</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="sm:col-span-1">
                <label className="mb-1.5 block text-xs text-muted-foreground">
                  School / district
                </label>
                <Input
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder="School name"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">
                  Default class
                </label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground transition-[border-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25"
                  value={defaultClassId}
                  onChange={(e) => setDefaultClassId(e.target.value)}
                >
                  <option value="">First class created</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.subject}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-muted-foreground">
                  Default student view
                </label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground transition-[border-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25"
                  value={defaultStudentView}
                  onChange={(e) =>
                    setDefaultStudentView(
                      e.target.value as 'polar' | 'bell' | 'concentric'
                    )
                  }
                >
                  <option value="polar">Polar radar</option>
                  <option value="bell">Bell curve</option>
                  <option value="concentric">Concentric radial</option>
                </select>
              </div>
            </div>
          </section>
        )}

        {/* Save + feedback */}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={status === 'saving'}>
            {status === 'saving' ? 'Saving…' : 'Save settings'}
          </Button>
          {status === 'success' && (
            <p className="text-xs text-psych">Saved.</p>
          )}
          {status === 'error' && (
            <p className="text-xs text-destructive">
              We couldn&apos;t save your settings. Please try again.
            </p>
          )}
        </div>
      </form>

      {/* Danger Zone - Collapsible */}
      {accountType && (
        <div className="border-t border-border pt-6">
          <button
            onClick={() => setDangerExpanded(!dangerExpanded)}
            className="flex items-center gap-2 text-xs font-semibold text-destructive transition-colors duration-150 hover:text-destructive/80"
          >
            <svg
              className={`w-4 h-4 transition-transform ${dangerExpanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            Danger zone
          </button>

          {dangerExpanded && (
            <div className="mt-3 space-y-2">
              {/* Switch Mode */}
              <div className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs">
                <div>
                  <p className="font-medium text-destructive">Switch mode</p>
                  <p className="text-[11px] text-muted-foreground">
                    Switch to {accountType === 'psychologist' ? 'Teacher' : 'Psychologist'} mode
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleSwitchMode}
                  disabled={loading}
                >
                  {loading ? 'Switching…' : 'Switch'}
                </Button>
              </div>

              {/* Delete Account */}
              <div className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs">
                <div>
                  <p className="font-medium text-destructive">Delete account</p>
                  <p className="text-[11px] text-muted-foreground">
                    Permanently delete your account
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAccount}
                  disabled={loading}
                >
                  {loading ? 'Deleting…' : 'Delete'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
