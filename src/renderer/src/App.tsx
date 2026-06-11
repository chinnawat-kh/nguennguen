import { useState, useEffect } from 'react'
import { Home, List, Tag, Download, Sun, Moon, Globe, Menu, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import Dashboard from './components/Dashboard'
import Transactions from './components/Transactions'
import Categories from './components/Categories'
import SetupWizard from './components/SetupWizard'
import { useL } from './i18n'

const STORAGE_KEY = 'nguennguen-lang'

export default function App() {
  const [firstRun, setFirstRun] = useState<boolean | null>(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('nguennguen-dark') === 'true')
  const [transactions, setTransactions] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [budget, setBudget] = useState<number>(0)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { t, lang, setLang } = useL()

  useEffect(() => {
    setFirstRun(!localStorage.getItem(STORAGE_KEY))
  }, [])

  useEffect(() => {
    localStorage.setItem('nguennguen-dark', String(darkMode))
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const txs = await window.api.getTransactions()
      setTransactions(txs)
      const cats = await window.api.getCategories()
      setCategories(cats)
      const currentMonth = new Date().toISOString().substring(0, 7)
      const b = await window.api.getBudget(currentMonth)
      if (b) setBudget(b.amount)
    } catch (e) {
      console.error(e)
    }
  }

  const totalIncome = transactions
    .filter((tx: any) => tx.type === 'income')
    .reduce((sum: number, tx: any) => sum + tx.amount, 0)
  const totalExpense = transactions
    .filter((tx: any) => tx.type === 'expense')
    .reduce((sum: number, tx: any) => sum + tx.amount, 0)
  const balance = totalIncome - totalExpense

  const handleExport = () => {
    const ws = XLSX.utils.json_to_sheet(
      transactions.map((tx) => ({
        [t('export.dateCol')]: tx.date,
        [t('export.typeCol')]: tx.type === 'income' ? t('export.income') : t('export.expense'),
        [t('export.categoryCol')]: tx.category_name,
        [t('export.amountCol')]: tx.amount,
        [t('export.noteCol')]: tx.note
      }))
    )
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, t('export.sheetName'))
    XLSX.writeFile(wb, 'nguennguen-export.xlsx')
  }

  const NavItem = ({ id, icon: Icon, label }: any) => (
    <button
      onClick={() => {
        setActiveTab(id)
        setIsSidebarOpen(false)
      }}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${
        activeTab === id
          ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 shadow-sm transform scale-105'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:translate-x-1'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  )

  if (firstRun === null) return null

  if (firstRun) {
    return <SetupWizard onDone={() => setFirstRun(false)} />
  }

  return (
    <div className="flex h-screen w-screen bg-gray-50 dark:bg-[#121212] text-gray-800 dark:text-gray-100 font-sans transition-colors duration-300 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:relative z-50 h-full w-64 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-r border-gray-200/50 dark:border-gray-700/50 flex flex-col transition-transform duration-300 ease-in-out transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          <h1 className="text-2xl font-black bg-gradient-to-r from-blue-500 to-teal-400 bg-clip-text text-transparent">
            {t('app.name')}
          </h1>
          <button className="md:hidden text-gray-500" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <NavItem id="dashboard" icon={Home} label={t('nav.dashboard')} />
          <NavItem id="transactions" icon={List} label={t('nav.transactions')} />
          <NavItem id="categories" icon={Tag} label={t('nav.categories')} />
        </nav>
        <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
              {t('dashboard.balanceLabel')}
            </span>
            <span
              className={`text-sm font-bold ${balance >= 0 ? 'text-blue-500' : 'text-pink-500'}`}
            >
              ฿{balance.toLocaleString()}
            </span>
          </div>
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <Download size={18} />
            <span className="font-semibold">{t('nav.exportExcel')}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Topbar */}
        <header className="h-16 flex-shrink-0 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Menu size={24} />
          </button>
          <div className="flex-1"></div>
          <button
            onClick={() => setLang(lang === 'en' ? 'th' : 'en')}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-all duration-300 text-sm font-semibold"
          >
            <Globe size={16} />
            <span>{lang === 'en' ? 'EN' : 'TH'}</span>
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-all duration-300 transform hover:scale-110"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-4 md:p-8 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
          <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'dashboard' && (
              <Dashboard transactions={transactions} budget={budget} setBudget={setBudget} />
            )}
            {activeTab === 'transactions' && (
              <Transactions
                transactions={transactions}
                categories={categories}
                onRefresh={loadData}
              />
            )}
            {activeTab === 'categories' && (
              <Categories categories={categories} onRefresh={loadData} />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
