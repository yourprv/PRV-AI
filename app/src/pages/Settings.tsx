import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { AVAILABLE_MODELS } from '@/types/chat';

interface SettingsProps {
  onBack: () => void;
}

export function Settings({ onBack }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<'about' | 'models' | 'data'>('about');
  const [allowDataSharing, setAllowDataSharing] = useLocalStorage('prv_allow_data_sharing', true);
  const [showChatHistoryInfo, setShowChatHistoryInfo] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    onBack();
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-white dark:bg-[#111827]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-12 sm:h-14 flex items-center px-3 sm:px-4 border-b border-[#E5E7EB] dark:border-[#374151] bg-white/80 dark:bg-[#1F2937]/80 backdrop-blur-sm z-30">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F3F4F6] transition-colors duration-200"
        >
          <ChevronLeft size={20} />
          <span className="text-xs sm:text-[14px] font-medium">Back</span>
        </button>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col md:flex-row pt-12 overflow-hidden">
        {/* Left sidebar - Tab buttons for mobile, vertical nav for desktop */}
        <div className="md:w-56 border-b md:border-b-0 md:border-r border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#1F2937] flex md:flex-col shrink-0 overflow-x-auto md:overflow-x-visible">
          <nav className="flex md:flex-col flex-1 md:flex-none px-2 md:px-3 py-2 md:py-4 space-y-0 md:space-y-1 md:gap-0">
            <button
              onClick={() => setActiveTab('about')}
              className={`flex-1 md:flex-none whitespace-nowrap md:whitespace-normal flex items-center justify-center md:justify-start gap-0 md:gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-lg text-xs md:text-[14px] font-medium transition-colors duration-200 ${
                activeTab === 'about'
                  ? 'bg-[#F5F5F7] dark:bg-[#374151] text-[#111827] dark:text-[#F3F4F6]'
                  : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F3F4F6] hover:bg-[#F9F9FB] dark:hover:bg-[#2D3748]'
              }`}
            >
              <span className="hidden sm:inline">About Me</span>
              <span className="sm:hidden">About</span>
            </button>
            <button
              onClick={() => setActiveTab('models')}
              className={`flex-1 md:flex-none whitespace-nowrap md:whitespace-normal flex items-center justify-center md:justify-start gap-0 md:gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-lg text-xs md:text-[14px] font-medium transition-colors duration-200 ${
                activeTab === 'models'
                  ? 'bg-[#F5F5F7] dark:bg-[#374151] text-[#111827] dark:text-[#F3F4F6]'
                  : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F3F4F6] hover:bg-[#F9F9FB] dark:hover:bg-[#2D3748]'
              }`}
            >
              Models
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`flex-1 md:flex-none whitespace-nowrap md:whitespace-normal flex items-center justify-center md:justify-start gap-0 md:gap-3 px-2 md:px-3 py-2 md:py-2.5 rounded-lg text-xs md:text-[14px] font-medium transition-colors duration-200 ${
                activeTab === 'data'
                  ? 'bg-[#F5F5F7] dark:bg-[#374151] text-[#111827] dark:text-[#F3F4F6]'
                  : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F3F4F6] hover:bg-[#F9F9FB] dark:hover:bg-[#2D3748]'
              }`}
            >
              <span className="hidden sm:inline">Data and Privacy</span>
              <span className="sm:hidden">Data</span>
            </button>
          </nav>
        </div>

        {/* Right content pane */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'about' ? (
            // About Me View
            <div className="max-w-2xl mx-auto px-4 sm:px-6 md:px-8 py-6 md:py-8">
              <h1 className="text-lg sm:text-xl md:text-[28px] font-semibold text-[#111827] dark:text-[#F3F4F6] mb-6 md:mb-8">
                About Me
              </h1>

              {user ? (
                <div className="space-y-6 md:space-y-8">
                  {/* Profile Picture */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center text-white text-2xl sm:text-[32px] font-semibold shadow-lg">
                      {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="space-y-4 md:space-y-6">
                    <div>
                      <label className="block text-xs sm:text-[12px] font-medium text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wide mb-2">
                        Name
                      </label>
                      <p className="text-sm sm:text-[16px] font-semibold text-[#111827] dark:text-[#F3F4F6]">
                        {user.name || 'Not set'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-[12px] font-medium text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wide mb-2">
                        Email
                      </label>
                      <p className="text-[14px] text-[#6B7280] dark:text-[#D1D5DB]">
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
                  <p className="text-[14px] text-[#6B7280] dark:text-[#9CA3AF]">
                    Please log in to view your profile
                  </p>
                </div>
              )}
            </div>
          ) : activeTab === 'models' ? (
            <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
              <div className="mb-8 rounded-3xl border border-violet-200/80 bg-gradient-to-br from-violet-50 via-white to-sky-50 p-6 dark:border-violet-400/20 dark:from-violet-950/40 dark:via-slate-900 dark:to-sky-950/30">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">PRV model catalog</p>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">The next-generation frontier.</h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">PRV V3 is our boldest leap yet: faster instincts, deeper reasoning, and a sharper sense of momentum. Choose the engine that matches the way you think.</p>
              </div>

              <div className="space-y-4">
                {AVAILABLE_MODELS.map((model) => (
                  <div key={model.id} className="rounded-2xl border border-slate-200/80 bg-white p-5 transition-shadow hover:shadow-lg dark:border-slate-700 dark:bg-slate-900 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="mb-2 flex items-center gap-2">
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 dark:bg-slate-800 dark:text-slate-300">{model.group}</span>
                          {model.badge && <span className="rounded-full bg-sky-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-sky-600 dark:bg-sky-400/15 dark:text-sky-300">{model.badge}</span>}
                        </div>
                        <h3 className="text-lg font-semibold text-slate-950 dark:text-white">{model.name}</h3>
                      </div>
                      <span className="rounded-full border border-slate-200 px-3 py-1 text-[11px] text-slate-500 dark:border-slate-700 dark:text-slate-400">{model.api}</span>
                    </div>
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">{model.description}</p>
                    <p className="mt-4 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-500 dark:border-slate-800 dark:text-slate-400">
                      {model.id === 'prv-v3.2-fire' && 'The ignition point of the V3 frontier: rapid, lively, and built to turn a blank page into momentum.'}
                      {model.id === 'prv-v3.5-earth' && 'The grounded titan of the V3 series: deliberate, durable, and engineered for demanding reasoning and creation.'}
                      {model.id === 'prv-v4-light' && 'A bright beta glimpse at the next horizon: capable, agile, and tuned for effortless everyday intelligence.'}
                      {model.id === 'prv-v1-flash' && 'The original quick-response PRV engine for clear answers and everyday flow.'}
                      {model.id === 'prv-v1-pro' && 'The legacy powerhouse for dense reasoning and complex tasks.'}
                      {model.id === 'prv-v1.5-beta' && 'The dependable legacy baseline: efficient, balanced, and easy to reach for.'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'data' ? (
            <div className="max-w-2xl mx-auto px-8 py-8">
              <h1 className="text-[28px] font-semibold text-[#111827] dark:text-[#F3F4F6] mb-8">
                Data and Privacy
              </h1>

              <div className="space-y-6">
                <div className="border border-[#E5E7EB] dark:border-[#374151] rounded-xl p-6 bg-white dark:bg-[#1F2937]">
                  <p className="text-[14px] text-[#6B7280] dark:text-[#D1D5DB] mb-6 leading-relaxed">
                    Your data might be shared with AI providers to improve our models and services. You can control this preference below.
                  </p>

                  {/* Toggle Option */}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-[#F9F9FB] dark:bg-[#2D3748] border border-[#E5E7EB] dark:border-[#374151]">
                    <div className="flex-1">
                      <h3 className="text-[14px] font-medium text-[#111827] dark:text-[#F3F4F6] mb-1">
                        Share Data with PRV Team
                      </h3>
                      <p className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF]">
                        Enable automated system diagnostics and feedback loops to optimize response generation metrics.
                      </p>
                    </div>
                    <button
                      onClick={() => setAllowDataSharing(!allowDataSharing)}
                      className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 shrink-0 ml-4 ${
                        allowDataSharing
                          ? 'bg-[#4F46E5] dark:bg-[#818CF8]'
                          : 'bg-[#D1D5DB] dark:bg-[#6B7280]'
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
                  <div className="mt-6 pt-6 border-t border-[#E5E7EB] dark:border-[#374151]">
                    <p className="text-[13px] text-[#6B7280] dark:text-[#9CA3AF] flex items-start gap-2">
                      <span className="text-[#EF4444] font-semibold mt-0.5">⚠</span>
                      <span>Do not share personal information in your conversations. Avoid including passwords, API keys, credit card numbers, or other sensitive data.</span>
                    </p>
                  </div>

                  <div className="mt-6">
                    <button
                      onClick={() => setShowChatHistoryInfo(!showChatHistoryInfo)}
                      className="w-full text-left px-4 py-3 rounded-lg border border-[#E5E7EB] dark:border-[#374151] bg-[#F9F9FB] dark:bg-[#2D3748] text-[#111827] dark:text-[#F3F4F6] font-medium hover:bg-[#F3F4F6] dark:hover:bg-[#334155] transition-colors duration-200"
                    >
                      See how your chats history are stored
                    </button>
                    {showChatHistoryInfo ? (
                      <p className="mt-4 text-[14px] text-[#6B7280] dark:text-[#D1D5DB] leading-relaxed">
                        Your chat history is stored entirely within your browser&apos;s local storage. PRV AI does not host cloud-based databases for conversation backups, meaning your chat history will not sync across different devices or browsers.
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-6 p-4 rounded-xl bg-[#F3F4F6] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] text-[13px] text-[#374151] dark:text-[#D1D5DB] leading-relaxed">
                    <p>
                      To maintain operational connectivity with frontier model networks, session data processing is managed in accordance with upstream AI infrastructure frameworks. System-level data handling and transmission rules default strictly to the external provider’s standard terms of service. Users may review the respective third-party documentation for a full breakdown of platform privacy schedules.
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
