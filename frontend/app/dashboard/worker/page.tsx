'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../../utils/supabase/client'

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
    phone: string
  }
}

interface Application {
  id: string
  status: 'pending' | 'accepted' | 'rejected'
  jobs: JobShift
}

export default function WorkerDashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [availableJobs, setAvailableJobs] = useState<JobShift[]>([])
  const [myApplications, setMyApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    const loadDashboardData = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/login'
        return
      }

      setUser(user)

      try {
        // 1. Carica il profilo dettagliato del lavoratore
        const { data: prof } = await supabase
          .from('worker_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        setProfile(prof)

        // 2. Carica i turni aperti
        const { data: jobsData, error: jobsErr } = await supabase
          .from('jobs')
          .select('*, restaurant_profiles(restaurant_name, phone)')
          .eq('status', 'open')
          .order('created_at', { ascending: false })

        if (jobsErr) throw jobsErr
        setAvailableJobs(jobsData || [])

        // 3. Carica le mie candidature
        const { data: appsData, error: appsErr } = await supabase
          .from('applications')
          .select('*, jobs(*, restaurant_profiles(restaurant_name, phone))')
          .eq('worker_id', user.id)

        if (appsErr) throw appsErr
        setMyApplications(appsData || [])

      } catch (err: any) {
        console.error(err)
        setErrorMsg("Visualizzazione dati in modalità demo locale.")
        // Dati fittizi premium di fallback per test locale immediato
        setAvailableJobs([
          {
            id: 'demo-job-1',
            role: 'Cameriere di Sala',
            location: 'Trattoria Bella Vita - Milano Centro',
            date: '2026-06-05',
            start_time: '18:00',
            end_time: '00:00',
            hourly_rate: 12.50,
            notes: 'Richiesta camicia nera classica e scarpe scure.',
            restaurant_profiles: { restaurant_name: 'Trattoria Bella Vita', phone: '+39 02 123456' }
          },
          {
            id: 'demo-job-2',
            role: 'Aiuto Cuoco',
            location: 'Ristorante Da Nando - Roma Prati',
            date: '2026-06-06',
            start_time: '17:00',
            end_time: '23:30',
            hourly_rate: 15.00,
            notes: 'HACCP obbligatorio.',
            restaurant_profiles: { restaurant_name: 'Ristorante Da Nando', phone: '+39 06 987654' }
          }
        ])
        setMyApplications([
          {
            id: 'demo-app-1',
            status: 'pending',
            jobs: {
              id: 'demo-job-3',
              role: 'Barman',
              location: 'Lounge Skyline - Firenze',
              date: '2026-06-06',
              start_time: '21:00',
              end_time: '03:00',
              hourly_rate: 18.00,
              restaurant_profiles: { restaurant_name: 'Lounge Skyline', phone: '+39 055 112233' }
            }
          }
        ])
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const handleApply = async (jobId: string) => {
    if (!user) return
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

      setSuccessMsg("Candidatura inviata con successo!")
      // Ricarica le candidature
      const { data: appsData } = await supabase
        .from('applications')
        .select('*, jobs(*, restaurant_profiles(restaurant_name, phone))')
        .eq('worker_id', user.id)
      
      setMyApplications(appsData || [])
    } catch (err: any) {
      // Simulazione candidatura lato client in demo mode
      if (jobId.startsWith('demo-')) {
        const alreadyApplied = myApplications.some(app => app.jobs.id === jobId)
        if (alreadyApplied) {
          setErrorMsg("Ti sei già candidato a questo turno.")
          return
        }
        const targetJob = availableJobs.find(job => job.id === jobId)
        if (targetJob) {
          setMyApplications([
            ...myApplications,
            {
              id: `demo-new-app-${Date.now()}`,
              status: 'pending',
              jobs: targetJob
            }
          ])
          setSuccessMsg("Candidatura di test registrata localmente!")
        }
      } else {
        setErrorMsg(err.message || "Impossibile completare la candidatura.")
      }
    } finally {
      setActionLoading(null)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center items-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-t-teal-400 border-slate-800 rounded-full animate-spin" />
          <span className="text-xs text-slate-400">Caricamento bacheca...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/60 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🏃‍♂️</span>
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-teal-400 to-emerald-300 bg-clip-text text-transparent">
              PUPILLO WORKER
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Accedi come: <strong className="text-teal-400">{profile?.first_name} {profile?.last_name}</strong>
            </span>
            <button
              onClick={() => window.location.href = '/messages'}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-800 hover:bg-slate-900 transition-all"
            >
              💬 Chat
            </button>
            <button
              onClick={() => window.location.href = '/notifications'}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-800 hover:bg-slate-900 transition-all"
            >
              🔔 Notifiche
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-800 hover:bg-slate-900 transition-all"
            >
              Disconnetti
            </button>
          </div>
        </div>
      </header>

      {/* Main Area */}
      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* Banner */}
        <section className="p-8 rounded-3xl bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-slate-900 border border-slate-800/80">
          <h1 className="text-2xl font-black text-slate-50">Ciao, {profile?.first_name || 'Lavoratore'}! 👋</h1>
          <p className="text-sm text-slate-400 mt-2 max-w-xl leading-relaxed">
            Esplora gli annunci per turni extra attivi e invia la tua candidatura. I gestori dei locali riceveranno istantaneamente il tuo profilo e recapito telefonico.
          </p>
        </section>

        {/* Feedback Messages */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 text-center">
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300 text-center">
            🎉 {successMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Turni Disponibili (Bacheca) */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>🔎</span> Turni Extra Disponibili
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableJobs.map((job) => (
                <div key={job.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between hover:border-slate-700/80 transition-all group">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-teal-500/10 text-teal-300 border border-teal-500/20">
                        {job.role}
                      </span>
                      <span className="text-sm font-black text-emerald-400">
                        {job.hourly_rate.toFixed(2)} €/h
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-100 group-hover:text-teal-400 transition-colors">
                        {job.restaurant_profiles?.restaurant_name || 'Ristorante'}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-1">📍 {job.location}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950 text-xs space-y-1 text-slate-300 border border-slate-850">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Data:</span>
                        <span className="font-medium">{job.date}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Orario:</span>
                        <span className="font-medium">{job.start_time} - {job.end_time}</span>
                      </div>
                    </div>
                    {job.notes && (
                      <p className="text-[10px] text-slate-500 italic">
                        Note: "{job.notes}"
                      </p>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/50">
                    <button
                      onClick={() => handleApply(job.id)}
                      disabled={actionLoading === job.id}
                      className="w-full py-2 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-lg active:scale-95 transition-all disabled:opacity-50"
                    >
                      {actionLoading === job.id ? 'Candidatura...' : 'Candidati Ora'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Le Mie Candidature */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>📄</span> Le Mie Candidature
            </h2>
            
            <div className="space-y-3">
              {myApplications.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 border-dashed text-center text-xs text-slate-500">
                  Nessuna candidatura inviata. Candidati ad un turno extra per iniziare!
                </div>
              ) : (
                myApplications.map((app) => (
                  <div key={app.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 hover:border-slate-700/50 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{app.jobs.role}</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                        app.status === 'accepted' 
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' 
                          : app.status === 'rejected'
                          ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                          : 'bg-slate-950 text-slate-400 border-slate-850'
                      }`}>
                        {app.status === 'accepted' ? 'Approvato' : app.status === 'rejected' ? 'Rifiutato' : 'In attesa'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400">
                      <p>🏦 {app.jobs.restaurant_profiles?.restaurant_name}</p>
                      <p className="mt-1">📅 {app.jobs.date} ({app.jobs.start_time} - {app.jobs.end_time})</p>
                    </div>

                    {/* Sblocco contatti in caso di candidatura accettata */}
                    {app.status === 'accepted' && (
                      <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-300 space-y-1">
                        <p className="font-bold">📞 Contatto Ristorante sbloccato!</p>
                        <p>Telefono: <a href={`tel:${app.jobs.restaurant_profiles?.phone}`} className="underline font-mono">{app.jobs.restaurant_profiles?.phone}</a></p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
