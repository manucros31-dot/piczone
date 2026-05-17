import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { NIVEAU_SCORE, haversineM, scoreToColor, scoreToLabel } from '../lib/geo'

// ─── Colour stops (fill opacity only — color comes from geo.js) ───────────────

const OPACITY_BY_SCORE = (score) => {
  const s = Math.max(0, Math.min(3, score))
  return 0.3 + (s / 3) * 0.3 // 0.3 → 0.6
}

// ─── Clustering spatial (rayon 50 m) ─────────────────────────────────────────

function clusterReports(reports) {
  const clusters = []
  for (const report of reports) {
    let merged = false
    for (const cluster of clusters) {
      if (haversineM(report.latitude, report.longitude, cluster.lat, cluster.lng) <= 50) {
        cluster.reports.push(report)
        cluster.lat = cluster.reports.reduce((s, r) => s + r.latitude,  0) / cluster.reports.length
        cluster.lng = cluster.reports.reduce((s, r) => s + r.longitude, 0) / cluster.reports.length
        merged = true
        break
      }
    }
    if (!merged) clusters.push({ lat: report.latitude, lng: report.longitude, reports: [report] })
  }
  return clusters.map((c) => {
    const avgScore = c.reports.reduce((s, r) => s + (NIVEAU_SCORE[r.niveau] ?? 0), 0) / c.reports.length
    return { ...c, avgScore, color: scoreToColor(avgScore), opacity: OPACITY_BY_SCORE(avgScore) }
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

function PlanController({ planResult }) {
  const map = useMap()
  useEffect(() => {
    if (planResult) map.flyTo([planResult.lat, planResult.lng], 15, { duration: 1.2 })
  }, [planResult, map])
  return null
}

// ─── Map ──────────────────────────────────────────────────────────────────────

export default function Map({ reports, position, planResult }) {
  const clusters = useMemo(() => clusterReports(reports), [reports])

  return (
    <MapContainer
      center={[46.2276, 2.2137]}
      zoom={6}
      className="map-container"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Cercle de repère plan (100m diamètre, même style que les signalements) */}
      {planResult && (
        <Circle
          center={[planResult.lat, planResult.lng]}
          radius={50}
          pathOptions={{
            color:       '#1565C0',
            fillColor:   '#1565C0',
            fillOpacity: 0.3,
            weight:      1.5,
          }}
        />
      )}

      {/* Signalements (filtrés ou tous) */}
      {clusters.map((cluster, i) => (
        <Circle
          key={i}
          center={[cluster.lat, cluster.lng]}
          radius={50}
          pathOptions={{
            color:       cluster.color,
            fillColor:   cluster.color,
            fillOpacity: cluster.opacity,
            weight:      1.5,
          }}
        >
          <Popup>
            <strong>{scoreToLabel(cluster.avgScore)}</strong>
            {cluster.reports.length > 1 && (
              <><br /><small>{cluster.reports.length} signalements</small></>
            )}
            <br />
            <small>{new Date(cluster.reports[0].created_at).toLocaleDateString('fr-FR')}</small>
          </Popup>
        </Circle>
      ))}

      <LocationTracker position={position} />
      <PlanController planResult={planResult} />
    </MapContainer>
  )
}
