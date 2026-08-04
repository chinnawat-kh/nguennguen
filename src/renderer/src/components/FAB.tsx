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
    <div className="fixed bottom-24 right-5 z-40 flex flex-col items-end gap-3 md:bottom-7 md:right-7">
      {open && (
        <div className="flex flex-col items-stretch gap-2 animate-fade-in">
          <button
            onClick={() => {
              setOpen(false)
              onAddExpense()
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-300 rounded-xl shadow-md text-sm font-semibold transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <Plus size={16} />
            {t('nav.quickExpense')}
          </button>
          <button
            onClick={() => {
              setOpen(false)
              onAddIncome()
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-600 dark:text-emerald-300 rounded-xl shadow-md text-sm font-semibold transition-colors hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <Plus size={16} />
            {t('nav.quickIncome')}
          </button>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg transition-colors duration-150 hover:bg-slate-700 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 ${
          open ? 'rotate-45' : ''
        }`}
      >
        <Plus size={24} />
      </button>
    </div>
  )
}
