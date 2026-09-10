import { useMemo, useState, type JSX } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { ArrowDownLeft, ArrowUpRight, Edit3, Wallet } from 'lucide-react'
import Modal from './Modal'
import { useL } from '../i18n'
import { type FilterMode, type Transaction } from '../types'
import { filterByMode, getCurrentMonth, getWeekEnd, getWeekStart } from '../dateUtils'
import { formatCurrency } from '../formatters'
import { useToast } from './toastContext'
import { calculatePeriodBudget } from '../budgetUtils'

interface DashboardProps {
  transactions: Transaction[]
  budget: number
  setBudget: (amount: number) => void
  onAddExpense: () => void
}

interface ChartEntry {
  name: string
  value: number
  color: string
}

export default function Dashboard({
  transactions,
  budget,
  setBudget,
  onAddExpense
}: DashboardProps): JSX.Element {
  const { t, lang } = useL()
  const { showToast } = useToast()
  const [filterMode, setFilterMode] = useState<FilterMode>('monthly')
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [newBudget, setNewBudget] = useState(budget.toString())
  const [savingBudget, setSavingBudget] = useState(false)
  const [budgetError, setBudgetError] = useState('')
  const filteredTxs = useMemo(
    () => filterByMode(transactions, filterMode),
    [transactions, filterMode]
  )
  const totalIncome = filteredTxs
    .filter((transaction) => transaction.type === 'income')
    .reduce((sum, transaction) => sum + transaction.amount, 0)
  const totalExpense = filteredTxs
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0)
  const balance = totalIncome - totalExpense
  const chartData = Object.values(
    filteredTxs
      .filter((transaction) => transaction.type === 'expense')
      .reduce<Record<string, ChartEntry>>((entries, transaction) => {
        const category = transaction.category_name || 'Other'
        if (!entries[category]) {
          entries[category] = {
            name: category,
            value: 0,
            color: transaction.category_color || '#64748b'
          }
        }
        entries[category].value += transaction.amount
        return entries
      }, {})
  )
  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonthIndex = today.getMonth()
  const budgetByMode: Record<FilterMode, number> = {
    daily: calculatePeriodBudget(budget, 'daily', today),
    weekly: calculatePeriodBudget(budget, 'weekly', today, getWeekStart(), getWeekEnd()),
    monthly: calculatePeriodBudget(budget, 'monthly', today),
    yearly: calculatePeriodBudget(budget, 'yearly', today)
  }
  const periodBudget = budgetByMode[filterMode]
  const periodLabel: Record<FilterMode, string> = {
    daily: t('dashboard.today'),
    weekly: t('dashboard.thisWeek'),
    monthly: t('dashboard.thisMonth'),
    yearly: t('dashboard.thisYear')
  }
  const isOverBudget = periodBudget > 0 && totalExpense > periodBudget
  const budgetPercent = periodBudget > 0 ? Math.min(100, (totalExpense / periodBudget) * 100) : 0
  const trendData = useMemo(() => {
    const locale = lang === 'th' ? 'th-TH' : 'en-US'
    return Array.from({ length: 6 }, (_, index) => {
      const month = new Date(currentYear, currentMonthIndex - (5 - index), 1)
      const monthKey = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`
      const monthTransactions = transactions.filter((transaction) =>
        transaction.date.startsWith(monthKey)
      )
      return {
        month: new Intl.DateTimeFormat(locale, { month: 'short' }).format(month),
        income: monthTransactions
          .filter((transaction) => transaction.type === 'income')
          .reduce((sum, transaction) => sum + transaction.amount, 0),
        expense: monthTransactions
          .filter((transaction) => transaction.type === 'expense')
          .reduce((sum, transaction) => sum + transaction.amount, 0)
      }
    })
  }, [currentMonthIndex, currentYear, lang, transactions])

  const openBudgetModal = (): void => {
    setBudgetError('')
    setNewBudget(budget.toString())
    setShowBudgetModal(true)
  }

  const closeBudgetModal = (): void => {
    if (savingBudget) return
    if (newBudget !== budget.toString() && !window.confirm(t('transactions.discardChanges'))) return
    setShowBudgetModal(false)
  }

  const handleBudgetSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault()
    const amount = Number(newBudget)
    if (savingBudget || !newBudget.trim() || !Number.isFinite(amount) || amount < 0) return
    setSavingBudget(true)
    setBudgetError('')
    try {
      await window.api.setBudget({ month: getCurrentMonth(), amount })
      setBudget(amount)
      setShowBudgetModal(false)
      showToast(t('common.saved'), 'success')
    } catch {
      setBudgetError(t('common.saveFailed'))
    } finally {
      setSavingBudget(false)
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            {t('dashboard.summary')}
          </p>
          <h2 className="text-2xl font-extrabold tracking-[-0.035em] text-slate-950 dark:text-white md:text-3xl">
            {t('dashboard.title')}
          </h2>
        </div>
        <select
          value={filterMode}
          onChange={(event) => setFilterMode(event.target.value as FilterMode)}
          className="control cursor-pointer bg-white px-3 py-2 text-sm font-semibold dark:bg-[#151d29]"
        >
          <option value="daily">{t('dashboard.today')}</option>
          <option value="weekly">{t('dashboard.thisWeek')}</option>
          <option value="monthly">{t('dashboard.thisMonth')}</option>
          <option value="yearly">{t('dashboard.thisYear')}</option>
        </select>
      </header>

      {isOverBudget && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
          <strong>{t('dashboard.budgetOverAlert')} </strong>
          {t('dashboard.budgetOverMsg')}
        </div>
      )}

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.75fr)]">
        <div className="hero-balance relative overflow-hidden rounded-[1.75rem] p-6 text-white md:p-8">
          <div className="relative z-10 flex min-h-64 flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-white/70">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white/10">
                  <Wallet size={16} />
                </span>
                {t('dashboard.balanceLabel')}
              </div>
              <span className="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[11px] font-semibold text-white/70">
                {t('dashboard.summary')}
              </span>
            </div>
            <p
              className={`my-8 text-4xl font-extrabold tracking-[-0.055em] tabular-nums md:text-5xl ${balance < 0 ? 'text-rose-300' : ''}`}
            >
              {formatCurrency(balance, lang)}
            </p>
            <div className="grid grid-cols-2 divide-x divide-white/15 border-t border-white/15 pt-5">
              <div className="pr-5">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-white/55">
                  <ArrowDownLeft size={15} className="text-emerald-300" />
                  {t('dashboard.incomeLabel')}
                </div>
                <p className="text-lg font-bold tabular-nums md:text-xl">
                  {formatCurrency(totalIncome, lang)}
                </p>
              </div>
              <div className="pl-5">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-white/55">
                  <ArrowUpRight size={15} className="text-rose-300" />
                  {t('dashboard.expenseLabel')}
                </div>
                <p className="text-lg font-bold tabular-nums md:text-xl">
                  {formatCurrency(totalExpense, lang)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="surface-card flex flex-col justify-between p-6">
          <div>
            <div className="mb-7 flex items-center justify-between">
              <div>
                <p className="mb-1 text-xs font-semibold text-slate-400">
                  {periodLabel[filterMode]}
                </p>
                <h3 className="text-lg font-bold">
                  {t(
                    filterMode === 'yearly' ? 'dashboard.yearlyEstimate' : 'dashboard.budgetTitle'
                  )}
                </h3>
              </div>
              <button
                onClick={openBudgetModal}
                className="icon-button text-slate-500"
                aria-label={t('dashboard.budgetSetting')}
              >
                <Edit3 size={17} />
              </button>
            </div>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <strong className="text-2xl font-extrabold tabular-nums tracking-tight">
                {formatCurrency(totalExpense, lang)}
              </strong>
              <span className="text-xs font-semibold text-slate-400">
                / {formatCurrency(periodBudget, lang)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/8">
              <div
                className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-rose-500' : 'bg-emerald-500'}`}
                style={{ width: `${budgetPercent}%` }}
              />
            </div>
            {budget > 0 && filterMode !== 'monthly' && (
              <p className="mt-3 text-[11px] font-medium text-slate-400">
                {t('dashboard.budgetSource', { amount: formatCurrency(budget, lang) })}
              </p>
            )}
            {filterMode === 'yearly' && (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {t('dashboard.yearlyEstimateHint')}
              </p>
            )}
          </div>
          {budget > 0 ? (
            <p className="mt-8 rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500 dark:bg-white/5 dark:text-slate-400">
              {isOverBudget
                ? t('dashboard.overBudget', {
                    n: (totalExpense - periodBudget).toLocaleString(
                      lang === 'th' ? 'th-TH' : 'en-US',
                      { maximumFractionDigits: 2 }
                    )
                  })
                : t('dashboard.remainingBudget', {
                    n: (periodBudget - totalExpense).toLocaleString(
                      lang === 'th' ? 'th-TH' : 'en-US',
                      { maximumFractionDigits: 2 }
                    )
                  })}
            </p>
          ) : (
            <button onClick={openBudgetModal} className="button-primary mt-8 w-full">
              {t('dashboard.setBudgetCTA')}
            </button>
          )}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="surface-card flex flex-col p-5 md:p-6">
          <div className="mb-3">
            <p className="mb-1 text-xs font-semibold text-slate-400">{t('dashboard.summary')}</p>
            <h3 className="text-lg font-bold">{t('dashboard.expenseChart')}</h3>
          </div>
          {chartData.length > 0 ? (
            <div className="h-72 w-full md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={105}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value), lang)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-72 flex-col items-center justify-center gap-4 text-center md:h-80">
              <p className="text-sm text-slate-400">{t('dashboard.noExpenseData')}</p>
              <button onClick={onAddExpense} className="button-primary">
                {t('dashboard.addFirstExpense')}
              </button>
            </div>
          )}
        </div>

        <div className="surface-card flex flex-col p-5 md:p-6">
          <div className="mb-3">
            <p className="mb-1 text-xs font-semibold text-slate-400">
              {t('dashboard.lastSixMonths')}
            </p>
            <h3 className="text-lg font-bold">{t('dashboard.cashFlowTrend')}</h3>
          </div>
          <div className="h-72 w-full md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 12, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b833" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  tickFormatter={(value) =>
                    new Intl.NumberFormat(lang === 'th' ? 'th-TH' : 'en-US', {
                      notation: 'compact',
                      maximumFractionDigits: 1
                    }).format(Number(value))
                  }
                />
                <Tooltip formatter={(value) => formatCurrency(Number(value), lang)} />
                <Legend />
                <Bar
                  dataKey="income"
                  name={t('dashboard.incomeLabel')}
                  fill="#10b981"
                  radius={[5, 5, 0, 0]}
                />
                <Bar
                  dataKey="expense"
                  name={t('dashboard.expenseLabel')}
                  fill="#f43f5e"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {showBudgetModal && (
        <Modal size="sm" onClose={closeBudgetModal} labelledBy="budget-modal-title">
          <h3 id="budget-modal-title" className="mb-4 text-xl font-bold">
            {t('dashboard.setBudgetModal')}
          </h3>
          <p className="-mt-2 mb-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            {t('dashboard.budgetMonthlyHint')}
          </p>
          <form onSubmit={handleBudgetSubmit} className="space-y-4">
            {budgetError && (
              <p role="alert" className="field-error">
                {budgetError}
              </p>
            )}
            <input
              type="number"
              min="0"
              step="0.01"
              value={newBudget}
              onChange={(event) => setNewBudget(event.target.value)}
              className="control w-full bg-white px-3 py-2 dark:bg-slate-800"
              placeholder={t('common.placeholder')}
              required
              disabled={savingBudget}
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeBudgetModal}
                className="button-quiet"
                disabled={savingBudget}
              >
                {t('common.cancel')}
              </button>
              <button type="submit" className="button-primary" disabled={savingBudget}>
                {t('common.save')}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
