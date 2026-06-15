import { useState, useMemo, type JSX } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react'
import Modal from './Modal'
import { useL } from '../i18n'
import { type Transaction, type FilterMode } from '../types'
import { filterByMode, getCurrentMonth } from '../dateUtils'

interface DashboardProps {
  transactions: Transaction[]
  budget: number
  setBudget: (amount: number) => void
}

interface ChartEntry {
  name: string
  value: number
  color: string
}

export default function Dashboard({
  transactions,
  budget,
  setBudget
}: DashboardProps): JSX.Element {
  const { t } = useL()
  const [filterMode, setFilterMode] = useState<FilterMode>('monthly')
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [newBudget, setNewBudget] = useState(budget.toString())

  const currentMonth = getCurrentMonth()

  const filteredTxs = useMemo(
    () => filterByMode(transactions, filterMode),
    [transactions, filterMode]
  )

  const totalIncome = filteredTxs
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  const totalExpense = filteredTxs
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  const balance = totalIncome - totalExpense

  const expensesByCategory = filteredTxs
    .filter((t) => t.type === 'expense')
    .reduce<Record<string, ChartEntry>>((acc, t) => {
      const cat = t.category_name || 'Other'
      if (!acc[cat]) acc[cat] = { name: cat, value: 0, color: t.category_color || '#8884d8' }
      acc[cat].value += t.amount
      return acc
    }, {})

  const chartData = Object.values(expensesByCategory)

  const handleBudgetSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    const amount = Number(newBudget)
    if (!isNaN(amount)) {
      await window.api.setBudget({ month: currentMonth, amount })
      setBudget(amount)
      setShowBudgetModal(false)
    }
  }

  const isOverBudget = budget > 0 && totalExpense > budget
  const budgetPercent = budget > 0 ? Math.min(100, (totalExpense / budget) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('dashboard.title')}</h2>
        <select
          value={filterMode}
          onChange={(e) => setFilterMode(e.target.value as FilterMode)}
          className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-400 dark:focus:ring-teal-500 cursor-pointer"
        >
          <option value="daily">{t('dashboard.today')}</option>
          <option value="weekly">{t('dashboard.thisWeek')}</option>
          <option value="monthly">{t('dashboard.thisMonth')}</option>
          <option value="yearly">{t('dashboard.thisYear')}</option>
        </select>
      </div>

      {isOverBudget && filterMode === 'monthly' && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative">
          <strong className="font-bold">{t('dashboard.budgetOverAlert')} </strong>
          <span className="block sm:inline">{t('dashboard.budgetOverMsg')}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300 overflow-hidden group">
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-green-500/5 dark:bg-green-500/10 group-hover:scale-150 transition-transform duration-500" />
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {t('dashboard.incomeLabel')}
            </h3>
            <TrendingUp size={20} className="text-green-400" />
          </div>
          <p className="text-3xl font-bold text-green-500">฿{totalIncome.toLocaleString()}</p>
        </div>
        <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300 overflow-hidden group">
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-rose-500/5 dark:bg-rose-500/10 group-hover:scale-150 transition-transform duration-500" />
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {t('dashboard.expenseLabel')}
            </h3>
            <TrendingDown size={20} className="text-rose-400" />
          </div>
          <p className="text-3xl font-bold text-rose-500">฿{totalExpense.toLocaleString()}</p>
        </div>
        <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300 overflow-hidden group">
          <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-teal-500/5 dark:bg-teal-500/10 group-hover:scale-150 transition-transform duration-500" />
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {t('dashboard.balanceLabel')}
            </h3>
            <Wallet size={20} className="text-teal-400" />
          </div>
          <p className={`text-3xl font-bold ${balance >= 0 ? 'text-teal-500' : 'text-rose-500'}`}>
            ฿{balance.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300 flex flex-col h-96">
          <h3 className="text-lg font-bold mb-4">{t('dashboard.expenseChart')}</h3>
          {chartData.length > 0 ? (
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `฿${Number(value).toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              {t('dashboard.noExpenseData')}
            </div>
          )}
        </div>

        {filterMode === 'monthly' && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{t('dashboard.budgetTitle')}</h3>
              <button
                onClick={() => {
                  setNewBudget(budget.toString())
                  setShowBudgetModal(true)
                }}
                className="text-sm text-teal-500 hover:text-teal-600 transition-colors"
              >
                {t('dashboard.budgetSetting')}
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  {t('dashboard.budgetUsed')}
                </span>
                <span className="font-bold">
                  ฿{totalExpense.toLocaleString()} / ฿{budget.toLocaleString()}
                </span>
              </div>

              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${isOverBudget ? 'bg-pink-500' : 'bg-green-400'}`}
                  style={{ width: `${budgetPercent}%` }}
                ></div>
              </div>

              {budget > 0 && (
                <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                  {isOverBudget
                    ? t('dashboard.overBudget', { n: (totalExpense - budget).toLocaleString() })
                    : t('dashboard.remainingBudget', {
                        n: (budget - totalExpense).toLocaleString()
                      })}
                </p>
              )}

              {budget === 0 && (
                <div className="text-center p-6 bg-teal-50 dark:bg-gray-700/50 rounded-lg border border-dashed border-teal-200 dark:border-gray-600">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {t('dashboard.noBudgetSet')}
                  </p>
                  <button
                    onClick={() => setShowBudgetModal(true)}
                    className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm hover:bg-teal-600 transition-colors"
                  >
                    {t('dashboard.setBudgetCTA')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showBudgetModal && (
        <Modal size="sm">
          <h3 className="text-xl font-bold mb-4">{t('dashboard.setBudgetModal')}</h3>
          <form onSubmit={handleBudgetSubmit} className="space-y-4">
            <input
              type="number"
              value={newBudget}
              onChange={(e) => setNewBudget(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none"
              placeholder={t('common.placeholder')}
              required
            />
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBudgetModal(false)}
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
        </Modal>
      )}
    </div>
  )
}
