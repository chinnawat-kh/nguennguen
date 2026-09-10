import { useState, type JSX } from 'react'
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react'
import Modal from './Modal'
import { useL } from '../i18n'
import { type Category } from '../types'
import { useToast } from './toastContext'

interface CategoriesProps {
  categories: Category[]
  onRefresh: () => void
}

const defaultColor = '#3b82f6'
const pastelColors = [
  '#f87171',
  '#fb923c',
  '#fbbf24',
  '#34d399',
  '#38bdf8',
  '#818cf8',
  '#c084fc',
  '#f472b6'
]

export default function Categories({ categories, onRefresh }: CategoriesProps): JSX.Element {
  const { t } = useL()
  const { showToast } = useToast()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  const closeAdd = (): void => {
    if (saving) return
    const dirty =
      formData.name !== '' || formData.type !== 'expense' || formData.color !== defaultColor
    if (dirty && !window.confirm(t('transactions.discardChanges'))) return
    setShowAddModal(false)
    setFormData({ name: '', type: 'expense', icon: 'Tag', color: defaultColor })
  }

  const cancelEdit = (): void => {
    if (saving) return
    const original = categories.find((category) => category.id === editingId)
    if (
      original &&
      JSON.stringify(original) !== JSON.stringify(editData) &&
      !window.confirm(t('transactions.discardChanges'))
    )
      return
    setEditingId(null)
  }

  const [formData, setFormData] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense',
    icon: 'Tag',
    color: defaultColor
  })

  const [editData, setEditData] = useState<Category>({
    id: 0,
    name: '',
    type: 'expense',
    icon: 'Tag',
    color: defaultColor
  })

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (saving || !formData.name.trim()) return
    setSaving(true)
    try {
      await window.api.addCategory({ ...formData, name: formData.name.trim() })
      setShowAddModal(false)
      setFormData({ name: '', type: 'expense', icon: 'Tag', color: defaultColor })
      onRefresh()
      showToast(t('common.saved'), 'success')
    } catch {
      showToast(t('common.saveFailed'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (saving || !editData.name.trim()) return
    setSaving(true)
    try {
      await window.api.updateCategory({ ...editData, name: editData.name.trim() })
      setEditingId(null)
      onRefresh()
      showToast(t('common.saved'), 'success')
    } catch {
      showToast(t('common.saveFailed'), 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number): Promise<void> => {
    await window.api.deleteCategory(id)
    setConfirmDeleteId(null)
    onRefresh()
    showToast(t('common.deleted'), 'success')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            {t('nav.categories')}
          </p>
          <h2 className="text-2xl font-extrabold tracking-[-0.035em] text-slate-950 dark:text-white md:text-3xl">
            {t('categories.title')}
          </h2>
        </div>
        <button onClick={() => setShowAddModal(true)} className="button-primary">
          <Plus size={20} />
          <span className="hidden md:inline">{t('categories.addNew')}</span>
        </button>
      </div>

      <div className="space-y-3 md:hidden">
        {categories.length === 0 ? (
          <div className="surface-card p-8 text-center text-sm text-slate-400">
            {t('common.noData')}
          </div>
        ) : (
          categories.map((category) => (
            <div key={category.id} className="surface-card p-4">
              {editingId === category.id ? (
                <form onSubmit={handleUpdate} className="space-y-3">
                  <fieldset disabled={saving} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={editData.color}
                        onChange={(event) =>
                          setEditData({ ...editData, color: event.target.value })
                        }
                        className="h-10 w-10 shrink-0 cursor-pointer rounded-lg"
                      />
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(event) => setEditData({ ...editData, name: event.target.value })}
                        className="control min-w-0 flex-1 bg-white px-3 py-2 dark:bg-slate-800"
                        required
                      />
                    </div>
                    <select
                      value={editData.type}
                      onChange={(event) =>
                        setEditData({
                          ...editData,
                          type: event.target.value as 'income' | 'expense'
                        })
                      }
                      className="control w-full bg-white px-3 py-2 dark:bg-slate-800"
                    >
                      <option value="expense">{t('common.expense')}</option>
                      <option value="income">{t('common.income')}</option>
                    </select>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={cancelEdit} className="button-quiet">
                        {t('common.cancel')}
                      </button>
                      <button type="submit" className="button-primary">
                        {t('common.save')}
                      </button>
                    </div>
                  </fieldset>
                </form>
              ) : (
                <div className="flex items-center gap-3">
                  <span
                    className="h-11 w-11 shrink-0 rounded-xl"
                    style={{ backgroundColor: category.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-slate-900 dark:text-white">
                      {category.name}
                    </p>
                    <p
                      className={`text-xs font-semibold ${category.type === 'income' ? 'text-emerald-600' : 'text-rose-500'}`}
                    >
                      {category.type === 'income' ? t('common.income') : t('common.expense')}
                    </p>
                  </div>
                  {confirmDeleteId === category.id ? (
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <button onClick={() => handleDelete(category.id)} className="text-rose-600">
                        {t('common.confirm')}
                      </button>
                      <button onClick={() => setConfirmDeleteId(null)} className="text-slate-500">
                        {t('common.cancel')}
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingId(category.id)
                          setEditData(category)
                        }}
                        className="icon-button text-slate-500"
                      >
                        <Edit2 size={17} />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(category.id)}
                        className="icon-button text-rose-500"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="surface-card hidden overflow-hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/50">
            <thead className="bg-gray-50 dark:bg-gray-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('categories.colorCol')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('categories.nameCol')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('categories.typeCol')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('categories.manageCol')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <svg
                        className="w-16 h-16 text-gray-300 dark:text-gray-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                      <p className="text-gray-400 dark:text-gray-500">{t('common.noData')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                categories.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    {editingId === c.id ? (
                      <td colSpan={4} className="px-6 py-4">
                        <form onSubmit={handleUpdate} className="flex items-center space-x-4">
                          <fieldset
                            disabled={saving}
                            className="flex items-center space-x-4 w-full"
                          >
                            <input
                              type="color"
                              value={editData.color}
                              onChange={(e) => setEditData({ ...editData, color: e.target.value })}
                              className="h-8 w-8 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={editData.name}
                              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                              className="px-3 py-1 border rounded bg-white dark:bg-gray-700 flex-1"
                              required
                            />
                            <select
                              value={editData.type}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  type: e.target.value as 'income' | 'expense'
                                })
                              }
                              className="px-3 py-1 border rounded bg-white dark:bg-gray-700"
                            >
                              <option value="expense">{t('common.expense')}</option>
                              <option value="income">{t('common.income')}</option>
                            </select>
                            <button type="submit" className="text-green-600 p-1">
                              <Check size={20} />
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="text-gray-500 p-1"
                            >
                              <X size={20} />
                            </button>
                          </fieldset>
                        </form>
                      </td>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div
                            className="w-6 h-6 rounded-full"
                            style={{ backgroundColor: c.color }}
                          ></div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium">{c.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {c.type === 'income' ? (
                            <span className="text-green-600">{t('common.income')}</span>
                          ) : (
                            <span className="text-rose-500">{t('common.expense')}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {confirmDeleteId === c.id ? (
                            <span className="inline-flex items-center gap-1 text-xs">
                              <button
                                onClick={() => handleDelete(c.id)}
                                className="text-green-600 hover:text-green-700 font-semibold"
                              >
                                {t('common.confirm')}
                              </button>
                              <span className="text-gray-300 dark:text-gray-600">/</span>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                {t('common.cancel')}
                              </button>
                            </span>
                          ) : (
                            <span className="space-x-2">
                              <button
                                onClick={() => {
                                  setEditingId(c.id)
                                  setEditData(c)
                                }}
                                className="text-teal-500 hover:text-teal-700"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(c.id)}
                                className="text-rose-500 hover:text-rose-700"
                              >
                                <Trash2 size={18} />
                              </button>
                            </span>
                          )}
                        </td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <Modal onClose={closeAdd} labelledBy="category-modal-title">
          <h3 id="category-modal-title" className="text-xl font-bold mb-4">
            {t('categories.addModalTitle')}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <fieldset disabled={saving} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('categories.typeLabel')}
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="catType"
                      value="expense"
                      checked={formData.type === 'expense'}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })
                      }
                      className="text-rose-500"
                    />
                    <span>{t('categories.expense')}</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="catType"
                      value="income"
                      checked={formData.type === 'income'}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })
                      }
                      className="text-green-500"
                    />
                    <span>{t('categories.income')}</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('categories.nameLabel')}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('categories.namePlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {t('categories.colorLabel')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {pastelColors.map((color) => (
                    <button
                      type="button"
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-full border-2 ${formData.color === color ? 'border-gray-900 dark:border-white' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    ></button>
                  ))}
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeAdd}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors"
                >
                  {t('common.save')}
                </button>
              </div>
            </fieldset>
          </form>
        </Modal>
      )}
    </div>
  )
}
