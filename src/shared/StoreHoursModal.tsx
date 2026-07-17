import { Clock, X } from 'lucide-react';
import { storeHoursDisplay } from '@/api/_seed';

/** Port of app.js `openStoreHours()` — static display, backend enforces timing. */
export function StoreHoursModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-back" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-extrabold flex items-center gap-2">
            <Clock className="w-5 h-5 text-[var(--green-700)]" /> Our Store Hours
          </h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-[var(--cream-2)] flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        {Object.entries(storeHoursDisplay).map(([day, hours]) => (
          <div key={day} className="flex justify-between py-2 border-b border-[var(--line)] text-sm">
            <span className="font-semibold">{day}</span>
            <span className="text-[var(--ink-soft)]">{hours}</span>
          </div>
        ))}
        <p className="text-xs text-[var(--ink-soft)] mt-4 bg-[var(--cream)] p-3 rounded-xl">
          Note: Order timing is managed by our system. If unavailable at checkout, please try again later.
        </p>
      </div>
    </div>
  );
}
