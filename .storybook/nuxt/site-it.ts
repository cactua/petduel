// Al posto di "#site-it": i testi italiani del nucleo con sopra quelli del sito caricato (vedi site.ts)
import { siteMessages } from './messages'
import { loadedSiteId } from './site'

const messages: Record<string, unknown> = siteMessages(loadedSiteId).it!
export default messages
