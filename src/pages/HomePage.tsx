import { useCallback, useEffect, useState } from 'react'
import { Header } from '../components/Header'
import { setUrl } from '../lib/root'
import { LegalFooter } from '../components/LegalFooter'
import { RefundCalculator, RegisterModal } from '../home/Register'
import { FacilitiesTeaser, Faq, Hero, Packing, Pricing, Safety, SeasonExplorer, Stay, type CampOption } from '../home/Sections'

/** Landing page (Doc 3, sections 1–10 plus refund calculator and registration). */
export function HomePage() {
  // false = closed; otherwise the option the form opens on.
  const [registering, setRegistering] = useState<false | CampOption>(false)
  const open = useCallback((option?: CampOption) => setRegistering(option === 'B' || option === 'C' ? option : 'A'), [])
  const close = useCallback(() => {
    setRegistering(false)
    if (window.location.hash === '#register') setUrl(window.location.pathname)
  }, [])
  // "#register" (e.g. from the Facilities page header) opens the modal.
  useEffect(() => {
    const check = () => window.location.hash === '#register' && setRegistering((cur) => cur || 'A')
    check()
    window.addEventListener('hashchange', check)
    return () => window.removeEventListener('hashchange', check)
  }, [])
  return (
    <>
      <Header page="home" onRegister={() => open()} />
      <main id="main">
        <Hero onRegister={open} />
        <SeasonExplorer />
        <FacilitiesTeaser />
        <Stay />
        <Safety />
        <Pricing onRegister={open}>
          <RefundCalculator />
        </Pricing>
        <Packing />
        <Faq />
      </main>
      <LegalFooter />
      {registering && <RegisterModal initialOption={registering} onClose={close} />}
    </>
  )
}
