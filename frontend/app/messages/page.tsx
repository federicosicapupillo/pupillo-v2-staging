'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../utils/supabase/client'
import { getDisplayPartnerName, publicLocationLabel } from '../../utils/public-location'

interface ChatThread {
  id: string // application_id
  status: 'pending' | 'accepted' | 'rejected'
  applied_at: string
  job: {
    id: string
    role: string
    date: string
    start_time: string
    end_time: string
    location: string
    hourly_rate: number
  }
  partner: {
    id: string
    fullName: string
    firstName?: string
    businessName?: string
    avatarUrl?: string
    phone: string
  }
  lastMessage?: string
  lastMessageTime?: string
  unreadCount: number
}

export default function MessagesListPage() {
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<'worker' | 'restaurant' | null>(null)
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    loadThreads()
  }, [])

  const loadThreads = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      // 1. Carica utente
      const { data: { user: sessionUser } } = await supabase.auth.getUser()
      if (!sessionUser) {
        window.location.href = '/login'
        return
      }
      setUser(sessionUser)

      // 2. Carica ruolo utente da profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', sessionUser.id)
        .single()

      const role = profile?.role as 'worker' | 'restaurant'
      setUserRole(role)

      // 3. Carica candidature (applications)
      const queryCol = role === 'restaurant' ? 'restaurant_id' : 'worker_id'
      const { data: appsData, error: appsErr } = await supabase
        .from('applications')
        .select('*, jobs(*)')
        .order('applied_at', { ascending: false })

      if (appsErr) throw appsErr

      // Filtra lato client le candidature dell'utente
      // In Supabase potremmo fare un filtro diretto, ma supportiamo fallback
      const myApps = (appsData || []).filter((app: any) => {
        if (role === 'restaurant') {
          return app.jobs?.restaurant_id === sessionUser.id
        } else {
          return app.worker_id === sessionUser.id
        }
      })

      // 4. Per ogni candidatura, ricava il profilo del partner e l'ultimo messaggio
      const nextThreads: ChatThread[] = []

      for (const app of myApps) {
        const partnerId = role === 'restaurant' ? app.worker_id : app.jobs?.restaurant_id
        if (!partnerId) continue

        // Carica profilo partner
        let partnerProfileData: any = null
        if (role === 'restaurant') {
          const { data: wp } = await supabase
            .from('worker_profiles')
            .select('*')
            .eq('id', partnerId)
            .maybeSingle()
          if (wp) {
            partnerProfileData = {
              id: wp.id,
              fullName: `${wp.first_name} ${wp.last_name}`,
              firstName: wp.first_name,
              phone: wp.phone
            }
          }
        } else {
          const { data: rp } = await supabase
            .from('restaurant_profiles')
            .select('*')
            .eq('id', partnerId)
            .maybeSingle()
          if (rp) {
            partnerProfileData = {
              id: rp.id,
              fullName: rp.restaurant_name,
              businessName: rp.restaurant_name,
              phone: rp.phone,
              avatarUrl: rp.logo_url
            }
          }
        }

        // Se non troviamo profilo sul DB, creiamo un placeholder sicuro
        const partner = partnerProfileData || {
          id: partnerId,
          fullName: role === 'restaurant' ? 'Lavoratore Pupillo' : 'Ristorante partner',
          phone: ''
        }

        // Carica ultimo messaggio
        const { data: messages } = await supabase
          .from('messages')
          .select('*')
          .eq('application_id', app.id)
          .order('created_at', { ascending: false })
          .limit(1)

        const lastMsg = messages && messages.length > 0 ? messages[0] : null

        nextThreads.push({
          id: app.id,
          status: app.status,
          applied_at: app.applied_at,
          job: {
            id: app.jobs?.id,
            role: app.jobs?.role || 'Extra',
            date: app.jobs?.date,
            start_time: app.jobs?.start_time?.slice(0, 5) || '19:00',
            end_time: app.jobs?.end_time?.slice(0, 5) || '01:00',
            location: app.jobs?.location || '',
            hourly_rate: Number(app.jobs?.hourly_rate || 0)
          },
          partner,
          lastMessage: lastMsg?.body || 'Candidatura inviata. Inizia una conversazione!',
          lastMessageTime: lastMsg?.created_at || app.applied_at,
          unreadCount: 0 // Semplificato per l'MVP
        })
      }

      setThreads(nextThreads)

    } catch (err: any) {
      console.error(err)
      setErrorMsg("Connessione Supabase assente. Visualizzazione canali in modalità demo locale.")
      setUserRole('worker') // Default worker per demo
      
      // Fallback Dati Demo di Canale
      setThreads([
        {
          id: 'demo-app-1',
          status: 'pending',
          applied_at: '2026-06-01T15:00:00Z',
          job: {
            id: 'demo-job-1',
            role: 'Cameriere di Sala',
            date: '2026-06-05',
            start_time: '18:00',
            end_time: '00:00',
            location: 'Duomo, Milano',
            hourly_rate: 14.50
          },
          partner: {
            id: 'demo-rest-1',
            fullName: 'Bistrot Duomo Milano',
            businessName: 'Bistrot Duomo Milano',
            phone: '+39 02 123456'
          },
          lastMessage: 'Ciao, ho visto la tua candidatura per venerdì. Hai esperienza con vassoio?',
          lastMessageTime: '2026-06-01T16:45:00Z',
          unreadCount: 1
        },
        {
          id: 'demo-app-2',
          status: 'accepted',
          applied_at: '2026-06-01T14:30:00Z',
          job: {
            id: 'demo-job-2',
            role: 'Barman / Mixologist',
            date: '2026-06-06',
            start_time: '21:00',
            end_time: '03:00',
            location: 'Corso Como, Milano',
            hourly_rate: 18.00
          },
          partner: {
            id: 'demo-rest-2',
            fullName: 'Skyline Terrace Bar',
            businessName: 'Skyline Terrace Bar',
            phone: '+39 02 987654'
          },
          lastMessage: 'Perfetto, accordo confermato! Ci vediamo sabato sera.',
          lastMessageTime: '2026-06-01T17:15:00Z',
          unreadCount: 0
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/60 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">💬</span>
            <span 
              onClick={() => window.location.href = '/'}
              className="text-xl font-black tracking-tight bg-gradient-to-r from-teal-400 to-emerald-300 bg-clip-text text-transparent cursor-pointer"
            >
              PUPILLO CHAT
            </span>
          </div>
          <button
            onClick={() => {
              if (userRole === 'restaurant') {
                window.location.href = '/dashboard/restaurant'
              } else {
                window.location.href = '/dashboard/worker'
              }
            }}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-800 hover:bg-slate-900 transition-all"
          >
            Torna alla Dashboard
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-50">I Miei Messaggi</h1>
          <p className="text-xs text-slate-400 mt-2">
            Conversazioni pre e post-turno con i tuoi ristoranti partner o i candidati extra.
          </p>
        </div>

        {/* Banner Alert Fallback */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 text-center">
            ⚠️ {errorMsg}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-t-teal-400 border-slate-800 rounded-full animate-spin" />
            <span className="text-xs text-slate-400">Caricamento messaggi...</span>
          </div>
        ) : threads.length === 0 ? (
          <div className="py-20 rounded-3xl bg-slate-900 border border-slate-800 border-dashed text-center text-sm text-slate-500">
            Nessuna chat attiva. Candidati ad un turno o ricevi candidature per iniziare a comunicare!
          </div>
        ) : (
          <div className="space-y-4">
            {threads.map((thread) => {
              // Applica la logica di privacy masking legacy per il nome del partner
              const displayPartnerName = getDisplayPartnerName({
                viewerRole: userRole,
                appStatus: thread.status,
                hasWorkedTogether: thread.status === 'accepted',
                partner: {
                  fullName: thread.partner.fullName,
                  firstName: thread.partner.firstName,
                  businessName: thread.partner.businessName
                }
              })

              const isConfirmed = thread.status === 'accepted'

              return (
                <div
                  key={thread.id}
                  onClick={() => window.location.href = `/messages/${thread.id}`}
                  className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700/80 transition-all flex justify-between items-start gap-4 cursor-pointer group shadow-lg"
                >
                  <div className="flex gap-4 items-start flex-1 min-w-0">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-850 flex items-center justify-center text-lg font-bold shrink-0">
                      {userRole === 'restaurant' ? '🏃‍♂️' : '🍽️'}
                    </div>

                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-100 group-hover:text-teal-400 transition-colors truncate">
                          {displayPartnerName}
                        </h3>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                          isConfirmed
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            : 'bg-slate-950 text-slate-400 border-slate-850'
                        }`}>
                          {isConfirmed ? 'Match Confermato ✓' : 'In Attesa'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 truncate">
                        {thread.lastMessage}
                      </p>

                      <div className="pt-2 flex items-center gap-3 text-[10px] text-slate-500 flex-wrap">
                        <span className="bg-slate-950 px-2 py-0.5 rounded border border-slate-850">
                          {thread.job.role}
                        </span>
                        <span>📅 {thread.job.date}</span>
                        <span>🕒 {thread.job.start_time} - {thread.job.end_time}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-2">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(thread.lastMessageTime).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {thread.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-teal-500 text-slate-950 text-[10px] font-bold flex items-center justify-center animate-pulse ml-auto">
                        {thread.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
