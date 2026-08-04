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
            Terms and Conditions
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
                  {policyView === 'terms' ? 'Terms and Conditions' : 'Privacy Policy'}
                </p>
                <h2 className="text-[24px] font-semibold text-[#111827] dark:text-[#F3F4F6] mt-3">
                  {policyView === 'terms' ? 'Terms and Conditions' : 'Privacy Policy'}
                </h2>
              </div>

              {policyView === 'terms' ? (
                <div className="space-y-5 text-sm leading-7 text-[#374151] dark:text-[#D1D5DB]">
                  <p>
                    Welcome to PRV AI. By using the service, you agree to these Terms and Conditions. PRV AI provides AI-assisted tools, model experiences, and PRV Cloud chat storage. We may update these terms when the service, safety standards, or applicable law changes.
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
                      PRV AI includes model experiences such as PRV V3.2 Fire, PRV V3.5 Earth, PRV 4.0 Light, PRV V1 Pro Max, and other PRV engines. Model names describe product experiences and do not guarantee a particular result. Outputs can be inaccurate, incomplete, or unsuitable for high-stakes decisions.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-[16px] font-semibold text-[#111827] dark:text-[#F3F4F6]">
                      6. Chat Storage and Deletion
                    </h3>
                    <p>
                      When you are signed in, your text-only chat history is stored in <strong>PRV Cloud</strong> and tied to your account. Guest and incognito chats are temporary and are not saved to PRV Cloud.
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>You can access signed-in chats from supported browsers and devices.</li>
                      <li>You can delete individual chats from the PRV AI interface.</li>
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
                      Your messages may be processed by automated systems to provide responses, operate safety controls, and improve PRV models. PRV Team does not routinely review or read your chats.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-[16px] font-semibold text-[#111827] dark:text-[#F3F4F6]">
                      9. Termination of Access
                    </h3>
                    <p>
                      Automated safety systems may flag content that appears harmful, illegal, abusive, or intended to facilitate wrongdoing. PRV AI may suspend or permanently ban accounts when harmful behavior or serious violations are detected. Appeals may be sent to <strong>yourprvdeveloper@proton.me</strong>.
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
                    This Privacy Policy explains how PRV AI handles information when you use the service. We aim to keep collection focused, transparent, and limited to operating PRV AI, protecting users, and improving our models.
                  </p>

                  <p>
                    By using PRV AI, you consent to the practices described below.
                  </p>

                  <div className="space-y-3">
                    <h3 className="text-[16px] font-semibold text-[#111827] dark:text-[#F3F4F6]">
                      1. Information Collected
                    </h3>
                    <p>
                      PRV AI may process the following information:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li><strong>Account Information:</strong> Your email address (if provided during setup or inquiry).</li>
                      <li><strong>Conversation Logs:</strong> The text inputs, prompts, and subsequent text outputs generated during your active session.</li>
                      <li><strong>Technical Information:</strong> Basic device, browser, security, and diagnostic information needed to operate and protect the service.</li>
                      <li><strong>Sensitive Data:</strong> PRV AI does not intentionally collect, store, or request health, financial, biometric, or legally sensitive data. Please do not input highly confidential information into the chat window.</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-[16px] font-semibold text-[#111827] dark:text-[#F3F4F6]">
                      2. How Data Is Used
                    </h3>
                    <p>
                      We use information only for service-related purposes:
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Providing real-time conversational responses and ensuring smooth client-side interface rendering.</li>
                      <li>Improving PRV models, reliability, safety, and the user experience through automated analysis.</li>
                      <li><strong>No targeted ads or data sales:</strong> PRV AI does not show targeted advertising and does not sell your personal information or chat data.</li>
                      <li><strong>No routine human reading:</strong> PRV Team does not routinely review or read your chats. Automated safety systems may flag content for enforcement.</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-[16px] font-semibold text-[#111827] dark:text-[#F3F4F6]">
                      3. Local Data Architecture and Deletion Rights
                    </h3>
                    <p>
                      Signed-in text-only conversation history is saved in <strong>PRV Cloud</strong> and associated with your account. Guest and incognito conversations are temporary.
                    </p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>You can access signed-in history across supported devices and browsers.</li>
                      <li>You can delete chats from the interface; deletion may take a short time to complete across backups and systems.</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-[16px] font-semibold text-[#111827] dark:text-[#F3F4F6]">
                      4. Upstream Network Processing and Infrastructure Sync
                    </h3>
                    <p>
                      Generating a response requires your message to be processed by PRV AI’s automated computing systems and safety controls.
                    </p>
                    <p>
                      Messages may pass through infrastructure providers that help PRV AI deliver responses, maintain availability, and protect the service.
                    </p>
                    <p>
                      PRV AI does not sell your data or use your chats for targeted advertising. Automated processing may use eligible chat data to improve PRV models, response quality, and safety. PRV Team does not routinely read individual conversations.
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
                      You can access and delete your signed-in chats through the PRV AI interface. You may also contact us about account or privacy questions at <strong>yourprvdeveloper@proton.me</strong>.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-[16px] font-semibold text-[#111827] dark:text-[#F3F4F6]">
                      7. Cookies and Tracking
                    </h3>
                    <p>
                      PRV AI uses necessary storage and session technologies for authentication, preferences, security, and core functionality. We do not use your chats to serve targeted ads.
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
                      For privacy questions, deletion requests, or policy concerns, contact: <strong>yourprvdeveloper@proton.me</strong>
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
