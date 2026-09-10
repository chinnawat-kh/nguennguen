import { type JSX } from 'react'
import { Search } from 'lucide-react'
import DateInput from './DateInput'
import { useL } from '../i18n'
import { type Category, type TransactionFilterMode } from '../types'
import { isValidISODate } from '../dateUtils'

interface TransactionFiltersProps {
  searchQuery: string
  onSearchChange: (val: string) => void
  filterMode: TransactionFilterMode
  onFilterModeChange: (val: TransactionFilterMode) => void
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
  const inputClass = 'control bg-white dark:bg-slate-900 text-sm px-3 focus:outline-none'

  return (
    <div className="surface-card p-4 space-y-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
          onChange={(e) => onFilterModeChange(e.target.value as TransactionFilterMode)}
          aria-label={t('transactions.period')}
          className={`w-full px-3 py-2 sm:w-auto ${inputClass} cursor-pointer`}
        >
          <option value="daily">{t('dashboard.today')}</option>
          <option value="weekly">{t('dashboard.thisWeek')}</option>
          <option value="monthly">{t('dashboard.thisMonth')}</option>
          <option value="yearly">{t('dashboard.thisYear')}</option>
          <option value="all">{t('dashboard.allTime')}</option>
          <option value="custom">{t('transactions.customRange')}</option>
        </select>
      </div>
      <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <select
          value={filterCategory}
          onChange={(e) =>
            onFilterCategoryChange(e.target.value === '' ? '' : Number(e.target.value))
          }
          className={`w-full min-w-0 px-3 py-2 ${inputClass}`}
        >
          <option value="">{t('transactions.allCategories')}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="grid min-w-0 gap-1.5">
          <label className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {t('transactions.fromDate')}
          </label>
          <DateInput
            value={filterFrom}
            onChange={onFilterFromChange}
            className={`px-3 py-2 ${inputClass}`}
          />
        </div>
        <div className="grid min-w-0 gap-1.5">
          <label className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {t('transactions.toDate')}
          </label>
          <DateInput
            value={filterTo}
            onChange={onFilterToChange}
            className={`px-3 py-2 ${inputClass}`}
          />
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="justify-self-start whitespace-nowrap text-xs font-medium text-teal-600 transition-colors hover:text-teal-700 sm:col-span-2 lg:col-span-3"
          >
            {t('transactions.resetFilters')}
          </button>
        )}
      </div>
      {filterMode === 'custom' &&
        ((filterFrom && !isValidISODate(filterFrom)) ||
          (filterTo && !isValidISODate(filterTo)) ||
          (filterFrom && filterTo && filterFrom > filterTo)) && (
          <p role="alert" className="field-error">
            {t('transactions.invalidRange')}
          </p>
        )}
    </div>
  )
}
