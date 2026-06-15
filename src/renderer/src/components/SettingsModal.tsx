import { type JSX } from 'react'
import { Download, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import Modal from './Modal'
import SyncSection from './SyncSection'
import AboutSection from './AboutSection'
import { useL } from '../i18n'
import { type Transaction } from '../types'
import { sectionHeader } from '../styles'

interface SettingsModalProps {
  version: string
  transactions: Transaction[]
  onClose: () => void
  onRefresh: () => void
}

export default function SettingsModal({
  version,
  transactions,
  onClose,
  onRefresh
}: SettingsModalProps): JSX.Element {
  const { t } = useL()

  return (
    <Modal size="lg" className="rounded-2xl max-h-[85vh] flex flex-col p-0">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold">{t('nav.syncSettings')}</h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <section>
          <h3 className={sectionHeader}>{t('export.sheetName')}</h3>
          <button
            onClick={() => {
              const ws = XLSX.utils.json_to_sheet(
                transactions.map((tx) => ({
                  [t('export.dateCol')]: tx.date,
                  [t('export.typeCol')]:
                    tx.type === 'income' ? t('export.income') : t('export.expense'),
                  [t('export.categoryCol')]: tx.category_name,
                  [t('export.amountCol')]: tx.amount,
                  [t('export.noteCol')]: tx.note
                }))
              )
              const wb = XLSX.utils.book_new()
              XLSX.utils.book_append_sheet(wb, ws, t('export.sheetName'))
              XLSX.writeFile(wb, t('export.fileName'))
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-500 hover:bg-teal-600 text-white rounded-xl font-medium transition-all duration-300"
          >
            <Download size={18} />
            {t('nav.exportExcel')}
          </button>
        </section>

        <section>
          <h3 className={sectionHeader}>☁️ {t('sync.sectionTitle')}</h3>
          <SyncSection onRefresh={onRefresh} />
        </section>

        <section>
          <h3 className={sectionHeader}>ℹ️ {t('about.sectionTitle')}</h3>
          <AboutSection version={version} />
        </section>
      </div>
    </Modal>
  )
}
