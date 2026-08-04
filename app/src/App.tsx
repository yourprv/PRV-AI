import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import AuthCallback from './pages/AuthCallback'
import { Settings } from './pages/Settings'
import { Toaster } from '@/components/ui/sonner'
import TurnstileGate from './components/TurnstileGate'

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
      <Toaster />
      <div className="fixed bottom-4 right-4 z-40 max-w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-violet-200/80 bg-white/95 px-4 py-3 text-xs leading-5 text-slate-600 shadow-[0_12px_40px_rgba(15,23,42,0.16)] backdrop-blur dark:border-violet-400/20 dark:bg-slate-900/95 dark:text-slate-300">
        <span className="mr-1.5 font-semibold text-violet-600 dark:text-violet-300">PRV AI update:</span>
        We made a major change to our Terms and Conditions and Privacy Policy.
      </div>
    </>
  )
}
