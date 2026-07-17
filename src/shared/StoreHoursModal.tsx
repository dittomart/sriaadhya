import { Clock, X } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { isStoreOpenNow, weekHours } from '@/utils/storeHours';

/** The store's published hours.

    This store runs in manual mode (is_schedulable = 0, no schedule_data), so
    there is no week to show — only whether it is taking orders right now. The
    table renders when a store does publish a schedule. */
export function StoreHoursModal({ onClose }: { onClose: () => void }) {
  const store = useAppStore((s) => s.storeLocation);
  const week = weekHours(store).filter((d) => d.hours);
  const open = isStoreOpenNow(store);

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

        <div
          className={`flex items-center gap-2 p-3 rounded-xl text-sm font-bold ${
            open ? 'bg-[var(--leaf-100)] text-[var(--green-800)]' : 'bg-yellow-50 text-yellow-800'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${open ? 'bg-[var(--green-600)]' : 'bg-yellow-500'}`} />
          {open ? 'Open now — taking orders' : 'Closed right now'}
        </div>

        {week.length > 0 &&
          week.map(({ day, hours }) => (
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
