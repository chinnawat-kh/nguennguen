import { type JSX } from 'react'
import { Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useL } from '../i18n'
import { type Transaction } from '../types'
import { formatDisplayDate } from '../dateUtils'

interface TransactionTableProps {
  transactions: Transaction[]
  sortField: string
  sortDir: 'asc' | 'desc'
  onSort: (field: string) => void
  onEdit: (tx: Transaction) => void
  onDelete: (id: number) => void
  confirmDeleteId: number | null
  setConfirmDeleteId: (id: number | null) => void
  page: number
  setPage: (page: number) => void
  totalPages: number
  startIdx: number
  filteredCount: number
  hasActiveFilters: boolean
}

function SortIcon({
  field,
  sortField,
  sortDir
}: {
  field: string
  sortField: string
  sortDir: 'asc' | 'desc'
}): JSX.Element {
  if (sortField !== field) return <span className="ml-1 opacity-30">↕</span>
  return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
}

export default function TransactionTable({
  transactions,
  sortField,
  sortDir,
  onSort,
  onEdit,
  onDelete,
  confirmDeleteId,
  setConfirmDeleteId,
  page,
  setPage,
  totalPages,
  startIdx,
  filteredCount,
  hasActiveFilters
}: TransactionTableProps): JSX.Element {
  const { t } = useL()

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 overflow-hidden transition-all duration-300">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/50">
          <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10">
            <tr>
              {[
                { field: 'date', label: t('transactions.dateCol') },
                { field: 'category_name', label: t('transactions.categoryCol') },
                { field: 'type', label: t('transactions.typeCol'), hideMd: true },
                { field: 'amount', label: t('transactions.amountCol') },
                { field: 'note', label: t('transactions.noteCol'), hideMd: true }
              ].map(({ field, label, hideMd }) => (
                <th
                  key={field}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200 ${hideMd ? 'hidden md:table-cell' : ''}`}
                  onClick={() => onSort(field)}
                >
                  {label}
                  <SortIcon field={field} sortField={sortField} sortDir={sortDir} />
                </th>
              ))}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('transactions.manageCol')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {transactions.map((tx, idx) => (
              <tr
                key={tx.id}
                className={`${idx % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-700/20'} hover:bg-gray-100 dark:hover:bg-gray-700/40 transition-colors`}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {formatDisplayDate(tx.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: (tx.category_color || '#8884d8') + '20',
                      color: tx.category_color
                    }}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: tx.category_color }}
                    />
                    {tx.category_name}
                  </span>
                </td>
                <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      tx.type === 'income'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                    }`}
                  >
                    {tx.type === 'income' ? t('transactions.income') : t('transactions.expense')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                  <span className={tx.type === 'income' ? 'text-green-600' : 'text-rose-600'}>
                    {tx.type === 'income' ? '+' : '-'}฿{tx.amount.toLocaleString()}
                  </span>
                </td>
                <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 max-w-[200px] truncate">
                  {tx.note}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {confirmDeleteId === tx.id ? (
                    <span className="inline-flex items-center gap-1 text-xs">
                      <button
                        onClick={() => onDelete(tx.id)}
                        className="text-green-600 hover:text-green-700 font-semibold"
                      >
                        {t('common.confirm')}
                      </button>
                      <span className="text-gray-300 dark:text-gray-600">/</span>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        {t('common.cancel')}
                      </button>
                    </span>
                  ) : (
                    <span className="space-x-2">
                      <button
                        onClick={() => onEdit(tx)}
                        className="text-teal-500 hover:text-teal-700 dark:hover:text-teal-400 transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(tx.id)}
                        className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  {hasActiveFilters ? (
                    <div className="flex flex-col items-center gap-3">
                      <svg
                        className="w-16 h-16 text-gray-300 dark:text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-gray-400 dark:text-gray-500">
                        {t('transactions.noRecords')}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <svg
                        className="w-16 h-16 text-gray-300 dark:text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>
                      <p className="text-gray-400 dark:text-gray-500">
                        {t('transactions.noRecords')}
                      </p>
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm text-gray-500 dark:text-gray-400">
          <span>
            {t('transactions.showing', {
              start: startIdx + 1,
              end: Math.min(startIdx + transactions.length, filteredCount),
              total: filteredCount
            })}
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="font-medium">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
