import { useState, type JSX } from 'react'
import { Plus } from 'lucide-react'
import { useL } from '../i18n'

interface FABProps {
  onAddIncome: () => void
  onAddExpense: () => void
}

export default function FAB({ onAddIncome, onAddExpense }: FABProps): JSX.Element {
  const { t } = useL()
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="flex flex-col items-stretch gap-2 animate-fade-in">
          <button
            onClick={() => {
              setOpen(false)
              onAddExpense()
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-lg text-sm font-medium transition-all duration-300 hover:-translate-y-0.5"
          >
            <Plus size={16} />
            {t('nav.quickExpense')}
          </button>
          <button
            onClick={() => {
              setOpen(false)
              onAddIncome()
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl shadow-lg text-sm font-medium transition-all duration-300 hover:-translate-y-0.5"
          >
            <Plus size={16} />
            {t('nav.quickIncome')}
          </button>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-14 h-14 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center ${
          open ? 'rotate-45' : ''
        }`}
      >
        <Plus size={24} />
      </button>
    </div>
  )
}
