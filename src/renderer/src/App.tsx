import { useState, useEffect, useCallback, type JSX } from 'react'
import { Home, List, Tag, WalletCards } from 'lucide-react'
import Dashboard from './components/Dashboard'
import Transactions from './components/Transactions'
import Categories from './components/Categories'
import SetupWizard from './components/SetupWizard'
import QuickAddModal from './components/QuickAddModal'
import FAB from './components/FAB'
import TitleBar from './components/TitleBar'
import SettingsModal from './components/SettingsModal'
import { useL } from './i18n'
import type { Transaction, Category, TabId } from './types'
import { TAB_IDS } from './types'
import { filterByMode, getCurrentMonth } from './dateUtils'
import { useToast } from './components/toastContext'
import { formatCurrency } from './formatters'
import logo from './assets/logo.png'

interface NavItemProps {
  id: TabId
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
  label: string
  activeTab: TabId
  onClick: (id: TabId) => void
}

function NavItem({ id, icon: Icon, label, activeTab, onClick }: NavItemProps): JSX.Element {
  return (
    <button
      onClick={() => onClick(id)}
      aria-current={activeTab === id ? 'page' : undefined}
      className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
        activeTab === id
          ? 'bg-white text-slate-950 shadow-sm dark:bg-white/10 dark:text-white'
          : 'text-slate-500 hover:bg-white/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'
      }`}
    >
      <Icon size={18} strokeWidth={activeTab === id ? 2.4 : 1.8} />
      <span className="font-semibold">{label}</span>
    </button>
  )
}

const STORAGE_KEY = 'nguennguen-lang'

export default function App(): JSX.Element {
  const [firstRun, setFirstRun] = useState<boolean>(() => !localStorage.getItem(STORAGE_KEY))
  const [activeTab, setActiveTab] = useState<TabId>(
    () => (localStorage.getItem('nguennguen-tab') as TabId) || TAB_IDS.DASHBOARD
  )
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('nguennguen-dark') === 'true')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [budget, setBudget] = useState<number>(0)
  const [showSettings, setShowSettings] = useState(false)
  const [showQuickAddModal, setShowQuickAddModal] = useState(false)
  const [quickAddType, setQuickAddType] = useState<'income' | 'expense'>('expense')
  const [appVersion, setAppVersion] = useState('')
  const [loading, setLoading] = useState(true)
  const { t, lang, setLang } = useL()
  const { showToast } = useToast()

  useEffect(() => {
    localStorage.setItem('nguennguen-dark', String(darkMode))
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const loadData = useCallback(async (): Promise<void> => {
    try {
      const txs = (await window.api.getTransactions()) as Transaction[]
      setTransactions(txs)
      const cats = (await window.api.getCategories()) as Category[]
      setCategories(cats)
      const currentMonth = getCurrentMonth()
      const b = await window.api.getBudget(currentMonth)
      if (b) setBudget(b.amount)
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Unable to load data', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => localStorage.setItem('nguennguen-tab', activeTab), [activeTab])

  useEffect(() => {
    const init = async (): Promise<void> => {
      await loadData()
    }
    init()
    window.api.getAppVersion().then(setAppVersion)
  }, [loadData])

  const calculateBalance = (items: Transaction[]): number =>
    items.reduce((sum, transaction) => {
      return sum + (transaction.type === 'income' ? transaction.amount : -transaction.amount)
    }, 0)
  const monthlyTransactions = filterByMode(transactions, 'monthly')
  const monthlyBalance = calculateBalance(monthlyTransactions)
  const monthlyExpense = monthlyTransactions
    .filter((transaction) => transaction.type === 'expense')
    .reduce((sum, transaction) => sum + transaction.amount, 0)
  const monthlyBudgetPercent = budget > 0 ? Math.round((monthlyExpense / budget) * 100) : 0

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      {firstRun ? (
        <TitleBar minimal />
      ) : (
        <TitleBar
          lang={lang}
          onToggleLang={() => setLang(lang === 'en' ? 'th' : 'en')}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode(!darkMode)}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}
      <div className="flex flex-1 overflow-hidden bg-[#f3f5f7] font-sans text-slate-800 transition-colors duration-300 dark:bg-[#0b1018] dark:text-slate-100">
        {firstRun ? (
          <SetupWizard onDone={() => setFirstRun(false)} />
        ) : (
          <>
            <aside className="hidden w-56 flex-shrink-0 flex-col border-r border-slate-200/70 bg-slate-100/70 px-3 py-5 dark:border-white/8 dark:bg-[#0e151f] md:flex">
              <div className="mb-7 flex items-center gap-3 px-2">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 shadow-sm dark:bg-white">
                  <img src={logo} alt="" className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-sm font-extrabold tracking-tight text-slate-950 dark:text-white">
                    {t('app.name')}
                  </p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                    Finance space
                  </p>
                </div>
              </div>
              <nav className="flex-1 space-y-1 overflow-y-auto">
                <NavItem
                  id={TAB_IDS.DASHBOARD}
                  icon={Home}
                  label={t('nav.dashboard')}
                  activeTab={activeTab}
                  onClick={setActiveTab}
                />
                <NavItem
                  id={TAB_IDS.TRANSACTIONS}
                  icon={List}
                  label={t('nav.transactions')}
                  activeTab={activeTab}
                  onClick={setActiveTab}
                />
                <NavItem
                  id={TAB_IDS.CATEGORIES}
                  icon={Tag}
                  label={t('nav.categories')}
                  activeTab={activeTab}
                  onClick={setActiveTab}
                />
              </nav>

              {/* Balance */}
              <div className="rounded-2xl bg-slate-950 p-4 text-white dark:bg-white dark:text-slate-950">
                <div className="mb-4 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 dark:bg-slate-950/10">
                    <WalletCards size={16} />
                  </div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {t('dashboard.balanceLabel')}
                  </p>
                </div>
                <div>
                  <p className="mb-0.5 text-[10px] font-medium text-slate-400">
                    {t('dashboard.thisMonth')}
                  </p>
                  <p
                    className={`text-xl font-extrabold tracking-tight tabular-nums ${monthlyBalance < 0 ? 'text-rose-400' : ''}`}
                  >
                    {formatCurrency(monthlyBalance, lang)}
                  </p>
                  <div className="mt-4 border-t border-white/10 pt-3 dark:border-slate-950/10">
                    <div className="mb-2 flex items-center justify-between gap-2 text-[10px] font-semibold">
                      <span className="text-slate-400">{t('dashboard.budgetUsed')}</span>
                      <span className={monthlyBudgetPercent > 100 ? 'text-rose-400' : ''}>
                        {budget > 0 ? `${monthlyBudgetPercent}%` : '—'}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10 dark:bg-slate-950/10">
                      <div
                        className={`h-full rounded-full ${monthlyBudgetPercent > 100 ? 'bg-rose-400' : 'bg-emerald-400'}`}
                        style={{ width: `${Math.min(100, monthlyBudgetPercent)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
              <main className="flex-1 overflow-auto px-4 pb-24 pt-5 transition-colors duration-300 md:p-8 lg:p-10">
                <div className="mx-auto max-w-7xl animate-fade-in">
                  {loading ? (
                    <div className="grid gap-4" aria-label="Loading">
                      <div className="skeleton h-10 w-48" />
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="skeleton h-36" />
                        <div className="skeleton h-36" />
                        <div className="skeleton h-36" />
                      </div>
                      <div className="skeleton h-80" />
                    </div>
                  ) : (
                    activeTab === TAB_IDS.DASHBOARD && (
                      <Dashboard
                        transactions={transactions}
                        budget={budget}
                        setBudget={setBudget}
                        onAddExpense={() => {
                          setQuickAddType('expense')
                          setShowQuickAddModal(true)
                        }}
                      />
                    )
                  )}
                  {!loading && activeTab === TAB_IDS.TRANSACTIONS && (
                    <Transactions
                      transactions={transactions}
                      categories={categories}
                      onRefresh={loadData}
                    />
                  )}
                  {!loading && activeTab === TAB_IDS.CATEGORIES && (
                    <Categories categories={categories} onRefresh={loadData} />
                  )}
                </div>
              </main>

              <FAB
                onAddIncome={() => {
                  setQuickAddType('income')
                  setShowQuickAddModal(true)
                }}
                onAddExpense={() => {
                  setQuickAddType('expense')
                  setShowQuickAddModal(true)
                }}
              />
              <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-3 rounded-2xl border border-white/70 bg-white/90 p-1.5 shadow-[0_12px_40px_rgba(15,23,42,0.16)] backdrop-blur-xl dark:border-white/10 dark:bg-[#151d29]/90 md:hidden">
                {[
                  [TAB_IDS.DASHBOARD, Home, t('nav.dashboard')],
                  [TAB_IDS.TRANSACTIONS, List, t('nav.transactions')],
                  [TAB_IDS.CATEGORIES, Tag, t('nav.categories')]
                ].map(([id, Icon, label]) => {
                  const tabId = id as TabId
                  const NavIcon = Icon as React.ComponentType<{
                    size?: number
                    strokeWidth?: number
                  }>
                  return (
                    <button
                      key={tabId}
                      onClick={() => setActiveTab(tabId)}
                      aria-current={activeTab === tabId ? 'page' : undefined}
                      className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold ${
                        activeTab === tabId
                          ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      <NavIcon size={18} strokeWidth={activeTab === tabId ? 2.4 : 1.8} />
                      <span className="truncate">{label as string}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </>
        )}
      </div>

      {showSettings && (
        <SettingsModal
          version={appVersion}
          transactions={transactions}
          onClose={() => setShowSettings(false)}
          onRefresh={loadData}
        />
      )}
      {showQuickAddModal && (
        <QuickAddModal
          initialType={quickAddType}
          categories={categories}
          onClose={() => setShowQuickAddModal(false)}
          onSuccess={loadData}
        />
      )}
    </div>
  )
}
