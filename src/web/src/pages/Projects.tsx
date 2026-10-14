import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { showSuccessToast, showErrorToast } from '../shared/utils/swal'
import { usePendingTasks, useTakeAction } from '../hooks/useWorkflows'
import DataTable from '../shared/components/DataTable'

interface PendingTask {
  stepId: string
  workflowId: string
  requestType: string
  resourceId: string
  stepName: string
  createdAt: string
}

interface WorkflowInstance {
  id: string
  requestType: string
  resourceId: string
  initiatorId: string
  status: string
  currentStepOrder: number
  createdAt: string
}

export default function Projects() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<'pending' | 'all'>('pending')
  const { data: pendingData, isLoading } = usePendingTasks()
  const takeActionMut = useTakeAction()

  const pending: PendingTask[] = Array.isArray(pendingData)
    ? pendingData as PendingTask[]
    : (pendingData as any)?.content || []

  const workflows: WorkflowInstance[] = [
    { id: 'wf-1', requestType: 'CONTRIBUTION_PROJECT', resourceId: 'proj-1', initiatorId: 'admin', status: 'APPROVED', currentStepOrder: 1, createdAt: new Date().toISOString() },
    { id: 'wf-2', requestType: 'EVENT_BOOKING', resourceId: 'evt-1', initiatorId: 'admin', status: 'REJECTED', currentStepOrder: 0, createdAt: new Date().toISOString() },
    { id: 'wf-3', requestType: 'MEMBER_REGISTRATION', resourceId: 'mem-1', initiatorId: 'admin', status: 'IN_PROGRESS', currentStepOrder: 1, createdAt: new Date().toISOString() },
  ]

  async function handleApprove(stepId: string) {
    try {
      await takeActionMut.mutateAsync({ stepId, data: { action: 'APPROVE', comments: '' } })
      showSuccessToast('Step approved')
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'Action failed')
    }
  }

  async function handleReject(stepId: string) {
    try {
      await takeActionMut.mutateAsync({ stepId, data: { action: 'REJECT', comments: '' } })
      showSuccessToast('Step rejected')
    } catch (err) {
      showErrorToast(err instanceof Error ? err.message : 'Action failed')
    }
  }

  const pendingCols = [
    { key: 'requestType', header: 'Project Type', render: (t: PendingTask) => t.requestType.replace(/_/g, ' ') },
    { key: 'stepName', header: 'Step' },
    { key: 'createdAt', header: 'Created', render: (t: PendingTask) => new Date(t.createdAt).toLocaleDateString() },
    { key: 'actions', header: t('common.actions'), render: (t: PendingTask) => (
      <div className="table-actions">
        <button className="btn btn-sm" style={{ background: '#2e7d32', color: '#fff' }} onClick={() => handleApprove(t.stepId)} disabled={takeActionMut.isPending}>✓ Approve</button>
        <button className="btn btn-sm" style={{ background: '#c62828', color: '#fff' }} onClick={() => handleReject(t.stepId)} disabled={takeActionMut.isPending}>✗ Reject</button>
      </div>
    )},
  ]

  const workflowCols = [
    { key: 'id', header: 'ID' },
    { key: 'requestType', header: 'Type', render: (w: WorkflowInstance) => w.requestType.replace(/_/g, ' ') },
    { key: 'status', header: t('common.status'), render: (w: WorkflowInstance) => (
      <span className={`badge badge-${w.status === 'APPROVED' ? 'success' : w.status === 'REJECTED' ? 'danger' : 'secondary'}`}>{w.status}</span>
    )},
    { key: 'currentStepOrder', header: 'Step' },
    { key: 'createdAt', header: 'Created', render: (w: WorkflowInstance) => new Date(w.createdAt).toLocaleDateString() },
  ]

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Projects</h2>
          <p className="page-subtitle">Approval workflows and project tracking</p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab${tab === 'pending' ? ' active' : ''}`} onClick={() => setTab('pending')}>⏳ Pending Approval</button>
        <button className={`tab${tab === 'all' ? ' active' : ''}`} onClick={() => setTab('all')}>📋 All Projects</button>
      </div>

      {tab === 'pending' ? (
        <DataTable columns={pendingCols as any} data={pending as any} loading={isLoading} emptyMessage="No pending approval tasks" />
      ) : (
        <DataTable columns={workflowCols as any} data={workflows as any} loading={isLoading} emptyMessage="No projects found" />
      )}
    </div>
  )
}
