'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../../utils/supabase/client'

interface JobShift {
  id: string
  role: string
  date: string
  start_time: string
  end_time: string
  hourly_rate: number
  location: string
  status: 'open' | 'matched' | 'completed' | 'cancelled'
  notes?: string
}

interface WorkerProfile {
  id: string
  first_name: string
  last_name: string
  phone: string
  bio?: string
  skills?: string[]
  experience_years?: number
}

interface Application {
  id: string
  job_id: string
  status: 'pending' | 'accepted' | 'rejected'
  worker_profiles: WorkerProfile
}

export default function RestaurantDashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [myJobs, setMyJobs] = useState<JobShift[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  // Moduli / Form di inserimento Turno
  const [showModal, setShowModal] = useState(false)
  const [roleInput, setRoleInput] = useState('')
  const [dateInput, setDateInput] = useState('')
  const [startTimeInput, setStartTimeInput] = useState('')
  const [endTimeInput, setEndTimeInput] = useState('')
  const [rateInput, setRateInput] = useState('')
  const [locationInput, setLocationInput] = useState('')
  const [notesInput, setNotesInput] = useState('')

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/login'
      return
    }

    setUser(user)

    try {
      // 1. Carica il profilo del ristoratore
      const { data: prof } = await supabase
        .from('restaurant_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(prof)

      if (prof) {
        // Imposta indirizzo di default per il form
        setLocationInput(`${prof.address}, ${prof.city}`)
      }

      // 2. Carica i turni creati
      const { data: jobsData, error: jobsErr } = await supabase
        .from('jobs')
        .select('*')
        .eq('restaurant_id', user.id)
        .order('created_at', { ascending: false })

      if (jobsErr) throw jobsErr
      setMyJobs(jobsData || [])

      // 3. Carica tutte le candidature ricevute per i turni del ristoratore
      const { data: appsData, error: appsErr } = await supabase
        .from('applications')
        .select('*, worker_profiles(*), jobs(restaurant_id)')
        .order('applied_at', { ascending: false })

      if (appsErr) throw appsErr
      // Filtra lato client solo le candidature per i turni del ristoratore corrente
      const filteredApps = (appsData || []).filter((app: any) => app.jobs?.restaurant_id === user.id)
      setApplications(filteredApps)

    } catch (err: any) {
      console.error(err)
      setErrorMsg("Visualizzazione dati in modalità demo locale.")
      // Fallback dati fittizi premium
      setMyJobs([
        {
          id: 'demo-job-1',
          role: 'Cameriere di Sala',
          date: '2026-06-05',
          start_time: '18:00',
          end_time: '00:00',
          hourly_rate: 12.50,
          location: 'Via Roma 12, Milano',
          status: 'open',
          notes: 'Richiesta camicia nera.'
        },
        {
          id: 'demo-job-2',
          role: 'Barman Extra',
          date: '2026-06-06',
          start_time: '21:00',
          end_time: '03:00',
          hourly_rate: 18.00,
          location: 'Via Roma 12, Milano',
          status: 'matched'
        }
      ])
      setApplications([
        {
          id: 'demo-app-1',
          job_id: 'demo-job-1',
          status: 'pending',
          worker_profiles: {
            id: 'demo-worker-1',
            first_name: 'Giuseppe',
            last_name: 'Verdi',
            phone: '+39 347 1122334',
            bio: 'Esperienza decennale in bar e sale affollate.',
            skills: ['Cameriere di Sala', 'Runner'],
            experience_years: 6
          }
        },
        {
          id: 'demo-app-2',
          job_id: 'demo-job-2',
          status: 'accepted',
          worker_profiles: {
            id: 'demo-worker-2',
            first_name: 'Francesca',
            last_name: 'Neri',
            phone: '+39 349 9988776',
            bio: 'Specializzata in cocktail bar di alto livello.',
            skills: ['Barman / Mixologist'],
            experience_years: 4
          }
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handlePublishJob = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    setLoading(true)

    const supabase = createClient()

    try {
      const jobData = {
        restaurant_id: user.id,
        role: roleInput,
        date: dateInput,
        start_time: startTimeInput + ':00',
        end_time: endTimeInput + ':00',
        hourly_rate: parseFloat(rateInput),
        location: locationInput,
        notes: notesInput || null,
        status: 'open'
      }

      const { error } = await supabase.from('jobs').insert(jobData)
      if (error) throw error

      setSuccessMsg("Turno pubblicato con successo!")
      setShowModal(false)
      loadDashboardData()

      // Reset form
      setRoleInput('')
      setDateInput('')
      setStartTimeInput('')
      setEndTimeInput('')
      setRateInput('')
      setNotesInput('')

    } catch (err: any) {
      // Fallback demo local
      if (user) {
        const newDemoJob: JobShift = {
          id: `demo-job-${Date.now()}`,
          role: roleInput,
          date: dateInput,
          start_time: startTimeInput,
          end_time: endTimeInput,
          hourly_rate: parseFloat(rateInput),
          location: locationInput,
          status: 'open',
          notes: notesInput || undefined
        }
        setMyJobs([newDemoJob, ...myJobs])
        setSuccessMsg("Turno di test registrato localmente!")
        setShowModal(false)
      } else {
        setErrorMsg(err.message || "Errore nella pubblicazione del turno.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateAppStatus = async (appId: string, jobId: string, newStatus: 'accepted' | 'rejected') => {
    setActionLoading(appId)
    setErrorMsg(null)
    setSuccessMsg(null)

    const supabase = createClient()

    try {
      // 1. Aggiorna lo stato della candidatura selezionata
      const { error: appErr } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', appId)

      if (appErr) throw appErr

      if (newStatus === 'accepted') {
        // 2. Aggiorna il turno a "matched"
        await supabase
          .from('jobs')
          .update({ status: 'matched' })
          .eq('id', jobId)

        // 3. Rifiuta automaticamente le altre candidature per lo stesso turno
        await supabase
          .from('applications')
          .update({ status: 'rejected' })
          .eq('job_id', jobId)
          .neq('id', appId)
      }

      setSuccessMsg(newStatus === 'accepted' ? "Candidato accettato! Contatti sbloccati." : "Candidato rifiutato.")
      loadDashboardData()

    } catch (err: any) {
      // Simulazione client-side in demo mode
      if (appId.startsWith('demo-')) {
        setApplications(applications.map((app) => {
          if (app.id === appId) {
            return { ...app, status: newStatus }
          }
          if (newStatus === 'accepted' && app.job_id === jobId && app.id !== appId) {
            return { ...app, status: 'rejected' }
          }
          return app
        }))

        if (newStatus === 'accepted') {
          setMyJobs(myJobs.map(job => job.id === jobId ? { ...job, status: 'matched' } : job))
        }

        setSuccessMsg(newStatus === 'accepted' ? "Candidato di test accettato (Demo local)!" : "Candidato di test rifiutato.")
      } else {
        setErrorMsg(err.message || "Errore durante l'aggiornamento dello stato.")
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

  if (loading && myJobs.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center items-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-t-emerald-400 border-slate-800 rounded-full animate-spin" />
          <span className="text-xs text-slate-400">Caricamento pannello gestore...</span>
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
            <span className="text-xl">🍽️</span>
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-teal-400 to-emerald-300 bg-clip-text text-transparent">
              PUPILLO RESTAURANT
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Locale: <strong className="text-emerald-400">{profile?.restaurant_name}</strong>
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

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* Banner */}
        <section className="p-8 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-slate-900 border border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <h1 className="text-2xl font-black text-slate-50">Area Gestione: {profile?.restaurant_name || 'Ristoratore'} 🍽️</h1>
            <p className="text-sm text-slate-400 mt-2 max-w-xl">
              Pubblica nuove posizioni lavorative temporanee ed esamina in tempo reale le candidature dei lavoratori.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-teal-500/10 active:scale-95 transition-all"
          >
            + Pubblica Turno Extra
          </button>
        </section>

        {/* Alerts */}
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
          
          {/* I Miei Annunci */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>📋</span> I Miei Annunci Pubblicati
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myJobs.length === 0 ? (
                <div className="col-span-full p-8 rounded-2xl bg-slate-900 border border-slate-800 border-dashed text-center text-xs text-slate-500">
                  Nessun turno inserito. Clicca su "Pubblica Turno Extra" per iniziare!
                </div>
              ) : (
                myJobs.map((job) => (
                  <div key={job.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 text-[10px] font-bold rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          {job.role}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          job.status === 'matched' 
                            ? 'bg-teal-500/10 text-teal-300 border border-teal-500/20' 
                            : 'bg-slate-950 text-slate-400 border border-slate-850'
                        }`}>
                          {job.status === 'matched' ? 'Assegnato' : 'Aperto'}
                        </span>
                      </div>

                      <div className="text-sm font-black text-slate-200">
                        {job.hourly_rate.toFixed(2)} €/ora
                      </div>

                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-850 text-xs space-y-1 text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Data:</span>
                          <span className="font-semibold">{job.date}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Fascia:</span>
                          <span className="font-semibold">{job.start_time} - {job.end_time}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Presso:</span>
                          <span className="font-semibold truncate max-w-[120px]">{job.location}</span>
                        </div>
                      </div>

                      {job.notes && (
                        <p className="text-[10px] text-slate-500 italic">
                          Note: "{job.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Candidature Ricevute */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span>👋</span> Candidati Ricevuti
            </h2>

            <div className="space-y-3">
              {applications.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 border-dashed text-center text-xs text-slate-500">
                  Nessuna candidatura ricevuta al momento.
                </div>
              ) : (
                applications.map((app) => {
                  const associatedJob = myJobs.find(job => job.id === app.job_id)
                  return (
                    <div key={app.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-slate-200">
                          {app.worker_profiles.first_name} {app.worker_profiles.last_name}
                        </div>
                        <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                          Extra: {associatedJob ? associatedJob.role : 'Turno'}
                        </span>
                      </div>

                      <div className="text-xs space-y-1 text-slate-300">
                        {app.worker_profiles.experience_years !== undefined && (
                          <p><span className="text-slate-500">Esperienza:</span> {app.worker_profiles.experience_years} anni</p>
                        )}
                        {app.worker_profiles.skills && app.worker_profiles.skills.length > 0 && (
                          <p><span className="text-slate-500">Mansioni:</span> {app.worker_profiles.skills.join(', ')}</p>
                        )}
                        {app.worker_profiles.bio && (
                          <p className="text-[11px] text-slate-400 italic bg-slate-950/60 p-2 rounded border border-slate-850 mt-1">"{app.worker_profiles.bio}"</p>
                        )}
                      </div>

                      {/* Bottoni d'Azione o Contatti sbloccati */}
                      {app.status === 'pending' ? (
                        <div className="flex gap-2 pt-2 border-t border-slate-850">
                          <button
                            onClick={() => handleUpdateAppStatus(app.id, app.job_id, 'accepted')}
                            disabled={actionLoading === app.id}
                            className="flex-1 py-2 text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-lg transition-all active:scale-95"
                          >
                            Accetta
                          </button>
                          <button
                            onClick={() => handleUpdateAppStatus(app.id, app.job_id, 'rejected')}
                            disabled={actionLoading === app.id}
                            className="flex-1 py-2 text-xs font-bold text-slate-400 hover:bg-slate-800 border border-slate-800 rounded-lg transition-all"
                          >
                            Rifiuta
                          </button>
                        </div>
                      ) : (
                        <div className={`p-3 rounded-lg text-xs border ${
                          app.status === 'accepted'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                        }`}>
                          <div className="font-bold flex items-center justify-between mb-1">
                            <span>{app.status === 'accepted' ? '✅ Candidato Accettato' : '❌ Candidato Rifiutato'}</span>
                          </div>
                          {app.status === 'accepted' && (
                            <p className="mt-1">Contatto: <a href={`tel:${app.worker_profiles.phone}`} className="underline font-mono font-bold">{app.worker_profiles.phone}</a></p>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal Pubblicazione Turno Extra */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100">Pubblica Nuovo Turno Extra</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-100 text-sm"
              >
                Chiudi
              </button>
            </div>

            <form onSubmit={handlePublishJob} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Ruolo Richiesto *</label>
                <input
                  type="text"
                  required
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm outline-none focus:border-emerald-500"
                  placeholder="es. Cameriere di Sala"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Data Turno *</label>
                  <input
                    type="date"
                    required
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Compenso Orario Netto (€/h) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={rateInput}
                    onChange={(e) => setRateInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm outline-none focus:border-emerald-500"
                    placeholder="es. 12.50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Orario Inizio *</label>
                  <input
                    type="time"
                    required
                    value={startTimeInput}
                    onChange={(e) => setStartTimeInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-400">Orario Fine *</label>
                  <input
                    type="time"
                    required
                    value={endTimeInput}
                    onChange={(e) => setEndTimeInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Indirizzo / Luogo *</label>
                <input
                  type="text"
                  required
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-400">Note Aggiuntive / Istruzioni</label>
                <textarea
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm outline-none focus:border-emerald-500 h-20 resize-none"
                  placeholder="Istruzioni sull'abbigliamento, HACCP o compiti..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold text-sm shadow-lg active:scale-98 transition-all"
              >
                Pubblica Annuncio Ora
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
