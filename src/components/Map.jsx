import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'

// ─── Score mapping ────────────────────────────────────────────────────────────

const NIVEAU_SCORE = { infeste: 3, beaucoup: 2, peu: 1, aucun: 0 }

// Stops: score → [r, g, b], fillOpacity
const COLOR_STOPS = [
  { score: 0, rgb: [59,  109, 17],  opacity: 0.3 }, // #3B6D11
  { score: 1, rgb: [99,  153, 34],  opacity: 0.4 }, // #639922
  { score: 2, rgb: [186, 117, 23],  opacity: 0.5 }, // #BA7517
  { score: 3, rgb: [163, 45,  45],  opacity: 0.6 }, // #A32D2D
]

function scoreToStyle(score) {
  const s = Math.max(0, Math.min(3, score))
  const lo = Math.floor(s)
  const hi = Math.min(3, lo + 1)
  const t  = s - lo

  const a = COLOR_STOPS[lo]
  const b = COLOR_STOPS[hi]

  const r   = Math.round(a.rgb[0] + t * (b.rgb[0] - a.rgb[0]))
  const g   = Math.round(a.rgb[1] + t * (b.rgb[1] - a.rgb[1]))
  const bl  = Math.round(a.rgb[2] + t * (b.rgb[2] - a.rgb[2]))
  const hex = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${bl.toString(16).padStart(2,'0')}`
  const opacity = a.opacity + t * (b.opacity - a.opacity)

  return { color: hex, opacity }
}

function scoreToLabel(score) {
  if (score >= 2.5) return 'Infesté'
  if (score >= 1.5) return 'Beaucoup'
  if (score >= 0.5) return 'Peu'
  return 'Aucun'
}

// ─── Spatial clustering (Haversine, radius = 50 m) ───────────────────────────

function haversineM(lat1, lon1, lat2, lon2) {
  const R  = 6_371_000
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180
  const a  = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function clusterReports(reports) {
  const CLUSTER_RADIUS = 50 // mètres
  const clusters = []

  for (const report of reports) {
    let merged = false
    for (const cluster of clusters) {
      if (haversineM(report.latitude, report.longitude, cluster.lat, cluster.lng) <= CLUSTER_RADIUS) {
        cluster.reports.push(report)
        // Recalcul du centroïde
        cluster.lat = cluster.reports.reduce((s, r) => s + r.latitude,  0) / cluster.reports.length
        cluster.lng = cluster.reports.reduce((s, r) => s + r.longitude, 0) / cluster.reports.length
        merged = true
        break
      }
    }
    if (!merged) {
      clusters.push({ lat: report.latitude, lng: report.longitude, reports: [report] })
    }
  }

  return clusters.map((c) => {
    const avgScore = c.reports.reduce((s, r) => s + (NIVEAU_SCORE[r.niveau] ?? 0), 0) / c.reports.length
    const { color, opacity } = scoreToStyle(avgScore)
    return { ...c, avgScore, color, opacity }
  })
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function LocationTracker({ position }) {
  const map = useMap()

  useEffect(() => {
    if (position) map.flyTo([position.lat, position.lng], 17, { duration: 1.5 })
  }, [position, map])

  if (!position) return null

  const icon = L.divIcon({
    className: '',
    html: '<div class="user-marker"></div>',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })

  return (
    <Marker position={[position.lat, position.lng]} icon={icon}>
      <Popup>Vous êtes ici</Popup>
    </Marker>
  )
}

// ─── Map ──────────────────────────────────────────────────────────────────────

export default function Map({ reports, position, contestMode, onZoneSelect }) {
  const clusters = useMemo(() => clusterReports(reports), [reports])

  return (
    <MapContainer
      center={[46.2276, 2.2137]}
      zoom={6}
      className={`map-container${contestMode ? ' map-contest-mode' : ''}`}
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {clusters.map((cluster, i) => (
        <Circle
          key={i}
          center={[cluster.lat, cluster.lng]}
          radius={50}
          pathOptions={{
            color:       cluster.color,
            fillColor:   cluster.color,
            fillOpacity: contestMode ? Math.min(cluster.opacity + 0.2, 0.85) : cluster.opacity,
            weight:      contestMode ? 2.5 : 1.5,
          }}
          eventHandlers={
            contestMode
              ? { click: () => onZoneSelect(cluster.reports[0]) }
              : {}
          }
        >
          {!contestMode && (
            <Popup>
              <strong>{scoreToLabel(cluster.avgScore)}</strong>
              {cluster.reports.length > 1 && (
                <><br /><small>{cluster.reports.length} signalements</small></>
              )}
              <br />
              <small>{new Date(cluster.reports[0].created_at).toLocaleDateString('fr-FR')}</small>
            </Popup>
          )}
        </Circle>
      ))}

      <LocationTracker position={position} />
    </MapContainer>
  )
}
