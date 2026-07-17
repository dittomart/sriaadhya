import { X } from 'lucide-react';

/** CMS copy, rendered as the markup it is.

    NEVER re-sanitize here: it was cleaned at the data boundary inside
    useGetBrandPolicies, so the cache only ever holds safe HTML. Doing it twice
    invites the two passes to disagree. */
export function PolicyModal({ title, html, onClose }: { title: string; html: string; onClose: () => void }) {
  return (
    <div className="modal-back" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card p-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3 sticky top-0 bg-white">
          <h3 className="text-lg font-extrabold">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-[var(--cream-2)] flex items-center justify-center flex-none">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}
