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
    <main className="page">
      <div className="max-w-3xl mx-auto px-4 lg:px-8 mt-4">
        <Link to="/profile" className="link-tap text-sm text-[var(--green-700)] mb-1 -ml-1">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="display text-2xl font-extrabold mb-4">{entry.title}</h1>

        {isLoading ? (
          <DotLoader />
        ) : html ? (
          <div className="card p-5 overflow-hidden">
            {/* already sanitized inside useGetBrandPolicies — never re-run it here */}
            {/* This is admin-authored HTML with no width contract: a pasted
                table, a long support URL or a code block will all exceed 360px.
                body{overflow-x:hidden} only hid the overflow — the text was
                still amputated at the viewport edge. Wide block children get
                their own scroller, prose text breaks instead of pushing. */}
            <div
              className="prose prose-sm max-w-none break-words
                         prose-headings:break-words
                         prose-a:break-all
                         prose-pre:overflow-x-auto prose-pre:max-w-full
                         prose-img:h-auto prose-img:max-w-full
                         prose-table:block prose-table:w-full prose-table:overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: html }}
            />
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
