import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, HeartHandshake, Leaf, ShieldCheck, Snowflake } from 'lucide-react';
import { useGenerateOtp, useVerifyOtp } from '@/api/mutations/useAuth';
import { LeafDefsLogin, LiveLeavesLogin } from '@/shared/LiveLeaf';
import { useAppStore } from '@/store/appStore';
import { useLocationStore } from '@/store/locationStore';
import { useToast } from '@/hooks/useToast';
import { formatPhone, isValidPhone } from '@/utils/normalizePhone';

const OTP_LENGTH = 6;

type Step = 'phone' | 'details' | 'otp';

/** Phone → (name/email, new customers only) → OTP.

    The OTP is the backend's: there is no demo code, and the only way past this
    screen is a real one delivered to a real number. */
export function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/home';
  const push = useToast();
  const brand = useAppStore((s) => s.brand);

  const generateOtp = useGenerateOtp();
  const verifyOtp = useVerifyOtp();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === 'otp') otpRefs.current[0]?.focus();
  }, [step]);

  const sending = generateOtp.isPending;
  const verifying = verifyOtp.isPending;

  const requestOtp = async (withDetails: boolean) => {
    setError('');
    if (!isValidPhone(phone)) {
      setError('Enter a valid 10-digit number');
      return;
    }
    if (withDetails && (!name.trim() || !email.trim())) {
      setError('We need your name and email to create your account');
      return;
    }

    const res = await generateOtp.mutateAsync(
      withDetails ? { phone, name: name.trim(), email: email.trim() } : { phone },
    );

    switch (res.status) {
      case 'otp':
        setStep('otp');
        push(`OTP sent to ${formatPhone(phone)}`, 'ok', 'message-square');
        break;
      case 'new_user':
        setStep('details');
        break;
      case 'email_phone_already_used':
        setError(res.message ?? 'That email or phone is already in use.');
        break;
      case 'user_deleted':
        setError(res.message ?? 'That account was removed.');
        break;
      default:
        setError(res.message ?? 'Could not send the code. Please try again.');
    }
  };

  const setOtpAt = (i: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setOtp((prev) => prev.map((d, idx) => (idx === i ? digit : d)));
    if (digit && i < OTP_LENGTH - 1) otpRefs.current[i + 1]?.focus();
  };

  const onOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!digits) return;
    e.preventDefault();
    setOtp(Array.from({ length: OTP_LENGTH }, (_, i) => digits[i] ?? ''));
    otpRefs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus();
  };

  const submitOtp = async () => {
    setError('');
    const code = otp.join('');
    if (code.length < OTP_LENGTH) {
      setError('Enter the 6-digit code');
      return;
    }

    const res = await verifyOtp.mutateAsync(
      name.trim() ? { phone, otp: code, name: name.trim(), email: email.trim() } : { phone, otp: code },
    );

    if (!res.ok) {
      setError(res.message ?? 'That code did not work.');
      setOtp(Array(OTP_LENGTH).fill(''));
      otpRefs.current[0]?.focus();
      return;
    }

    push('Logged in 🌱', 'ok', 'check');
    /* A returning customer's default address already seeded the pin — they can
       go straight where they were headed. Everyone else picks a location. */
    const hasLocation = !!useLocationStore.getState().location;
    navigate(hasLocation ? next : `/location?next=${encodeURIComponent(next)}`, { replace: true });
  };

  return (
    <div className="login-page">
      {/* ===================== LEFT · BRAND ===================== */}
      <section className="brand-side lg:w-1/2 flex flex-col justify-center items-center text-center px-7 py-6 lg:px-14 lg:py-12 relative">
        <LeafDefsLogin />
        <LiveLeavesLogin />

        <Leaf className="leaf l3 leaf-float" style={{ animationDelay: '1.4s' }} />
        <Leaf className="leaf l4 leaf-float" style={{ animationDelay: '2s' }} />

        <div className="logo-plate" style={{ animation: 'bounceIn .9s ease' }}>
          <span className="orbit" />
          <img
            src={brand?.logo || '/images/logo-full.png'}
            alt={brand?.name ?? 'SRI AADHYA'}
            className="logo-banner sm lg:!w-[360px]"
          />
        </div>

        <div className="tagline mt-6 lg:mt-7" style={{ animation: 'fadeUp .7s .25s both' }}>
          <Snowflake className="w-3.5 h-3.5" /> Freshness Frozen, Goodness Preserved
        </div>

        <div className="feats mt-8 hidden lg:flex" style={{ animation: 'fadeUp .7s .4s both' }}>
          <div className="feat">
            <span className="feat-ico">
              <Leaf />
            </span>
            <span className="feat-lbl">
              100%
              <br />
              Natural
            </span>
          </div>
          <div className="feat">
            <span className="feat-ico">
              <Snowflake />
            </span>
            <span className="feat-lbl">
              Frozen
              <br />
              Fresh
            </span>
          </div>
          <div className="feat">
            <span className="feat-ico">
              <ShieldCheck />
            </span>
            <span className="feat-lbl">
              Premium
              <br />
              Quality
            </span>
          </div>
          <div className="feat">
            <span className="feat-ico">
              <HeartHandshake />
            </span>
            <span className="feat-lbl">
              Made for
              <br />
              Families
            </span>
          </div>
        </div>

        <p className="text-[12px] text-[var(--ink-soft)] mt-5 hidden lg:block" style={{ animation: 'fadeIn 1s .7s both' }}>
          100% Natural • Hygienically Packed • Avinashi, Tirupur
        </p>
      </section>

      {/* ===================== RIGHT · FORM ===================== */}
      <section className="form-side lg:w-1/2 px-4 py-4 lg:px-10 lg:py-10">
        <div className="form-wrap">
          <div className="auth-card p-5 lg:p-6 rise d1">
            <div className="mb-5 flex items-center gap-3">
              <span className="welcome-chip">
                <Leaf className="w-5 h-5" />
              </span>
              <div>
                <h2 className="display text-2xl lg:text-3xl font-extrabold leading-tight">Welcome 👋</h2>
                <p className="text-sm2 lg:text-[15px] text-[var(--ink-soft)] mt-0.5">
                  {step === 'otp'
                    ? `We sent a code to ${formatPhone(phone)}`
                    : step === 'details'
                      ? "You're new here — tell us who you are."
                      : 'Log in with your mobile number to start ordering.'}
                </p>
              </div>
            </div>

            {step === 'phone' && (
              <div>
                <label htmlFor="login-phone" className="text-sm font-bold">
                  Mobile number
                </label>
                {/* The 56px of `.field-lg` was on this wrapper while the input
                    inside shrank to its own 25px line-box — the box that looked
                    tappable and the box that took the tap were different
                    elements, and only the small one was real. `<label>` + a
                    full-height input makes them the same thing. */}
                <label htmlFor="login-phone" className="flex items-center field field-lg mt-1.5 gap-2 cursor-text">
                  <span className="font-extrabold text-[var(--ink-soft)]">+91</span>
                  <input
                    id="login-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    onKeyDown={(e) => e.key === 'Enter' && void requestOtp(false)}
                    maxLength={10}
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="10-digit number"
                    className="flex-1 h-full min-w-0 outline-none bg-transparent text-md2"
                  />
                </label>
                {error && <div className="text-xs text-[var(--coral)] mt-1.5">{error}</div>}
                <button
                  onClick={() => void requestOtp(false)}
                  disabled={sending || !isValidPhone(phone)}
                  className={`btn btn-primary btn-xl w-full mt-4 shine-wrap ${sending || !isValidPhone(phone) ? 'opacity-60' : ''}`}
                >
                  {sending ? 'Sending…' : 'Send OTP'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {step === 'details' && (
              <div>
                {/* Both labels were bare <label> over an id-less input: nothing
                    tied them together, so the label was 17px of inert text
                    rather than part of the field's target. */}
                <label htmlFor="login-name" className="text-sm font-bold">
                  Your name
                </label>
                <input
                  id="login-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  autoComplete="name"
                  className="field mt-1.5"
                />
                <label htmlFor="login-email" className="text-sm font-bold mt-4 block">
                  Email
                </label>
                <input
                  id="login-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void requestOtp(true)}
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="field mt-1.5"
                />
                {error && <div className="text-xs text-[var(--coral)] mt-1.5">{error}</div>}
                <button
                  onClick={() => void requestOtp(true)}
                  disabled={sending}
                  className={`btn btn-primary btn-xl w-full mt-4 shine-wrap ${sending ? 'opacity-60' : ''}`}
                >
                  {sending ? 'Sending…' : 'Send OTP'} <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => setStep('phone')} className="btn btn-ghost w-full mt-2 text-sm">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              </div>
            )}

            {step === 'otp' && (
              <div>
                <div className="flex gap-2 justify-center my-4" id="otpInputs">
                  {otp.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        otpRefs.current[i] = el;
                      }}
                      value={d}
                      onChange={(e) => setOtpAt(i, e.target.value)}
                      onPaste={onOtpPaste}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
                        if (e.key === 'Enter') void submitOtp();
                      }}
                      maxLength={1}
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      autoComplete={i === 0 ? 'one-time-code' : 'off'}
                      className="w-10 h-12 sm:w-11 sm:h-12 text-center text-xl font-extrabold field"
                    />
                  ))}
                </div>
                {error && <div className="text-xs text-[var(--coral)] text-center mb-2">{error}</div>}
                <button
                  onClick={() => void submitOtp()}
                  disabled={verifying || otp.join('').length < OTP_LENGTH}
                  className={`btn btn-primary btn-xl w-full ${verifying || otp.join('').length < OTP_LENGTH ? 'opacity-60' : ''}`}
                >
                  {verifying ? 'Verifying…' : 'Verify & Continue'}
                </button>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      setStep('phone');
                      setOtp(Array(OTP_LENGTH).fill(''));
                      setError('');
                    }}
                    className="btn btn-ghost flex-1 text-sm"
                  >
                    Change number
                  </button>
                  <button
                    onClick={() => void requestOtp(!!name.trim())}
                    disabled={sending}
                    className="btn btn-ghost flex-1 text-sm"
                  >
                    {sending ? 'Sending…' : 'Resend OTP'}
                  </button>
                </div>
              </div>
            )}
          </div>
          <p className="text-center text-xs2 text-[var(--ink-soft)] mt-4">
            By continuing you agree to our Terms &amp; Privacy Policy.
          </p>
        </div>
      </section>
    </div>
  );
}
