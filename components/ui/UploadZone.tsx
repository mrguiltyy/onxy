'use client'
import { useState, useRef } from 'react'
import { Upload, File, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UploadZoneProps {
  onFile?:   (file: File) => void
  accept?:   string
  hint?:     string
  className?: string
}

export function UploadZone({ onFile, accept, hint = 'Drag & drop or click to browse', className }: UploadZoneProps) {
  const [active, setActive] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (f?: File | null) => {
    if (!f) return
    setFile(f)
    onFile?.(f)
  }

  const fmt = (b: number) => {
    if (b < 1024)      return `${b} B`
    if (b < 1048576)   return `${(b / 1024).toFixed(1)} KB`
    return `${(b / 1048576).toFixed(1)} MB`
  }

  if (file) {
    return (
      <div className={cn('upload-zone upload-active', className)} style={{ borderStyle: 'solid' }}>
        <div className="flex items-center gap-3 w-full">
          <div className="w-10 h-10 rounded-lg bg-[rgba(255,58,0,0.1)] border border-[rgba(255,58,0,0.2)] flex items-center justify-center shrink-0">
            <File size={16} className="text-[#ff3a00]" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-white font-semibold text-[13.5px] truncate">{file.name}</p>
            <p className="text-[#6b7280] text-xs">{fmt(file.size)}</p>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setFile(null) }} className="btn btn-icon" aria-label="Remove">
            <X size={13} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn('upload-zone', active && 'upload-active', className)}
      onDragOver={(e) => { e.preventDefault(); setActive(true) }}
      onDragLeave={() => setActive(false)}
      onDrop={(e) => {
        e.preventDefault(); setActive(false)
        handleFile(e.dataTransfer.files?.[0])
      }}
      onClick={() => inputRef.current?.click()}
    >
      <Upload size={22} className="text-[#9ca3af]" strokeWidth={1.5} />
      <div>
        <p className="text-white font-medium text-[14px]">{hint}</p>
        {accept && <p className="text-[#6b7280] text-xs mt-1">Allowed: {accept}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  )
}
