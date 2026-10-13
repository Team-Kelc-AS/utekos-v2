import Breadcrumbs from '@/components/Breadcrumbs'
import { CompareModelsJsonLd } from './components/CompareModelsJsonLd'
import type { ReactNode } from 'react'

export default function CompareModelsLayout({
  children
}: {
  children: ReactNode
}) {
  return (
    <>
      <CompareModelsJsonLd />
      <div className='container mx-auto w-full px-4 py-5'>
      <Breadcrumbs
        items={[
          { label: 'Forsiden', href: '/' },
          { label: 'Handlehjelp' },
          { label: 'Sammenlign modeller' }
        ]}
      />
      </div>
      {children}
    </>
  )
}
