import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useGetBrandPolicies } from '@/api/queries/useInit';
import { DotLoader } from '@/ui/DotLoader';
import type { BrandPolicies } from '@/api/queries/useInit';

const BY_PATH: Record<string, { key: keyof BrandPolicies; title: string }> = {
  '/terms-conditions': { key: 'termsConditions', title: 'Terms & Conditions' },
  '/privacy-policy': { key: 'privacyPolicy', title: 'Privacy Policy' },
};

/** A policy on its own route, for links that arrive from outside the app
    (an email, an app-store listing). The same copy also opens in a modal from
    the profile — this is the direct-link path. */
export function PolicyPage() {
  const { pathname } = useLocation();
  const { data: policies, isLoading } = useGetBrandPolicies();

  const entry = BY_PATH[pathname] ?? BY_PATH['/terms-conditions'];
  const html = policies?.[entry.key] ?? null;

  return (
    <main className="pt-16 pb-24 lg:pb-10">
      <div className="max-w-3xl mx-auto px-4 lg:px-8 mt-4">
        <Link to="/profile" className="text-sm font-bold text-[var(--green-700)] flex items-center gap-1 mb-3">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="display text-2xl font-extrabold mb-4">{entry.title}</h1>

        {isLoading ? (
          <DotLoader />
        ) : html ? (
          <div className="card p-5">
            {/* already sanitized inside useGetBrandPolicies — never re-run it here */}
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        ) : (
          <div className="card p-8 text-center text-sm text-[var(--ink-soft)]">
            This page hasn't been published yet.
          </div>
        )}
      </div>
    </main>
  );
}
