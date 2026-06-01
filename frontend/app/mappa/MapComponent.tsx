'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix per l'icona di default di Leaflet non sempre caricata su Next.js/Webpack
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})
L.Marker.prototype.options.icon = DefaultIcon

interface JobShift {
  id: string
  role: string
  location: string
  date: string
  start_time: string
  end_time: string
  hourly_rate: number
  status: string
  restaurant_profiles?: {
    city?: string
  }
}

// Dizionario mock di coordinate principali (poiché il db attuale ha solo testo)
const CITIES_COORDS: Record<string, [number, number]> = {
  'milano': [45.4642, 9.1900],
  'roma': [41.9028, 12.4964],
  'firenze': [43.7696, 11.2558],
  'napoli': [40.8518, 14.2681],
  'torino': [45.0703, 7.6869],
}

// Funzione di jitter: aggiunge un offset casuale alle coordinate per tutelare la privacy
function addJitter(baseCoord: [number, number]): [number, number] {
  const maxOffset = 0.015 // Circa 1-1.5 km
  const latOffset = (Math.random() * maxOffset * 2) - maxOffset
  const lngOffset = (Math.random() * maxOffset * 2) - maxOffset
  return [baseCoord[0] + latOffset, baseCoord[1] + lngOffset]
}

export default function MapComponent({ jobs }: { jobs: JobShift[] }) {
  const [markers, setMarkers] = useState<(JobShift & { position: [number, number] })[]>([])

  useEffect(() => {
    // Calcoliamo la posizione offuscata dei marker una volta al montaggio
    const generatedMarkers = jobs.map(job => {
      const cityText = (job.restaurant_profiles?.city || job.location || '').toLowerCase()
      
      let baseCoord: [number, number] = [41.8719, 12.5674] // Default centro Italia
      
      for (const [cityKey, coords] of Object.entries(CITIES_COORDS)) {
        if (cityText.includes(cityKey)) {
          baseCoord = coords
          break
        }
      }

      return {
        ...job,
        position: addJitter(baseCoord)
      }
    })
    
    setMarkers(generatedMarkers)
  }, [jobs])

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl z-0 relative">
      <MapContainer 
        center={[41.8719, 12.5674]} 
        zoom={6} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {markers.map((job) => (
          <Marker key={job.id} position={job.position}>
            <Popup className="pupillo-popup">
              <div className="font-sans text-slate-900 min-w-[200px]">
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {job.role}
                  </span>
                  <span className="font-black text-emerald-600 text-sm">
                    {job.hourly_rate.toFixed(2)} €/h
                  </span>
                </div>
                
                <h3 className="font-bold text-[15px] leading-tight mb-1">
                  Ristorante Partner
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  📍 {job.restaurant_profiles?.city || 'Zona non specificata'} (Indirizzo approssimativo)
                </p>

                <div className="bg-slate-50 p-2 rounded-lg border border-slate-200 text-xs mb-4 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Data:</span>
                    <span className="font-semibold">{job.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Orario:</span>
                    <span className="font-semibold">{job.start_time} - {job.end_time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Stato:</span>
                    <span className="font-semibold text-teal-600 uppercase text-[10px]">{job.status}</span>
                  </div>
                </div>

                <a 
                  href={`/announcements/${job.id}`}
                  className="block w-full text-center bg-slate-900 text-white font-bold py-2 rounded-lg text-xs hover:bg-slate-800 transition-colors"
                >
                  Vedi Dettagli
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      <style dangerouslySetInnerHTML={{__html: `
        .leaflet-popup-content-wrapper {
          border-radius: 16px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }
        .leaflet-popup-content {
          margin: 16px;
        }
      `}} />
    </div>
  )
}
