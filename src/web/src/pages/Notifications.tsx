import { useTranslation } from 'react-i18next'
import { useNotificationTemplates } from '../hooks/useNotifications'

interface NotificationItem {
  id: string
  title: string
  message: string
  read: boolean
  type: string
  createdAt: string
}

export default function Notifications() {
  const { t } = useTranslation()
  const { data: templatesData, isLoading } = useNotificationTemplates()
  const notifications: NotificationItem[] = Array.isArray(templatesData) ? templatesData as NotificationItem[] : []

  function markAllRead() {
    // optimistic local only
  }

  if (isLoading) return <div className="loading-screen">{t('common.loading')}</div>

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2 className="page-title">{t('notifications.title')}</h2>
          <p className="page-subtitle">{t('notifications.description')}</p>
        </div>
        {notifications.some((n) => !n.read) && (
          <button className="btn btn-outline" onClick={markAllRead}>{t('notifications.markAllRead')}</button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state">{t('notifications.noNotifications')}</div>
      ) : (
        <div className="notification-list">
          {notifications.map((n) => (
            <div key={n.id} className={`notification-item${n.read ? '' : ' unread'}`}>
              <div className="notification-content">
                <div className="notification-title">{n.title}</div>
                <div className="notification-message">{n.message}</div>
                <div className="notification-time">{new Date(n.createdAt).toLocaleString()}</div>
              </div>
              {!n.read && <span className="notification-dot" />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
