import { useRef, useState, type JSX } from 'react'
import { Calendar } from 'lucide-react'
import { useL } from '../i18n'
import { formatDisplayDate, isValidISODate, parseDisplayDate } from '../dateUtils'

interface DateInputProps {
  value: string
  onChange: (date: string) => void
  className?: string
}

export default function DateInput({
  value,
  onChange,
  className = ''
}: DateInputProps): JSX.Element {
  const { t } = useL()
  const hiddenRef = useRef<HTMLInputElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [editValue, setEditValue] = useState('')

  const display = isFocused ? editValue : formatDisplayDate(value)

  const handleFocus = (): void => {
    setIsFocused(true)
    setEditValue(formatDisplayDate(value))
  }

  const handleBlur = (): void => {
    setIsFocused(false)
    const parsed = parseDisplayDate(editValue)
    onChange(parsed)
  }

  const handleDisplayChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setEditValue(e.target.value)
    onChange(parseDisplayDate(e.target.value))
  }

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onChange(e.target.value)
  }

  const openPicker = (): void => {
    hiddenRef.current?.showPicker()
  }

  return (
    <div className="relative min-w-0 w-full">
      <input
        type="text"
        value={display}
        onChange={handleDisplayChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={t('common.dateFormat')}
        aria-label={t('transactions.dateLabel')}
        aria-invalid={!!value && !isValidISODate(value)}
        className={`${className} w-full min-w-0 pr-11`}
      />
      <button
        type="button"
        onClick={openPicker}
        className="absolute inset-y-0 right-0 flex w-10 shrink-0 cursor-pointer items-center justify-center rounded-r-xl border-l border-slate-200/80 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700 dark:border-white/10 dark:hover:bg-white/5 dark:hover:text-slate-200"
        aria-label={t('common.dateFormat')}
      >
        <Calendar size={17} strokeWidth={1.8} />
      </button>
      <input
        ref={hiddenRef}
        type="date"
        value={isValidISODate(value) ? value : ''}
        onChange={handleNativeChange}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      />
    </div>
  )
}
