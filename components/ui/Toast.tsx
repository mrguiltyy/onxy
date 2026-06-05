'use client'
import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X, Sparkles } from 'lucide-react'

type ToastVariant = 'success' | 'error' | 'warn' | 'info' | 'default'

interface ToastInput {
  title:       string
  description?: string
  variant?:    ToastVariant
  duration?:   number
}

interface Toast extends ToastInput {
  id:    string
  going?: boolean
}

interface ToastCtx {
  toast: (t: ToastInput) => void
}

const Ctx = createContext<ToastCtx | null>(null)

export function useToast() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useToast must be used inside ToastProvider')
  return c
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const dismiss = useCallback((id: string) => {
    setToasts(ts => ts.map(t => (t.id === id ? { ...t, going: true } : t)))
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), 250)
  }, [])

  const toast = useCallback((t: ToastInput) => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    setToasts(ts => [...ts, { ...t, id }])
    const duration = t.duration ?? 4500
    timers.current[id] = setTimeout(() => dismiss(id), duration)
  }, [dismiss])

  useEffect(() => {
    const t = timers.current
    return () => Object.values(t).forEach(clearTimeout)
  }, [])

  const icons: Record<ToastVariant, React.ReactNode> = {
    success: <CheckCircle2 size={16} />,
    error:   <AlertCircle  size={16} />,
    warn:    <AlertTriangle size={16} />,
    info:    <Info size={16} />,
    default: <Sparkles size={16} />,
  }

  return (
    <Ctx.Provider value={{ toast }}>
      {children}

      <div className="toast-region" role="region" aria-label="Notifications">
        {toasts.map(t => {
          const v = t.variant ?? 'default'
          const cls = v === 'default' ? 'toast' : `toast toast-${v}`
          return (
            <div key={t.id} className={`${cls} ${t.going ? 'toast-out' : ''}`}>
              <div className="toast-icon">{icons[v]}</div>
              <div className="toast-body">
                <div className="toast-title">{t.title}</div>
                {t.description && <div className="toast-desc">{t.description}</div>}
              </div>
              <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="Close">
                <X size={14} />
              </button>
              <div className="toast-progress" style={{ animationDuration: `${(t.duration ?? 4500) / 1000}s` }} />
            </div>
          )
        })}
      </div>
    </Ctx.Provider>
  )
}
