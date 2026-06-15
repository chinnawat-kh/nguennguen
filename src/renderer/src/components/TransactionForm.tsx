import { useState, type JSX } from 'react'
import { useL } from '../i18n'
import { type Category } from '../types'
import DateInput from './DateInput'

export interface TransactionFormData {
  type: 'income' | 'expense'
  amount: string
  category_id: string
  date: string
  note: string
}

interface TransactionFormProps {
  initialValues: TransactionFormData
  categories: Category[]
  onSubmit: (data: TransactionFormData) => Promise<void>
  onCancel: () => void
}

export default function TransactionForm({
  initialValues,
  categories,
  onSubmit,
  onCancel
}: TransactionFormProps): JSX.Element {
  const { t } = useL()
  const [formData, setFormData] = useState<TransactionFormData>(initialValues)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!formData.amount || !formData.category_id) return
    setSubmitting(true)
    try {
      await onSubmit(formData)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">{t('transactions.typeLabel')}</label>
        <div className="flex space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="type"
              value="expense"
              checked={formData.type === 'expense'}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })
              }
              className="text-rose-500"
            />
            <span>{t('transactions.expense')}</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              name="type"
              value="income"
              checked={formData.type === 'income'}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })
              }
              className="text-green-500"
            />
            <span>{t('transactions.income')}</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">{t('transactions.amountLabel')}</label>
        <input
          type="number"
          step="0.01"
          required
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder={t('transactions.placeholder')}
          autoFocus
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">{t('transactions.categoryLabel')}</label>
        <select
          required
          value={formData.category_id}
          onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">{t('transactions.selectCategory')}</option>
          {categories
            .filter((c) => c.type === formData.type)
            .map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">{t('transactions.dateLabel')}</label>
        <DateInput
          value={formData.date}
          onChange={(date) => setFormData({ ...formData, date })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">{t('transactions.noteLabel')}</label>
        <input
          type="text"
          value={formData.note}
          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder={t('common.optional')}
        />
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          disabled={submitting}
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          {t('common.save')}
        </button>
      </div>
    </form>
  )
}
