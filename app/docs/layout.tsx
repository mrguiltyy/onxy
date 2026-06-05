import { Navbar } from '@/components/landing/Navbar'
import { DocsSidebar } from '@/components/docs/DocsSidebar'

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <DocsSidebar />
      <div className="pl-0 md:pl-[260px] pt-[68px]">
        <main className="container-x py-10 max-w-3xl ml-0 md:ml-0">
          <article className="docs-prose">{children}</article>
        </main>
      </div>
    </div>
  )
}
