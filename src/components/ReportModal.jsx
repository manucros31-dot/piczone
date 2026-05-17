import { useState } from 'react'

const LEVELS = [
  { value: 'infeste', label: 'Infesté', emoji: '🚨', desc: 'Nuage de moustiques', color: '#ef4444', bg: '#fef2f2' },
  { value: 'beaucoup', label: 'Beaucoup', emoji: '😤', desc: 'Très présents', color: '#f97316', bg: '#fff7ed' },
  { value: 'peu', label: 'Peu', emoji: '😐', desc: 'Quelques-uns', color: '#eab308', bg: '#fefce8' },
  { value: 'aucun', label: 'Aucun', emoji: '😌', desc: 'Zone tranquille', color: '#22c55e', bg: '#f0fdf4' },
]

export default function ReportModal({ onSubmit, onClose, hasPosition }) {
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit() {
    if (!selected) return
    setLoading(true)
    setError(null)
    try {
      await onSubmit(selected)
    } catch (e) {
      setError(e?.message || 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />

        <h2 className="modal-title">Signaler ma zone</h2>
        <p className="modal-subtitle">Quel est le niveau d'infestation autour de vous ?</p>

        {!hasPosition && (
          <div className="location-warning">
            Activez votre GPS pour signaler votre position exacte.
          </div>
        )}

        {error && (
          <div className="location-warning" style={{ borderColor: '#f87171', background: '#fef2f2', color: '#991b1b' }}>
            Erreur : {error}
          </div>
        )}

        <div className="level-grid">
          {LEVELS.map((level) => (
            <button
              key={level.value}
              className={`level-card ${selected === level.value ? 'selected' : ''}`}
              style={{
                '--card-color': level.color,
                '--card-bg': level.bg,
              }}
              onClick={() => setSelected(level.value)}
            >
              <span className="level-emoji">{level.emoji}</span>
              <span className="level-label">{level.label}</span>
              <span className="level-desc">{level.desc}</span>
            </button>
          ))}
        </div>

        <button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={!selected || loading || !hasPosition}
        >
          {loading ? 'Envoi...' : 'Envoyer le signalement'}
        </button>
      </div>
    </div>
  )
}
