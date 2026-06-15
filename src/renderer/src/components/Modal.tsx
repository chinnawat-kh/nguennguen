import { type ReactNode, type JSX } from 'react'

interface ModalProps {
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg'
}

export default function Modal({ children, size = 'md', className = '' }: ModalProps): JSX.Element {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div
        className={`bg-white dark:bg-gray-800 rounded-xl ${sizeMap[size]} w-full p-6 shadow-xl border border-gray-100 dark:border-gray-700 animate-scale-in ${className}`}
      >
        {children}
      </div>
    </div>
  )
}
