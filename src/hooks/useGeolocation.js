import { useState, useEffect } from 'react'

export default function useGeolocation() {
  const [position, setPosition] = useState(null)

  useEffect(() => {
    if (!navigator.geolocation) return

    const watcher = navigator.geolocation.watchPosition(
      ({ coords }) => setPosition({ lat: coords.latitude, lng: coords.longitude }),
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000 }
    )

    return () => navigator.geolocation.clearWatch(watcher)
  }, [])

  return position
}
