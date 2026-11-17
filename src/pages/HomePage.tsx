import { useCallback, useEffect, useState } from 'react'
import { Header } from '../components/Header'
import { LegalFooter } from '../components/LegalFooter'
import { RefundCalculator, RegisterModal } from '../home/Register'
import { FacilitiesTeaser, Faq, Hero, Packing, Pricing, Safety, SeasonExplorer, Stay, Timeline } from '../home/Sections'

/** Landing page (Doc 3, sections 1–10 plus refund calculator and registration). */
export function HomePage() {
  const [registering, setRegistering] = useState(false)
  const open = useCallback(() => setRegistering(true), [])
  const close = useCallback(() => {
    setRegistering(false)
    if (window.location.hash === '#register') window.history.replaceState(null, '', window.location.pathname)
  }, [])
  // "#register" (e.g. from the Facilities page header) opens the modal.
  useEffect(() => {
    const check = () => window.location.hash === '#register' && setRegistering(true)
    check()
    window.addEventListener('hashchange', check)
    return () => window.removeEventListener('hashchange', check)
  }, [])
  return (
    <>
      <Header page="home" onRegister={open} />
      <main id="main">
        <Hero onRegister={open} />
        <SeasonExplorer />
        <FacilitiesTeaser />
        <Stay />
        <Timeline />
        <Safety />
        <Pricing onRegister={open}>
          <RefundCalculator />
        </Pricing>
        <Packing />
        <Faq />
      </main>
      <LegalFooter />
      {registering && <RegisterModal onClose={close} />}
    </>
  )
}
