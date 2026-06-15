import { useState, useMemo, useEffect } from 'react'
import { Plus, Trash2, Edit2, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { useL } from '../i18n'

const PAGE_SIZE = 50

export default function Transactions({ transactions, categories, onRefresh }: any) {
  const { t } = useL()
  const [filterMode, setFilterMode] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTx, setEditingTx] = useState<any | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        setEditingTx(null)
        setFormData({
          type: 'expense',
          amount: '',
          category_id: '',
          date: new Date().toISOString().substring(0, 10),
          note: ''
        })
        setShowAddModal(true)
      }
      if (e.key === 'Escape') {
        setShowAddModal(false)
        setEditingTx(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<number | ''>('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [sortField, setSortField] = useState('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)

  const today = new Date()
  const currentDay = today.toISOString().substring(0, 10)
  const currentMonth = today.toISOString().substring(0, 7)
  const currentYear = today.toISOString().substring(0, 4)

  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  const weekStart = monday.toISOString().substring(0, 10)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const weekEnd = sunday.toISOString().substring(0, 10)

  const filteredTxs = useMemo(() => {
    let result = [...transactions]

    if (filterMode === 'daily') result = result.filter((tx: any) => tx.date.startsWith(currentDay))
    else if (filterMode === 'weekly')
      result = result.filter((tx: any) => tx.date >= weekStart && tx.date <= weekEnd)
    else if (filterMode === 'monthly')
      result = result.filter((tx: any) => tx.date.startsWith(currentMonth))
    else if (filterMode === 'yearly')
      result = result.filter((tx: any) => tx.date.startsWith(currentYear))

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (tx: any) =>
          (tx.note && tx.note.toLowerCase().includes(q)) ||
          String(tx.amount).includes(q) ||
          (tx.category_name && tx.category_name.toLowerCase().includes(q))
      )
    }

    if (filterCategory !== '') {
      result = result.filter((tx: any) => tx.category_id === filterCategory)
    }

    if (filterFrom) {
      result = result.filter((tx: any) => tx.date >= filterFrom)
    }
    if (filterTo) {
      result = result.filter((tx: any) => tx.date <= filterTo)
    }

    result.sort((a: any, b: any) => {
      let cmp = 0
      if (sortField === 'amount') cmp = a.amount - b.amount
      else if (sortField === 'date') cmp = a.date.localeCompare(b.date)
      else if (sortField === 'category_name')
        cmp = (a.category_name || '').localeCompare(b.category_name || '')
      else if (sortField === 'type') cmp = a.type.localeCompare(b.type)
      else if (sortField === 'note') cmp = (a.note || '').localeCompare(b.note || '')
      return sortDir === 'desc' ? -cmp : cmp
    })

    return result
  }, [
    transactions,
    filterMode,
    currentDay,
    currentMonth,
    currentYear,
    searchQuery,
    filterCategory,
    filterFrom,
    filterTo,
    sortField,
    sortDir
  ])

  const totalPages = Math.ceil(filteredTxs.length / PAGE_SIZE)
  const startIdx = (page - 1) * PAGE_SIZE
  const paginatedTxs = filteredTxs.slice(startIdx, startIdx + PAGE_SIZE)

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
    setPage(1)
  }

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) return <span className="ml-1 opacity-30">↕</span>
    return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category_id: '',
    date: new Date().toISOString().substring(0, 10),
    note: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.amount || !formData.category_id) {
      alert(t('transactions.fillAll'))
      return
    }
    await window.api.addTransaction({
      ...formData,
      amount: Number(formData.amount),
      category_id: Number(formData.category_id)
    })
    setShowAddModal(false)
    setFormData({
      type: 'expense',
      amount: '',
      category_id: '',
      date: new Date().toISOString().substring(0, 10),
      note: ''
    })
    onRefresh()
  }

  const handleEdit = (tx: any) => {
    setEditingTx(tx)
    setFormData({
      type: tx.type,
      amount: String(tx.amount),
      category_id: String(tx.category_id),
      date: tx.date,
      note: tx.note || ''
    })
    setShowAddModal(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.amount || !formData.category_id) {
      alert(t('transactions.fillAll'))
      return
    }
    await window.api.updateTransaction({
      id: editingTx.id,
      type: formData.type,
      amount: Number(formData.amount),
      category_id: Number(formData.category_id),
      date: formData.date,
      note: formData.note
    })
    setShowAddModal(false)
    setEditingTx(null)
    setFormData({
      type: 'expense',
      amount: '',
      category_id: '',
      date: new Date().toISOString().substring(0, 10),
      note: ''
    })
    onRefresh()
  }

  const handleDelete = async (id: number) => {
    if (confirm(t('transactions.confirmDelete'))) {
      await window.api.deleteTransaction(id)
      onRefresh()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('transactions.title')}</h2>
        <div className="flex items-center space-x-4">
          <select
            value={filterMode}
            onChange={(e) => {
              setFilterMode(e.target.value as any)
              setPage(1)
            }}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-400 dark:focus:ring-teal-500 cursor-pointer"
          >
            <option value="daily">{t('dashboard.today')}</option>
            <option value="weekly">{t('dashboard.thisWeek')}</option>
            <option value="monthly">{t('dashboard.thisMonth')}</option>
            <option value="yearly">{t('dashboard.thisYear')}</option>
          </select>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
            <span className="hidden md:inline">{t('transactions.addNew')}</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
            placeholder={t('transactions.search')}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value === '' ? '' : Number(e.target.value))
            setPage(1)
          }}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">{t('transactions.allCategories')}</option>
          {categories.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filterFrom}
          onChange={(e) => {
            setFilterFrom(e.target.value)
            setPage(1)
          }}
          placeholder={t('transactions.fromDate')}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          title={t('transactions.fromDate')}
        />
        <input
          type="date"
          value={filterTo}
          onChange={(e) => {
            setFilterTo(e.target.value)
            setPage(1)
          }}
          placeholder={t('transactions.toDate')}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          title={t('transactions.toDate')}
        />
      </div>

      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 overflow-hidden transition-all duration-300">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/50">
            <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => handleSort('date')}
                >
                  {t('transactions.dateCol')}
                  <SortIcon field="date" />
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => handleSort('category_name')}
                >
                  {t('transactions.categoryCol')}
                  <SortIcon field="category_name" />
                </th>
                <th
                  className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => handleSort('type')}
                >
                  {t('transactions.typeCol')}
                  <SortIcon field="type" />
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => handleSort('amount')}
                >
                  {t('transactions.amountCol')}
                  <SortIcon field="amount" />
                </th>
                <th
                  className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-200"
                  onClick={() => handleSort('note')}
                >
                  {t('transactions.noteCol')}
                  <SortIcon field="note" />
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('transactions.manageCol')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedTxs.map((tx: any, idx: number) => (
                <tr
                  key={tx.id}
                  className={`${idx % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-700/20'} hover:bg-gray-100 dark:hover:bg-gray-700/40 transition-colors`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{tx.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: tx.category_color + '20',
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
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(tx)}
                      className="text-teal-500 hover:text-teal-700 dark:hover:text-teal-400 transition-colors"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedTxs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    {searchQuery ||
                    filterCategory ||
                    filterFrom ||
                    filterTo ||
                    filterMode !== 'monthly' ? (
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm text-gray-500 dark:text-gray-400">
            <span>
              {t('transactions.showing', {
                start: startIdx + 1,
                end: Math.min(startIdx + PAGE_SIZE, filteredTxs.length),
                total: filteredTxs.length
              })}
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="font-medium">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold mb-4">
              {editingTx ? t('transactions.editLabel') : t('transactions.addModalTitle')}
            </h3>
            <form onSubmit={editingTx ? handleUpdate : handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('transactions.typeLabel')}
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="type"
                      value="expense"
                      checked={formData.type === 'expense'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="text-rose-500"
                    />
                    <span>{t('transactions.expense')}</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="type"
                      value="income"
                      checked={formData.type === 'income'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="text-green-500"
                    />
                    <span>{t('transactions.income')}</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('transactions.amountLabel')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder={t('transactions.placeholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('transactions.categoryLabel')}
                </label>
                <select
                  required
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">{t('transactions.selectCategory')}</option>
                  {categories
                    .filter((c: any) => c.type === formData.type)
                    .map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('transactions.dateLabel')}
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('transactions.noteLabel')}
                </label>
                <input
                  type="text"
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder={t('common.optional')}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingTx(null)
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors"
                >
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
