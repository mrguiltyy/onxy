'use client'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page:        number
  totalPages:  number
  onPageChange: (p: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages: (number | '…')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3)                     pages.push('…')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2)        pages.push('…')
    pages.push(totalPages)
  }

  return (
    <div className="pag">
      <button className="pag-btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft size={13} />
      </button>
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e-${i}`} className="pag-btn" style={{ border: 'none', pointerEvents: 'none' }}>…</span>
        ) : (
          <button
            key={p}
            className="pag-btn"
            data-active={p === page}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        )
      )}
      <button className="pag-btn" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        <ChevronRight size={13} />
      </button>
    </div>
  )
}
