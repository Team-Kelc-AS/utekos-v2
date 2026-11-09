import Breadcrumbs from '@/components/Breadcrumbs'
import type { ReactNode } from 'react'
import { FunctionalityJsonLd } from './components/FunctionalityJsonLd'
export default function FunctionalityLayout({
  children
}: {
  children: ReactNode
}) {
  return (
    <>
      <FunctionalityJsonLd />
      <article className='bg-background text-foreground'>
        <div className='container mx-auto px-4 pt-8'>
          <Breadcrumbs
            items={[
              { label: 'Forsiden', href: '/' },
              { label: 'Funksjonalitet' }
            ]}
          />
        </div>
        {children}
      </article>
    </>
  )
}
