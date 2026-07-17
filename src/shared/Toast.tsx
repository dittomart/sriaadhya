import {
  Bell,
  Check,
  CheckCircle2,
  Heart,
  Leaf,
  LogOut,
  MapPin,
  MessageSquare,
  RotateCcw,
  ShoppingBag,
  Ticket,
  Trash2,
  User,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useToastStore } from '@/hooks/useToast';

/* Only the icons app.js actually passes to toast(). Keeping this an explicit
   map (rather than a namespace import) keeps lucide tree-shakeable. */
const ICONS: Record<string, LucideIcon> = {
  bell: Bell,
  check: Check,
  'check-circle-2': CheckCircle2,
  heart: Heart,
  leaf: Leaf,
  'log-out': LogOut,
  'map-pin': MapPin,
  'message-square': MessageSquare,
  'rotate-ccw': RotateCcw,
  'shopping-bag': ShoppingBag,
  ticket: Ticket,
  'trash-2': Trash2,
  user: User,
  x: X,
};

/** Port of app.js `toast()` markup + #toast-wrap container. */
export function Toast() {
  const toasts = useToastStore((s) => s.toasts);
  if (toasts.length === 0) return null;
  return (
    <div id="toast-wrap">
      {toasts.map((t) => {
        const Icon = ICONS[t.icon] ?? Check;
        return (
          <div key={t.id} className={`toast ${t.kind}`}>
            <Icon style={{ width: 16, height: 16 }} />
            <span>{t.msg}</span>
          </div>
        );
      })}
    </div>
  );
}
