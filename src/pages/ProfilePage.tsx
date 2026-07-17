import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  ChevronDown,
  ChevronRight,
  Clock,
  HelpCircle,
  LogIn,
  LogOut,
  MapPin,
  MessageCircle,
  Navigation,
  Package,
  Trash2,
  Wallet,
} from 'lucide-react';
import { logoutFully, useDeleteAccount } from '@/api/mutations/useAuth';
import { useGetBrandPolicies } from '@/api/queries/useInit';
import { useGetOrders } from '@/api/queries/useOrders';
import { useGetWallet } from '@/api/queries/useWallet';
import { PolicyModal } from '@/shared/PolicyModal';
import { StoreHoursModal } from '@/shared/StoreHoursModal';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/useToast';
import { rupee } from '@/utils/fmt';
import type { BrandPolicies } from '@/api/queries/useInit';

/** Terms and Privacy get their own rows — everything else lives under Help. */
const TOP_LEVEL: Array<{ key: keyof BrandPolicies; label: string; to: string }> = [
  { key: 'termsConditions', label: 'Terms & Conditions', to: '/terms-conditions' },
  { key: 'privacyPolicy', label: 'Privacy Policy', to: '/privacy-policy' },
];

const HELP_LINKS: Array<{ key: keyof BrandPolicies; label: string }> = [
  { key: 'aboutUs', label: 'About Us' },
  { key: 'contactUs', label: 'Contact Us' },
  { key: 'deliveryPolicy', label: 'Delivery Policy' },
  { key: 'cancellationRefundPolicy', label: 'Cancellation & Refund' },
  { key: 'returnPolicy', label: 'Return Policy' },
  { key: 'deleteAccountPolicy', label: 'Account Deletion Policy' },
  { key: 'sellerTerms', label: 'Seller Terms' },
];

export function ProfilePage() {
  const navigate = useNavigate();
  const push = useToast();
  const user = useAuthStore((s) => s.user);
  const brand = useAppStore((s) => s.brand);
  const store = useAppStore((s) => s.storeLocation);
  const { data: policies } = useGetBrandPolicies();
  const { data: wallet } = useGetWallet();
  const { orders } = useGetOrders();
  const deleteAccount = useDeleteAccount();

  const [hoursOpen, setHoursOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [policy, setPolicy] = useState<{ title: string; html: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const whatsapp = (brand?.whatsapp || store?.whatsapp || store?.phone || '').replace(/\D/g, '');
  const helpItems = HELP_LINKS.filter(({ key }) => !!policies?.[key]);

  const onDelete = async () => {
    await deleteAccount.mutateAsync();
    setConfirmDelete(false);
    push('Account deleted', '', 'trash-2');
    navigate('/home');
  };

  const onLogout = () => {
    logoutFully();
    push('Logged out', '', 'log-out');
    setTimeout(() => navigate('/home'), 400);
  };

  return (
    <>
      <main className="page">
        <div className="max-w-2xl mx-auto px-4 lg:px-8 mt-4">
          {/* ===== HERO ===== */}
          <div className="hero-wave text-white p-6 relative rise">
            <div className="absolute text-7xl opacity-15 leaf-sway" style={{ right: '-6px', top: '-10px' }}>
              🌿
            </div>
            <div className="absolute text-5xl opacity-10 float-slow" style={{ right: '34%', bottom: '-8px' }}>
              🍃
            </div>
            <div className="relative flex items-center gap-4">
              <div className="pf-avatar w-20 h-20 rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-extrabold display border border-white/30">
                {(user?.name || 'G')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xl font-extrabold display truncate">{user?.name || 'Guest User'}</div>
                <div className="text-sm text-white/85 truncate">{user?.phone || 'Not logged in'}</div>
                {user && (
                  <span className="inline-flex items-center gap-1 mt-2 text-micro font-bold bg-white/20 border border-white/25 px-2.5 py-1 rounded-full">
                    <BadgeCheck className="w-3.5 h-3.5 flex-none" /> {brand?.name ?? 'SRIAADHYA'} Member
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ===== STATS (overlap) ===== */}
          <div className="grid grid-cols-2 gap-3 -mt-6 relative z-10">
            <div className="card stat-card p-3.5 text-center rise d1">
              <Wallet className="ic w-6 h-6 text-[var(--green-700)] mx-auto" />
              <div className="font-extrabold text-lg mt-1 tabular-nums">{rupee(wallet?.balance ?? 0)}</div>
              <div className="text-xs2 text-[var(--ink-soft)]">Wallet</div>
            </div>
            <div className="card stat-card p-3.5 text-center rise d2">
              <Package className="ic w-6 h-6 text-[var(--green-700)] mx-auto" />
              <div className="font-extrabold text-lg mt-1 tabular-nums">{orders.length}</div>
              <div className="text-xs2 text-[var(--ink-soft)]">Orders</div>
            </div>
          </div>

          {/* menu */}
          <div className="card mt-5 overflow-hidden divide-y divide-[var(--line)] rise d2">
            <Link to="/my-orders" className="menu-row flex items-center gap-3 p-4">
              <span className="w-9 h-9 rounded-xl bg-[var(--leaf-100)] flex items-center justify-center flex-none">
                <Package className="w-5 h-5 text-[var(--green-700)]" />
              </span>
              <span className="flex-1 font-semibold text-sm">My Orders</span>
              <ChevronRight className="chev w-4 h-4 text-[var(--ink-soft)]" />
            </Link>
            <Link to="/address" className="menu-row flex items-center gap-3 p-4">
              <span className="w-9 h-9 rounded-xl bg-[var(--leaf-100)] flex items-center justify-center flex-none">
                <MapPin className="w-5 h-5 text-[var(--green-700)]" />
              </span>
              <span className="flex-1 font-semibold text-sm">Saved Addresses</span>
              <ChevronRight className="chev w-4 h-4 text-[var(--ink-soft)]" />
            </Link>
            <Link to="/location" className="menu-row flex items-center gap-3 p-4">
              <span className="w-9 h-9 rounded-xl bg-[var(--leaf-100)] flex items-center justify-center flex-none">
                <Navigation className="w-5 h-5 text-[var(--green-700)]" />
              </span>
              <span className="flex-1 font-semibold text-sm">Change Location</span>
              <ChevronRight className="chev w-4 h-4 text-[var(--ink-soft)]" />
            </Link>
            <button onClick={() => setHoursOpen(true)} className="menu-row w-full flex items-center gap-3 p-4 text-left">
              <span className="w-9 h-9 rounded-xl bg-[var(--leaf-100)] flex items-center justify-center flex-none">
                <Clock className="w-5 h-5 text-[var(--green-700)]" />
              </span>
              <span className="flex-1 font-semibold text-sm">Store Hours</span>
              <ChevronRight className="chev w-4 h-4 text-[var(--ink-soft)]" />
            </button>
            {whatsapp && (
              <a
                href={`https://wa.me/${whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className="menu-row flex items-center gap-3 p-4"
              >
                <span className="w-9 h-9 rounded-xl bg-[#DCFCE7] flex items-center justify-center flex-none">
                  <MessageCircle className="w-5 h-5 text-[#16A34A]" />
                </span>
                <span className="flex-1 font-semibold text-sm">Chat with us</span>
                <ChevronRight className="chev w-4 h-4 text-[var(--ink-soft)]" />
              </a>
            )}
          </div>

          {/* policies — each row appears only when the brand published that page */}
          {(helpItems.length > 0 || TOP_LEVEL.some(({ key }) => !!policies?.[key])) && (
            <div className="card mt-4 overflow-hidden divide-y divide-[var(--line)] rise d3">
              {TOP_LEVEL.filter(({ key }) => !!policies?.[key]).map(({ key, label, to }) => (
                <Link key={key} to={to} className="menu-row flex items-center gap-3 p-4">
                  <span className="flex-1 font-semibold text-sm">{label}</span>
                  <ChevronRight className="chev w-4 h-4 text-[var(--ink-soft)]" />
                </Link>
              ))}

              {helpItems.length > 0 && (
                <>
                  <button
                    onClick={() => setHelpOpen((v) => !v)}
                    className="menu-row w-full flex items-center gap-3 p-4 text-left"
                  >
                    <span className="w-9 h-9 rounded-xl bg-[var(--leaf-100)] flex items-center justify-center flex-none">
                      <HelpCircle className="w-5 h-5 text-[var(--green-700)]" />
                    </span>
                    <span className="flex-1 font-semibold text-sm">Help &amp; Info</span>
                    <ChevronDown
                      className={`w-4 h-4 text-[var(--ink-soft)] transition-transform ${helpOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {helpOpen &&
                    helpItems.map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setPolicy({ title: label, html: policies?.[key] ?? '' })}
                        className="menu-row w-full flex items-center gap-3 p-4 pl-16 text-left"
                      >
                        <span className="flex-1 font-semibold text-sm">{label}</span>
                        <ChevronRight className="chev w-4 h-4 text-[var(--ink-soft)]" />
                      </button>
                    ))}
                </>
              )}
            </div>
          )}

          {user ? (
            <>
              <button onClick={onLogout} className="btn btn-ghost w-full mt-5">
                <LogOut className="w-4 h-4" /> Logout
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="btn-danger-text w-full mt-3 justify-center"
              >
                <Trash2 className="w-4 h-4" /> Delete Account
              </button>
            </>
          ) : (
            <Link to="/login?next=/profile" className="btn btn-primary w-full mt-5">
              <LogIn className="w-4 h-4" /> Login / Sign up
            </Link>
          )}

          <p className="text-center text-xs2 text-[var(--ink-soft)] mt-4">
            SRI AADHYA FROZENS • Freshness Frozen, Goodness Preserved
          </p>
        </div>
      </main>

      {hoursOpen && <StoreHoursModal onClose={() => setHoursOpen(false)} />}
      {policy && <PolicyModal title={policy.title} html={policy.html} onClose={() => setPolicy(null)} />}

      {confirmDelete && (
        <div className="modal-back" onClick={(e) => e.target === e.currentTarget && setConfirmDelete(false)}>
          <div className="modal-card p-5">
            <h3 className="text-lg font-extrabold">Delete Account</h3>
            <p className="text-sm text-[var(--ink-soft)] mt-3">Are you sure you want to delete your account?</p>
            <p className="text-sm text-[var(--ink-soft)] mt-3">
              Once you delete your account, you will lose all the details saved in {brand?.name ?? 'SRIAADHYA'}.
            </p>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setConfirmDelete(false)} className="btn btn-ghost flex-1">
                No
              </button>
              <button
                onClick={() => void onDelete()}
                disabled={deleteAccount.isPending}
                className={`btn flex-1 text-white ${deleteAccount.isPending ? 'opacity-60' : ''}`}
                style={{ background: 'var(--coral)' }}
              >
                {deleteAccount.isPending ? 'Deleting…' : 'Yes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
