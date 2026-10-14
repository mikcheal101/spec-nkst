import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { showSuccessToast, showErrorToast } from '../shared/utils/swal'
import { useContributionsList, useRecordContribution } from '../hooks/useContributions'
import DataTable from '../shared/components/DataTable'

const contributionTypes = ['tithe', 'offering', 'firstFruit', 'thanksgiving', 'buildingFund', 'mission', 'other']
const currencies = ['NGN', 'USD']

export default function Contributions() {
  const { t } = useTranslation()
  const { data: records = [], isLoading } = useContributionsList()
  const recordMut = useRecordContribution()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ amount: '', currency: 'NGN', type: 'tithe', notes: '', contributorName: '' })

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.amount || !form.contributorName.trim()) {
      showErrorToast(t('validation.requiredFields'))
      return
    }
    try {
      await recordMut.mutateAsync({
        amount: parseFloat(form.amount),
        currency: form.currency,
        type: form.type,
        notes: form.notes,
        contributorName: form.contributorName,
      })
      showSuccessToast(t('contributions.createSuccess'))
      setShowForm(false)
      setForm({ amount: '', currency: 'NGN', type: 'tithe', notes: '', contributorName: '' })
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'Record failed')
    }
  }

  const columns = [
    { key: 'contributorName', header: t('contributions.member') },
    {
      key: 'amount', header: t('contributions.amount'),
      render: (r: any) => `${r.currency} ${r.amount?.toLocaleString()}`,
    },
    { key: 'type', header: t('contributions.type'), render: (r: any) => t(`contributions.${r.type}`) },
    { key: 'createdAt', header: t('contributions.date'), render: (r: any) => new Date(r.createdAt).toLocaleDateString() },
    { key: 'notes', header: t('contributions.notes') },
  ]

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">{t('contributions.title')}</h2>
          <p className="page-subtitle">{t('contributions.description')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>{t('contributions.newContribution')}</button>
      </div>

      <DataTable columns={columns as any} data={records as any} loading={isLoading} />

      {showForm && (
        <div className="dialog-overlay" onClick={() => setShowForm(false)}>
          <div className="dialog dialog-lg" onClick={(e) => e.stopPropagation()}>
            <h3>{t('contributions.newContribution')}</h3>
            <form onSubmit={handleSubmit} className="dialog-form">
              <div className="form-row">
                <div className="form-group">
                  <label>{t('contributions.member')} <span className="required">*</span></label>
                  <input value={form.contributorName} onChange={(e) => setForm({ ...form, contributorName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>{t('contributions.amount')} <span className="required">*</span></label>
                  <input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('contributions.currency')}</label>
                  <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                    {currencies.map((c) => <option key={c} value={c}>{t(`contributions.${c.toLowerCase()}`)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>{t('contributions.type')}</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    {contributionTypes.map((ct) => <option key={ct} value={ct}>{t(`contributions.${ct}`)}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>{t('contributions.notes')}</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
              </div>
              <div className="dialog-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>{t('common.cancel')}</button>
                <button type="submit" className="btn btn-primary" disabled={recordMut.isPending}>
                  {recordMut.isPending ? t('common.loading') : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
