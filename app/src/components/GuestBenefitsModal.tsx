import { X, Sparkles, ShieldCheck, Search, MessagesSquare } from 'lucide-react';

interface GuestBenefitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: () => void;
}

export function GuestBenefitsModal({ isOpen, onClose, onSignIn }: GuestBenefitsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/55 px-4 py-6 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-[28px] border border-[#E5E7EB] bg-white p-6 shadow-[0_20px_70px_rgba(15,23,42,0.25)] dark:border-[#374151] dark:bg-[#111827]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#111827] dark:text-[#9CA3AF] dark:hover:bg-[#1F2937] dark:hover:text-[#F3F4F6]"
          aria-label="Close benefits dialog"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 text-[#4F46E5] dark:text-[#818CF8]">
          <Sparkles size={18} />
          <span className="text-sm font-semibold uppercase tracking-[0.24em]">Guest mode</span>
        </div>

        <h2 className="mt-4 text-xl font-semibold text-[#111827] dark:text-[#F3F4F6]">
          Sign in for more from PRV AI
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#4B5563] dark:text-[#D1D5DB]">
          You can continue using PRV V1 Pro right now. Sign in to unlock richer features and keep the experience more powerful.
        </p>

        <div className="mt-5 space-y-3 text-sm text-[#374151] dark:text-[#E5E7EB]">
          <div className="flex items-start gap-3 rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-3 dark:border-[#374151] dark:bg-[#1F2937]">
            <ShieldCheck className="mt-0.5 shrink-0 text-[#4F46E5] dark:text-[#818CF8]" size={18} />
            <div>
              <div className="font-medium">Full model access</div>
              <p className="mt-1 text-xs text-[#6B7280] dark:text-[#9CA3AF]">Use PRV V1 Pro Max and Base when you sign in.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-3 dark:border-[#374151] dark:bg-[#1F2937]">
            <Search className="mt-0.5 shrink-0 text-[#4F46E5] dark:text-[#818CF8]" size={18} />
            <div>
              <div className="font-medium">Web search</div>
              <p className="mt-1 text-xs text-[#6B7280] dark:text-[#9CA3AF]">Bring live web results into your next prompt.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-3 dark:border-[#374151] dark:bg-[#1F2937]">
            <MessagesSquare className="mt-0.5 shrink-0 text-[#4F46E5] dark:text-[#818CF8]" size={18} />
            <div>
              <div className="font-medium">Saved history and shareable chats</div>
              <p className="mt-1 text-xs text-[#6B7280] dark:text-[#9CA3AF]">Keep your conversations and access them later.</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full border border-[#D1D5DB] px-4 py-2.5 text-sm font-medium text-[#374151] transition-colors hover:bg-[#F5F5F7] dark:border-[#4B5563] dark:text-[#D1D5DB] dark:hover:bg-[#1F2937]"
          >
            Continue as guest
          </button>
          <button
            type="button"
            onClick={onSignIn}
            className="inline-flex items-center justify-center rounded-full bg-[#4F46E5] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#4338CA]"
          >
            Sign in / Sign up
          </button>
        </div>
      </div>
    </div>
  );
}
