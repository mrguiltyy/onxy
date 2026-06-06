import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ProductForm } from '../ProductForm'

export const metadata = { title: 'New product · Admin' }

export default function NewProductPage() {
  return (
    <div>
      <Link href="/admin/products" className="text-[12px] text-[var(--fg-dim)] hover:text-[var(--fg)] inline-flex items-center gap-1 mb-4">
        <ChevronLeft size={13} /> All products
      </Link>

      <div className="mb-6">
        <p className="label-mono mb-2">New product</p>
        <h1 className="text-[24px] font-bold tracking-tight">Create product</h1>
        <p className="text-[13px] text-[var(--fg-dim)] mt-1">It&apos;ll appear publicly on /products once Active. Slug is auto-generated from the name.</p>
      </div>

      <ProductForm />
    </div>
  )
}
