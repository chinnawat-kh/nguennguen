import { useState } from 'react'
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react'
import { useL } from '../i18n'

export default function Categories({ categories, onRefresh }: any) {
  const { t } = useL()
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    icon: 'Tag',
    color: '#3b82f6'
  })

  const [editData, setEditData] = useState({
    id: 0,
    name: '',
    type: 'expense',
    icon: 'Tag',
    color: '#3b82f6'
  })

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) return
    await window.api.addCategory(formData)
    setShowAddModal(false)
    setFormData({ name: '', type: 'expense', icon: 'Tag', color: '#3b82f6' })
    onRefresh()
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editData.name) return
    await window.api.updateCategory(editData)
    setEditingId(null)
    onRefresh()
  }

  const handleDelete = async (id: number) => {
    if (confirm(t('categories.confirmDelete'))) {
      await window.api.deleteCategory(id)
      onRefresh()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{t('categories.title')}</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
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
              {categories.map((c: any) => (
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
                          onChange={(e) => setEditData({ ...editData, type: e.target.value })}
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
                          <span className="text-pink-500">{t('common.expense')}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button
                          onClick={() => {
                            setEditingId(c.id)
                            setEditData(c)
                          }}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold mb-4">{t('categories.addModalTitle')}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="text-pink-500"
                    />
                    <span>{t('categories.expense')}</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="catType"
                      value="income"
                      checked={formData.type === 'income'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
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
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  {t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
