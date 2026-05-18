// ─── Types d'événements officiels ────────────────────────────────────────────

export const EVENT_TYPES = {
  demoustication:     { label: 'Démoustication municipale', icon: '💨', color: '#1d4ed8' },
  males_steriles:     { label: 'Lâcher de mâles stériles',  icon: '🧬', color: '#6d28d9' },
  alerte_dengue:      { label: 'Alerte dengue',             icon: '🚨', color: '#dc2626' },
  alerte_chikungunya: { label: 'Alerte chikungunya',        icon: '🚨', color: '#b91c1c' },
  alerte_zika:        { label: 'Alerte Zika',               icon: '🚨', color: '#7f1d1d' },
  larvicide:          { label: 'Traitement larvicide',       icon: '🧪', color: '#065f46' },
  information:        { label: 'Information générale',       icon: 'ℹ️',  color: '#374151' },
}

export const ALERT_TYPES = new Set(['alerte_dengue', 'alerte_chikungunya', 'alerte_zika'])

// Retourne true si l'événement est actif aujourd'hui
export function isActiveEvent(event) {
  const now  = new Date()
  const start = new Date(event.start_date + 'T00:00:00')
  const end   = event.end_date ? new Date(event.end_date + 'T23:59:59') : null
  return start <= now && (!end || end >= now)
}

// ─── Hook data.gouv.fr (à brancher quand le format CSV est confirmé) ──────────
// Pour l'activer :
//   1. Vérifier le dataset ID sur https://www.data.gouv.fr/fr/datasets/?q=moustique+tigre
//   2. Adapter parseTigerCSV() au format réel
//   3. Appeler fetchTigerMosquitoData() dans App.jsx (useEffect hebdomadaire)
//
export async function fetchTigerMosquitoData() {
  try {
    const res = await fetch(
      'https://www.data.gouv.fr/api/1/datasets/?q=aedes+albopictus+commune&page_size=5&sort=-last_modified',
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return []
    const { data: datasets } = await res.json()
    const dataset = datasets?.[0]
    if (!dataset) return []
    const csv = dataset.resources?.find(r =>
      r.format?.toLowerCase() === 'csv' || r.url?.toLowerCase().endsWith('.csv')
    )
    if (!csv?.url) return []
    const csvRes = await fetch(csv.url, { signal: AbortSignal.timeout(15000) })
    if (!csvRes.ok) return []
    return parseTigerCSV(await csvRes.text())
  } catch {
    return []  // Échec silencieux — données communautaires restent affichées
  }
}

function parseTigerCSV(text) {
  // TODO: adapter les noms de colonnes au format réel du CSV data.gouv.fr
  // Colonnes attendues : code_commune (ou code_dept), niveau (0-3), lat, lon
  const lines  = text.trim().split('\n')
  const header = lines[0].toLowerCase().split(/[;,]/)
  const latIdx = header.findIndex(h => h.includes('lat'))
  const lonIdx = header.findIndex(h => h.includes('lon') || h.includes('lng'))
  const niveauIdx = header.findIndex(h => h.includes('niveau') || h.includes('level'))
  if (latIdx < 0 || lonIdx < 0 || niveauIdx < 0) return []
  return lines.slice(1).flatMap(line => {
    const cols  = line.split(/[;,]/)
    const lat   = parseFloat(cols[latIdx])
    const lon   = parseFloat(cols[lonIdx])
    const niveau = parseInt(cols[niveauIdx], 10)
    if (isNaN(lat) || isNaN(lon) || niveau < 2) return []  // niveau 2+ = présence/implantation
    return [{ latitude: lat, longitude: lon, niveau }]
  })
}
