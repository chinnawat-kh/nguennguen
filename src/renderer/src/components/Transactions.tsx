import { useState, useMemo, useEffect, type JSX } from 'react'
import { Plus } from 'lucide-react'
import Modal from './Modal'
import TransactionForm, { type TransactionFormData } from './TransactionForm'
import TransactionFilters from './TransactionFilters'
import TransactionTable from './TransactionTable'
import { useL } from '../i18n'
import { type Transaction, type Category, type FilterMode } from '../types'
import { filterByMode, getCurrentDay } from '../dateUtils'
import { useToast } from './toastContext'

const PAGE_SIZE = 50

const defaultFormData: TransactionFormData = {
  type: 'expense',
  amount: '',
  category_id: '',
  date: getCurrentDay(),
  note: ''
}

interface TransactionsProps {
  transactions: Transaction[]
  categories: Category[]
  onRefresh: () => void
}

export default function Transactions({
  transactions,
  categories,
  onRefresh
}: TransactionsProps): JSX.Element {
  const { t } = useL()
  const { showToast } = useToast()
  const [filterMode, setFilterMode] = useState<FilterMode>('monthly')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTx, setEditingTx] = useState<Transaction | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<number | ''>('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [sortField, setSortField] = useState('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [formValues, setFormValues] = useState<TransactionFormData>(defaultFormData)
  const [isFormDirty, setIsFormDirty] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        setEditingTx(null)
        setFormValues(defaultFormData)
        setIsFormDirty(false)
        setShowAddModal(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const filteredTxs = useMemo(() => {
    let result = filterByMode(transactions, filterMode)

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (tx) =>
          (tx.note && tx.note.toLowerCase().includes(q)) ||
          String(tx.amount).includes(q) ||
          (tx.category_name && tx.category_name.toLowerCase().includes(q))
      )
    }

    if (filterCategory !== '') {
      result = result.filter((tx) => tx.category_id === filterCategory)
    }

    if (filterFrom) {
      result = result.filter((tx) => tx.date >= filterFrom)
    }
    if (filterTo) {
      result = result.filter((tx) => tx.date <= filterTo)
    }

    result.sort((a, b) => {
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

  const handleSort = (field: string): void => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('desc')
    }
    setPage(1)
  }

  const handleSubmit = async (data: TransactionFormData): Promise<void> => {
    await window.api.addTransaction({
      type: data.type,
      amount: Number(data.amount),
      category_id: Number(data.category_id),
      date: data.date,
      note: data.note
    })
    setShowAddModal(false)
    setEditingTx(null)
    setFormValues(defaultFormData)
    setIsFormDirty(false)
    onRefresh()
    showToast(t('common.saved'), 'success')
  }

  const handleUpdate = async (data: TransactionFormData): Promise<void> => {
    if (!editingTx) return
    await window.api.updateTransaction({
      id: editingTx.id,
      type: data.type,
      amount: Number(data.amount),
      category_id: Number(data.category_id),
      date: data.date,
      note: data.note
    })
    setShowAddModal(false)
    setEditingTx(null)
    setFormValues(defaultFormData)
    setIsFormDirty(false)
    onRefresh()
    showToast(t('common.saved'), 'success')
  }

  const handleEdit = (tx: Transaction): void => {
    setIsFormDirty(false)
    setEditingTx(tx)
    setFormValues({
      type: tx.type,
      amount: String(tx.amount),
      category_id: tx.category_id === null ? '' : String(tx.category_id),
      date: tx.date,
      note: tx.note || ''
    })
    setShowAddModal(true)
  }

  const handleDelete = async (id: number): Promise<void> => {
    await window.api.deleteTransaction(id)
    setConfirmDeleteId(null)
    onRefresh()
    showToast(t('common.deleted'), 'success')
  }

  const handleModalCancel = (): void => {
    if (isFormDirty && !window.confirm(t('transactions.discardChanges'))) return
    setShowAddModal(false)
    setEditingTx(null)
    setFormValues(defaultFormData)
    setIsFormDirty(false)
  }

  const handleResetFilters = (): void => {
    setSearchQuery('')
    setFilterCategory('')
    setFilterFrom('')
    setFilterTo('')
    setPage(1)
  }

  const hasActiveFilters = !!(searchQuery || filterCategory !== '' || filterFrom || filterTo)

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            {t('nav.transactions')}
          </p>
          <h2 className="text-2xl font-extrabold tracking-[-0.035em] text-slate-950 dark:text-white md:text-3xl">
            {t('transactions.title')}
          </h2>
        </div>
        <button
          onClick={() => {
            setIsFormDirty(false)
            setShowAddModal(true)
          }}
          className="button-primary"
        >
          <Plus size={20} />
          <span className="hidden md:inline">{t('transactions.addNew')}</span>
        </button>
      </div>

      <TransactionFilters
        searchQuery={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val)
          setPage(1)
        }}
        filterMode={filterMode}
        onFilterModeChange={(val) => {
          setFilterMode(val)
          setPage(1)
        }}
        filterCategory={filterCategory}
        onFilterCategoryChange={(val) => {
          setFilterCategory(val)
          setPage(1)
        }}
        filterFrom={filterFrom}
        onFilterFromChange={(val) => {
          setFilterFrom(val)
          setPage(1)
        }}
        filterTo={filterTo}
        onFilterToChange={(val) => {
          setFilterTo(val)
          setPage(1)
        }}
        onReset={handleResetFilters}
        categories={categories}
        hasActiveFilters={hasActiveFilters}
      />

      <TransactionTable
        transactions={paginatedTxs}
        sortField={sortField}
        sortDir={sortDir}
        onSort={handleSort}
        onEdit={handleEdit}
        onDelete={handleDelete}
        confirmDeleteId={confirmDeleteId}
        setConfirmDeleteId={setConfirmDeleteId}
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        startIdx={startIdx}
        filteredCount={filteredTxs.length}
        hasActiveFilters={hasActiveFilters}
      />

      {showAddModal && (
        <Modal onClose={handleModalCancel} labelledBy="transaction-modal-title">
          <h3 id="transaction-modal-title" className="text-xl font-bold mb-4">
            {editingTx ? t('transactions.editLabel') : t('transactions.addModalTitle')}
          </h3>
          <TransactionForm
            key={editingTx?.id ?? 'new'}
            initialValues={formValues}
            categories={categories}
            onSubmit={editingTx ? handleUpdate : handleSubmit}
            onCancel={handleModalCancel}
            onDirtyChange={setIsFormDirty}
          />
        </Modal>
      )}
    </div>
  )
}
