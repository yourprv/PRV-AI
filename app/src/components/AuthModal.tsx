import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { PolicyDocument } from '@/components/PolicyDocument';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PolicyView = 'terms' | 'privacy' | null;

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { isLoading, loginWithGoogle, loginWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | null>(null);
  const [policyView, setPolicyView] = useState<PolicyView>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setStatusMessage(null);
      setStatusType(null);
      setTermsAccepted(false);
      setAgeConfirmed(false);
    }
  }, [isOpen]);

  const handleGoogleSignIn = async () => {
    if (!termsAccepted || !ageConfirmed) return;
    setStatusMessage(null);
    setStatusType(null);

    try {
      await loginWithGoogle();
      setStatusMessage('Redirecting to Google for authentication…');
      setStatusType('success');
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : 'Unable to sign in with Google. Please try again.',
      );
      setStatusType('error');
    }
  };

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!termsAccepted || !ageConfirmed) return;
    setStatusMessage(null);
    setStatusType(null);

    if (!email.trim()) {
      return;
    }

    try {
      await loginWithEmail(email.trim());
      setStatusMessage(
        'If your email is valid, you will receive a login link shortly.',
      );
      setStatusType('success');
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : 'Unable to send a login link. Please try again.',
      );
      setStatusType('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-sm mx-auto bg-white dark:bg-[#1F2937] rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.3)] p-6 sm:p-8 animate-fade-in max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 sm:top-4 right-3 sm:right-4 w-8 h-8 flex items-center justify-center rounded-lg text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F3F4F6] hover:bg-[#F5F5F7] dark:hover:bg-[#374151] transition-colors duration-200"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-base sm:text-[20px] font-semibold text-[#111827] dark:text-[#F3F4F6] mb-1">
            Unlock the full PRV AI experience
          </h2>
          <p className="text-xs sm:text-[14px] text-[#6B7280] dark:text-[#D1D5DB]">
            Sign in to unlock PRV V3.5 Earth, PRV 4.0 Light, PRV V1 Pro Max, PRV Cloud chat history, and more.
          </p>
        </div>

        {statusMessage ? (
          <div
            className={`mb-4 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-[14px] ${
              statusType === 'success'
                ? 'bg-[#ECFDF5] text-[#166534]'
                : 'bg-[#FEF2F2] text-[#991B1B]'
            }`}
          >
            {statusMessage}
          </div>
        ) : null}

        {/* Google button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading || !termsAccepted || !ageConfirmed}
          className="w-full flex items-center justify-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-[#2D3748] border border-[#E5E7EB] dark:border-[#374151] rounded-xl hover:bg-[#F9F9FB] dark:hover:bg-[#374151] hover:border-[#D1D5DB] dark:hover:border-[#4B5563] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-xs sm:text-[14px] text-[#374151] dark:text-[#D1D5DB] font-medium mb-3"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="hidden sm:inline">{isLoading ? 'Signing in...' : 'Continue with Google'}</span>
          <span className="sm:hidden">{isLoading ? 'Signing...' : 'Google'}</span>
        </button>

        {/* Divider */}
        <div className="relative mb-3">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#E5E7EB] dark:border-[#374151]" />
          </div>
          <div className="relative flex justify-center text-xs sm:text-[12px]">
            <span className="bg-white dark:bg-[#1F2937] px-2 text-[#9CA3AF] dark:text-[#6B7280]">or</span>
          </div>
        </div>

        {/* Email form */}
        <form onSubmit={handleEmailSubmit}>
          <div className="space-y-2">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#F9F9FB] dark:bg-[#2D3748] border border-[#E5E7EB] dark:border-[#374151] rounded-xl text-xs sm:text-[14px] text-[#374151] dark:text-[#D1D5DB] placeholder:text-[#9CA3AF] dark:placeholder:text-[#6B7280] focus:outline-none focus:border-[#4F46E5] dark:focus:border-[#6366F1] focus:shadow-[0_0_0_3px_rgba(79,70,229,0.15)] dark:focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              required
            />
            <button
              type="submit"
              disabled={isLoading || !email.trim() || !termsAccepted || !ageConfirmed}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#4F46E5] hover:bg-[#4338CA] disabled:bg-[#9CA3AF] text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-xs sm:text-[14px] font-medium"
            >
              {isLoading ? 'Signing in...' : 'Continue with Email'}
            </button>
          </div>
        </form>

        <div className="mt-4 space-y-3 rounded-xl border border-[#E5E7EB] bg-[#F9F9FB] p-3 dark:border-[#374151] dark:bg-[#2D3748]/60">
          <label className="flex items-start gap-2 text-[11px] leading-4 text-[#6B7280] dark:text-[#D1D5DB]">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(event) => setTermsAccepted(event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#4F46E5]"
            />
            <span>
              By continuing, you agree to PRV AI{' '}
              <button type="button" onClick={() => setPolicyView('terms')} className="font-semibold text-[#4F46E5] dark:text-[#8B9BFF] hover:underline">Terms and Conditions</button>{' '}
              and{' '}
              <button type="button" onClick={() => setPolicyView('privacy')} className="font-semibold text-[#4F46E5] dark:text-[#8B9BFF] hover:underline">Privacy Policy</button>.
            </span>
          </label>
          <label className="flex items-start gap-2 text-[11px] leading-4 text-[#6B7280] dark:text-[#D1D5DB]">
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(event) => setAgeConfirmed(event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#4F46E5]"
            />
            <span>I’m 13 years or older.</span>
          </label>
        </div>
      </div>

      {policyView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setPolicyView(null)}
          />
          <div className="relative z-10 w-full max-w-4xl mx-auto bg-white dark:bg-[#111827] rounded-[32px] shadow-[0_30px_90px_rgba(15,23,42,0.35)] p-8 overflow-hidden animate-fade-in">
            <button
              type="button"
              onClick={() => setPolicyView(null)}
              className="absolute right-5 top-5 w-10 h-10 rounded-xl bg-[#F3F4F6] dark:bg-[#1F2937] text-[#374151] dark:text-[#D1D5DB] hover:bg-[#E5E7EB] dark:hover:bg-[#2D3748] flex items-center justify-center transition-colors duration-200"
              aria-label="Close policy"
            >
              <X size={18} />
            </button>

            <div className="max-h-[75vh] overflow-y-auto pr-1">
              <div className="mb-6">
                <p className="text-[12px] text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-[0.24em] font-semibold">
                  {policyView === 'terms' ? 'Terms and Conditions' : 'Privacy Policy'}
                </p>
                <h2 className="text-[24px] font-semibold text-[#111827] dark:text-[#F3F4F6] mt-3">
                  {policyView === 'terms' ? 'Terms and Conditions' : 'Privacy Policy'}
                </h2>
              </div>

              <PolicyDocument type={policyView} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
