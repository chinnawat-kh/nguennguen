import { useState, useMemo } from 'react'
import { Plus, Trash2, Edit2, CalendarDays, CalendarRange, CalendarCheck } from 'lucide-react'
import { useL } from '../i18n'

export default function Transactions({ transactions, categories, onRefresh }: any) {
  const { t } = useL()
  const [filterMode, setFilterMode] = useState<'daily' | 'monthly' | 'yearly'>('monthly')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTx, setEditingTx] = useState<any | null>(null)

  const today = new Date()
  const currentDay = today.toISOString().substring(0, 10)
  const currentMonth = today.toISOString().substring(0, 7)
  const currentYear = today.toISOString().substring(0, 4)

  const filteredTxs = useMemo(() => {
    if (filterMode === 'daily')
      return transactions.filter((t: any) => t.date.startsWith(currentDay))
    if (filterMode === 'monthly')
      return transactions.filter((t: any) => t.date.startsWith(currentMonth))
    if (filterMode === 'yearly')
      return transactions.filter((t: any) => t.date.startsWith(currentYear))
    return transactions
  }, [transactions, filterMode, currentDay, currentMonth, currentYear])

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
          <div className="flex space-x-2 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
            <button
              onClick={() => setFilterMode('daily')}
              className={`px-3 md:px-4 py-2 md:py-1 flex items-center space-x-2 rounded-md text-sm transition-colors ${filterMode === 'daily' ? 'bg-white dark:bg-gray-600 shadow' : 'hover:bg-gray-300 dark:hover:bg-gray-500'}`}
            >
              <span className="md:hidden">
                <CalendarDays size={16} />
              </span>
              <span className="hidden md:inline">{t('dashboard.today')}</span>
            </button>
            <button
              onClick={() => setFilterMode('monthly')}
              className={`px-3 md:px-4 py-2 md:py-1 flex items-center space-x-2 rounded-md text-sm transition-colors ${filterMode === 'monthly' ? 'bg-white dark:bg-gray-600 shadow' : 'hover:bg-gray-300 dark:hover:bg-gray-500'}`}
            >
              <span className="md:hidden">
                <CalendarRange size={16} />
              </span>
              <span className="hidden md:inline">{t('dashboard.thisMonth')}</span>
            </button>
            <button
              onClick={() => setFilterMode('yearly')}
              className={`px-3 md:px-4 py-2 md:py-1 flex items-center space-x-2 rounded-md text-sm transition-colors ${filterMode === 'yearly' ? 'bg-white dark:bg-gray-600 shadow' : 'hover:bg-gray-300 dark:hover:bg-gray-500'}`}
            >
              <span className="md:hidden">
                <CalendarCheck size={16} />
              </span>
              <span className="hidden md:inline">{t('dashboard.thisYear')}</span>
            </button>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
            <span className="hidden md:inline">{t('transactions.addNew')}</span>
          </button>
        </div>
      </div>

      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 overflow-hidden transition-all duration-300">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/50">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('transactions.dateCol')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('transactions.categoryCol')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('transactions.typeCol')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('transactions.amountCol')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('transactions.noteCol')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('transactions.manageCol')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTxs.map((tx: any) => (
                <tr
                  key={tx.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{tx.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: tx.category_color + '20',
                        color: tx.category_color
                      }}
                    >
                      {tx.category_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {tx.type === 'income' ? (
                      <span className="text-green-600 font-medium">{t('transactions.income')}</span>
                    ) : (
                      <span className="text-red-600 font-medium">{t('transactions.expense')}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                    <span className={tx.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                      {tx.type === 'income' ? '+' : '-'}฿{tx.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {tx.note}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(tx)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(tx.id)}
                      className="text-red-600 hover:text-red-900 dark:hover:text-red-400"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTxs.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    {t('transactions.noRecords')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
                      className="text-blue-600"
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
                      className="text-blue-600"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
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
