import { Routes, Route } from 'react-router'
import Home from './pages/Home'
import AuthCallback from './pages/AuthCallback'
import { Settings } from './pages/Settings'
import { Toaster } from '@/components/ui/sonner'

export default function App() {
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
