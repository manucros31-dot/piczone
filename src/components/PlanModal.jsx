import { useState, useEffect, useRef } from 'react'
import { getMonthsForRange } from '../lib/geo'

const today    = new Date().toISOString().split('T')[0]
const maxDate  = (() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toISOString().split('T')[0] })()

function shortName(displayName) {
  return displayName.split(',').slice(0, 2).join(', ')
}

function formatDateFR(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function PlanModal({ onClose, onConfirm }) {
  const [step, setStep]               = useState(1)
  const [query, setQuery]             = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searching, setSearching]     = useState(false)
  const [location, setLocation]       = useState(null)
  const [dateType, setDateType]       = useState('date')
  const [startDate, setStartDate]     = useState(today)
  const [endDate, setEndDate]         = useState(today)
  const inputRef = useRef(null)

  // Recherche Nominatim avec debounce 500ms
  useEffect(() => {
    if (query.length < 3) { setSuggestions([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&countrycodes=fr&accept-language=fr`
        const res  = await fetch(url, { headers: { 'Accept-Language': 'fr' } })
        const data = await res.json()
        setSuggestions(data)
      } catch { setSuggestions([]) }
      setSearching(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [query])

  function selectLocation(item) {
    const name = shortName(item.display_name)
    setLocation({ displayName: name, lat: parseFloat(item.lat), lng: parseFloat(item.lon) })
    setQuery(name)
    setSuggestions([])
    setStep(2)
  }

  function handleConfirm() {
    const end    = dateType === 'date' ? startDate : endDate
    const months = Array.from(getMonthsForRange(startDate, end))
    onConfirm({ ...location, dateType, startDate, endDate: end, months })
  }

  const canSubmit = dateType === 'date' ? !!startDate : (!!startDate && !!endDate && endDate >= startDate)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content plan-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />

        <div className="plan-header">
          <h2 className="modal-title">📅 Je planifie ma sortie</h2>
          <div className="plan-steps">
            <div className={`plan-step ${step >= 1 ? 'done' : ''}`}>1</div>
            <div className="plan-step-line" />
            <div className={`plan-step ${step >= 2 ? 'done' : ''}`}>2</div>
          </div>
        </div>

        <div className="plan-disclaimer">
          <span className="plan-disclaimer-icon">ⓘ</span>
          <p className="plan-disclaimer-text">
            Les informations affichées sur PIKZONE sont exclusivement issues de signalements
            volontaires de la communauté d'utilisateurs. Elles reflètent un ressenti subjectif
            à un instant donné et ne constituent en aucun cas une expertise scientifique,
            sanitaire ou commerciale. PIKZONE ne peut être tenu responsable des décisions
            prises sur la base de ces informations.
          </p>
        </div>

        {/* ── ÉTAPE 1 : lieu ── */}
        {step === 1 && (
          <div className="plan-body">
            <p className="modal-subtitle">Où souhaitez-vous aller ?</p>
            <div className="search-wrap">
              <input
                ref={inputRef}
                className="form-input search-input"
                type="text"
                placeholder="Adresse, lieu, quartier…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                autoComplete="off"
              />
              {searching && <span className="search-spinner">⏳</span>}
            </div>

            {suggestions.length > 0 && (
              <ul className="suggestions-list">
                {suggestions.map((item) => (
                  <li key={item.place_id} className="suggestion-item" onClick={() => selectLocation(item)}>
                    <span className="suggestion-icon">📍</span>
                    <span className="suggestion-text">{shortName(item.display_name)}</span>
                  </li>
                ))}
              </ul>
            )}

            {query.length >= 3 && !searching && suggestions.length === 0 && (
              <p className="search-empty">Aucun résultat pour « {query} »</p>
            )}
          </div>
        )}

        {/* ── ÉTAPE 2 : période ── */}
        {step === 2 && (
          <div className="plan-body">
            <div className="plan-location-chip">
              <span>📍</span>
              <span>{location?.displayName}</span>
              <button className="chip-edit" onClick={() => setStep(1)}>Modifier</button>
            </div>

            <p className="modal-subtitle" style={{ marginTop: 16 }}>Quand partez-vous ?</p>

            <div className="date-type-toggle">
              <button
                className={`date-type-btn ${dateType === 'date' ? 'active' : ''}`}
                onClick={() => setDateType('date')}
              >
                Une date précise
              </button>
              <button
                className={`date-type-btn ${dateType === 'period' ? 'active' : ''}`}
                onClick={() => setDateType('period')}
              >
                Une période
              </button>
            </div>

            {dateType === 'date' && (
              <div className="form-field">
                <label className="form-label">Date de sortie</label>
                <input
                  className="form-input"
                  type="date"
                  value={startDate}
                  min={today}
                  max={maxDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            )}

            {dateType === 'period' && (
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Du</label>
                  <input
                    className="form-input"
                    type="date"
                    value={startDate}
                    min={today}
                    max={maxDate}
                    onChange={(e) => { setStartDate(e.target.value); if (e.target.value > endDate) setEndDate(e.target.value) }}
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Au</label>
                  <input
                    className="form-input"
                    type="date"
                    value={endDate}
                    min={startDate || today}
                    max={maxDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            <p className="plan-period-hint">
              {dateType === 'date'
                ? `Nous afficherons les signalements du mois de ${new Date(startDate + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'long' })} (toutes années)`
                : 'Nous afficherons les signalements des mois couverts (toutes années)'}
            </p>

            <button className="submit-btn" onClick={handleConfirm} disabled={!canSubmit}>
              Voir les moustiques 🦟
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
