import { useState, type JSX } from 'react'
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react'
import Modal from './Modal'
import { useL } from '../i18n'
import { type Category } from '../types'

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
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)

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
    if (!formData.name) return
    await window.api.addCategory(formData)
    setShowAddModal(false)
    setFormData({ name: '', type: 'expense', icon: 'Tag', color: defaultColor })
    onRefresh()
  }

  const handleUpdate = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!editData.name) return
    await window.api.updateCategory(editData)
    setEditingId(null)
    onRefresh()
  }

  const handleDelete = async (id: number): Promise<void> => {
    await window.api.deleteCategory(id)
    setConfirmDeleteId(null)
    onRefresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('categories.title')}</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={20} />
          <span className="hidden md:inline">{t('categories.addNew')}</span>
        </button>
      </div>

      <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 dark:border-gray-700/50 overflow-hidden transition-all duration-300">
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
                            onClick={() => setEditingId(null)}
                            className="text-gray-500 p-1"
                          >
                            <X size={20} />
                          </button>
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
        <Modal>
          <h3 className="text-xl font-bold mb-4">{t('categories.addModalTitle')}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('categories.typeLabel')}</label>
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
              <label className="block text-sm font-medium mb-1">{t('categories.nameLabel')}</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('categories.colorLabel')}</label>
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
                onClick={() => setShowAddModal(false)}
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
          </form>
        </Modal>
      )}
    </div>
  )
}
