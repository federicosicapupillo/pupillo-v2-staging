'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '../../utils/supabase/client'

interface NotificationItem {
  id: string
  title: string
  body: string | null
  link: string | null
  read: boolean
  created_at: string
}

type Filter = 'all' | 'unread' | 'read'
type TypeFilter = 'all' | 'new_application' | 'status_change' | 'message' | 'shift' | 'other'

export default function NotificationsCenterPage() {
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<'worker' | 'restaurant' | null>(null)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  const [activeFilter, setActiveFilter] = useState<Filter>('all')
  const [activeTypeFilter, setActiveTypeFilter] = useState<TypeFilter>('all')

  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    loadNotifications()
  }, [])

  useEffect(() => {
    // REALTIME SUBSCRIPTION FOR NOTIFICATIONS
    if (!user) return

    const supabase = createClient()
    const channel = supabase
      .channel(`notif-realtime:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newNotif = payload.new as NotificationItem
          setNotifications((prev) => {
            if (prev.some(i => i.id === newNotif.id)) return prev
            return [newNotif, ...prev]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const loadNotifications = async () => {
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

      setUserRole(profile?.role as 'worker' | 'restaurant')

      // 3. Carica notifiche dal DB
      const { data: notifData, error: notifErr } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', sessionUser.id)
        .order('created_at', { ascending: false })

      if (notifErr) throw notifErr
      setNotifications(notifData || [])

    } catch (err: any) {
      console.error(err)
      setErrorMsg("Connessione Supabase assente. Visualizzazione feed in modalità demo locale.")
      
      // Fallback Dati Demo per Ristoratori e Lavoratori
      const demoNotifications: NotificationItem[] = [
        {
          id: 'demo-n-1',
          title: 'Messaggio ricevuto da Skyline Terrace Bar',
          body: 'Perfetto, accordo confermato! Ci vediamo sabato sera.',
          link: '/messages/demo-app-2',
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString() // 10 min fa
        },
        {
          id: 'demo-n-2',
          title: 'Candidatura ricevuta per Cameriere Extra',
          body: 'Un lavoratore si è candidato al tuo turno del 5 Giugno.',
          link: '/dashboard/restaurant',
          read: false,
          created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString() // 2 ore fa
        },
        {
          id: 'demo-n-3',
          title: 'Candidatura confermata! Contatti sbloccati',
          body: 'La tua candidatura per Skyline Terrace Bar è stata accettata. Chiama il locale!',
          link: '/announcements/demo-job-2',
          read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 600).toISOString() // 10 ore fa
        },
        {
          id: 'demo-n-4',
          title: 'Recensione richiesta per il turno completato',
          body: 'Lascia una recensione al lavoratore Giuseppe V. per incrementare la reputazione.',
          link: '/dashboard/restaurant',
          read: true,
          created_at: new Date(Date.now() - 1000 * 60 * 1440 * 2).toISOString() // 2 giorni fa
        }
      ]
      setNotifications(demoNotifications)
    } finally {
      setLoading(false)
    }
  }

  // Classificazione Tipo Notifica (legacy logic)
  const classifyType = (title: string): Exclude<TypeFilter, 'all'> => {
    const t = title.toLowerCase()
    if (t.includes('candidatura ricevuta') || t.includes('candidato al tuo')) return 'new_application'
    if (t.includes('messaggio')) return 'message'
    if (t.includes('turno')) return 'shift'
    if (
      t.includes('confermata') || t.includes('accettata') || 
      t.includes('stato') || t.includes('rifiutata') || 
      t.includes('accordo') || t.includes('proposta')
    ) return 'status_change'
    return 'other'
  }

  // Filtro ed ordinamento dei dati
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      const readOk = activeFilter === 'all' 
        ? true 
        : activeFilter === 'unread' 
        ? !n.read 
        : n.read

      const typeOk = activeTypeFilter === 'all'
        ? true
        : classifyType(n.title) === activeTypeFilter

      return readOk && typeOk
    })
  }, [notifications, activeFilter, activeTypeFilter])

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length
  }, [notifications])

  const handleMarkRead = async (id: string, read: boolean) => {
    const supabase = createClient()
    setNotifications(prev => prev.map(i => i.id === id ? { ...i, read } : i))

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read })
        .eq('id', id)

      if (error) throw error
    } catch {
      // In modalità demo l'aggiornamento è immediato ed ha già avuto effetto localmente
      if (!id.startsWith('demo-')) {
        setNotifications(prev => prev.map(i => i.id === id ? { ...i, read: !read } : i))
        setErrorMsg("Aggiornamento stato lettura fallito.")
      }
    }
  }

  const handleMarkAllRead = async () => {
    if (unreadCount === 0) return

    const supabase = createClient()
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)

    setNotifications(prev => prev.map(i => ({ ...i, read: true })))
    setSuccessMsg("Tutte le notifiche segnate come lette!")

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

      if (error) throw error
    } catch {
      if (!unreadIds[0]?.startsWith('demo-')) {
        setNotifications(prev => prev.map(i => unreadIds.includes(i.id) ? { ...i, read: false } : i))
        setErrorMsg("Impossibile segnare come lette tutte le notifiche.")
      }
    }
  }

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    const target = notifications.find(n => n.id === id)
    if (!target) return

    setNotifications(prev => prev.filter(i => i.id !== id))

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch {
      if (!id.startsWith('demo-')) {
        setNotifications(prev => [target, ...prev].sort((a, b) => b.created_at.localeCompare(a.created_at)))
        setErrorMsg("Impossibile eliminare la notifica.")
      }
    }
  }

  const handleNotificationClick = async (notif: NotificationItem) => {
    // Segna come letta all'istante
    if (!notif.read) {
      await handleMarkRead(notif.id, true)
    }

    // Reindirizza al link collegato
    if (notif.link) {
      window.location.href = notif.link
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/60 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔔</span>
            <span 
              onClick={() => window.location.href = '/'}
              className="text-xl font-black tracking-tight bg-gradient-to-r from-teal-400 to-emerald-300 bg-clip-text text-transparent cursor-pointer"
            >
              PUPILLO NOTIFICHE
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
        
        {/* Intestazione */}
        <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-50 flex items-center gap-2">
              Centro Notifiche 
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-teal-500 text-slate-950">
                  {unreadCount} nuove
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-400 mt-2">
              Rimani aggiornato in tempo reale sulle tue candidature, accordi conclusi e messaggi di chat.
            </p>
          </div>
          
          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="px-5 py-2.5 rounded-xl border border-slate-850 hover:bg-slate-900 text-xs font-bold transition-all disabled:opacity-40"
          >
            ✓ Segna tutte come lette
          </button>
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

        {/* Filtri Lettura & Tipo */}
        <section className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-850 pb-6">
          <div className="flex gap-2 flex-wrap">
            {([
              { v: 'all', label: 'Tutte' },
              { v: 'unread', label: 'Non lette' },
              { v: 'read', label: 'Lette' }
            ] as { v: Filter; label: string }[]).map(f => (
              <button
                key={f.v}
                onClick={() => setActiveFilter(f.v)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  activeFilter === f.v
                    ? 'bg-teal-500/10 text-teal-300 border-teal-500/40 shadow-inner'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="space-y-1.5 min-w-[200px] w-full md:w-auto">
            <select
              value={activeTypeFilter}
              onChange={(e) => setActiveTypeFilter(e.target.value as TypeFilter)}
              className="w-full md:w-auto px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold outline-none text-slate-300 focus:border-teal-500"
            >
              <option value="all">Filtra per Tipo: Tutti</option>
              <option value="new_application">Nuove Candidature</option>
              <option value="status_change">Cambi di Stato</option>
              <option value="message">Messaggi in Chat</option>
              <option value="shift">Turni Extra</option>
              <option value="other">Altre comunicazioni</option>
            </select>
          </div>
        </section>

        {/* Lista Notifiche */}
        <section className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="py-20 rounded-3xl bg-slate-900 border border-slate-800 border-dashed text-center text-sm text-slate-500">
              Nessuna notifica presente per i filtri selezionati.
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const type = classifyType(notif.title)
              
              // Definisce l'icona ed il colore in base al tipo
              const typeBadge = (() => {
                switch(type) {
                  case 'new_application': return { label: '👋 Candidatura', style: 'bg-amber-500/10 text-amber-300 border-amber-500/20' }
                  case 'message': return { label: '💬 Chat', style: 'bg-teal-500/10 text-teal-300 border-teal-500/20' }
                  case 'shift': return { label: '🍽️ Turno', style: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' }
                  case 'status_change': return { label: '⚖️ Match/Stato', style: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' }
                  default: return { label: '⚙️ Ops', style: 'bg-slate-950 text-slate-400 border-slate-850' }
                }
              })()

              return (
                <div
                  key={notif.id}
                  className={`p-5 rounded-3xl border transition-all flex justify-between items-start gap-4 shadow-md ${
                    notif.read
                      ? 'bg-slate-900/50 border-slate-900/80 hover:border-slate-800 opacity-75'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700/80'
                  }`}
                >
                  <div 
                    onClick={() => handleNotificationClick(notif)}
                    className="flex-1 min-w-0 space-y-2 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border ${typeBadge.style}`}>
                        {typeBadge.label}
                      </span>
                      {!notif.read && (
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" title="Nuova" />
                      )}
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 group-hover:text-teal-400 transition-colors leading-snug">
                        {notif.title}
                      </h3>
                      {notif.body && (
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                          {notif.body}
                        </p>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-500 font-mono block pt-1">
                      {new Date(notif.created_at).toLocaleString('it-IT', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>

                  {/* Pulsanti azioni */}
                  <div className="flex items-center gap-2 shrink-0 pt-1">
                    <button
                      onClick={() => handleMarkRead(notif.id, !notif.read)}
                      className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-850 text-slate-400 hover:text-slate-200 transition-all text-xs"
                      title={notif.read ? "Segna come non letta" : "Segna come letta"}
                    >
                      {notif.read ? '👁️‍🗨️' : '👁️'}
                    </button>
                    
                    <button
                      onClick={() => handleDelete(notif.id)}
                      className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-850 text-rose-500 hover:text-rose-400 transition-all text-xs"
                      title="Elimina notifica"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </section>
      </main>
    </div>
  )
}
