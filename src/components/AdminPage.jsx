import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { EVENT_TYPES } from '../lib/officialData'

const ADMIN_KEY = 'pikzone_admin_access'
const ADMIN_PWD = import.meta.env.VITE_ADMIN_PASSWORD
const today     = new Date().toISOString().split('T')[0]

const EMPTY_FORM = {
  type: 'demoustication', title: '', description: '',
  latitude: '', longitude: '', radius: 500,
  start_date: today, end_date: '', source_name: '', source_url: '',
}

export default function AdminPage({ onClose }) {
  const [authed, setAuthed]         = useState(() => localStorage.getItem(ADMIN_KEY) === '1')
  const [pwd, setPwd]               = useState('')
  const [pwdError, setPwdError]     = useState(false)
  const [events, setEvents]         = useState([])
  const [form, setForm]             = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess]       = useState(false)
  const [query, setQuery]           = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searching, setSearching]   = useState(false)

  useEffect(() => { if (authed) fetchEvents() }, [authed])

  // Recherche adresse via Nominatim
  useEffect(() => {
    if (query.length < 3) { setSuggestions([]); return }
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&accept-language=fr`
        const data = await (await fetch(url, { headers: { 'Accept-Language': 'fr' } })).json()
        setSuggestions(data)
      } catch { setSuggestions([]) }
      setSearching(false)
    }, 500)
    return () => clearTimeout(t)
  }, [query])

  async function fetchEvents() {
    const { data } = await supabase
      .from('official_events').select('*').order('created_at', { ascending: false })
    if (data) setEvents(data)
  }

  function handleLogin(e) {
    e.preventDefault()
    if (pwd === ADMIN_PWD) {
      localStorage.setItem(ADMIN_KEY, '1')
      setAuthed(true)
    } else {
      setPwdError(true); setPwd('')
      setTimeout(() => setPwdError(false), 2000)
    }
  }

  function selectSuggestion(item) {
    setForm(f => ({ ...f, latitude: parseFloat(item.lat), longitude: parseFloat(item.lon) }))
    setQuery(item.display_name.split(',').slice(0, 2).join(', '))
    setSuggestions([])
  }

  function setField(key, value) { setForm(f => ({ ...f, [key]: value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    const { error } = await supabase.from('official_events').insert({
      ...form,
      latitude:   parseFloat(form.latitude),
      longitude:  parseFloat(form.longitude),
      radius:     parseInt(form.radius),
      end_date:   form.end_date   || null,
      source_url: form.source_url || null,
    })
    if (!error) {
      setForm(EMPTY_FORM); setQuery(''); setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      fetchEvents()
    }
    setSubmitting(false)
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer cet événement de la carte ?')) return
    await supabase.from('official_events').delete().eq('id', id)
    fetchEvents()
  }

  /* ── Page de connexion ────────────────────────────────────────────────────── */
  if (!authed) {
    return (
      <div className="beta-gate">
        <div className="beta-content">
          <span className="beta-mosquito">🔐</span>
          <h1 className="beta-title" style={{ fontSize: 26 }}>Administration PikZone</h1>
          <p className="beta-subtitle">Données officielles</p>
          <form onSubmit={handleLogin} className="beta-form">
            <input
              className={`beta-input ${pwdError ? 'beta-input-error' : ''}`}
              type="password" placeholder="Mot de passe admin"
              value={pwd} onChange={e => setPwd(e.target.value)} autoFocus
            />
            {pwdError && <p className="beta-error">Mot de passe incorrect</p>}
            <button className="beta-btn" type="submit">Accéder →</button>
          </form>
        </div>
      </div>
    )
  }

  /* ── Interface admin ────────────────────────────────────────────────────────  */
  return (
    <div className="admin-page">

      {/* Header */}
      <div className="admin-header">
        <button className="back-btn" onClick={onClose}>← Carte</button>
        <h1 className="admin-title">🗂️ Données officielles</h1>
        <button
          className="admin-logout"
          onClick={() => { localStorage.removeItem(ADMIN_KEY); setAuthed(false) }}
        >
          Déco.
        </button>
      </div>

      <div className="admin-body">

        {/* ── Formulaire ── */}
        <section className="admin-section">
          <h2 className="admin-section-title">Ajouter un événement</h2>

          <form onSubmit={handleSubmit} className="admin-form" autoComplete="off">

            {/* Type */}
            <div className="form-field">
              <label className="form-label">Type d'événement</label>
              <select className="form-input" value={form.type}
                onChange={e => setField('type', e.target.value)}>
                {Object.entries(EVENT_TYPES).map(([k, { label, icon }]) => (
                  <option key={k} value={k}>{icon} {label}</option>
                ))}
              </select>
            </div>

            {/* Titre */}
            <div className="form-field">
              <label className="form-label">Titre *</label>
              <input className="form-input" type="text" required
                placeholder="Ex : Démoustication parc Tête d'Or"
                value={form.title} onChange={e => setField('title', e.target.value)} />
            </div>

            {/* Description */}
            <div className="form-field">
              <label className="form-label">
                Description{' '}
                <span className="admin-char-count">{form.description.length}/200</span>
              </label>
              <textarea className="form-input admin-textarea" rows={3}
                placeholder="Informations complémentaires…"
                value={form.description}
                onChange={e => setField('description', e.target.value.slice(0, 200))} />
            </div>

            {/* Recherche adresse */}
            <div className="form-field" style={{ position: 'relative' }}>
              <label className="form-label">Localisation (recherche ou coordonnées)</label>
              <div className="search-wrap">
                <input className="form-input search-input" type="text"
                  placeholder="Rechercher une adresse…"
                  value={query} onChange={e => setQuery(e.target.value)} autoComplete="off" />
                {searching && <span className="search-spinner">⏳</span>}
              </div>
              {suggestions.length > 0 && (
                <ul className="suggestions-list">
                  {suggestions.map(item => (
                    <li key={item.place_id} className="suggestion-item"
                      onClick={() => selectSuggestion(item)}>
                      <span className="suggestion-icon">📍</span>
                      <span className="suggestion-text">
                        {item.display_name.split(',').slice(0, 2).join(', ')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Lat / Lon */}
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Latitude *</label>
                <input className="form-input" type="number" step="any"
                  placeholder="48.8566" required
                  value={form.latitude} onChange={e => setField('latitude', e.target.value)} />
              </div>
              <div className="form-field">
                <label className="form-label">Longitude *</label>
                <input className="form-input" type="number" step="any"
                  placeholder="2.3522" required
                  value={form.longitude} onChange={e => setField('longitude', e.target.value)} />
              </div>
            </div>

            {/* Rayon */}
            <div className="form-field">
              <label className="form-label">Rayon d'impact (mètres)</label>
              <input className="form-input" type="number" min="50" max="100000"
                value={form.radius} onChange={e => setField('radius', e.target.value)} />
            </div>

            {/* Dates */}
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Date de début *</label>
                <input className="form-input" type="date" required
                  value={form.start_date} onChange={e => setField('start_date', e.target.value)} />
              </div>
              <div className="form-field">
                <label className="form-label">Date de fin</label>
                <input className="form-input" type="date"
                  min={form.start_date}
                  value={form.end_date} onChange={e => setField('end_date', e.target.value)} />
              </div>
            </div>

            {/* Source */}
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Source officielle</label>
                <input className="form-input" type="text"
                  placeholder="Ex : Mairie de Lyon"
                  value={form.source_name} onChange={e => setField('source_name', e.target.value)} />
              </div>
              <div className="form-field">
                <label className="form-label">Lien</label>
                <input className="form-input" type="url"
                  placeholder="https://…"
                  value={form.source_url} onChange={e => setField('source_url', e.target.value)} />
              </div>
            </div>

            {success && (
              <div className="admin-success">✅ Événement ajouté sur la carte !</div>
            )}

            <button className="submit-btn" type="submit" disabled={submitting}>
              {submitting ? 'Enregistrement…' : 'Ajouter sur la carte ➕'}
            </button>
          </form>
        </section>

        {/* ── Liste des événements ── */}
        <section className="admin-section">
          <h2 className="admin-section-title">
            Événements enregistrés ({events.length})
          </h2>
          {events.length === 0 ? (
            <p className="admin-empty">Aucun événement pour le moment.</p>
          ) : (
            <ul className="admin-events-list">
              {events.map(ev => (
                <li key={ev.id} className="admin-event-item">
                  <span className="admin-event-icon">{EVENT_TYPES[ev.type]?.icon}</span>
                  <div className="admin-event-info">
                    <p className="admin-event-title">{ev.title}</p>
                    <p className="admin-event-meta">
                      {EVENT_TYPES[ev.type]?.label}
                      &nbsp;·&nbsp;{ev.start_date}
                      {ev.end_date ? ` → ${ev.end_date}` : ''}
                      &nbsp;·&nbsp;r={ev.radius}m
                    </p>
                  </div>
                  <button className="admin-event-delete"
                    onClick={() => handleDelete(ev.id)}>✕</button>
                </li>
              ))}
            </ul>
          )}
        </section>

      </div>
    </div>
  )
}
