import { useCallback, useEffect, useState } from 'react'
import { Routes, Route } from 'react-router'
import { X } from 'lucide-react'
import Home from './pages/Home'
import AuthCallback from './pages/AuthCallback'
import { Settings } from './pages/Settings'
import { Toaster } from '@/components/ui/sonner'
import TurnstileGate from './components/TurnstileGate'

const POLICY_NOTICE_KEY = 'prv_policy_update_notice_dismissed_2026_11';

function PolicyUpdateNotice() {
  const [visible, setVisible] = useState(() => localStorage.getItem(POLICY_NOTICE_KEY) !== '1');
  const [fading, setFading] = useState(false);
  const dismiss = useCallback(() => {
    localStorage.setItem(POLICY_NOTICE_KEY, '1');
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const fadeTimer = window.setTimeout(() => setFading(true), 6700);
    const dismissTimer = window.setTimeout(dismiss, 7000);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(dismissTimer);
    };
  }, [dismiss, visible]);

  if (!visible) return null;
  return (
    <div role="status" aria-live="polite" className={`fixed right-4 top-4 z-[100] flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm text-slate-800 shadow-xl transition-opacity duration-300 ease-out dark:border-violet-400/20 dark:bg-slate-900 dark:text-slate-100 ${fading ? 'opacity-0' : 'opacity-100'}`}>
      <span>Terms and Conditions and Privacy Policy have been updated.</span>
      <button type="button" onClick={dismiss} aria-label="Dismiss policy update notice" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white">
        <X size={16} />
      </button>
    </div>
  );
}

export default function App() {
  const [isVerified, setIsVerified] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  useEffect(() => {
    // Wake the backend in the background as soon as the app loads.
    fetch('https://prv-ai-backend.onrender.com/wake-up', {
      method: 'GET',
      keepalive: true,
    }).catch(() => {
      // Ignore network failures here so the UI remains responsive.
    })
  }, [])

  if (!isVerified) {
    return <TurnstileGate onVerified={(token) => {
      setTurnstileToken(token)
      setIsVerified(true)
    }} />
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Home turnstileToken={turnstileToken ?? undefined} />} />
        <Route path="/chat/:chatId" element={<Home turnstileToken={turnstileToken ?? undefined} />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/settings" element={<Settings onBack={() => window.history.back()} />} />
      </Routes>
      <PolicyUpdateNotice />
      <Toaster />
    </>
  )
}
