import { useState, useEffect, useCallback, type JSX } from 'react'
import { Home, List, Tag } from 'lucide-react'
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

interface NavItemProps {
  id: TabId
  icon: React.ComponentType<{ size?: number }>
  label: string
  activeTab: TabId
  onClick: (id: TabId) => void
}

function NavItem({ id, icon: Icon, label, activeTab, onClick }: NavItemProps): JSX.Element {
  return (
    <button
      onClick={() => onClick(id)}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
        activeTab === id
          ? 'bg-teal-100 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 shadow-sm transform scale-105'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:translate-x-1'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  )
}

const STORAGE_KEY = 'nguennguen-lang'

export default function App(): JSX.Element {
  const [firstRun, setFirstRun] = useState<boolean>(() => !localStorage.getItem(STORAGE_KEY))
  const [activeTab, setActiveTab] = useState<TabId>(TAB_IDS.DASHBOARD)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('nguennguen-dark') === 'true')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [budget, setBudget] = useState<number>(0)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showQuickAddModal, setShowQuickAddModal] = useState(false)
  const [quickAddType, setQuickAddType] = useState<'income' | 'expense'>('expense')
  const [appVersion, setAppVersion] = useState('')
  const { t, lang, setLang } = useL()

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
      const currentMonth = new Date().toISOString().substring(0, 7)
      const b = await window.api.getBudget(currentMonth)
      if (b) setBudget(b.amount)
    } catch {
      console.error('loadData failed')
    }
  }, [])

  useEffect(() => {
    const init = async (): Promise<void> => {
      await loadData()
    }
    init()
    window.api.getAppVersion().then(setAppVersion)
  }, [loadData])

  const totalIncome = transactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0)
  const totalExpense = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + tx.amount, 0)
  const balance = totalIncome - totalExpense

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
          onToggleSidebar={() => setIsSidebarOpen(true)}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}
      <div className="flex-1 flex overflow-hidden bg-gray-50 dark:bg-[#121212] text-gray-800 dark:text-gray-100 font-sans transition-colors duration-300">
        {firstRun ? (
          <SetupWizard onDone={() => setFirstRun(false)} />
        ) : (
          <>
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
              <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden transition-opacity"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}

            {/* Sidebar */}
            <div
              className={`fixed md:relative z-50 h-full w-56 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-r border-gray-200/50 dark:border-gray-700/50 flex flex-col transition-transform duration-300 ease-in-out transform ${
                isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
              }`}
            >
              <nav className="flex-1 px-3 pt-3 space-y-1.5 overflow-y-auto">
                <NavItem
                  id={TAB_IDS.DASHBOARD}
                  icon={Home}
                  label={t('nav.dashboard')}
                  activeTab={activeTab}
                  onClick={() => {
                    setActiveTab(TAB_IDS.DASHBOARD)
                    setIsSidebarOpen(false)
                  }}
                />
                <NavItem
                  id={TAB_IDS.TRANSACTIONS}
                  icon={List}
                  label={t('nav.transactions')}
                  activeTab={activeTab}
                  onClick={() => {
                    setActiveTab(TAB_IDS.TRANSACTIONS)
                    setIsSidebarOpen(false)
                  }}
                />
                <NavItem
                  id={TAB_IDS.CATEGORIES}
                  icon={Tag}
                  label={t('nav.categories')}
                  activeTab={activeTab}
                  onClick={() => {
                    setActiveTab(TAB_IDS.CATEGORIES)
                    setIsSidebarOpen(false)
                  }}
                />
              </nav>

              {/* Balance */}
              <div className="mx-3 mb-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium mb-1">
                  {t('dashboard.balanceLabel')}
                </p>
                <p
                  className={`text-xl font-bold ${balance >= 0 ? 'text-teal-500' : 'text-rose-500'}`}
                >
                  ฿{balance.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
              <main className="flex-1 overflow-auto p-4 md:p-8 bg-gradient-to-br from-teal-50/50 to-emerald-50/50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
                <div className="max-w-6xl mx-auto animate-fade-in">
                  {activeTab === TAB_IDS.DASHBOARD && (
                    <Dashboard transactions={transactions} budget={budget} setBudget={setBudget} />
                  )}
                  {activeTab === TAB_IDS.TRANSACTIONS && (
                    <Transactions
                      transactions={transactions}
                      categories={categories}
                      onRefresh={loadData}
                    />
                  )}
                  {activeTab === TAB_IDS.CATEGORIES && (
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
