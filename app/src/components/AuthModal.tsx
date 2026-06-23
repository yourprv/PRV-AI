import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

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

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setStatusMessage(null);
      setStatusType(null);
    }
  }, [isOpen]);

  const handleGoogleSignIn = async () => {
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
            Please log in to continue
          </h2>
          <p className="text-xs sm:text-[14px] text-[#6B7280] dark:text-[#D1D5DB]">
            Sign in to access PRV AI chat and your personalized settings.
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
          disabled={isLoading}
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
              disabled={isLoading || !email.trim()}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#4F46E5] hover:bg-[#4338CA] disabled:bg-[#9CA3AF] text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-xs sm:text-[14px] font-medium"
            >
              {isLoading ? 'Signing in...' : 'Continue with Email'}
            </button>
          </div>
        </form>

        {/* Footer text */}
        <p className="text-center text-[11px] sm:text-[12px] text-[#9CA3AF] dark:text-[#6B7280] mt-4">
          By continuing, you agree to our{' '}
          <button
            type="button"
            onClick={() => setPolicyView('terms')}
            className="font-semibold text-[#4F46E5] dark:text-[#8B9BFF] hover:underline"
          >
            Terms of Service
          </button>{' '}
          and{' '}
          <button
            type="button"
            onClick={() => setPolicyView('privacy')}
            className="font-semibold text-[#4F46E5] dark:text-[#8B9BFF] hover:underline"
          >
            Privacy Policy
          </button>.
        </p>
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
                  {policyView === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
                </p>
                <h2 className="text-[24px] font-semibold text-[#111827] dark:text-[#F3F4F6] mt-3">
                  {policyView === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
                </h2>
              </div>

              {policyView === 'terms' ? (
                <div className="space-y-5 text-sm leading-7 text-[#374151] dark:text-[#D1D5DB]">
                  <p>
                    Welcome to PRV AI. By using our website and chatbot, you agree to these Terms and Conditions. This is a binding agreement between you and <strong>yourprv</strong> ("the Developer"). If you do not agree to these terms, please do not use the service. We reserve the right to update these terms at any time without notice.
                  </p>

                  <div className="space-y-3">
                    <h3 className="text-[16px] font-semibold text-[#111827] dark:text-[#F3F4F6]">
                      1. Acceptance and Eligibility
                    </h3>
                    <p>
                      By accessing PRV AI, you agree to follow these terms and all applicable laws of Nepal, including the <strong>Electronic Transactions Act, 2063 (2068)</strong> and the right to privacy guaranteed under <strong>Article 28 of the Constitution of Nepal</strong>.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-[16px] font-semibold text-[#111827] dark:text-[#F3F4F6]">
                      2. User Obligations and Conduct
                    </h3>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>You must provide accurate information when using our platform.</li>
                      <li>You are completely responsible for your conversations and interactions with the chatbot.</li>
                      <li>You are strictly prohibited from using the chatbot for illegal activities, cyberbullying, spreading malicious software, or violating the prevailing laws of Nepal.</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-[16px] font-semibold text-[#111827] dark:text-[#F3F4F6]">
                      3. Indemnity (User Liability)
                    </h3>
                    <p>
                      If your misuse of the chatbot, illegal behavior, or violation of these terms causes any legal trouble, lawsuits, or financial loss for the Developer, <strong>you will be held fully responsible for all resulting costs, damages, and legal expenses.</strong>
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-[16px] font-semibold text-[#111827] dark:text-[#F3F4F6]">
                      4. Intellectual Property and Content Ownership
                    </h3>
                    <p>
                      The core engine and response outputs of this platform are highly fine-tuned by the PRV AI team. You are granted a license to read and interact with the text, but you do not own the underlying generated datasets or system content. You may not claim exclusive ownership over the generated content.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-[16px] font-semibold text-[#111827] dark:text-[#F3F4F6]">
                      5. Underlying Technology Network
                    </h3>
                    <p>
                      PRV AI operates a custom, multi-tier intelligence system utilizing fine-tuned parameter weights. To process complex language calculations efficiently, our system relies on advanced, open-source decentralized infrastructure stacks. This setup includes the integration of local data-routing models known as the <strong>PRV V1 Pro</strong>, <strong>PRV 1.5 Base</strong>, and <strong>PRV V1 Pro Max</strong>, which are optimized using standard baseline architectures globally managed by Alphabet's open-access model distributions (including the Gemini 3.1 flash lite and Gemma 4 protocols). By using this service, you acknowledge that your prompt text flows through these background processing nodes to generate an accurate text response.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-[16px] font-semibold text-[#111827] dark:text-[#F3F4F6]">
                      6. Chat Storage and Deletion
                    </h3>
                    <p>
                      Your chat history is saved <strong>locally on your own device's browser cache</strong>. We do not store your chat logs on a centralized cloud database. Because of this local design:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Changing your phone or computer will result in a blank chat history.</li>
                      <li>Clearing your browser cookies or cache will <strong>permanently delete</strong> your entire chat history. We cannot recover it for you.</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-[16px] font-semibold text-[#111827] dark:text-[#F3F4F6]">
                      7. Limitation of Liability
                    </h3>
                    <p>
                      PRV AI is provided to you on an <strong>"as is"</strong> and <strong>"as available"</strong> basis. While we strive for accuracy, the chatbot can make mistakes or generate incorrect answers. The Developer is not liable for any errors, inaccuracies, or damages that happen because of your reliance on the chatbot's answers.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-[16px] font-semibold text-[#111827] dark:text-[#F3F4F6]">
                      8. Data Processing and Third Parties
                    </h3>
                    <p>
                      While your history is stored on your browser, the text you type must be sent to our background infrastructure providers (including Google's cloud system network) to analyze the words and return an answer. Please review our Privacy Policy to understand how your data is handled by these necessary technical systems.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-[16px] font-semibold text-[#111827] dark:text-[#F3F4F6]">
                      9. Termination of Access
                    </h3>
                    <p>
                      We reserve the right to block your IP address, suspend your account, or permanently deny you access to PRV AI at any time if we detect harmful behavior or a breach of these terms.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-[16px] font-semibold text-[#111827] dark:text-[#F3F4F6]">
                      10. Governing Law
                    </h3>
                    <p>
                      These terms are governed by and written in accordance with the laws of <strong>Nepal</strong>. Any legal disputes arising from the use of this service will fall strictly under the jurisdiction of the courts of Nepal.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-[16px] font-semibold text-[#111827] dark:text-[#F3F4F6]">
                      11. Contact Us
                    </h3>
                    <p>
                      If you have any questions, concerns, or legal inquiries regarding these terms, you can contact the developer directly at: <strong>yourprvdeveloper@proton.me</strong>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-5 text-sm leading-7 text-[#374151] dark:text-[#D1D5DB]">
                  <p>
                    Welcome to PRV AI. We are deeply committed to protecting your personal information and ensuring transparency in how data is processed within our ecosystem. This Privacy Policy outlines our data management, caching architectures, and transmission protocols in compliance with the prevailing laws of Nepal, including the right to privacy under <strong>Article 28 of the Constitution of Nepal</strong>.
                  </p>

                  <p>
                    By using PRV AI, you consent to the practices described below.
                  </p>

                  <div className="space-y-3">
                    <h3 className="text-[16px] font-semibold text-[#111827] dark:text-[#F3F4F6]">
                      1. Information Collected
                    </h3>
                    <p>
                      To maintain a streamlined application structure, PRV AI minimizes direct data harvesting:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><strong>Account Information:</strong> Your email address (if provided during setup or inquiry).</li>
                      <li><strong>Conversation Logs:</strong> The text inputs, prompts, and subsequent text outputs generated during your active session.</li>
                      <li><strong>Technical Identifiers:</strong> Basic browser metadata, language configurations, and device token properties necessary to render the user interface smoothly.</li>
                      <li><strong>Sensitive Data:</strong> PRV AI does not intentionally collect, store, or request health, financial, biometric, or legally sensitive data. Please do not input highly confidential information into the chat window.</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-[16px] font-semibold text-[#111827] dark:text-[#F3F4F6]">
                      2. How Data Is Used
                    </h3>
                    <p>
                      We utilize gathered parameters strictly for the following purposes:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Providing real-time conversational responses and ensuring smooth client-side interface rendering.</li>
                      <li>Optimizing localized software performance and fixing application bugs.</li>
                      <li><strong>Marketing & Analytics:</strong> We do not sell your personal information to third-party brokers, nor do we run targeted commercial advertising campaigns using your personal chat history.</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-[16px] font-semibold text-[#111827] dark:text-[#F3F4F6]">
                      3. Local Data Architecture and Deletion Rights
                    </h3>
                    <p>
                      Your main conversation files are saved <strong>locally inside your device’s browser storage (such as IndexedDB or LocalStorage)</strong>. We do not host your conversation history on centralized cloud database servers.
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Switching to a different computer or phone will result in a fresh, blank chat history.</li>
                      <li>Clearing your browser cache, clearing site cookies, or resetting your browser data will <strong>permanently and irreversibly destroy</strong> your chat history. The PRV AI team has no way to restore or recover this data for you.</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-[16px] font-semibold text-[#111827] dark:text-[#F3F4F6]">
                      4. Upstream Network Processing and Infrastructure Sync
                    </h3>
                    <p>
                      While your session history is cached directly inside your browser app, generating a response requires text to be processed through advanced computing systems. PRV AI operates on a decentralized, distributed network architecture utilizing fine-tuned parameter distributions.
                    </p>
                    <p>
                      Linguistic inputs and prompt packets flow through specialized, external global data infrastructure nodes managing primary token processing and matrix analysis algorithms—specifically those aligning with the Gemini 3.1 Flash Lite and Gemma 4 foundational network tiers managed at the parent-infrastructure level by Alphabet.
                    </p>
                    <p>
                      Consequently, raw prompt strings and contextual objects are securely routed to our upstream cloud computing providers (including Google LLC's backend API systems) to compute the language variables and send back a written answer. This processing runs in tandem with standard network security monitoring. For a deep, absolute understanding of how linguistic data is retained, monitored for abuse, or indexed during external API calls, <strong>users are strongly encouraged to independently read and cross-reference the Google AI Privacy Policy and its corresponding API Terms of Service.</strong>
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-[16px] font-semibold text-[#111827] dark:text-[#F3F4F6]">
                      5. Data Security
                    </h3>
                    <p>
                      We implement industry-standard encryption protocols to protect your data while it is moving between your browser and our upstream infrastructure nodes. However, please remember that no computer network or data transmission over the internet can be guaranteed 100% secure.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-[16px] font-semibold text-[#111827] dark:text-[#F3F4F6]">
                      6. User Rights
                    </h3>
                    <p>
                      You hold absolute control over your local data footprint. You may exercise your right to access, alter, or purge your conversational data simply by clearing your browser cache or manually wiping individual chat logs from the PRV AI user interface.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-[16px] font-semibold text-[#111827] dark:text-[#F3F4F6]">
                      7. Cookies and Tracking
                    </h3>
                    <p>
                      PRV AI utilizes necessary local browser caching tokens to remember your UI configurations (such as theme choice and session variables). We do not deploy intrusive third-party cross-site marketing trackers. You can adjust your browser settings to reject cookies, though doing so might cause specific interface features to stop loading correctly.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-[16px] font-semibold text-[#111827] dark:text-[#F3F4F6]">
                      8. Children’s Privacy
                    </h3>
                    <p>
                      PRV AI is strictly intended for individuals who are <strong>13 years of age or older</strong>. We do not knowingly allow individuals under the age of 13 to utilize the platform, nor do we intentionally process data from children under this threshold. If we discover that a user under 13 has provided personal data, we will wipe that local data profile immediately.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-[16px] font-semibold text-[#111827] dark:text-[#F3F4F6]">
                      9. Changes to This Privacy Policy
                    </h3>
                    <p>
                      The Developer reserves the right to update this policy documentation at any time to reflect software changes or legal updates in Nepal. Any major modifications will be actively flagged on this webpage with a revised effective date.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-[16px] font-semibold text-[#111827] dark:text-[#F3F4F6]">
                      10. Contact Information
                    </h3>
                    <p>
                      For any complaints, clarifications regarding local storage, or data infrastructure inquiries, you can reach the developer directly at: <strong>yourprvdeveloper@proton.me</strong>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
