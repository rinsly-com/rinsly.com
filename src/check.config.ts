/**
 * Configuration for the /check funnel (LeadLens scorecard pages). These are
 * deliberate plain constants — edit and redeploy; no env plumbing needed.
 */
type CheckConfig = {
  bookingUrl: string
  phone: string
  email: string
  pricing: { title: string; lines: readonly string[]; note: string }
}

export const checkConfig: CheckConfig = {
  /**
   * DELIBERATELY empty (Yaron, 2026-07-30): no booking tool. The CTA mails
   * contact@rinsly.com with a prefilled subject and shows the address plainly.
   * Should a scheduling tool ever land, any public booking URL here switches
   * the CTA over; nothing else changes.
   */
  bookingUrl: '',
  /**
   * Phone number for callers, shown next to the CTA ("liever bellen?").
   * Display form + tel: href. Hidden while empty.
   * TODO(yaron): fill in or leave empty.
   */
  phone: '',
  /** Fallback contact address for the CTA and the /check lead form. */
  email: 'contact@rinsly.com',
  /**
   * Transparent price indication shown on the scorecard page. Kept in line
   * with the public pricing section (build from €2,500; Care from €49/mo).
   * TODO(yaron): confirm wording/amounts for this funnel (handoff §6.3).
   */
  pricing: {
    title: 'Transparant over de kosten',
    lines: [
      'Gaat u een beheerovereenkomst van drie jaar aan? Dan bouwen we uw website gratis (afhankelijk van de omvang).',
      'Liever niet vastzitten? Dan bouwen we vanaf €2.500 eenmalig (desgewenst gespreid over het eerste jaar) en kunt u maandelijks opzeggen.',
      'Het beheer is vanaf €49 per maand, alles inbegrepen: hosting, beveiliging, updates en back-ups.',
    ],
    note: 'Zakelijke tarieven, excl. 21% btw. U bent altijd eigenaar van uw site en data.',
  },
}
