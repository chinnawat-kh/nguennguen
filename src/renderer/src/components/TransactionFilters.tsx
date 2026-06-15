import { type JSX } from 'react'
import { Search } from 'lucide-react'
import DateInput from './DateInput'
import { useL } from '../i18n'
import { type Category, type FilterMode } from '../types'

interface TransactionFiltersProps {
  searchQuery: string
  onSearchChange: (val: string) => void
  filterMode: FilterMode
  onFilterModeChange: (val: FilterMode) => void
  filterCategory: number | ''
  onFilterCategoryChange: (val: number | '') => void
  filterFrom: string
  onFilterFromChange: (val: string) => void
  filterTo: string
  onFilterToChange: (val: string) => void
  onReset: () => void
  categories: Category[]
  hasActiveFilters: boolean
}

export default function TransactionFilters({
  searchQuery,
  onSearchChange,
  filterMode,
  onFilterModeChange,
  filterCategory,
  onFilterCategoryChange,
  filterFrom,
  onFilterFromChange,
  filterTo,
  onFilterToChange,
  onReset,
  categories,
  hasActiveFilters
}: TransactionFiltersProps): JSX.Element {
  const { t } = useL()
  const inputClass =
    'border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500'

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('transactions.search')}
            className={`w-full pl-9 pr-3 py-2 ${inputClass}`}
          />
        </div>
        <select
          value={filterMode}
          onChange={(e) => onFilterModeChange(e.target.value as FilterMode)}
          className={`px-3 py-2 ${inputClass} cursor-pointer`}
        >
          <option value="daily">{t('dashboard.today')}</option>
          <option value="weekly">{t('dashboard.thisWeek')}</option>
          <option value="monthly">{t('dashboard.thisMonth')}</option>
          <option value="yearly">{t('dashboard.thisYear')}</option>
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filterCategory}
          onChange={(e) =>
            onFilterCategoryChange(e.target.value === '' ? '' : Number(e.target.value))
          }
          className={`px-3 py-2 ${inputClass}`}
        >
          <option value="">{t('transactions.allCategories')}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {t('transactions.fromDate')}
          </label>
          <DateInput
            value={filterFrom}
            onChange={onFilterFromChange}
            className={`px-2 py-2 ${inputClass}`}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {t('transactions.toDate')}
          </label>
          <DateInput
            value={filterTo}
            onChange={onFilterToChange}
            className={`px-2 py-2 ${inputClass}`}
          />
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-xs text-teal-500 hover:text-teal-600 font-medium transition-colors whitespace-nowrap"
          >
            {t('transactions.resetFilters')}
          </button>
        )}
      </div>
    </div>
  )
}
