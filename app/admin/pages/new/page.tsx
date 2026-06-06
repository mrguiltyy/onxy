import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { PageEditor } from '../PageEditor'

export const metadata = { title: 'New page · Admin' }

export default function NewCmsPage() {
  return (
    <div className="max-w-[1100px]">
      <Link href="/admin/pages" className="text-[12px] text-[var(--fg-dim)] hover:text-[var(--fg)] inline-flex items-center gap-1 mb-4">
        <ChevronLeft size={13} /> All pages
      </Link>
      <div className="mb-6">
        <p className="label-mono mb-2">New page</p>
        <h1 className="text-[24px] font-bold tracking-tight">Create a page</h1>
        <p className="text-[13px] text-[var(--fg-dim)] mt-1">Write in markdown. Toggle preview to see the rendered output.</p>
      </div>
      <PageEditor />
    </div>
  )
}
