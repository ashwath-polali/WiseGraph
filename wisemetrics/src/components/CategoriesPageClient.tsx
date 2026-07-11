'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UniversalTemplateClient } from './UniversalTemplateClient';

interface CustomEvaluation {
  id: string;
  name: string;
  subject: string;
  gradeLevel: string;
  student?: { name: string };
  categoryCount: number;
}

interface Props {
  teacherId: string;
  customEvaluations: CustomEvaluation[];
}

export function CategoriesPageClient({ teacherId, customEvaluations }: Props) {
  const [activeTab, setActiveTab] = useState<'universal' | 'custom'>('universal');

  return (
    <div className="flex gap-6 min-h-screen">
      {/* Sidebar */}
      <div className="w-48 flex-shrink-0 border-r border-border pr-6 pt-6">
        <div className="space-y-2">
          <button
            onClick={() => setActiveTab('universal')}
            className={`w-full text-left px-4 py-2 rounded-lg transition-colors duration-150 ${
              activeTab === 'universal'
                ? 'bg-psych text-psych-foreground'
                : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Universal Categories
            </div>
          </button>

          <button
            onClick={() => setActiveTab('custom')}
            className={`w-full text-left px-4 py-2 rounded-lg transition-colors duration-150 ${
              activeTab === 'custom'
                ? 'bg-[color:var(--chart-3)] text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent/40 hover:text-foreground'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Custom Profiles
            </div>
            {customEvaluations.length > 0 && (
              <span className={`text-xs block mt-1 ${
                activeTab === 'custom' ? 'text-primary-foreground/80' : 'text-muted-foreground'
              }`}>
                {customEvaluations.length} evaluation{customEvaluations.length !== 1 ? 's' : ''}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {activeTab === 'universal' ? (
          <div>
            <div className="mb-6">
              <h1 className="font-display text-2xl font-bold text-foreground mb-1">Universal Categories</h1>
              <p className="text-sm text-muted-foreground">Edit the default assessment framework</p>
            </div>
            <Card className="p-6">
              <UniversalTemplateClient teacherId={teacherId} />
            </Card>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <h1 className="font-display text-2xl font-bold text-foreground mb-1">Custom Profiles</h1>
              <p className="text-sm text-muted-foreground">Manage unique assessment frameworks for each student</p>
            </div>

            {customEvaluations.length === 0 ? (
              <Card className="p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">
                  No Custom Profiles Yet
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a new evaluation with "Custom Profile" to get started
                </p>
                <Link href="/psych/new-evaluation">
                  <Button className="text-sm">Create Evaluation</Button>
                </Link>
              </Card>
            ) : (
              <Card className="p-4">
                <div className="space-y-2">
                  {customEvaluations.map((evaluation, index) => (
                    <motion.div
                      key={evaluation.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1], delay: index * 0.03 }}
                    >
                      <Link
                        href={`/psych/evaluations/${evaluation.id}/configure`}
                        className="block"
                      >
                        <div className="group flex items-center gap-3 p-3 rounded-lg hover:bg-accent/40 transition-colors duration-150 border border-transparent hover:border-[color:var(--chart-3)]/50">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-foreground truncate group-hover:text-[color:var(--chart-3)] transition-colors">
                              {evaluation.student?.name || 'Unnamed'}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              Grade {evaluation.gradeLevel}
                            </p>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="text-right">
                              <p className="text-muted-foreground">Categories</p>
                              <p className="font-semibold text-foreground font-mono" data-numeric>{evaluation.categoryCount}</p>
                            </div>
                          </div>

                          <svg className="w-5 h-5 text-muted-foreground flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
