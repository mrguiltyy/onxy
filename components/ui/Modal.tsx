'use client'
import { useEffect } from 'react'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  maxWidth?: number
}

export function Modal({ open, onClose, title, description, children, footer, maxWidth = 480 }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handle)

    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handle)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth }} onClick={e => e.stopPropagation()}>
        {(title || description) && (
          <div className="modal-header">
            <div>
              {title       && <div className="modal-title">{title}</div>}
              {description && <div className="modal-desc">{description}</div>}
            </div>
            <button className="btn btn-icon" onClick={onClose} aria-label="Close">
              <X size={14} />
            </button>
          </div>
        )}
        <div>{children}</div>
        {footer && <div className="mt-5 flex items-center justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body
  )
}
