import {
  CONTACT_EMAIL,
  SITE_DESCRIPTION,
  SITE_TAGLINE,
} from '../constants/brand'
import { allServices } from '../data/services'

export const SITE_CONTENT_DOC_ID = 'main'

export function getDefaultSiteContent() {
  return {
    heroEyebrow: 'DIGIT · შუამავალი კონტროლი',
    heroTitle: 'შენ არ ეძებ სპეციალისტს.',
    heroTitleAccent: 'შენ იღებ კონტროლს.',
    heroSubtitle:
      'გამოიძახე IT დახმარება ისევე მარტივად, როგორც ტაქსი — მენეჯერი აფასებს, შემსრულებელი მუშაობს, შენ ხედავ ყველაფერს.',
    tagline: SITE_TAGLINE,
    siteDescription: SITE_DESCRIPTION,
    contactPhone: '+995 555 123 456',
    contactEmail: CONTACT_EMAIL,
    workingHours: 'ორშ–პარ, 10:00 – 19:00',
    aboutIntro:
      'DIGIT არის პლატფორმა, სადაც ბიზნესი იღებს IT დახმარებას ერთი მენეჯერის კონტროლით — გამჭვირვალე პროცესით, გადამოწმებული შემსრულებლებით.',
    services: allServices.map(({ id, title, description }) => ({
      id,
      title,
      description,
      enabled: true,
    })),
  }
}

export function mergeSiteContent(stored) {
  const defaults = getDefaultSiteContent()
  if (!stored) return defaults

  const storedServices = new Map((stored.services || []).map((service) => [service.id, service]))

  return {
    ...defaults,
    ...stored,
    services: defaults.services.map((service) => ({
      ...service,
      ...storedServices.get(service.id),
    })),
  }
}
