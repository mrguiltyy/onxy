'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Boxes, ChevronDown, Plus, Settings, Sparkles } from 'lucide-react'
import { supabaseBrowser } from '@/lib/supabase/client'

interface Project {
  id:        string
  app_id:    string
  name:      string
  status:    string
}

const STORAGE_KEY = 'op_active_project'

export function ProjectSelector() {
  const [open, setOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [loading, setLoading]   = useState(true)
  const ref = useRef<HTMLDivElement>(null)

  const refresh = useCallback(async () => {
    try {
      const supabase = supabaseBrowser()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('applications')
        .select('id, app_id, name, status')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
      setProjects((data as Project[] | null) ?? [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { refresh() }, [refresh])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setActiveId(stored)
    }
  }, [])

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  function pick(id: string | null) {
    setActiveId(id)
    if (typeof window !== 'undefined') {
      if (id) localStorage.setItem(STORAGE_KEY, id)
      else    localStorage.removeItem(STORAGE_KEY)
    }
    setOpen(false)
  }

  const active = activeId ? projects.find(p => p.id === activeId) : null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-md px-3 py-1.5 transition-colors border"
        style={{
          background: 'var(--surface-2)',
          borderColor: 'var(--hairline)',
        }}
      >
        <span className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
          style={{ background: 'var(--brand-faint)', color: 'var(--brand)' }}>
          <Boxes size={11} />
        </span>
        <div className="flex flex-col items-start min-w-0">
          <span className="text-[9.5px] text-[var(--fg-mute)] uppercase tracking-wider leading-none">Project</span>
          <span className="text-[12.5px] font-semibold leading-tight truncate max-w-[150px]">
            {active ? active.name : 'OP Main'}
          </span>
        </div>
        <ChevronDown size={12} className="text-[var(--fg-mute)] shrink-0" />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-2 w-[280px] rounded-md overflow-hidden shadow-2xl z-50"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--hairline)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          }}
        >
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--hairline)' }}>
            <p className="label-mono">Switch project</p>
          </div>

          {/* OP Main option */}
          <button
            onClick={() => pick(null)}
            className="w-full px-4 py-3 hover:bg-[var(--surface-2)] flex items-center gap-2.5 text-left transition-colors"
            style={activeId === null ? { background: 'var(--brand-faint)' } : undefined}
          >
            <span className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
              style={{ background: 'var(--brand-gradient)', color: '#3a2630' }}>
              <Sparkles size={12} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[12.5px]">OP Main</p>
              <p className="text-[10.5px] text-[var(--fg-mute)] font-mono">Default workspace</p>
            </div>
            {activeId === null && <span className="text-[10px] text-[var(--brand)] font-bold">●</span>}
          </button>

          {/* User's applications */}
          {loading ? (
            <div className="px-4 py-3 text-[11.5px] text-[var(--fg-mute)]">Loading…</div>
          ) : projects.length === 0 ? (
            <div className="px-4 py-4 text-center">
              <p className="text-[11.5px] text-[var(--fg-mute)] mb-2">No projects yet</p>
              <Link href="/dashboard/applications" onClick={() => setOpen(false)}
                className="btn btn-primary btn-sm inline-flex">
                <Plus size={11} /> Create project
              </Link>
            </div>
          ) : (
            <div className="max-h-[260px] overflow-y-auto">
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => pick(p.id)}
                  className="w-full px-4 py-2.5 hover:bg-[var(--surface-2)] flex items-center gap-2.5 text-left transition-colors"
                  style={activeId === p.id ? { background: 'var(--brand-faint)' } : undefined}
                >
                  <span className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: 'var(--surface-2)', color: 'var(--brand)' }}>
                    <Boxes size={11} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[12.5px] truncate">{p.name}</p>
                    <p className="text-[10.5px] text-[var(--fg-mute)] font-mono truncate">{p.app_id}</p>
                  </div>
                  {activeId === p.id && <span className="text-[10px] text-[var(--brand)] font-bold shrink-0">●</span>}
                </button>
              ))}
            </div>
          )}

          <div className="border-t" style={{ borderColor: 'var(--hairline)' }}>
            <Link href="/dashboard/applications" onClick={() => setOpen(false)}
              className="w-full px-4 py-2.5 text-[11.5px] text-[var(--fg-dim)] hover:bg-[var(--surface-2)] flex items-center gap-2 transition-colors">
              <Plus size={11} /> Create new project
            </Link>
            <Link href="/dashboard/applications" onClick={() => setOpen(false)}
              className="w-full px-4 py-2.5 text-[11.5px] text-[var(--fg-dim)] hover:bg-[var(--surface-2)] flex items-center gap-2 transition-colors">
              <Settings size={11} /> Manage projects
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
