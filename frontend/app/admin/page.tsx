'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../utils/supabase/client'

// -- TIPI BASE --
interface Profile {
  id: string
  first_name: string
  last_name: string
  email: string
  primary_role: string
  phone_verified: boolean
  account_status: string
  created_at: string
}

interface Job {
  id: string
  role: string
  location: string
  status: string
  hourly_rate: number
  date: string
}

interface Application {
  id: string
  status: string
  applied_at: string
}

// -- HELPER MASCHERAMENTO --
function maskEmail(email: string | undefined | null) {
  if (!email) return 'N/D'
  const [name, domain] = email.split('@')
  if (!domain) return email
  const maskedName = name.length > 3 ? name.substring(0, 3) + '***' : name + '***'
  const [domName, domExt] = domain.split('.')
  const maskedDom = domName.length > 2 ? domName.substring(0, 2) + '***' : domName + '***'
  return `${maskedName}@${maskedDom}.${domExt || 'com'}`
}

function maskPhone() {
  return '+39 3** *** **01'
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'jobs' | 'system'>('overview')
  
  // States
  const [loading, setLoading] = useState(true)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [demoActionMsg, setDemoActionMsg] = useState<string | null>(null)

  // Auth Gate
  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/login'
      return
    }

    // Verifica ruolo admin
    let isAdmin = false
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()
    
    if (roleData && roleData.role === 'admin') {
      isAdmin = true
    }

    if (!isAdmin) {
      // Gate client-side. Non usarlo come sicurezza assoluta backend (le tabelle hanno RLS), ma ottimo per UI routing.
      window.location.href = '/forbidden'
      return
    }

    // Se arrivo qui, utente confermato admin per la UI.
    loadAdminData()
  }

  const loadAdminData = async () => {
    setLoading(true)
    setErrorMsg(null)
    const supabase = createClient()

    try {
      const [profRes, jobsRes, appsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('jobs').select('*').order('created_at', { ascending: false }).limit(100),
        supabase.from('applications').select('*').order('applied_at', { ascending: false }).limit(100)
      ])

      if (profRes.error) throw profRes.error
      if (jobsRes.error) throw jobsRes.error
      if (appsRes.error) throw appsRes.error

      setProfiles(profRes.data || [])
      setJobs(jobsRes.data || [])
      setApplications(appsRes.data || [])

    } catch (err: any) {
      console.warn("DB offline o errore permessi. Caricamento mock.", err)
      setErrorMsg("Errore di connessione o RLS attiva. Visualizzazione in Demo Fallback mode.")
      loadDemoData()
    } finally {
      setLoading(false)
    }
  }

  const loadDemoData = () => {
    setProfiles([
      { id: '1', first_name: 'Mario', last_name: 'Rossi', email: 'mario.rossi@example.com', primary_role: 'worker', phone_verified: true, account_status: 'active', created_at: '2026-05-10T10:00:00Z' },
      { id: '2', first_name: 'Luigi', last_name: 'Verdi', email: 'luigi.verdi@example.com', primary_role: 'restaurant', phone_verified: false, account_status: 'pending', created_at: '2026-05-11T12:00:00Z' },
      { id: '3', first_name: 'Admin', last_name: 'Super', email: 'admin@pupillo.com', primary_role: 'admin', phone_verified: true, account_status: 'active', created_at: '2026-01-01T00:00:00Z' }
    ])
    setJobs([
      { id: 'j1', role: 'Cameriere', location: 'Milano', status: 'open', hourly_rate: 14, date: '2026-06-10' },
      { id: 'j2', role: 'Barman', location: 'Roma', status: 'matched', hourly_rate: 16, date: '2026-06-12' },
      { id: 'j3', role: 'Cuoco', location: 'Firenze', status: 'completed', hourly_rate: 18, date: '2026-05-20' },
    ])
    setApplications([
      { id: 'a1', status: 'pending', applied_at: '2026-06-01T10:00:00Z' },
      { id: 'a2', status: 'accepted', applied_at: '2026-05-30T10:00:00Z' },
    ])
  }

  // Simulatore Azioni Distruttive
  const triggerDemoAction = (actionName: string) => {
    setDemoActionMsg(`Azione intercettata: [${actionName}]. Funzione demo: nessuna modifica reale eseguita sul DB.`)
    setTimeout(() => setDemoActionMsg(null), 4000)
  }

  // --- RENDERING SCHEDE ---
  const renderOverview = () => {
    const activeWorkers = profiles.filter(p => p.primary_role === 'worker').length
    const activeRests = profiles.filter(p => p.primary_role === 'restaurant').length
    const openJobs = jobs.filter(j => j.status === 'open').length
    const totalApps = applications.length

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
            <h3 className="text-sm font-bold text-slate-400">Totale Lavoratori</h3>
            <p className="text-3xl font-black text-teal-400 mt-2">{activeWorkers}</p>
          </div>
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
            <h3 className="text-sm font-bold text-slate-400">Totale Ristoranti</h3>
            <p className="text-3xl font-black text-emerald-400 mt-2">{activeRests}</p>
          </div>
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
            <h3 className="text-sm font-bold text-slate-400">Turni Aperti</h3>
            <p className="text-3xl font-black text-amber-400 mt-2">{openJobs}</p>
          </div>
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-md">
            <h3 className="text-sm font-bold text-slate-400">Candidature Totali</h3>
            <p className="text-3xl font-black text-rose-400 mt-2">{totalApps}</p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-lg font-bold text-slate-100">Azioni Rapide Simulate</h2>
          <div className="flex flex-wrap gap-4">
            <button onClick={() => triggerDemoAction('Report Piattaforma Mensile')} className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold transition-all border border-slate-700">Genera Report</button>
            <button onClick={() => triggerDemoAction('Invia Notifica Push Globale')} className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold transition-all border border-slate-700">Notifica Globale</button>
            <button onClick={() => triggerDemoAction('Analisi No-Show (Dispute)')} className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold transition-all border border-slate-700">Analizza No-Show</button>
          </div>
        </div>
      </div>
    )
  }

  const renderUsers = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900 shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-xs uppercase text-slate-500 border-b border-slate-800">
            <tr>
              <th className="px-6 py-4 font-bold">Utente (Mascherato)</th>
              <th className="px-6 py-4 font-bold">Ruolo</th>
              <th className="px-6 py-4 font-bold">Contatto</th>
              <th className="px-6 py-4 font-bold">Stato</th>
              <th className="px-6 py-4 font-bold text-right">Azioni (Demo)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {profiles.map(p => (
              <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-100">
                  {p.first_name} {p.last_name[0]}.<br/>
                  <span className="text-[10px] text-slate-500 font-mono">{p.id.substring(0,8)}...</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${p.primary_role === 'admin' ? 'bg-rose-500/10 text-rose-400' : p.primary_role === 'worker' ? 'bg-teal-500/10 text-teal-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {p.primary_role.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs font-mono text-slate-400 space-y-1">
                  <p>{maskEmail(p.email)}</p>
                  <p>{maskPhone()}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-[10px] font-bold rounded-md ${p.account_status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
                    {p.account_status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => triggerDemoAction(`Verifica Id per ${p.id}`)} className="text-teal-400 hover:text-teal-300 text-xs font-bold underline">Verifica</button>
                  <button onClick={() => triggerDemoAction(`Banna/Sospendi utente ${p.id}`)} className="text-rose-400 hover:text-rose-300 text-xs font-bold underline">Banna</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {profiles.length === 0 && <div className="p-8 text-center text-slate-500 text-sm">Nessun utente trovato.</div>}
      </div>
    </div>
  )

  const renderJobs = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900 shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-xs uppercase text-slate-500 border-b border-slate-800">
            <tr>
              <th className="px-6 py-4 font-bold">ID Turno</th>
              <th className="px-6 py-4 font-bold">Ruolo / Luogo</th>
              <th className="px-6 py-4 font-bold">Tariffa</th>
              <th className="px-6 py-4 font-bold">Stato</th>
              <th className="px-6 py-4 font-bold text-right">Azioni (Demo)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {jobs.map(j => (
              <tr key={j.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-slate-500">
                  {j.id.substring(0,8)}...
                </td>
                <td className="px-6 py-4 font-medium text-slate-200">
                  {j.role}<br/>
                  <span className="text-[10px] text-slate-500">{j.location} • {j.date}</span>
                </td>
                <td className="px-6 py-4 font-mono text-emerald-400">
                  {j.hourly_rate} €/h
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-[10px] font-bold rounded-md bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                    {j.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => triggerDemoAction(`Forza Match turno ${j.id}`)} className="text-emerald-400 hover:text-emerald-300 text-xs font-bold underline">Matcha</button>
                  <button onClick={() => triggerDemoAction(`Cancella turno ${j.id}`)} className="text-rose-400 hover:text-rose-300 text-xs font-bold underline">Annulla</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {jobs.length === 0 && <div className="p-8 text-center text-slate-500 text-sm">Nessun turno trovato.</div>}
      </div>
    </div>
  )

  const renderSystem = () => (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="p-6 rounded-3xl bg-rose-500/10 border border-rose-500/20 space-y-4">
        <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">⚠️ Zona Pericolosa (Protetta)</h3>
        <p className="text-xs text-rose-400/80 leading-relaxed">
          Queste azioni agiscono sull'intero database di produzione. Sono attualmente neutralizzate e disabilitate. Qualsiasi click genererà unicamente un mock di verifica per la sicurezza dell'ambiente.
        </p>
        <div className="flex flex-col gap-3 pt-2">
          <button onClick={() => triggerDemoAction('Esegui Reset Globale DB')} className="w-full py-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold border border-rose-500/50 transition-colors">
            🔥 Esegui Reset Completo Database
          </button>
          <button onClick={() => triggerDemoAction('Rimuovi tutti gli Utenti Inattivi')} className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors">
            🗑️ Purge Account Sospesi
          </button>
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-teal-500/10 border border-teal-500/20 space-y-4">
        <h3 className="text-sm font-bold text-teal-400 flex items-center gap-2">💾 Manutenzione & Backup</h3>
        <div className="flex flex-col gap-3 pt-2">
          <button onClick={() => triggerDemoAction('Esegui Backup Snapshot DB')} className="w-full py-3 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 text-xs font-bold border border-teal-500/50 transition-colors">
            Invia Richiesta Snapshot (Simulato)
          </button>
          <button onClick={() => triggerDemoAction('Esegui Ricalcolo Statistiche Rating')} className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors">
            Ricalcola Rating e Punteggi Reputazione
          </button>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center">
        <div className="w-8 h-8 border-4 border-t-rose-500 border-slate-800 rounded-full animate-spin mb-4" />
        <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Inizializzazione Gateway Secure Admin...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased flex flex-col">
      {/* Toast Alert Demo (Globale e fluttuante) */}
      {demoActionMsg && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-fade-in-down">
          <div className="bg-rose-500 text-white text-xs font-bold px-6 py-3 rounded-2xl shadow-2xl border-2 border-rose-400 flex items-center gap-2">
            <span>🛡️</span> {demoActionMsg}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-2xl">⚡</span>
            <div>
              <h1 className="text-xl font-black bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent">
                ADMIN CONSOLE
              </h1>
              <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Pupillo Root Access • Sandboxed</p>
            </div>
          </div>
          <button 
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-bold hover:bg-slate-900 transition-colors"
          >
            Esci dall'Admin
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Nav */}
        <aside className="lg:w-64 shrink-0 space-y-2">
          {errorMsg && (
            <div className="mb-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-400 leading-tight">
              {errorMsg}
            </div>
          )}
          
          <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`text-left px-5 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'overview' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-300'}`}
            >
              📊 Overview Generale
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`text-left px-5 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-300'}`}
            >
              👥 Gestione Utenti
            </button>
            <button 
              onClick={() => setActiveTab('jobs')}
              className={`text-left px-5 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'jobs' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-300'}`}
            >
              🗓️ Turni & Candidature
            </button>
            <div className="hidden lg:block h-px w-full bg-slate-800/50 my-2" />
            <button 
              onClick={() => setActiveTab('system')}
              className={`text-left px-5 py-3 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === 'system' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-300'}`}
            >
              ⚙️ Sistema & Backup
            </button>
          </nav>
        </aside>

        {/* Dynamic Content */}
        <div className="flex-1 min-w-0">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'jobs' && renderJobs()}
          {activeTab === 'system' && renderSystem()}
        </div>

      </main>
    </div>
  )
}
