import { type JSX } from 'react'
import Modal from './Modal'
import TransactionForm, { type TransactionFormData } from './TransactionForm'
import { useL } from '../i18n'
import { type Category } from '../types'

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
  }

  return (
    <Modal>
      <h3 className="text-xl font-bold mb-4">{t('transactions.addModalTitle')}</h3>
      <TransactionForm
        initialValues={{
          type: initialType,
          amount: '',
          category_id: '',
          date: new Date().toISOString().substring(0, 10),
          note: ''
        }}
        categories={categories}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  )
}
