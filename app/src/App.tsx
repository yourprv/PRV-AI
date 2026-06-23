import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import AuthCallback from './pages/AuthCallback'
import { Settings } from './pages/Settings'
import { Toaster } from '@/components/ui/sonner'
import FakeCaptchaGate from './components/FakeCaptchaGate'

export default function App() {
  const [isVerified, setIsVerified] = useState(false)

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
    return <FakeCaptchaGate onVerified={() => setIsVerified(true)} />
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat/:chatId" element={<Home />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/settings" element={<Settings onBack={() => window.history.back()} />} />
      </Routes>
      <Toaster />
    </>
  )
}
