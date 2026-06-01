'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../utils/supabase/client'
import dynamic from 'next/dynamic'

// Disattiviamo il Server-Side Rendering (SSR) per Leaflet onde evitare "window is not defined"
const MapComponent = dynamic(() => import('./MapComponent'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col justify-center items-center bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
      <div className="w-8 h-8 border-4 border-t-teal-400 border-slate-800 rounded-full animate-spin mb-4" />
      <span className="text-sm font-semibold text-slate-400">Caricamento mappa...</span>
    </div>
  )
})

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

export default function MappaPage() {
  const [jobs, setJobs] = useState<JobShift[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    loadJobsForMap()
  }, [])

  const loadJobsForMap = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      // Come richiesto, uso la stessa logica e tabella di /browse
      const { data: jobsData, error: jobsErr } = await supabase
        .from('jobs')
        .select('*, restaurant_profiles(city)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })

      if (jobsErr) throw jobsErr

      setJobs(jobsData || [])
    } catch (err: any) {
      console.error(err)
      setErrorMsg("Connessione Supabase assente. Visualizzazione dati in modalità demo locale.")
      
      // Fallback Dati Demo Identico a /browse per test offline
      const demoShifts: JobShift[] = [
        {
          id: 'demo-job-1',
          role: 'Cameriere di Sala',
          location: 'Milano centro',
          date: '2026-06-05',
          start_time: '18:00',
          end_time: '00:00',
          hourly_rate: 14.50,
          status: 'open',
          restaurant_profiles: { city: 'Milano' }
        },
        {
          id: 'demo-job-2',
          role: 'Barman / Mixologist',
          location: 'Corso Como, Milano',
          date: '2026-06-06',
          start_time: '21:00',
          end_time: '03:00',
          hourly_rate: 18.00,
          status: 'open',
          restaurant_profiles: { city: 'Milano' }
        },
        {
          id: 'demo-job-3',
          role: 'Aiuto Cuoco',
          location: 'Piazza della Signoria, Firenze',
          date: '2026-06-06',
          start_time: '17:00',
          end_time: '23:30',
          hourly_rate: 15.00,
          status: 'open',
          restaurant_profiles: { city: 'Firenze' }
        },
        {
          id: 'demo-job-4',
          role: 'Lavapiatti / Utility',
          location: 'Trastevere, Roma',
          date: '2026-06-05',
          start_time: '19:00',
          end_time: '01:00',
          hourly_rate: 11.00,
          status: 'open',
          restaurant_profiles: { city: 'Roma' }
        }
      ]
      setJobs(demoShifts)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 font-sans antialiased overflow-hidden">
      {/* Header */}
      <header className="z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/60 px-6 py-4 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">📍</span>
            <span 
              className="text-xl font-black tracking-tight bg-gradient-to-r from-teal-400 to-emerald-300 bg-clip-text text-transparent"
            >
              PUPILLO MAPPA
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.href = '/browse'}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-800 hover:bg-slate-900 transition-all flex items-center gap-1"
            >
              📄 Vista Lista
            </button>
          </div>
        </div>
      </header>

      {/* Main Area Full Height */}
      <main className="flex-1 relative flex flex-col p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto gap-4">
        <div className="flex justify-between items-end shrink-0">
          <div>
            <h1 className="text-2xl font-black text-slate-50">Turni sul territorio</h1>
            <p className="text-xs text-slate-400 mt-1">
              Esplora la mappa e scopri i turni disponibili vicino a te. Le posizioni sono approssimative per tutelare la privacy.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 shrink-0">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Map Container */}
        <div className="flex-1 min-h-0 relative">
          {loading ? (
            <div className="w-full h-full flex justify-center items-center bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
               <div className="w-8 h-8 border-4 border-t-teal-400 border-slate-800 rounded-full animate-spin" />
            </div>
          ) : (
            <MapComponent jobs={jobs} />
          )}
        </div>
      </main>
    </div>
  )
}
