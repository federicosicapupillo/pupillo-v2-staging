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
      setErrorMsg("Connessione Supabase assente. Dati in modalità demo locale.")
      
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
    <>
      <style>{`
        /* Self-contained styling for browse page */
        html, body {
          background-color: #000000 !important;
          color: #ffffff !important;
          margin: 0;
          padding: 0;
          font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          box-sizing: border-box;
          scroll-behavior: smooth;
        }

        *, *::before, *::after {
          box-sizing: inherit;
        }

        .browse-wrapper {
          min-height: 100vh;
          background-color: #000000;
          color: #ffffff;
          padding-bottom: 4rem;
        }

        /* Header / Navbar */
        .brand-header {
          position: sticky;
          top: 0;
          z-index: 50;
          background-color: #000000;
          border-bottom: 6px solid #ffffff;
          padding: 1rem 1.5rem;
        }

        .header-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          align-items: center;
          justify-content: space-between;
          max-width: 80rem;
          margin: 0 auto;
        }

        @media (min-width: 640px) {
          .header-container {
            flex-direction: row;
          }
        }

        .logo-nav {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
        }

        .text-logo-small {
          font-size: 1.25rem;
          font-weight: 900;
          letter-spacing: -0.05em;
          text-transform: uppercase;
          color: #eab308;
          background-color: #000000;
          border: 3px solid #ffffff;
          padding: 0.2rem 0.75rem;
          border-radius: 10px;
          box-shadow: 3px 3px 0px #7c3aed;
          display: inline-block;
          user-select: none;
          text-decoration: none;
          cursor: pointer;
        }

        .btn-header-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        /* Action Buttons */
        .pupillo-btn-header {
          padding: 0.5rem 1rem;
          font-size: 0.7rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-radius: 10px;
          border: 2px solid #ffffff;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.1s ease;
          display: inline-block;
        }

        .btn-header-black {
          background-color: #000000;
          color: #ffffff;
          box-shadow: 2px 2px 0px #ffffff;
        }

        .btn-header-black:hover {
          transform: translate(-1px, -1px);
          box-shadow: 3px 3px 0px #ffffff;
        }

        .btn-header-yellow {
          background-color: #eab308;
          color: #000000;
          box-shadow: 2px 2px 0px #7c3aed;
        }

        .btn-header-yellow:hover {
          transform: translate(-1px, -1px);
          box-shadow: 3px 3px 0px #7c3aed;
        }

        /* Main Content */
        .main-container {
          max-width: 80rem;
          margin: 0 auto;
          padding: 3rem 1.5rem;
        }

        .intro-section {
          margin-bottom: 2.5rem;
        }

        .intro-title {
          font-size: 1.75rem;
          font-weight: 900;
          text-transform: uppercase;
          margin: 0 0 0.5rem 0;
          letter-spacing: -0.01em;
        }

        @media (min-width: 768px) {
          .intro-title {
            font-size: 2.5rem;
          }
        }

        .title-accent {
          color: #eab308;
          text-shadow: 2px 2px 0px #7c3aed;
        }

        .intro-desc {
          font-size: 0.85rem;
          font-weight: bold;
          color: #cbd5e1;
          margin: 0;
          max-width: 40rem;
          line-height: 1.6;
        }

        /* Filter Panel */
        .pupillo-card-purple {
          background-color: #09090b;
          border: 6px solid #ffffff;
          box-shadow: 8px 8px 0px #7c3aed;
          border-radius: 32px;
          padding: 2rem;
          margin-bottom: 3rem;
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        @media (min-width: 768px) {
          .pupillo-card-purple {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .filter-label {
          font-size: 0.65rem;
          font-weight: 900;
          text-transform: uppercase;
          color: #94a3b8;
          letter-spacing: 0.05em;
        }

        .pupillo-input {
          width: 100%;
          padding: 0.75rem 1.25rem;
          border-radius: 16px;
          background-color: #000000;
          border: 4px solid #1f2937;
          color: #ffffff;
          font-size: 0.875rem;
          font-weight: bold;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }

        .pupillo-input:focus {
          border-color: #eab308;
        }

        select.pupillo-input {
          cursor: pointer;
        }

        /* Results area */
        .results-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .results-title {
          font-size: 1.25rem;
          font-weight: 900;
          text-transform: uppercase;
          color: #eab308;
          margin: 0;
          letter-spacing: 0.05em;
        }

        .reset-filter-btn {
          background-color: #000000;
          border: 2px solid #ffffff;
          color: #ffffff;
          font-weight: 900;
          text-transform: uppercase;
          font-size: 0.65rem;
          padding: 0.4rem 0.8rem;
          border-radius: 8px;
          cursor: pointer;
          box-shadow: 2px 2px 0px #ffffff;
          transition: all 0.1s ease;
        }

        .reset-filter-btn:hover {
          transform: translate(-1px, -1px);
          box-shadow: 3px 3px 0px #ffffff;
        }

        /* Loader */
        .loader-box {
          padding: 5rem 0;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .spinner {
          width: 3rem;
          height: 3rem;
          border: 4px solid #ffffff;
          border-top-color: #eab308;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .loader-text {
          font-size: 0.75rem;
          font-weight: 900;
          text-transform: uppercase;
          color: #eab308;
          letter-spacing: 0.05em;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-box {
          padding: 4rem 1.5rem;
          text-align: center;
          background-color: #09090b;
          border: 4px dashed #ffffff;
          border-radius: 24px;
          font-size: 0.875rem;
          font-weight: 900;
          color: #64748b;
          text-transform: uppercase;
          box-shadow: 6px 6px 0px #7c3aed;
        }

        /* Cards Grid */
        .cards-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }

        @media (min-width: 640px) {
          .cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .cards-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        /* Neobrutalist Card shifts */
        .pupillo-card-shift {
          background-color: #09090b;
          border: 4px solid #ffffff;
          border-radius: 32px;
          padding: 1.5rem;
          box-shadow: 6px 6px 0px #ffffff;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100%;
          box-sizing: border-box;
        }

        .pupillo-card-shift:hover {
          transform: scale(1.01);
          box-shadow: 8px 8px 0px #ffffff;
        }

        .card-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .pupillo-badge-yellow {
          padding: 0.3rem 0.6rem;
          font-size: 0.6rem;
          font-weight: 900;
          border-radius: 8px;
          background-color: #eab308;
          border: 2px solid #ffffff;
          color: #000000;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          box-shadow: 2px 2px 0px #7c3aed;
          display: inline-block;
        }

        .shift-rate {
          font-size: 0.85rem;
          font-weight: 900;
          color: #eab308;
          background-color: #000000;
          padding: 0.2rem 0.5rem;
          border-radius: 8px;
          border: 2px solid #ffffff;
          transform: rotate(2deg);
          box-shadow: 2px 2px 0px #ffffff;
        }

        .shift-title {
          font-size: 1.15rem;
          font-weight: 900;
          text-transform: uppercase;
          margin: 0;
          color: #ffffff;
        }

        .shift-location {
          font-size: 0.65rem;
          color: #9ca3af;
          font-weight: bold;
          margin-top: 0.25rem;
        }

        /* Logbox info */
        .shift-info-box {
          margin-top: 1rem;
          padding: 1rem;
          border-radius: 12px;
          background-color: #000000;
          border: 2px solid #ffffff;
          font-size: 0.7rem;
          font-weight: bold;
          color: #ffffff;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          box-shadow: 3px 3px 0px #ffffff;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
        }

        .info-label {
          color: #64748b;
        }

        .info-value {
          color: #eab308;
        }

        .shift-notes {
          font-size: 0.65rem;
          color: #94a3b8;
          font-style: italic;
          margin-top: 1rem;
          border-left: 2px solid #eab308;
          padding-left: 0.5rem;
          line-height: 1.4;
        }

        /* Actions row */
        .card-actions {
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 2px solid rgba(255,255,255,0.1);
          display: flex;
          gap: 0.5rem;
        }

        .card-btn-black {
          flex: 1;
          padding: 0.65rem;
          background-color: #000000;
          color: #ffffff;
          border: 2px solid #ffffff;
          font-weight: 900;
          text-transform: uppercase;
          font-size: 0.7rem;
          border-radius: 10px;
          cursor: pointer;
          box-shadow: 2px 2px 0px #fff;
          transition: all 0.1s ease;
          text-align: center;
          text-decoration: none;
        }

        .card-btn-black:hover {
          transform: translate(-1px, -1px);
          box-shadow: 3px 3px 0px #fff;
        }

        .card-btn-yellow {
          flex: 1;
          padding: 0.65rem;
          background-color: #eab308;
          color: #000000;
          border: 2px solid #ffffff;
          font-weight: 900;
          text-transform: uppercase;
          font-size: 0.7rem;
          border-radius: 10px;
          cursor: pointer;
          box-shadow: 2px 2px 0px #7c3aed;
          transition: all 0.1s ease;
          text-align: center;
          text-decoration: none;
        }

        .card-btn-yellow:hover {
          transform: translate(-1px, -1px);
          box-shadow: 3px 3px 0px #7c3aed;
        }

        .card-btn-disabled {
          flex: 1;
          padding: 0.65rem;
          background-color: #1f2937;
          color: #64748b;
          border: 2px solid #374151;
          font-weight: 900;
          text-transform: uppercase;
          font-size: 0.7rem;
          border-radius: 10px;
          text-align: center;
          pointer-events: none;
          box-shadow: none;
        }

        /* Notifications card styling */
        .alert-card {
          padding: 1rem;
          border-radius: 16px;
          border: 4px solid #ffffff;
          font-size: 0.75rem;
          font-weight: 900;
          text-transform: uppercase;
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .alert-error {
          background-color: #e11d48;
          color: #ffffff;
          box-shadow: 4px 4px 0px #be123c;
        }

        .alert-success {
          background-color: #7c3aed;
          color: #ffffff;
          box-shadow: 4px 4px 0px #6d28d9;
        }

      `}</style>

      <div className="browse-wrapper">
        
        {/* Header / Navbar */}
        <header className="brand-header">
          <div className="header-container">
            <div className="logo-nav" onClick={() => window.location.href = '/'}>
              <span className="text-logo-small">PUPILLO</span>
            </div>

            <div className="btn-header-group">
              <button
                onClick={() => window.location.href = '/mappa'}
                className="pupillo-btn-header btn-header-black"
              >
                🗺️ Vista Mappa
              </button>
              <button
                onClick={() => window.location.href = user ? (user.user_metadata?.role === 'restaurant' ? '/dashboard/restaurant' : '/dashboard/worker') : '/login'}
                className="pupillo-btn-header btn-header-yellow"
              >
                {user ? 'La Mia Dashboard' : 'Accedi'}
              </button>
            </div>
          </div>
        </header>

        {/* Main Section */}
        <main className="main-container">
          
          <section className="intro-section">
            <h1 className="intro-title">
              Trova il tuo prossimo <span className="title-accent">Turno Extra</span> 🍕
            </h1>
            <p className="intro-desc">
              Filtra gli annunci attivi vicino a te per ruolo, compenso o città, e candidati con un solo click. Riceverai risposta immediata dal ristorante.
            </p>
          </section>

          {/* Messages */}
          {errorMsg && (
            <div className="alert-card alert-error">
              <span>⚠️</span> {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="alert-card alert-success">
              <span>🎉</span> {successMsg}
            </div>
          )}

          {/* Filtri Panel */}
          <section className="pupillo-card-purple">
            <div className="filter-group">
              <label className="filter-label">Ruolo / Mansione</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="pupillo-input"
              >
                <option value="" className="bg-black">Tutti i ruoli</option>
                {rolesList.map(r => (
                  <option key={r} value={r} className="bg-black">{r}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Tariffa Minima (€/ora)</label>
              <input
                type="number"
                value={minRate}
                onChange={(e) => setMinRate(e.target.value)}
                className="pupillo-input"
                placeholder="es. 12"
                min="0"
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Cerca per Città / Indirizzo</label>
              <input
                type="text"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                className="pupillo-input"
                placeholder="es. Milano"
              />
            </div>
          </section>

          {/* Results list */}
          <section>
            <div className="results-header-row">
              <h2 className="results-title">
                Annunci Attivi ({filteredJobs.length})
              </h2>
              {(selectedRole || minRate || searchCity) && (
                <button
                  onClick={() => {
                    setSelectedRole('')
                    setMinRate('')
                    setSearchCity('')
                  }}
                  className="reset-filter-btn"
                >
                  Resetta Filtri
                </button>
              )}
            </div>

            {loading ? (
              <div className="loader-box">
                <div className="spinner" />
                <span className="loader-text">Ricerca turni in corso...</span>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="empty-box">
                Nessun turno extra corrisponde ai filtri impostati. Riprova con parametri diversi!
              </div>
            ) : (
              <div className="cards-grid">
                {filteredJobs.map((job) => {
                  const hasApplied = appliedJobIds.has(job.id)
                  return (
                    <div 
                      key={job.id} 
                      className="pupillo-card-shift"
                    >
                      <div>
                        <div className="card-header-row">
                          <span className="pupillo-badge-yellow">
                            {job.role}
                          </span>
                          <span className="shift-rate">
                            {job.hourly_rate.toFixed(2)} €/h
                          </span>
                        </div>
                        
                        <div>
                          <h3 className="shift-title">
                            {job.restaurant_profiles?.restaurant_name || 'Ristorante Extra'}
                          </h3>
                          <div className="shift-location">📍 {job.location}</div>
                        </div>

                        <div className="shift-info-box">
                          <div className="info-row">
                            <span className="info-label">DATA TURNO:</span>
                            <span className="info-value">{job.date}</span>
                          </div>
                          <div className="info-row">
                            <span className="info-label">ORARIO TURNO:</span>
                            <span>{job.start_time.substring(0, 5)} - {job.end_time.substring(0, 5)}</span>
                          </div>
                        </div>

                        {job.notes && (
                          <p className="shift-notes">
                            Note: "{job.notes}"
                          </p>
                        )}
                      </div>

                      <div className="card-actions">
                        <button
                          onClick={() => window.location.href = `/announcements/${job.id}`}
                          className="card-btn-black"
                        >
                          Dettagli
                        </button>
                        <button
                          onClick={() => handleApply(job.id)}
                          disabled={actionLoading === job.id || hasApplied}
                          className={hasApplied ? "card-btn-disabled" : "card-btn-yellow"}
                        >
                          {actionLoading === job.id 
                            ? '...' 
                            : hasApplied 
                            ? 'Candidato ✓' 
                            : 'Candidati'}
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
    </>
  )
}
