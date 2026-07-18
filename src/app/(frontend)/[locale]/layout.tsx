import config from '@payload-config'

import { createLocaleLayout } from '@rinsly-com/site-core/app'
import { siteConfig } from '@/site.config'

import '../globals.css'

const layout = createLocaleLayout({ siteConfig, config })

export const viewport = layout.viewport
export const generateStaticParams = layout.generateStaticParams
export const generateMetadata = layout.generateMetadata
export default layout.Layout
