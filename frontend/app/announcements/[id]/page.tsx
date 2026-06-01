'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../../utils/supabase/client'
import { useParams } from 'next/navigation'

interface JobShift {
  id: string
  role: string
  location: string
  date: string
  start_time: string
  end_time: string
  hourly_rate: number
  notes?: string
  status: 'open' | 'matched' | 'completed' | 'cancelled'
  restaurant_id: string
  restaurant_profiles?: {
    restaurant_name: string
    company_name?: string
    phone: string
    address?: string
    city?: string
    description?: string
  }
}

export default function AnnouncementDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [user, setUser] = useState<any>(null)
  const [job, setJob] = useState<JobShift | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null)

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    loadJobDetails()
  }, [id])

  const loadJobDetails = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      // 1. Carica sessione utente
      const { data: { user: sessionUser } } = await supabase.auth.getUser()
      setUser(sessionUser)

      // 2. Carica i dettagli del turno
      const { data: jobData, error: jobErr } = await supabase
        .from('jobs')
        .select('*, restaurant_profiles(*)')
        .eq('id', id)
        .single()

      if (jobErr) throw jobErr
      setJob(jobData)

      // 3. Se loggato, controlla se c'è già una candidatura per questo turno
      if (sessionUser && jobData) {
        const { data: appData } = await supabase
          .from('applications')
          .select('status')
          .eq('job_id', jobData.id)
          .eq('worker_id', sessionUser.id)
          .maybeSingle()

        if (appData) {
          setApplicationStatus(appData.status)
        }
      }

    } catch (err: any) {
      console.error(err)
      setErrorMsg("Dettaglio caricato in modalità demo locale.")
      
      // Fallback Dati Demo se l'ID è demo o se la query fallisce
      const demoShifts: Record<string, JobShift> = {
        'demo-job-1': {
          id: 'demo-job-1',
          role: 'Cameriere di Sala',
          location: 'Via Montenapoleone 14, Milano',
          date: '2026-06-05',
          start_time: '18:00',
          end_time: '00:00',
          hourly_rate: 14.50,
          notes: 'Richiesta camicia nera classica stirata, pantaloni neri eleganti e scarpe scure pulite. HACCP gradito.',
          status: 'open',
          restaurant_id: 'demo-rest-1',
          restaurant_profiles: {
            restaurant_name: 'Bistrot Duomo Milano',
            company_name: 'Duomo Food S.r.l.',
            phone: '+39 02 123456',
            address: 'Via Montenapoleone 14',
            city: 'Milano',
            description: 'Elegante bistrot milanese a due passi dal Duomo, specializzato in cucina tradizionale gourmet.'
          }
        },
        'demo-job-2': {
          id: 'demo-job-2',
          role: 'Barman / Mixologist',
          location: 'Corso Como 8, Milano',
          date: '2026-06-06',
          start_time: '21:00',
          end_time: '03:00',
          hourly_rate: 18.00,
          notes: 'Esperienza in cocktail bar di alta gamma e gestione flussi veloci. Divisa e kit barman forniti dal locale.',
          status: 'open',
          restaurant_id: 'demo-rest-2',
          restaurant_profiles: {
            restaurant_name: 'Skyline Terrace Bar',
            company_name: 'Sky Lounge S.r.l.',
            phone: '+39 02 987654',
            address: 'Corso Como 8',
            city: 'Milano',
            description: 'Esclusivo cocktail bar panoramico rinomato per la sua drink list d\'autore e DJ set serali.'
          }
        }
      }

      const selectedJob = demoShifts[id] || demoShifts['demo-job-1']
      setJob(selectedJob)
      
      // Simulazione candidatura locale
      if (id === 'demo-job-2') {
        setApplicationStatus('accepted')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (!user) {
      window.location.href = '/login'
      return
    }

    if (!job) return

    setActionLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const supabase = createClient()

    try {
      const { error } = await supabase.from('applications').insert({
        job_id: job.id,
        worker_id: user.id,
      })

      if (error) throw error

      setSuccessMsg("Ti sei candidato con successo a questo turno!")
      setApplicationStatus('pending')
    } catch (err: any) {
      if (job.id.startsWith('demo-')) {
        setApplicationStatus('pending')
        setSuccessMsg("Candidatura di test registrata localmente (Demo mode)!")
      } else {
        setErrorMsg(err.message || "Errore durante l'invio della candidatura.")
      }
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center items-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-t-teal-400 border-slate-800 rounded-full animate-spin" />
          <span className="text-xs text-slate-400">Caricamento dettagli in corso...</span>
        </div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center gap-4 font-sans">
        <p className="text-slate-400">Turno extra non trovato o non disponibile.</p>
        <button 
          onClick={() => window.location.href = '/browse'}
          className="px-6 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-300"
        >
          Torna alla Bacheca
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/60 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => window.location.href = '/browse'}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-800 hover:bg-slate-900 transition-all flex items-center gap-1.5"
          >
            ← Torna alla Bacheca
          </button>
          <span className="text-sm font-black tracking-tight bg-gradient-to-r from-teal-400 to-emerald-300 bg-clip-text text-transparent">
            DETTAGLIO TURNO
          </span>
        </div>
      </header>

      {/* Content Container */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">
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

        {/* Card Principale Dettagli */}
        <section className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
            <div>
              <span className="px-3 py-1 text-xs font-bold rounded-xl bg-teal-500/10 text-teal-300 border border-teal-500/20">
                {job.role}
              </span>
              <h1 className="text-2xl font-black text-slate-50 mt-3">
                {job.restaurant_profiles?.restaurant_name}
              </h1>
              <p className="text-xs text-slate-400 mt-1">📍 {job.location}</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black text-emerald-400 block">
                {job.hourly_rate.toFixed(2)} €/h
              </span>
              <span className="text-[10px] text-slate-500">compenso orario netto</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-2">
            {/* Info Logistiche */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Pianificazione Turno</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-lg">📅</span>
                  <div>
                    <p className="text-xs text-slate-400">Data del Turno</p>
                    <p className="text-sm font-semibold">{job.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-lg">🕒</span>
                  <div>
                    <p className="text-xs text-slate-400">Fascia Oraria</p>
                    <p className="text-sm font-semibold">{job.start_time} - {job.end_time}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Note e Requisiti */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Istruzioni e Note del Locale</h3>
              <p className="text-sm text-slate-300 bg-slate-950/60 p-4 rounded-2xl border border-slate-850 leading-relaxed italic">
                "{job.notes || 'Nessuna nota aggiuntiva fornita dal ristoratore.'}"
              </p>
            </div>
          </div>

          {/* Profilo Ristorante */}
          {job.restaurant_profiles?.description && (
            <div className="border-t border-slate-800 pt-6 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Chi Siamo</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {job.restaurant_profiles.description}
              </p>
            </div>
          )}

          {/* Sblocco contatti */}
          {applicationStatus === 'accepted' && (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 space-y-2 border-dashed">
              <h4 className="text-sm font-black flex items-center gap-1.5">
                <span>✅</span> Candidatura Accettata — Contatti Sbloccati!
              </h4>
              <p className="text-xs text-emerald-400/90 leading-relaxed">
                Il gestore ha accettato il tuo profilo. Puoi contattarlo direttamente via telefono per concordare i dettagli o recarti direttamente al locale.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row gap-4">
                <p className="text-xs"><span className="text-slate-400">Telefono:</span> <a href={`tel:${job.restaurant_profiles?.phone}`} className="underline font-mono font-bold">{job.restaurant_profiles?.phone}</a></p>
                {job.restaurant_profiles?.address && (
                  <p className="text-xs"><span className="text-slate-400">Indirizzo:</span> <strong className="font-semibold">{job.restaurant_profiles.address}, {job.restaurant_profiles.city}</strong></p>
                )}
              </div>
            </div>
          )}

          {/* Bottoni d'Azione */}
          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center gap-4">
            {applicationStatus === 'accepted' ? (
              <button
                onClick={() => window.location.href = `/messages/${job.id}`}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/10 active:scale-98 transition-all"
              >
                💬 Apri Chat di Turno
              </button>
            ) : applicationStatus === 'pending' ? (
              <div className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center text-sm text-slate-400 font-semibold flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Candidatura Inviata in Attesa di Valutazione
              </div>
            ) : applicationStatus === 'rejected' ? (
              <div className="w-full p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center text-sm text-rose-400 font-semibold">
                Candidatura Rifiutata per questo turno
              </div>
            ) : (
              <button
                onClick={handleApply}
                disabled={actionLoading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/10 active:scale-98 transition-all disabled:opacity-50"
              >
                {actionLoading ? 'Invio candidatura...' : 'Invia Candidatura Istantanea'}
              </button>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
