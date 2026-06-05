'use client'
import { createContext, useContext, useState } from 'react'

interface TabsCtx { value: string; setValue: (v: string) => void }
const Ctx = createContext<TabsCtx | null>(null)

export function Tabs({ defaultValue, children, onChange }: { defaultValue: string; children: React.ReactNode; onChange?: (v: string) => void }) {
  const [value, setValue] = useState(defaultValue)
  const set = (v: string) => { setValue(v); onChange?.(v) }
  return <Ctx.Provider value={{ value, setValue: set }}>{children}</Ctx.Provider>
}

export function TabsList({ children }: { children: React.ReactNode }) {
  return <div className="tabs-list">{children}</div>
}

export function Tab({ value, children }: { value: string; children: React.ReactNode }) {
  const c = useContext(Ctx)!
  return (
    <button className={`tab ${c.value === value ? 'active' : ''}`} onClick={() => c.setValue(value)}>
      {children}
    </button>
  )
}

export function TabPanel({ value, children }: { value: string; children: React.ReactNode }) {
  const c = useContext(Ctx)!
  if (c.value !== value) return null
  return <div className="animate-fade-in">{children}</div>
}
