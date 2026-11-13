import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { AVAILABLE_MODELS } from '@/types/chat';
import { PlansUpgrade } from '@/components/PlansUpgrade';

interface SettingsProps {
  onBack: () => void;
}

export function Settings({ onBack }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<'about' | 'models' | 'data' | 'plans'>(() => (
    new URLSearchParams(window.location.search).get('tab') === 'plans' ? 'plans' : 'about'
  ));
  const [allowDataSharing, setAllowDataSharing] = useLocalStorage('prv_allow_data_sharing', true);
  const [showChatHistoryInfo, setShowChatHistoryInfo] = useState(false);
  const { user, logout, refreshUser } = useAuth();

  const handleLogout = async () => {
    await logout();
    onBack();
  };

  return (
    <div className="flex h-[100dvh] w-full max-w-full flex-col overflow-hidden bg-[#faf7ef] dark:bg-[#1b1a15] md:flex-row">
      {/* Header */}
      <header className="mobile-settings-header fixed left-0 right-0 top-0 z-30 flex h-12 items-center border-b border-[#e7decc] bg-[#faf7ef]/95 px-3 backdrop-blur-sm sm:h-14 sm:px-4 dark:border-[#39372c] dark:bg-[#222119]/95">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#6B7280] dark:text-[#bcb39d] hover:text-[#111827] dark:hover:text-[#f3eddf] transition-colors duration-200"
        >
          <ChevronLeft size={20} />
          <span className="text-xs sm:text-[14px] font-medium">Back</span>
        </button>
      </header>

      {/* Main content */}
      <div className="mobile-settings-main flex min-h-0 flex-1 flex-col overflow-hidden pt-12 sm:pt-14 md:flex-row">
        {/* Left sidebar - Tab buttons for mobile, vertical nav for desktop */}
        <div className="shrink-0 overflow-x-auto border-b border-[#e5dac3] bg-[#f3eddf] dark:border-[#39372c] dark:bg-[#222119] md:w-56 md:overflow-x-visible md:border-b-0 md:border-r">
          <nav className="flex md:flex-col flex-1 md:flex-none px-2 md:px-3 py-2 md:py-4 space-y-0 md:space-y-1 md:gap-0">
            <button
              onClick={() => setActiveTab('about')}
              className={`flex-1 md:flex-none whitespace-nowrap md:whitespace-normal flex items-center justify-center md:justify-start gap-0 md:gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-lg text-xs md:text-[14px] font-medium transition-colors duration-200 ${
                activeTab === 'about'
                  ? 'bg-[#e8ebe4] dark:bg-[#38362a] text-[#20231f] dark:text-[#f3eddf]'
                  : 'text-[#6B7280] dark:text-[#bcb39d] hover:text-[#111827] dark:hover:text-[#f3eddf] hover:bg-[#F9F9FB] dark:hover:bg-[#37352b]'
              }`}
            >
              <span className="hidden sm:inline">About Me</span>
              <span className="sm:hidden">About</span>
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`flex-1 md:flex-none whitespace-nowrap md:whitespace-normal flex items-center justify-center md:justify-start gap-0 md:gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-lg text-xs md:text-[14px] font-medium transition-colors duration-200 ${
                activeTab === 'plans'
                  ? 'bg-[#e8ebe4] dark:bg-[#38362a] text-[#20231f] dark:text-[#f3eddf]'
                  : 'text-[#6B7280] dark:text-[#bcb39d] hover:text-[#111827] dark:hover:text-[#f3eddf] hover:bg-[#F9F9FB] dark:hover:bg-[#37352b]'
              }`}
            >
              Plans
            </button>
            <button
              onClick={() => setActiveTab('models')}
              className={`flex-1 md:flex-none whitespace-nowrap md:whitespace-normal flex items-center justify-center md:justify-start gap-0 md:gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-lg text-xs md:text-[14px] font-medium transition-colors duration-200 ${
                activeTab === 'models'
                  ? 'bg-[#e8ebe4] dark:bg-[#38362a] text-[#20231f] dark:text-[#f3eddf]'
                  : 'text-[#6B7280] dark:text-[#bcb39d] hover:text-[#111827] dark:hover:text-[#f3eddf] hover:bg-[#F9F9FB] dark:hover:bg-[#37352b]'
              }`}
            >
              Models
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`flex-1 md:flex-none whitespace-nowrap md:whitespace-normal flex items-center justify-center md:justify-start gap-0 md:gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-lg text-xs md:text-[14px] font-medium transition-colors duration-200 ${
                activeTab === 'data'
                  ? 'bg-[#e8ebe4] dark:bg-[#38362a] text-[#20231f] dark:text-[#f3eddf]'
                  : 'text-[#6B7280] dark:text-[#bcb39d] hover:text-[#111827] dark:hover:text-[#f3eddf] hover:bg-[#F9F9FB] dark:hover:bg-[#37352b]'
              }`}
            >
              <span className="hidden sm:inline">Data and Privacy</span>
              <span className="sm:hidden">Data</span>
            </button>
          </nav>
        </div>

        {/* Right content pane */}
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          {activeTab === 'plans' ? (
            <PlansUpgrade user={user} refreshUser={refreshUser} />
          ) : activeTab === 'about' ? (
            // About Me View
            <div className="max-w-2xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8">
              <h1 className="premium-heading text-lg sm:text-xl md:text-[28px] text-[#111827] dark:text-[#f3eddf] mb-6 md:mb-8">
                About Me
              </h1>

              {user ? (
                <div className="space-y-6 md:space-y-8">
                  {/* Profile Picture */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#35483a] flex items-center justify-center text-white text-2xl sm:text-[32px] font-semibold">
                      {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="space-y-4 md:space-y-6">
                    <div>
                      <label className="block text-xs sm:text-[12px] font-medium text-[#6B7280] dark:text-[#bcb39d] uppercase tracking-wide mb-2">
                        Name
                      </label>
                      <p className="text-sm sm:text-[16px] font-semibold text-[#111827] dark:text-[#f3eddf]">
                        {user.name || 'Not set'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-[12px] font-medium text-[#6B7280] dark:text-[#bcb39d] uppercase tracking-wide mb-2">
                        Email
                      </label>
                      <p className="text-[14px] text-[#6B7280] dark:text-[#e0d9c8]">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Log Out Button */}
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-lg font-medium transition-colors duration-200 mt-8"
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-[14px] text-[#6B7280] dark:text-[#bcb39d]">
                    Please log in to view your profile
                  </p>
                </div>
              )}
            </div>
          ) : activeTab === 'models' ? (
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
              <div className="mb-8 rounded-2xl border border-[#e7e4dc] bg-white p-6 dark:border-[#62583e]/50 dark:bg-[#24231d]">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#687c68] dark:text-[#d5c49d]">PRV model catalog</p>
                <h1 className="premium-heading text-2xl font-medium tracking-tight text-[#20231f] dark:text-[#f3eddf] sm:text-3xl">Choose the right pace.</h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#74766f] dark:text-[#d0c7b3]">Compare the available models and pick the one that fits the work in front of you.</p>
              </div>

              <div className="space-y-4">
                {AVAILABLE_MODELS.map((model) => (
                  <div key={model.id} className="rounded-2xl border border-[#e7e4dc] bg-white p-5 transition-shadow hover:shadow-md dark:border-[#454235] dark:bg-[#24231d] sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="mb-2 flex items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:bg-[#302f25] dark:text-[#d0c7b3]">{model.group}</span>
                          {model.badge && <span className="rounded-full bg-[#edf0e9] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#536653] dark:bg-[#bda76b]/15 dark:text-[#c4b484]">{model.badge}</span>}
                        </div>
                        <h3 className="text-lg font-semibold text-slate-950 dark:text-[#f3eddf]">{model.name}</h3>
                      </div>
                    </div>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-[#d0c7b3]">{model.description}</p>
                    <p className="mt-4 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-500 dark:border-[#3b392e] dark:text-[#bcb39d]">
                      {model.id === 'prv-v3.2-fire' && 'The ignition point of the V3 frontier: rapid, lively, and built to turn a blank page into momentum.'}
                      {model.id === 'prv-v3.5-earth' && 'The grounded titan of the V3 series: deliberate, durable, and engineered for demanding reasoning and creation.'}
                      {model.id === 'prv-v4-light' && 'PRV 4.0 Lightning brings a bright beta glimpse of the next horizon: capable, agile, and tuned for effortless everyday intelligence.'}
                      {model.id === 'prv-v1-flash' && 'The original quick-response PRV engine for clear answers and everyday flow.'}
                      {model.id === 'prv-v1-pro' && 'The legacy powerhouse for dense reasoning and complex tasks.'}
                      {model.id === 'prv-v1.5-beta' && 'The dependable legacy baseline: efficient, balanced, and easy to reach for.'}
                      {model.id === 'opal-o1-flash' && 'Opal O1 Flash is a fast, lightweight coding model for quick edits and rapid build iterations. It is available in Kite Studio and cannot be selected in PRV chat.'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'data' ? (
            <div className="max-w-2xl mx-auto px-8 py-8">
              <h1 className="premium-heading text-[28px] text-[#111827] dark:text-[#f3eddf] mb-8">
                Data and Privacy
              </h1>

              <div className="space-y-6">
                <div className="border border-[#E5E7EB] dark:border-[#454235] rounded-xl p-6 bg-white dark:bg-[#2b2921]">
                  <p className="text-[14px] text-[#6B7280] dark:text-[#e0d9c8] mb-6 leading-relaxed">
                    Your data is used to operate PRV AI and improve our models. PRV AI does not show targeted ads and does not sell your data.
                  </p>

                  {/* Toggle Option */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-[#F9F9FB] dark:bg-[#37352b] border border-[#E5E7EB] dark:border-[#454235]">
                    <div className="flex-1">
                      <h3 className="text-[14px] font-medium text-[#111827] dark:text-[#f3eddf] mb-1">
                        Help improve PRV AI automatically
                      </h3>
                      <p className="text-[13px] text-[#6B7280] dark:text-[#bcb39d]">
                        Automated systems may use conversation signals to improve model quality. PRV Team does not routinely review or read your chats.
                      </p>
                    </div>
                    <button
                      onClick={() => setAllowDataSharing(!allowDataSharing)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 shrink-0 ml-4 ${
                        allowDataSharing
                          ? 'bg-[#536653] dark:bg-[#9b8b65]'
                          : 'bg-[#D1D5DB] dark:bg-[#625c49]'
                      }`}
                      role="switch"
                      aria-checked={allowDataSharing}
                    >
                      <span
                        className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-200 ${
                          allowDataSharing ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Warning text */}
                  <div className="mt-6 pt-6 border-t border-[#E5E7EB] dark:border-[#454235]">
                    <p className="text-[13px] text-[#6B7280] dark:text-[#bcb39d] flex items-start gap-2">
                      <span className="text-[#EF4444] font-semibold mt-0.5">⚠</span>
                      <span>Do not share personal information in your conversations. Avoid including passwords, API keys, credit card numbers, or other sensitive data.</span>
                    </p>
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={() => setShowChatHistoryInfo(!showChatHistoryInfo)}
                      className="w-full text-left px-4 py-3 rounded-lg border border-[#E5E7EB] dark:border-[#454235] bg-[#F9F9FB] dark:bg-[#37352b] text-[#111827] dark:text-[#f3eddf] font-medium hover:bg-[#F3F4F6] dark:hover:bg-[#37352b] transition-colors duration-200"
                    >
                      See how your chats history are stored
                    </button>
                    {showChatHistoryInfo ? (
                      <p className="mt-4 text-[14px] text-[#6B7280] dark:text-[#e0d9c8] leading-relaxed">
                        When you are signed in, your text-only chat history is stored securely in PRV Cloud and tied to your account, so it is available across supported browsers and devices. Guest and incognito chats are temporary.
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-6 p-4 rounded-xl bg-[#F3F4F6] dark:bg-[#24231d] border border-[#E5E7EB] dark:border-[#454235] text-[13px] text-[#374151] dark:text-[#e0d9c8] leading-relaxed">
                    <p>
                      PRV Cloud stores text-only conversation history for signed-in accounts. Automated safety systems may process chats to detect abuse or harmful content. We do not sell your data or use it for targeted advertising.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
