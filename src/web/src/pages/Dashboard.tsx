import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { useDashboardCounters } from '../hooks/useDashboard'
import Skeleton from '../shared/components/Skeleton'

function formatNaira(amount: number): string {
  if (amount >= 1_000_000) return '₦' + (amount / 1_000_000).toFixed(1) + 'M'
  if (amount >= 1_000) return '₦' + (amount / 1_000).toFixed(1) + 'K'
  return '₦' + amount.toLocaleString()
}

export default function Dashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { data: counters, isLoading } = useDashboardCounters()

  return (
    <div className="dashboard">
      <div className="verse-card">
        <div className="verse-text">&ldquo;{counters?.dailyMessage ?? t('verses.' + (new Date().getDate() % 5) + '.text')}&rdquo;</div>
        {!counters?.dailyMessage && <div className="verse-ref">&mdash; {t('verses.' + (new Date().getDate() % 5) + '.ref')}</div>}
      </div>

      <h2 className="page-title">{t('dashboard.welcome', { username: user?.username })}</h2>
      <p className="page-subtitle">{t('dashboard.description')}</p>

      <div className="stats-row">
        {isLoading ? (
          <>
            <Skeleton.Card rows={2} />
            <Skeleton.Card rows={2} />
            <Skeleton.Card rows={2} />
            <Skeleton.Card rows={2} />
            <Skeleton.Card rows={2} />
          </>
        ) : (
          <>
            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-card-icon green">👥</div>
              </div>
              <div className="stat-card-value">{(counters?.members ?? 0).toLocaleString()}</div>
              <div className="stat-card-label">{t('dashboard.members')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-card-icon blue">💰</div>
              </div>
              <div className="stat-card-value">{formatNaira(counters?.contributions ?? 0)}</div>
              <div className="stat-card-label">{t('dashboard.contributions')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-card-icon amber">⛪</div>
              </div>
              <div className="stat-card-value">{(counters?.churches ?? 0).toLocaleString()}</div>
              <div className="stat-card-label">{t('dashboard.churches')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-card-icon purple">📋</div>
              </div>
              <div className="stat-card-value">{(counters?.projects ?? 0).toLocaleString()}</div>
              <div className="stat-card-label">{t('dashboard.projects')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-card-icon teal">📢</div>
              </div>
              <div className="stat-card-value">{(counters?.announcements ?? 0).toLocaleString()}</div>
              <div className="stat-card-label">{t('dashboard.announcements')}</div>
            </div>
          </>
        )}
      </div>

      {isLoading ? (
        <Skeleton.Table rows={4} cols={4} />
      ) : (
        <div className="dashboard-cards">
          <div className="card">
            <h3>👥 {t('dashboard.members')}</h3>
            <p>{t('dashboard.membersDesc')}</p>
          </div>
          <div className="card">
            <h3>💰 {t('dashboard.contributions')}</h3>
            <p>{t('dashboard.contributionsDesc')}</p>
          </div>
          <div className="card">
            <h3>⛪ {t('dashboard.churches')}</h3>
            <p>{t('dashboard.churchesDesc')}</p>
          </div>
          <div className="card">
            <h3>📋 {t('dashboard.projects')}</h3>
            <p>{t('dashboard.projectsDesc')}</p>
          </div>
        </div>
      )}

    </div>
  )
}