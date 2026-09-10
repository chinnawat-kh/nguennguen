import { useState, type JSX } from 'react'
import { useL } from '../i18n'

export default function BackupSection({
  onRefresh,
  onBusyChange
}: {
  onRefresh: () => void
  onBusyChange: (busy: boolean) => void
}): JSX.Element {
  const { t } = useL()
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)
  const run = async (restore: boolean): Promise<void> => {
    if (busy) return
    setBusy(true)
    onBusyChange(true)
    setMessage('')
    setFailed(false)
    try {
      const path = restore ? await window.api.importBackup() : await window.api.exportBackup()
      if (path) {
        if (restore) onRefresh()
        setMessage(t(restore ? 'backup.restored' : 'backup.saved', { path }))
      }
    } catch {
      setFailed(true)
      setMessage(t('backup.failed'))
    } finally {
      setBusy(false)
      onBusyChange(false)
    }
  }
  return (
    <section className="space-y-3">
      <h3 className="font-semibold">{t('backup.title')}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400">{t('backup.description')}</p>
      <div className="flex flex-wrap gap-2">
        <button disabled={busy} onClick={() => run(false)} className="button-primary">
          {t('backup.export')}
        </button>
        <button disabled={busy} onClick={() => run(true)} className="button-quiet">
          {t('backup.import')}
        </button>
      </div>
      {message && (
        <p role={failed ? 'alert' : 'status'} className="text-sm break-words">
          {message}
        </p>
      )}
    </section>
  )
}
