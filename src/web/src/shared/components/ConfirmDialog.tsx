import { useTranslation } from 'react-i18next';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
}

export default function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmLabel, cancelLabel, danger, loading }: ConfirmDialogProps) {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>{cancelLabel || t('common.cancel')}</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm} disabled={loading}>
            {loading && <span className="mf-spinner" style={{ marginRight: '0.375rem' }} />}
            {loading ? `${confirmLabel || t('common.confirm')}...` : (confirmLabel || t('common.confirm'))}
          </button>
        </div>
      </div>
    </div>
  );
}
