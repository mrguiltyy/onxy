import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { ProductWizard } from './ProductWizard'

export const metadata = { title: 'New product · Admin' }

export default function NewProductPage() {
  return (
    <div>
      <Link href="/admin/products" className="text-[12px] text-[var(--fg-dim)] hover:text-[var(--fg)] inline-flex items-center gap-1 mb-4">
        <ChevronLeft size={13} /> All products
      </Link>

      <div className="mb-8">
        <p className="label-mono mb-2">New product</p>
        <h1 className="text-[24px] font-bold tracking-tight">Add a product to your store</h1>
        <p className="text-[13px] text-[var(--fg-dim)] mt-1">5 quick steps. You can edit everything later.</p>
      </div>

      <ProductWizard />
    </div>
  )
}
