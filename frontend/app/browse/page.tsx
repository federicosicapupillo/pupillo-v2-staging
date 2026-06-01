'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../utils/supabase/client'

interface JobShift {
  id: string
  role: string
  location: string
  date: string
  start_time: string
  end_time: string
  hourly_rate: number
  notes?: string
  restaurant_profiles?: {
    restaurant_name: string
    city?: string
  }
}

export default function BrowseJobsPage() {
  const [user, setUser] = useState<any>(null)
  const [jobs, setJobs] = useState<JobShift[]>([])
  const [filteredJobs, setFilteredJobs] = useState<JobShift[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set())

  // Filtri
  const [selectedRole, setSelectedRole] = useState('')
  const [minRate, setMinRate] = useState('')
  const [searchCity, setSearchCity] = useState('')

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const rolesList = [
    'Cameriere di Sala',
    'Barman / Mixologist',
    'Aiuto Cuoco',
    'Lavapiatti / Utility',
    'Runner',
    'Pizzaiolo',
    'Barista'
  ]

  useEffect(() => {
    loadJobs()
  }, [])

  useEffect(() => {
    // Applica i filtri
    let temp = [...jobs]
    if (selectedRole) {
      temp = temp.filter(job => job.role.toLowerCase().includes(selectedRole.toLowerCase()))
    }
    if (minRate) {
      temp = temp.filter(job => job.hourly_rate >= parseFloat(minRate))
    }
    if (searchCity) {
      temp = temp.filter(job => {
        const city = job.restaurant_profiles?.city || ''
        const location = job.location || ''
        return city.toLowerCase().includes(searchCity.toLowerCase()) || 
               location.toLowerCase().includes(searchCity.toLowerCase())
      })
    }
    setFilteredJobs(temp)
  }, [selectedRole, minRate, searchCity, jobs])

  const loadJobs = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      // 1. Verifica utente autenticato
      const { data: { user: sessionUser } } = await supabase.auth.getUser()
      setUser(sessionUser)

      // 2. Carica i turni aperti
      const { data: jobsData, error: jobsErr } = await supabase
        .from('jobs')
        .select('*, restaurant_profiles(restaurant_name, city)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })

      if (jobsErr) throw jobsErr

      // 3. Se autenticato, carica le candidature già effettuate per contrassegnarle
      if (sessionUser) {
        const { data: appsData } = await supabase
          .from('applications')
          .select('job_id')
          .eq('worker_id', sessionUser.id)

        if (appsData) {
          setAppliedJobIds(new Set(appsData.map(app => app.job_id)))
        }
      }

      setJobs(jobsData || [])
    } catch (err: any) {
      console.error(err)
      setErrorMsg("Connessione Supabase assente. Visualizzazione dati in modalità demo locale.")
      
      // Fallback Dati Demo Premium
      const demoShifts: JobShift[] = [
        {
          id: 'demo-job-1',
          role: 'Cameriere di Sala',
          location: 'Via Montenapoleone 14, Milano',
          date: '2026-06-05',
          start_time: '18:00',
          end_time: '00:00',
          hourly_rate: 14.50,
          notes: 'Richiesta camicia nera e grembiule classico.',
          restaurant_profiles: { restaurant_name: 'Bistrot Duomo Milano', city: 'Milano' }
        },
        {
          id: 'demo-job-2',
          role: 'Barman / Mixologist',
          location: 'Corso Como 8, Milano',
          date: '2026-06-06',
          start_time: '21:00',
          end_time: '03:00',
          hourly_rate: 18.00,
          notes: 'Mixology bar con clientela internazionale. Divisa premium fornita.',
          restaurant_profiles: { restaurant_name: 'Skyline Terrace Bar', city: 'Milano' }
        },
        {
          id: 'demo-job-3',
          role: 'Aiuto Cuoco',
          location: 'Piazza della Signoria, Firenze',
          date: '2026-06-06',
          start_time: '17:00',
          end_time: '23:30',
          hourly_rate: 15.00,
          notes: 'HACCP attivo. Esperienza con griglia e secondi piatti.',
          restaurant_profiles: { restaurant_name: 'Antica Osteria Toscana', city: 'Firenze' }
        },
        {
          id: 'demo-job-4',
          role: 'Lavapiatti / Utility',
          location: 'Trastevere, Roma',
          date: '2026-06-05',
          start_time: '19:00',
          end_time: '01:00',
          hourly_rate: 11.00,
          notes: 'Velocità, serietà e stivali impermeabili consigliati.',
          restaurant_profiles: { restaurant_name: 'Trattoria Da Nando', city: 'Roma' }
        }
      ]
      setJobs(demoShifts)
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async (jobId: string) => {
    if (!user) {
      // Se non autenticato, rimanda a registrazione/login
      window.location.href = '/login'
      return
    }

    setActionLoading(jobId)
    setErrorMsg(null)
    setSuccessMsg(null)

    const supabase = createClient()

    try {
      const { error } = await supabase.from('applications').insert({
        job_id: jobId,
        worker_id: user.id,
      })

      if (error) throw error

      setSuccessMsg("Candidatura registrata con successo!")
      setAppliedJobIds(prev => {
        const next = new Set(prev)
        next.add(jobId)
        return next
      })
    } catch (err: any) {
      if (jobId.startsWith('demo-')) {
        setAppliedJobIds(prev => {
          const next = new Set(prev)
          next.add(jobId)
          return next
        })
        setSuccessMsg("Candidatura di test registrata localmente (Demo mode)!")
      } else {
        setErrorMsg(err.message || "Errore durante l'invio della candidatura.")
      }
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/60 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🏃‍♂️</span>
            <span 
              onClick={() => window.location.href = '/'}
              className="text-xl font-black tracking-tight bg-gradient-to-r from-teal-400 to-emerald-300 bg-clip-text text-transparent cursor-pointer"
            >
              PUPILLO BACHECA
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.location.href = '/mappa'}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-800 hover:bg-slate-900 transition-all flex items-center gap-1"
            >
              🗺️ Vista Mappa
            </button>
            <button
              onClick={() => window.location.href = user ? '/dashboard/worker' : '/login'}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 transition-all"
            >
              {user ? 'La Mia Dashboard' : 'Accedi'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Area */}
      <main className="max-w-7xl mx-auto px-6 py-12 space-y-10">
        <section className="space-y-4">
          <h1 className="text-3xl font-black tracking-tight text-slate-50">
            Trova il tuo prossimo <span className="bg-gradient-to-r from-teal-400 to-emerald-300 bg-clip-text text-transparent">Turno Extra</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl">
            Filtra gli annunci attivi vicino a te per ruolo, compenso o città, e candidati con un solo click. Riceverai risposta immediata dal ristorante.
          </p>
        </section>

        {/* Banner Alert Fallback */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 text-center">
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300 text-center">
            🎉 {successMsg}
          </div>
        )}

        {/* Filtri */}
        <section className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Ruolo / Mansione</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm outline-none text-slate-200 focus:border-teal-500"
            >
              <option value="">Tutti i ruoli</option>
              {rolesList.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Tariffa Minima (€/ora)</label>
            <input
              type="number"
              value={minRate}
              onChange={(e) => setMinRate(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm outline-none text-slate-200 placeholder-slate-600 focus:border-teal-500"
              placeholder="es. 12"
              min="0"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">Cerca per Città / Indirizzo</label>
            <input
              type="text"
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm outline-none text-slate-200 placeholder-slate-600 focus:border-teal-500"
              placeholder="es. Milano"
            />
          </div>
        </section>

        {/* Lista Risultati */}
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-100">
              Annunci Attivi ({filteredJobs.length})
            </h2>
            {(selectedRole || minRate || searchCity) && (
              <button
                onClick={() => {
                  setSelectedRole('')
                  setMinRate('')
                  setSearchCity('')
                }}
                className="text-xs text-teal-400 hover:underline"
              >
                Resetta Filtri
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-20 text-center flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-t-teal-400 border-slate-800 rounded-full animate-spin" />
              <span className="text-xs text-slate-400">Ricerca dei turni in corso...</span>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="py-16 rounded-3xl bg-slate-900 border border-slate-800 border-dashed text-center text-sm text-slate-500">
              Nessun turno extra corrisponde ai filtri impostati. Riprova con parametri diversi!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredJobs.map((job) => {
                const hasApplied = appliedJobIds.has(job.id)
                return (
                  <div 
                    key={job.id} 
                    className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between group shadow-lg"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 text-xs font-bold rounded-xl bg-teal-500/10 text-teal-300 border border-teal-500/20">
                          {job.role}
                        </span>
                        <span className="text-lg font-black text-emerald-400">
                          {job.hourly_rate.toFixed(2)} €/h
                        </span>
                      </div>
                      
                      <div>
                        <h3 className="text-base font-bold text-slate-100 group-hover:text-teal-400 transition-colors">
                          {job.restaurant_profiles?.restaurant_name || 'Ristorante Extra'}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">📍 {job.location}</p>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-850 text-xs text-slate-300 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Data Turno:</span>
                          <span className="font-semibold">{job.date}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Orario Turno:</span>
                          <span className="font-semibold">{job.start_time} - {job.end_time}</span>
                        </div>
                      </div>

                      {job.notes && (
                        <p className="text-[11px] text-slate-500 italic leading-snug">
                          Note: "{job.notes}"
                        </p>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center gap-2">
                      <button
                        onClick={() => window.location.href = `/announcements/${job.id}`}
                        className="flex-1 py-2.5 text-center text-xs font-bold rounded-xl border border-slate-800 hover:bg-slate-800 transition-all text-slate-300"
                      >
                        Vedi Dettagli
                      </button>
                      <button
                        onClick={() => handleApply(job.id)}
                        disabled={actionLoading === job.id || hasApplied}
                        className={`flex-1 py-2.5 text-center text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 ${
                          hasApplied
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 pointer-events-none'
                            : 'bg-teal-400 hover:bg-teal-300 text-slate-950'
                        }`}
                      >
                        {actionLoading === job.id 
                          ? 'Candidatura...' 
                          : hasApplied 
                          ? 'Candidato ✓' 
                          : 'Candidati Ora'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
