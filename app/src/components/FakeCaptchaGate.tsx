import { useState } from 'react'
import { Check, Loader2, ShieldCheck } from 'lucide-react'

type GateStatus = 'idle' | 'verifying' | 'verified'

interface FakeCaptchaGateProps {
  onVerified: () => void
}

export default function FakeCaptchaGate({ onVerified }: FakeCaptchaGateProps) {
  const [status, setStatus] = useState<GateStatus>('idle')

  const handleVerify = () => {
    if (status !== 'idle') {
      return
    }

    // Start the verification animation immediately and complete it in the requested sequence.
    setStatus('verifying')

    window.setTimeout(() => {
      setStatus('verified')

      window.setTimeout(() => {
        onVerified()
      }, 1000)
    }, 6000)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 text-black">
      <div className="w-full max-w-md rounded-[32px] border border-black/10 bg-white p-8 shadow-[0_30px_100px_rgba(0,0,0,0.08)]">
        <div className="mb-6 flex justify-center">
          <div className={`flex h-16 w-16 items-center justify-center rounded-full border ${status === 'verified' ? 'border-emerald-500 bg-emerald-500/10' : 'border-black/15 bg-black/5'}`}>
            {status === 'verifying' ? (
              <Loader2 className="h-7 w-7 animate-spin text-black" />
            ) : status === 'verified' ? (
              <Check className="h-8 w-8 text-emerald-600" />
            ) : (
              <ShieldCheck className="h-7 w-7 text-black" />
            )}
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Verify you are human</h1>
          <p className="mt-3 text-sm text-black/60">
            A quick confirmation is required before you can continue.
          </p>
        </div>

        <label className={`mt-8 flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-4 transition-all ${status === 'idle' ? 'border-black/10 bg-black/[0.03] hover:bg-black/[0.06]' : 'border-emerald-500/20 bg-emerald-500/[0.08]'}`}>
          <input
            type="checkbox"
            className="sr-only"
            checked={status === 'verified'}
            disabled={status !== 'idle'}
            onChange={handleVerify}
          />
          <span className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${status === 'verified' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-black/20 bg-white'}`}>
            {status === 'verifying' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : status === 'verified' ? <Check className="h-3.5 w-3.5" /> : null}
          </span>
          <span className="text-sm font-medium text-black/80">
            {status === 'idle' && 'I confirm I am human'}
            {status === 'verifying' && 'Checking your request...'}
            {status === 'verified' && 'Verified'}
          </span>
        </label>

        <div className="mt-6 h-2 overflow-hidden rounded-full bg-black/10">
          <div
            className={`h-full rounded-full bg-black transition-all duration-500 ${status === 'idle' ? 'w-0' : status === 'verifying' ? 'w-1/2' : 'w-full'}`}
          />
        </div>
      </div>
    </div>
  )
}
