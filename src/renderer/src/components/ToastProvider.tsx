import { useCallback, useEffect, useState, type JSX, type ReactNode } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { ToastContext, type ToastType } from './toastContext'

interface Toast {
  id: number
  type: ToastType
  message: string
}
export default function ToastProvider({ children }: { children: ReactNode }): JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([])
  const dismiss = useCallback(
    (id: number) => setToasts((items) => items.filter((item) => item.id !== id)),
    []
  )
  const showToast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = Date.now() + Math.random()
      setToasts((items) => [...items.slice(-2), { id, type, message }])
      window.setTimeout(() => dismiss(id), 4500)
    },
    [dismiss]
  )

  useEffect(() => {
    const onUnhandled = (event: PromiseRejectionEvent): void => {
      event.preventDefault()
      showToast(
        event.reason instanceof Error ? event.reason.message : String(event.reason),
        'error'
      )
    }
    window.addEventListener('unhandledrejection', onUnhandled)
    return () => window.removeEventListener('unhandledrejection', onUnhandled)
  }, [showToast])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed right-4 top-14 z-[120] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const Icon =
            toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? AlertCircle : Info
          return (
            <div
              key={toast.id}
              role={toast.type === 'error' ? 'alert' : 'status'}
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-xl backdrop-blur ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50/95 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/95 dark:text-emerald-100' : toast.type === 'error' ? 'border-rose-200 bg-rose-50/95 text-rose-900 dark:border-rose-800 dark:bg-rose-950/95 dark:text-rose-100' : 'border-sky-200 bg-sky-50/95 text-sky-900 dark:border-sky-800 dark:bg-sky-950/95 dark:text-sky-100'}`}
            >
              <Icon size={20} className="mt-0.5 shrink-0" />
              <span className="flex-1 text-sm font-medium">{toast.message}</span>
              <button
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="rounded p-0.5 opacity-60 hover:opacity-100"
              >
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
