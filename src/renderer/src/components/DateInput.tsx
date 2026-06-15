import { useRef, useState, type JSX } from 'react'
import { Calendar } from 'lucide-react'
import { useL } from '../i18n'
import { formatDisplayDate, parseDisplayDate } from '../dateUtils'

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
    if (parsed !== editValue) {
      onChange(parsed)
    }
  }

  const handleDisplayChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setEditValue(e.target.value)
  }

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onChange(e.target.value)
  }

  const openPicker = (): void => {
    hiddenRef.current?.showPicker()
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={display}
        onChange={handleDisplayChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={t('common.dateFormat')}
        className={`${className} pr-9`}
      />
      <button
        type="button"
        onClick={openPicker}
        className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
      >
        <Calendar size={16} />
      </button>
      <input
        ref={hiddenRef}
        type="date"
        value={value}
        onChange={handleNativeChange}
        className="sr-only"
      />
    </div>
  )
}
