import { useEffect } from 'react'
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'

const LEVEL_COLORS = {
  infeste: '#ef4444',
  beaucoup: '#f97316',
  peu: '#eab308',
  aucun: '#22c55e',
}

const LEVEL_LABELS = {
  infeste: 'Infesté',
  beaucoup: 'Beaucoup',
  peu: 'Peu',
  aucun: 'Aucun',
}

function LocationTracker({ position }) {
  const map = useMap()

  useEffect(() => {
    if (position) {
      map.flyTo([position.lat, position.lng], 13, { duration: 1.5 })
    }
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

export default function Map({ reports, position }) {
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

      {reports.map((report) => (
        <Circle
          key={report.id}
          center={[report.latitude, report.longitude]}
          radius={3000}
          pathOptions={{
            color: LEVEL_COLORS[report.niveau],
            fillColor: LEVEL_COLORS[report.niveau],
            fillOpacity: 0.35,
            weight: 1.5,
          }}
        >
          <Popup>
            <strong>{LEVEL_LABELS[report.niveau]}</strong>
            <br />
            <small>{new Date(report.created_at).toLocaleDateString('fr-FR')}</small>
          </Popup>
        </Circle>
      ))}

      <LocationTracker position={position} />
    </MapContainer>
  )
}
