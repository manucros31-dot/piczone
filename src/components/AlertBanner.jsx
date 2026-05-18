import { useState } from 'react'
import { ALERT_TYPES, isActiveEvent } from '../lib/officialData'

export default function AlertBanner({ officialEvents }) {
  const [dismissed, setDismissed] = useState(false)
  if (dismissed) return null

  const activeAlerts = officialEvents.filter(ev => ALERT_TYPES.has(ev.type) && isActiveEvent(ev))
  if (activeAlerts.length === 0) return null

  const diseases = [...new Set(activeAlerts.map(ev =>
    ev.type === 'alerte_dengue' ? 'dengue' :
    ev.type === 'alerte_chikungunya' ? 'chikungunya' : 'Zika'
  ))]

  return (
    <div className="alert-banner">
      <span className="alert-banner-text">
        ⚠️ Cas de {diseases.join(' et ')} signalés —{' '}
        <a
          href="https://www.santepubliquefrance.fr/maladies-et-traumatismes/maladies-transmissibles-de-l-animal-a-l-homme/chikungunya-dengue-et-zika"
          target="_blank"
          rel="noopener noreferrer"
          className="alert-banner-link"
        >
          Consulter santepubliquefrance.fr
        </a>
      </span>
      <button className="alert-banner-close" onClick={() => setDismissed(true)}>✕</button>
    </div>
  )
}
