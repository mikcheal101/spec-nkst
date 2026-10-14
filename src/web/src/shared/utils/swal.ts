import Swal from 'sweetalert2'

const theme = {
  primary: '#8b1a1a',
  primaryLight: '#b71c1c',
  primaryDark: '#5c0e0e',
  accent: '#d4a843',
  success: '#2e7d32',
  error: '#c62828',
  bg: '#f5f0eb',
  surface: '#ffffff',
  text: '#1a1a1a',
  textSecondary: '#5d4037',
  textMuted: '#8d6e63',
  border: '#d7ccc8',
}

function toastHtml(iconSvg: string, message: string) {
  return `<div style="display:flex;align-items:center;gap:0.75rem">
    <div style="flex-shrink:0;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center">${iconSvg}</div>
    <div style="font-size:0.875rem;font-weight:500;color:${theme.text};line-height:1.4;flex:1">${message}</div>
  </div>`
}

const checkIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
const xIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`

const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  showCloseButton: true,
  background: theme.surface,
  color: theme.text,
  heightAuto: false,
  buttonsStyling: false,
  customClass: {
    popup: 'swal-toast-popup',
    timerProgressBar: 'swal-toast-progress',
    closeButton: 'swal-toast-close',
    htmlContainer: 'swal-toast-html',
  },
})

export function showSuccessToast(message: string) {
  Toast.fire({
    html: toastHtml(
      `<div style="width:28px;height:28px;border-radius:8px;background:${theme.success};display:flex;align-items:center;justify-content:center">${checkIcon}</div>`,
      message,
    ),
    icon: undefined,
    timer: 3000,
  })
}

export function showErrorToast(message: string) {
  Toast.fire({
    html: toastHtml(
      `<div style="width:28px;height:28px;border-radius:8px;background:${theme.error};display:flex;align-items:center;justify-content:center">${xIcon}</div>`,
      message,
    ),
    icon: undefined,
    timer: 4000,
  })
}

export function showErrorDialog(title: string, message?: string) {
  base.fire({
    icon: 'error',
    title,
    text: message,
    confirmButtonText: 'OK',
    iconColor: theme.error,
  })
}

export function showSuccessDialog(title: string, message?: string) {
  base.fire({
    icon: 'success',
    title,
    text: message,
    confirmButtonText: 'OK',
    iconColor: theme.success,
  })
}

interface ConfirmOptions {
  title: string
  text?: string
  confirmButtonText?: string
  cancelButtonText?: string
  danger?: boolean
  icon?: 'warning' | 'question' | 'error'
}

export async function showConfirm(options: ConfirmOptions) {
  const result = await base.fire({
    icon: options.icon || 'warning',
    title: options.title,
    text: options.text,
    showCancelButton: true,
    confirmButtonText: options.confirmButtonText || 'Yes, proceed',
    cancelButtonText: options.cancelButtonText || 'Cancel',
    iconColor: options.danger ? theme.error : theme.accent,
    customClass: {
      popup: 'swal-popup',
      title: 'swal-title',
      htmlContainer: 'swal-html',
      confirmButton: `swal-btn ${options.danger ? 'swal-btn-danger' : 'swal-btn-confirm'}`,
      cancelButton: 'swal-btn swal-btn-cancel',
      icon: 'swal-icon',
      footer: 'swal-footer',
    },
  })
  return result.isConfirmed
}

const base = Swal.mixin({
  confirmButtonColor: theme.primary,
  cancelButtonColor: '#d7ccc8',
  background: theme.surface,
  color: theme.text,
  reverseButtons: true,
  heightAuto: false,
  buttonsStyling: false,
  customClass: {
    popup: 'swal-popup',
    title: 'swal-title',
    htmlContainer: 'swal-html',
    confirmButton: 'swal-btn swal-btn-confirm',
    cancelButton: 'swal-btn swal-btn-cancel',
    icon: 'swal-icon',
    footer: 'swal-footer',
  },
})

const swal = base
export default swal