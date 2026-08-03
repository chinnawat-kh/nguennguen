import { type JSX } from 'react'
import Modal from './Modal'
import TransactionForm, { type TransactionFormData } from './TransactionForm'
import { useL } from '../i18n'
import { type Category } from '../types'
import { getCurrentDay } from '../dateUtils'
import { useToast } from './toastContext'

interface QuickAddModalProps {
  initialType: 'income' | 'expense'
  categories: Category[]
  onClose: () => void
  onSuccess: () => void
}

export default function QuickAddModal({
  initialType,
  categories,
  onClose,
  onSuccess
}: QuickAddModalProps): JSX.Element {
  const { t } = useL()
  const { showToast } = useToast()

  const handleSubmit = async (data: TransactionFormData): Promise<void> => {
    await window.api.addTransaction({
      type: data.type,
      amount: Number(data.amount),
      category_id: Number(data.category_id),
      date: data.date,
      note: data.note
    })
    onSuccess()
    onClose()
    showToast(t('common.saved'), 'success')
  }

  return (
    <Modal onClose={onClose} labelledBy="quick-add-title">
      <h3 id="quick-add-title" className="text-xl font-bold mb-4">
        {t('transactions.addModalTitle')}
      </h3>
      <TransactionForm
        initialValues={{
          type: initialType,
          amount: '',
          category_id: '',
          date: getCurrentDay(),
          note: ''
        }}
        categories={categories}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  )
}
