import { useState, useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { CalendarDays, CalendarRange, CalendarCheck } from 'lucide-react'
import { useL } from '../i18n'

export default function Dashboard({ transactions, budget, setBudget }: any) {
  const { t } = useL()
  const [filterMode, setFilterMode] = useState<'daily' | 'monthly' | 'yearly'>('monthly')
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [newBudget, setNewBudget] = useState(budget.toString())

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

  const totalIncome = filteredTxs
    .filter((t: any) => t.type === 'income')
    .reduce((sum: number, t: any) => sum + t.amount, 0)
  const totalExpense = filteredTxs
    .filter((t: any) => t.type === 'expense')
    .reduce((sum: number, t: any) => sum + t.amount, 0)
  const balance = totalIncome - totalExpense

  const expensesByCategory = filteredTxs
    .filter((t: any) => t.type === 'expense')
    .reduce((acc: any, t: any) => {
      const cat = t.category_name || 'Other'
      if (!acc[cat]) acc[cat] = { name: cat, value: 0, color: t.category_color || '#8884d8' }
      acc[cat].value += t.amount
      return acc
    }, {})

  const chartData = Object.values(expensesByCategory)

  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = Number(newBudget)
    if (!isNaN(amount)) {
      await window.api.setBudget({ month: currentMonth, amount })
      setBudget(amount)
      setShowBudgetModal(false)
    }
  }

  // Budget is always based on monthly logic, but if we are viewing other periods, we still show the monthly budget
  const isOverBudget = budget > 0 && totalExpense > budget
  const budgetPercent = budget > 0 ? Math.min(100, (totalExpense / budget) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('dashboard.title')}</h2>
        <div className="flex space-x-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
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
      </div>

      {isOverBudget && filterMode === 'monthly' && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative">
          <strong className="font-bold">{t('dashboard.budgetOverAlert')} </strong>
          <span className="block sm:inline">{t('dashboard.budgetOverMsg')}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            {t('dashboard.incomeLabel')}
          </h3>
          <p className="text-3xl font-bold text-green-500">฿{totalIncome.toLocaleString()}</p>
        </div>
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            {t('dashboard.expenseLabel')}
          </h3>
          <p className="text-3xl font-bold text-pink-500">฿{totalExpense.toLocaleString()}</p>
        </div>
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 hover:shadow-xl transition-all duration-300">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            {t('dashboard.balanceLabel')}
          </h3>
          <p className={`text-3xl font-bold ${balance >= 0 ? 'text-blue-500' : 'text-pink-500'}`}>
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
                    {chartData.map((entry: any, index: number) => (
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
                className="text-sm text-blue-500 hover:text-blue-600 transition-colors"
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
                <div className="text-center p-6 bg-blue-50 dark:bg-gray-700/50 rounded-lg border border-dashed border-blue-200 dark:border-gray-600">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {t('dashboard.noBudgetSet')}
                  </p>
                  <button
                    onClick={() => setShowBudgetModal(true)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-sm w-full p-6 shadow-xl border border-gray-100 dark:border-gray-700">
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
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
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
