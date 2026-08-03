import { createContext, useContext } from 'react'

export type ToastType = 'success' | 'error' | 'info'
export interface ToastApi {
  showToast: (message: string, type?: ToastType) => void
}
export const ToastContext = createContext<ToastApi | null>(null)

export function useToast(): ToastApi {
  const value = useContext(ToastContext)
  if (!value) throw new Error('useToast must be used within ToastProvider')
  return value
}
