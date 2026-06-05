'use client'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { Navbar } from '@/components/landing/Navbar'
import { Footer } from '@/components/landing/Footer'
import { ProductCard, type Product } from '@/components/landing/ProductCard'
import { Select } from '@/components/ui/Select'

const all: Product[] = [
  { slug: 'onyx-rage',    name: 'Onyx Rage',    category: 'Automation', version: '2.1.0', price:  999, status: 'undetected', lastUpdated: '2h ago',  artMesh: 1, accent: '#ff3a00' },
  { slug: 'onyx-stealth', name: 'Onyx Stealth', category: 'Stealth',    version: '1.4.2', price: 1499, status: 'undetected', lastUpdated: '5h ago',  artMesh: 2, accent: '#ff5b75' },
  { slug: 'onyx-core',    name: 'Onyx Core',    category: 'Utility',    version: '3.0.1', price:  699, status: 'undetected', lastUpdated: '1d ago',  artMesh: 3, accent: '#5fcb88' },
  { slug: 'onyx-apex',    name: 'Onyx Apex',    category: 'Premium',    version: '1.0.3', price: 2999, status: 'updating',   lastUpdated: 'now',     artMesh: 4, accent: '#ffae50' },
  { slug: 'onyx-pulse',   name: 'Onyx Pulse',   category: 'Automation', version: '0.9.1', price:  499, status: 'beta',       lastUpdated: '3h ago',  artMesh: 5, accent: '#5b8def' },
  { slug: 'onyx-blade',   name: 'Onyx Blade',   category: 'Stealth',    version: '2.4.0', price: 1799, status: 'undetected', lastUpdated: '8h ago',  artMesh: 6, accent: '#ff5fb2' },
  { slug: 'onyx-echo',    name: 'Onyx Echo',    category: 'Utility',    version: '1.2.7', price:  599, status: 'undetected', lastUpdated: '12h ago', artMesh: 7, accent: '#34d399' },
  { slug: 'onyx-vortex',  name: 'Onyx Vortex',  category: 'Premium',    version: '1.5.2', price: 2499, status: 'undetected', lastUpdated: '4h ago',  artMesh: 8, accent: '#ff7a4d' },
]

const cats = ['All', 'Automation', 'Stealth', 'Utility', 'Premium']

export default function ShopPage() {
  const [cat, setCat] = useState('All')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('popular')

  const filtered = all
    .filter(p => cat === 'All' || p.category === cat)
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sort === 'low' ? a.price - b.price : sort === 'high' ? b.price - a.price : 0)

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-[68px] pb-20 bg-mesh">

        {/* Hero section */}
        <div className="relative border-b border-white/[0.04] py-16 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, rgba(255,58,0,0.12) 0%, transparent 60%)' }}
          />
          <div className="container-x relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(255,58,0,0.06)] border border-[rgba(255,58,0,0.15)] mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff3a00] animate-pulse" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#ff3a00]">Product Catalog</span>
            </div>
            <h1 className="text-white font-bold tracking-tight mb-3" style={{ fontSize: 'clamp(2.25rem, 5vw, 3.5rem)', letterSpacing: '-0.03em' }}>
              The full arsenal.
            </h1>
            <p className="text-[#9ca3af] max-w-xl">Every product is HWID-locked, auto-updating, and delivered instantly upon purchase.</p>
          </div>
        </div>

        <div className="container-x py-10">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]" />
              <input
                type="search"
                placeholder="Search products..."
                className="input-onyx pl-9"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full lg:w-48">
              <Select
                value={sort}
                onChange={setSort}
                options={[
                  { value: 'popular', label: 'Most Popular' },
                  { value: 'low',     label: 'Price: Low → High' },
                  { value: 'high',    label: 'Price: High → Low' },
                ]}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1 mb-8 p-1 rounded-xl bg-[rgba(20,24,35,0.5)] backdrop-blur-sm border border-white/[0.05] w-fit">
            {cats.map(c => (
              <button key={c} onClick={() => setCat(c)} className={`filter-btn ${c === cat ? 'active' : ''}`}>
                {c}
                {c !== 'All' && <span className="text-[10px] opacity-60">{all.filter(p => p.category === c).length}</span>}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((p, i) => (
              <div key={p.slug} className="animate-fade-up" style={{ animationDelay: `${i * 30}ms` }}>
                <ProductCard p={p} />
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="card p-12 text-center">
              <p className="text-[#9ca3af]">No products match your filters.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
