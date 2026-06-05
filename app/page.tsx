import { Navbar }           from '@/components/landing/Navbar'
import { Hero }             from '@/components/landing/Hero'
import { FeaturedProducts } from '@/components/landing/FeaturedProducts'
import { Philosophy }       from '@/components/landing/Philosophy'
import { Showcase }         from '@/components/landing/Showcase'
import { ToolSlideshow }    from '@/components/landing/ToolSlideshow'
import { Reviews }          from '@/components/landing/Reviews'
import { CTA }              from '@/components/landing/CTA'
import { Footer }           from '@/components/landing/Footer'

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <FeaturedProducts />
        <Philosophy />
        <Showcase />
        <ToolSlideshow />
        <Reviews />
        <CTA />
      </main>
      <Footer />
    </>
  )
}
