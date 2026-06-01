'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '../../../utils/supabase/client'
import { useParams } from 'next/navigation'
import { getDisplayPartnerName } from '../../../utils/public-location'

interface Message {
  id: string
  application_id: string
  sender_id: string
  body: string
  created_at: string
}

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
}

export default function ChatRoomPage() {
  const params = useParams()
  const id = params.id as string // application_id

  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<'worker' | 'restaurant' | null>(null)
  const [thread, setThread] = useState<ChatThread | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    loadChatData()
  }, [id])

  useEffect(() => {
    // Scroll automatico in fondo alla chat per ogni nuovo messaggio
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    // SUPABASE REALTIME SUBSCRIPTION
    if (!id || id.startsWith('demo-')) return

    const supabase = createClient()
    
    // Sottoscrizione al canale dei messaggi per questa candidatura
    const channel = supabase
      .channel(`chat:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `application_id=eq.${id}`
        },
        (payload) => {
          const newMsg = payload.new as Message
          setMessages((prev) => {
            // Evita duplicazioni dovute all'inserimento locale istantaneo
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id])

  const loadChatData = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      // 1. Carica utente loggato
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

      // 3. Carica dettagli candidatura (application)
      const { data: appData, error: appErr } = await supabase
        .from('applications')
        .select('*, jobs(*)')
        .eq('id', id)
        .single()

      if (appErr) throw appErr

      const partnerId = role === 'restaurant' ? appData.worker_id : appData.jobs?.restaurant_id

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

      const partner = partnerProfileData || {
        id: partnerId,
        fullName: role === 'restaurant' ? 'Lavoratore' : 'Ristorante partner',
        phone: ''
      }

      setThread({
        id: appData.id,
        status: appData.status,
        applied_at: appData.applied_at,
        job: {
          id: appData.jobs?.id,
          role: appData.jobs?.role || 'Extra',
          date: appData.jobs?.date,
          start_time: appData.jobs?.start_time?.slice(0, 5) || '19:00',
          end_time: appData.jobs?.end_time?.slice(0, 5) || '01:00',
          location: appData.jobs?.location || '',
          hourly_rate: Number(appData.jobs?.hourly_rate || 0)
        },
        partner
      })

      // 4. Carica messaggi storici
      const { data: msgs, error: msgsErr } = await supabase
        .from('messages')
        .select('*')
        .eq('application_id', id)
        .order('created_at', { ascending: true })

      if (msgsErr) throw msgsErr
      setMessages(msgs || [])

    } catch (err: any) {
      console.error(err)
      setErrorMsg("Dati caricati in modalità demo locale.")
      setUserRole('worker') // default worker per demo

      // Fallback Dettaglio Canale Demo
      const demoThreads: Record<string, ChatThread> = {
        'demo-app-1': {
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
          }
        },
        'demo-app-2': {
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
          }
        }
      }

      const activeThread = demoThreads[id] || demoThreads['demo-app-1']
      setThread(activeThread)

      // Fallback Messaggi Demo
      if (id === 'demo-app-2') {
        setMessages([
          {
            id: 'm1',
            application_id: 'demo-app-2',
            sender_id: 'demo-rest-2',
            body: 'Ciao! Abbiamo visto il tuo profilo da Barman per sabato sera. Ti andrebbe bene iniziare alle 21?',
            created_at: '2026-06-01T16:00:00Z'
          },
          {
            id: 'm2',
            application_id: 'demo-app-2',
            sender_id: 'me', // noi
            body: 'Ciao! Sì, assolutamente. Perfetto per le 21. Qual è la divisa consigliata?',
            created_at: '2026-06-01T16:30:00Z'
          },
          {
            id: 'm3',
            application_id: 'demo-app-2',
            sender_id: 'demo-rest-2',
            body: 'Perfetto, accordo confermato! Ci vediamo sabato sera. Camicia nera classica stirata e pantaloni scuri.',
            created_at: '2026-06-01T17:15:00Z'
          }
        ])
      } else {
        setMessages([
          {
            id: 'm1',
            application_id: 'demo-app-1',
            sender_id: 'demo-rest-1',
            body: 'Ciao, ho visto la tua candidatura per venerdì. Hai esperienza con vassoio?',
            created_at: '2026-06-01T16:45:00Z'
          }
        ])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim() || !thread || !user) return

    setSending(true)
    const textToSend = inputText.trim()
    setInputText('')

    const supabase = createClient()

    const localNewMsg: Message = {
      id: `local-msg-${Date.now()}`,
      application_id: thread.id,
      sender_id: user.id,
      body: textToSend,
      created_at: new Date().toISOString()
    }

    // Aggiungi immediatamente allo stato locale per reattività visiva
    setMessages((prev) => [...prev, localNewMsg])

    try {
      const { error } = await supabase.from('messages').insert({
        application_id: thread.id,
        sender_id: user.id,
        body: textToSend
      })

      if (error) throw error
    } catch (err: any) {
      console.error(err)
      
      // Modalità Demo / Offline Simulation
      if (thread.id.startsWith('demo-')) {
        // Simula risposta automatica dopo 1.5 secondi
        setTimeout(() => {
          const autoReply: Message = {
            id: `demo-reply-${Date.now()}`,
            application_id: thread.id,
            sender_id: thread.partner.id,
            body: `[Simulatore Risposta Ristorante] Grazie del messaggio! Il gestore esaminerà la tua richiesta il prima possibile.`,
            created_at: new Date().toISOString()
          }
          setMessages((prev) => [...prev, autoReply])
        }, 1500)
      }
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center items-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-t-teal-400 border-slate-800 rounded-full animate-spin" />
          <span className="text-xs text-slate-400">Caricamento conversazione...</span>
        </div>
      </div>
    )
  }

  if (!thread) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center gap-4 font-sans">
        <p className="text-slate-400">Conversazione non trovata.</p>
        <button 
          onClick={() => window.location.href = '/messages'}
          className="px-6 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-300"
        >
          Torna all'Elenco Chat
        </button>
      </div>
    )
  }

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/60 px-6 py-4 shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => window.location.href = '/messages'}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-800 hover:bg-slate-900 transition-all flex items-center gap-1.5"
          >
            ← Messaggi
          </button>
          
          <div className="text-center">
            <h2 className="text-sm font-bold text-slate-100 flex items-center justify-center gap-2">
              {displayPartnerName}
              <span className={`w-2 h-2 rounded-full ${isConfirmed ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            </h2>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Turno: {thread.job.role} (Data: {thread.job.date})
            </p>
          </div>

          <button
            onClick={() => window.location.href = `/announcements/${thread.job.id}`}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-800 hover:bg-slate-900 transition-all"
          >
            Dettagli Turno
          </button>
        </div>
      </header>

      {/* Area Messaggi Scrollabile */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          
          {/* Privacy masking notice banner */}
          {!isConfirmed && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-400/90 text-center leading-relaxed">
              🔒 <strong>Tutela della Privacy Pupillo</strong>: Per proteggere la trattativa diretta, i dati societari sensibili del ristorante, l'indirizzo esatto e i cognomi completi rimangono protetti da masking. Diventeranno visibili automaticamente non appena il turno sarà <strong>Confermato</strong>.
            </div>
          )}

          {/* Dettagli Match */}
          {isConfirmed && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 text-center flex flex-col sm:flex-row justify-between items-center gap-2">
              <span>🎉 <strong>Match Confermato!</strong> Potete ora comunicare apertamente ed organizzarvi telefonicamente.</span>
              <a href={`tel:${thread.partner.phone}`} className="px-3 py-1 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-lg text-[10px] transition-all">
                Chiama Ora
              </a>
            </div>
          )}

          {/* Lista Messaggi */}
          <div className="space-y-4">
            {messages.map((msg) => {
              const isMe = msg.sender_id === user?.id || msg.sender_id === 'me'
              return (
                <div 
                  key={msg.id} 
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[70%] p-4 rounded-2xl text-sm shadow-md ${
                    isMe
                      ? 'bg-gradient-to-tr from-teal-500 to-emerald-500 text-slate-950 rounded-tr-none font-medium'
                      : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none'
                  }`}>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                    <span className={`text-[9px] block text-right mt-1.5 font-mono ${
                      isMe ? 'text-slate-950/60' : 'text-slate-500'
                    }`}>
                      {new Date(msg.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Input Form per invio messaggi */}
      <div className="p-6 bg-slate-950 border-t border-slate-800/80 shrink-0">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              required
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-5 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-sm outline-none text-slate-100 placeholder-slate-500 focus:border-teal-500 transition-all shadow-inner"
              placeholder="Scrivi un messaggio di chiarimento o accordo..."
            />
            <button
              type="submit"
              disabled={sending || !inputText.trim()}
              className="px-6 py-3.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold rounded-2xl text-sm transition-all active:scale-95 shadow-md shadow-teal-500/10 disabled:opacity-50"
            >
              Invia
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
