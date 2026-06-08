'use client'
import { Sparkles } from 'lucide-react'

export function ReplayTourButton() {
  function replay() {
    if (typeof window === 'undefined') return
    localStorage.removeItem('op_tour_done_v1')
    window.location.href = '/dashboard'
  }
  return (
    <button onClick={replay} className="btn btn-secondary btn-sm">
      <Sparkles size={11} /> Re-play tour
    </button>
  )
}
