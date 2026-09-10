import { useState, type JSX } from 'react'
import { useL } from '../i18n'
import { type Category } from '../types'
import DateInput from './DateInput'
import { isValidISODate } from '../dateUtils'

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
  onDirtyChange?: (dirty: boolean) => void
  onSubmittingChange?: (submitting: boolean) => void
}

export default function TransactionForm({
  initialValues,
  categories,
  onSubmit,
  onCancel,
  onDirtyChange,
  onSubmittingChange
}: TransactionFormProps): JSX.Element {
  const { t } = useL()
  const [formData, setFormData] = useState<TransactionFormData>(initialValues)
  const [submitting, setSubmitting] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [errors, setErrors] = useState<Partial<Record<keyof TransactionFormData, string>>>({})

  const updateFormData = (nextData: TransactionFormData): void => {
    setFormData(nextData)
    onDirtyChange?.(JSON.stringify(nextData) !== JSON.stringify(initialValues))
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    const nextErrors: typeof errors = {}
    if (
      !formData.amount ||
      !Number.isFinite(Number(formData.amount)) ||
      Number(formData.amount) <= 0
    )
      nextErrors.amount = t('validation.amountPositive')
    if (!formData.category_id) nextErrors.category_id = t('validation.categoryRequired')
    if (!isValidISODate(formData.date)) nextErrors.date = t('validation.dateRequired')
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setSubmitting(true)
    onSubmittingChange?.(true)
    setSaveError('')
    try {
      await onSubmit(formData)
    } catch {
      setSaveError(t('common.saveFailed'))
    } finally {
      setSubmitting(false)
      onSubmittingChange?.(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {saveError && (
        <p role="alert" className="field-error">
          {saveError}
        </p>
      )}
      <fieldset disabled={submitting} className="space-y-4">
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
                  updateFormData({
                    ...formData,
                    type: e.target.value as 'income' | 'expense',
                    category_id: ''
                  })
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
                  updateFormData({
                    ...formData,
                    type: e.target.value as 'income' | 'expense',
                    category_id: ''
                  })
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
            min="0.01"
            required
            value={formData.amount}
            onChange={(e) => updateFormData({ ...formData, amount: e.target.value })}
            aria-invalid={!!errors.amount}
            aria-describedby={errors.amount ? 'amount-error' : undefined}
            className="control w-full px-3 py-2 bg-white dark:bg-slate-900 focus:outline-none"
            placeholder={t('transactions.placeholder')}
            autoFocus
          />
          {errors.amount && (
            <p id="amount-error" className="field-error">
              {errors.amount}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            {t('transactions.categoryLabel')}
          </label>
          <select
            required
            value={formData.category_id}
            onChange={(e) => updateFormData({ ...formData, category_id: e.target.value })}
            className="control w-full px-3 py-2 bg-white dark:bg-slate-900 focus:outline-none"
            aria-invalid={!!errors.category_id}
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
          {errors.category_id && <p className="field-error">{errors.category_id}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t('transactions.dateLabel')}</label>
          <DateInput
            value={formData.date}
            onChange={(date) => updateFormData({ ...formData, date })}
            className="control w-full px-3 py-2 bg-white dark:bg-slate-900 text-sm focus:outline-none"
          />
          {errors.date && <p className="field-error">{errors.date}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t('transactions.noteLabel')}</label>
          <input
            type="text"
            value={formData.note}
            onChange={(e) => updateFormData({ ...formData, note: e.target.value })}
            className="control w-full px-3 py-2 bg-white dark:bg-slate-900 focus:outline-none"
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
          <button type="submit" disabled={submitting} className="button-primary">
            {t('common.save')}
          </button>
        </div>
      </fieldset>
    </form>
  )
}
