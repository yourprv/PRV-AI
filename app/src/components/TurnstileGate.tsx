import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Loader2, ShieldCheck } from 'lucide-react'
import { getApiBaseUrl } from '@/lib/api'

type GateStatus = 'loading' | 'idle' | 'verifying' | 'verified' | 'error'

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, options: {
        sitekey: string
        callback?: (token: string) => void
        'error-callback'?: () => void
        'expired-callback'?: () => void
        theme?: 'light' | 'dark' | 'auto'
        appearance?: 'always' | 'execute' | 'interaction-only'
      }) => string
      remove: (widgetId: string) => void
      reset: (widgetId?: string) => void
    }
  }
}

interface TurnstileGateProps {
  onVerified: (token: string) => void
}

export default function TurnstileGate({ onVerified }: TurnstileGateProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [status, setStatus] = useState<GateStatus>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const siteKey = (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '').trim()

    if (!siteKey) {
      setError('Turnstile is not configured yet. Add the site key to your environment variables.')
      setStatus('error')
      return
    }

    const renderWidget = () => {
      if (!containerRef.current) return

      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
      }

      widgetIdRef.current = window.turnstile?.render(containerRef.current, {
        sitekey: siteKey,
        theme: 'light',
        appearance: 'always',
        callback: async (token) => {
          setStatus('verifying')
          setError(null)

          try {
            const response = await fetch(`${getApiBaseUrl()}/api/turnstile/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token }),
            })

            if (!response.ok) {
              throw new Error((await response.text()) || 'Turnstile verification failed.')
            }

            setStatus('verified')
            onVerified(token)
          } catch (verificationError) {
            const message = verificationError instanceof Error ? verificationError.message : 'Turnstile verification failed.'
            setError(message)
            setStatus('error')
          }
        },
        'error-callback': () => {
          setError('The Turnstile challenge was not completed successfully.')
          setStatus('error')
        },
        'expired-callback': () => {
          setError('The Turnstile challenge expired. Please try again.')
          setStatus('idle')
        },
      }) ?? null
    }

    const scriptId = 'cloudflare-turnstile-script'
    const existingScript = document.getElementById(scriptId)

    if (existingScript && window.turnstile) {
      renderWidget()
      setStatus('idle')
      return
    }

    if (existingScript) {
      existingScript.addEventListener('load', renderWidget, { once: true })
      setStatus('idle')
      return
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    script.async = true
    script.defer = true
    script.onload = () => {
      renderWidget()
      setStatus('idle')
    }
    script.onerror = () => {
      setError('Unable to load the Turnstile widget. Please try again later.')
      setStatus('error')
    }
    document.body.appendChild(script)

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
      }
    }
  }, [onVerified])

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6 text-black">
      <div className="w-full max-w-md rounded-[32px] border border-black/10 bg-white p-8 shadow-[0_30px_100px_rgba(0,0,0,0.08)]">
        <div className="mb-6 flex justify-center">
          <div className={`flex h-16 w-16 items-center justify-center rounded-full border ${status === 'verified' ? 'border-emerald-500 bg-emerald-500/10' : 'border-black/15 bg-black/5'}`}>
            {status === 'verifying' ? (
              <Loader2 className="h-7 w-7 animate-spin text-black" />
            ) : status === 'verified' ? (
              <ShieldCheck className="h-8 w-8 text-emerald-600" />
            ) : (
              <ShieldCheck className="h-7 w-7 text-black" />
            )}
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight">Verify you are human</h1>
          <p className="mt-3 text-sm text-black/60">
            Complete the security check to continue to the app.
          </p>
        </div>

        <div className="mt-6 flex min-h-[76px] justify-center">
          <div ref={containerRef} />
        </div>

        {error ? (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {status === 'verifying' ? (
          <div className="mt-4 text-center text-sm text-black/70">Verifying your request...</div>
        ) : null}
      </div>
    </div>
  )
}
