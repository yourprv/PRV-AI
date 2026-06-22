import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLocalStorage } from '@/hooks/useLocalStorage';

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
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-[#111827]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-12 flex items-center px-4 border-b border-[#E5E7EB] dark:border-[#374151] bg-white/80 dark:bg-[#1F2937]/80 backdrop-blur-sm z-30">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F3F4F6] transition-colors duration-200"
        >
          <ChevronLeft size={20} />
          <span className="text-[14px] font-medium">Back</span>
        </button>
      </header>

      {/* Main content */}
      <div className="flex-1 flex pt-12 overflow-hidden">
        {/* Left sidebar */}
        <div className="w-56 border-r border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#1F2937] flex flex-col shrink-0">
          <nav className="flex-1 px-3 py-4 space-y-1">
            <button
              onClick={() => setActiveTab('about')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors duration-200 ${
                activeTab === 'about'
                  ? 'bg-[#F5F5F7] dark:bg-[#374151] text-[#111827] dark:text-[#F3F4F6]'
                  : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F3F4F6] hover:bg-[#F9F9FB] dark:hover:bg-[#2D3748]'
              }`}
            >
              About Me
            </button>
            <button
              onClick={() => setActiveTab('models')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors duration-200 ${
                activeTab === 'models'
                  ? 'bg-[#F5F5F7] dark:bg-[#374151] text-[#111827] dark:text-[#F3F4F6]'
                  : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F3F4F6] hover:bg-[#F9F9FB] dark:hover:bg-[#2D3748]'
              }`}
            >
              Models
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-medium transition-colors duration-200 ${
                activeTab === 'data'
                  ? 'bg-[#F5F5F7] dark:bg-[#374151] text-[#111827] dark:text-[#F3F4F6]'
                  : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F3F4F6] hover:bg-[#F9F9FB] dark:hover:bg-[#2D3748]'
              }`}
            >
              Data and Privacy
            </button>
          </nav>
        </div>

        {/* Right content pane */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'about' ? (
            // About Me View
            <div className="max-w-2xl mx-auto px-8 py-8">
              <h1 className="text-[28px] font-semibold text-[#111827] dark:text-[#F3F4F6] mb-8">
                About Me
              </h1>

              {user ? (
                <div className="space-y-8">
                  {/* Profile Picture */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center text-white text-[32px] font-semibold shadow-lg">
                      {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[12px] font-medium text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-wide mb-2">
                        Name
                      </label>
                      <p className="text-[16px] font-semibold text-[#111827] dark:text-[#F3F4F6]">
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
            <div className="max-w-4xl mx-auto px-8 py-8">
              <h1 className="text-[28px] font-semibold text-[#111827] dark:text-[#F3F4F6] mb-8">
                Models
              </h1>

              <div className="space-y-6">
                {/* PRV V1 Flash */}
                <div className="border border-[#E5E7EB] dark:border-[#374151] rounded-xl p-6 hover:shadow-lg dark:hover:shadow-[0_10px_15px_rgba(0,0,0,0.3)] transition-shadow duration-200 bg-white dark:bg-[#1F2937]">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-[16px] font-semibold text-[#111827] dark:text-[#F3F4F6]">
                        PRV V1 Pro
                      </h3>
                    </div>
                  </div>
                  <p className="text-[14px] text-[#6B7280] dark:text-[#D1D5DB] mb-4 leading-relaxed">
                    The ultimate balance between lightning-fast intelligence and pure speed in answers. Your shortcut to brilliance—blazing-fast responses without compromise.
                  </p>
                  <div className="mb-4">
                    <p className="text-[12px] font-medium text-[#111827] dark:text-[#F3F4F6] mb-2 uppercase tracking-wide">Supported File Types</p>
                    <div className="grid grid-cols-2 gap-3 text-[12px] text-[#6B7280] dark:text-[#9CA3AF]">
                      <div>
                        <span className="font-medium text-[#374151] dark:text-[#D1D5DB]">Documents:</span> PDF, TXT, CSV, JSON, HTML, Markdown
                      </div>
                      <div>
                        <span className="font-medium text-[#374151] dark:text-[#D1D5DB]">Images:</span> PNG, JPEG, WebP, HEIC, GIF
                      </div>
                      <div>
                        <span className="font-medium text-[#374151] dark:text-[#D1D5DB]">Audio:</span> MP3, WAV, AAC, FLAC, M4A, OPUS
                      </div>
                      <div>
                        <span className="font-medium text-[#374151] dark:text-[#D1D5DB]">Video:</span> MP4, MOV, WEBM, AVI, MPEG, WMV, 3GPP (up to 1 hour)
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 text-[13px] text-[#6B7280] dark:text-[#D1D5DB]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-[#111827] dark:text-[#F3F4F6]">1,048,576</span>
                      <span>Input Tokens</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-[#111827] dark:text-[#F3F4F6]">65,536</span>
                      <span>Output Tokens</span>
                    </div>
                  </div>
                </div>

                {/* PRV V1 Pro */}
                <div className="border border-[#E5E7EB] dark:border-[#374151] rounded-xl p-6 hover:shadow-lg dark:hover:shadow-[0_10px_15px_rgba(0,0,0,0.3)] transition-shadow duration-200 bg-white dark:bg-[#1F2937]">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-[16px] font-semibold text-[#111827] dark:text-[#F3F4F6]">
                        PRV V1 Pro Max
                      </h3>
                    </div>
                  </div>
                  <p className="text-[14px] text-[#6B7280] dark:text-[#D1D5DB] mb-4 leading-relaxed">
                    The full dense powerhouse with maximum AI index from the PRV family. Unleash pure capability for complex tasks—the most formidable mind in the V1 arsenal.
                  </p>
                  <div className="mb-4">
                    <p className="text-[12px] font-medium text-[#111827] dark:text-[#F3F4F6] mb-2 uppercase tracking-wide">Supported File Types</p>
                    <div className="space-y-2 text-[12px] text-[#6B7280] dark:text-[#9CA3AF]">
                      <div>
                        <span className="font-medium text-[#374151] dark:text-[#D1D5DB]">Text:</span> Plain text arrays (string). For PDF, CSV, JSON files, extract text using Python libraries (PyPDF, pandas) and inject into prompt.
                      </div>
                      <div>
                        <span className="font-medium text-[#374151] dark:text-[#D1D5DB]">Images:</span> Raw image pixel matrices. Processes natively via frameworks like Hugging Face transformers or vLLM.
                      </div>
                      <div>
                        <span className="font-medium text-[#374151] dark:text-[#D1D5DB]">Audio / Video:</span> Not supported. Audio encoder weights were omitted to optimize text and vision reasoning depth.
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 text-[13px] text-[#6B7280] dark:text-[#D1D5DB]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-[#111827] dark:text-[#F3F4F6]">262,144</span>
                      <span>Input Tokens</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-[#111827] dark:text-[#F3F4F6]">8,192</span>
                      <span>Output Tokens</span>
                    </div>
                  </div>
                </div>

                {/* PRV V1.5 beta */}
                <div className="border border-[#E5E7EB] dark:border-[#374151] rounded-xl p-6 hover:shadow-lg dark:hover:shadow-[0_10px_15px_rgba(0,0,0,0.3)] transition-shadow duration-200 bg-white dark:bg-[#1F2937]">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-[16px] font-semibold text-[#111827] dark:text-[#F3F4F6]">
                        PRV V1 Base
                      </h3>
                    </div>
                  </div>
                  <p className="text-[14px] text-[#6B7280] dark:text-[#D1D5DB] mb-4 leading-relaxed">
                    The reliable PRV V1 Base model—balanced, efficient, and designed for general-purpose reasoning with strong performance across everyday tasks.
                  </p>
                  <div className="mb-4">
                    <p className="text-[12px] font-medium text-[#111827] dark:text-[#F3F4F6] mb-2 uppercase tracking-wide">Supported File Types</p>
                    <div className="space-y-2 text-[12px] text-[#6B7280] dark:text-[#9CA3AF]">
                      <div>
                        <span className="font-medium text-[#374151] dark:text-[#D1D5DB]">Text:</span> Plain text arrays (string). For PDF, CSV, JSON files, extract text using Python libraries (PyPDF, pandas) and inject into prompt.
                      </div>
                      <div>
                        <span className="font-medium text-[#374151] dark:text-[#D1D5DB]">Images:</span> Raw image pixel matrices. Processes natively via frameworks like Hugging Face transformers or vLLM.
                      </div>
                      <div>
                        <span className="font-medium text-[#374151] dark:text-[#D1D5DB]">Audio / Video:</span> Not supported. Audio encoder weights were omitted to optimize text and vision reasoning depth.
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 text-[13px] text-[#6B7280] dark:text-[#D1D5DB]">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-[#111827] dark:text-[#F3F4F6]">262,144</span>
                      <span>Input Tokens</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-[#111827] dark:text-[#F3F4F6]">8,192</span>
                      <span>Output Tokens</span>
                    </div>
                  </div>
                </div>
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
