import { createClient } from '../utils/supabase/server'
import { cookies } from 'next/headers'

// Definizione dell'interfaccia del Turno per l'MVP
interface JobShift {
  id: string;
  role: string;
  date: string;
  start_time: string;
  end_time: string;
  hourly_rate: number;
  location: string;
  status: 'open' | 'matched' | 'completed' | 'cancelled';
  notes?: string;
  restaurant_profiles?: {
    restaurant_name: string;
  };
}

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  let shifts: JobShift[] = []
  let errorMsg = null
  let sessionUser: any = null
  let userRole: string | null = null

  try {
    // Verifica se c'è un utente loggato ed il suo ruolo
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      sessionUser = user
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      if (profile) {
        userRole = profile.role
      }
    }
  } catch (e) {
    // Ignoriamo silenti errori di sessione in questa fase
  }

  try {
    // Prova a recuperare i turni reali dal database di Supabase
    const { data, error } = await supabase
      .from('jobs')
      .select('*, restaurant_profiles(restaurant_name)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(6)
    
    if (error) {
      throw error
    }
    if (data) {
      shifts = data as any[]
    }
  } catch (err: any) {
    errorMsg = err.message
    // Fallback su dati fittizi premium se il database non è ancora configurato
    shifts = [
      {
        id: '1',
        role: 'Cameriere di Sala (Extra)',
        restaurant_profiles: { restaurant_name: 'Trattoria Bella Vita' },
        date: 'Venerdì, 5 Giugno',
        start_time: '18:00',
        end_time: '00:00',
        hourly_rate: 12.50,
        location: 'Milano Centro',
        status: 'open',
        notes: 'Richiesta camicia nera classica e scarpe scure.'
      },
      {
        id: '2',
        role: 'Aiuto Cuoco / Capopartita',
        restaurant_profiles: { restaurant_name: 'Ristorante Da Nando' },
        date: 'Sabato, 6 Giugno',
        start_time: '17:00',
        end_time: '23:30',
        hourly_rate: 15.00,
        location: 'Roma Prati',
        status: 'open',
        notes: 'HACCP in corso di validità necessario.'
      },
      {
        id: '3',
        role: 'Barman / Mixologist',
        restaurant_profiles: { restaurant_name: 'Lounge Bar Skyline' },
        date: 'Sabato, 6 Giugno',
        start_time: '21:00',
        end_time: '03:00',
        hourly_rate: 18.00,
        location: 'Firenze Lungarno',
        status: 'open',
        notes: 'Esperienza con cocktail premium ed eventi affollati.'
      }
    ]
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-teal-500 selection:text-slate-950">
      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/60 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-teal-500 to-emerald-400 p-2 rounded-xl shadow-lg shadow-teal-500/20">
              <span className="text-xl font-bold text-slate-950">🐶</span>
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-teal-400 via-emerald-300 to-indigo-400 bg-clip-text text-transparent">
                PUPILLO
              </span>
              <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded bg-teal-500/10 text-teal-300 border border-teal-500/20">
                MVP Baseline
              </span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <a href="#about" className="hover:text-teal-400 transition-colors">Chi Siamo</a>
            <a href="/browse" className="hover:text-teal-400 transition-colors">Trova Turni</a>
            <a href="/register" className="hover:text-teal-400 transition-colors">Per i Ristoratori</a>
          </nav>
          <div className="flex items-center gap-3">
            {sessionUser ? (
              <a 
                href={userRole === 'restaurant' ? '/dashboard/restaurant' : '/dashboard/worker'} 
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 shadow-md shadow-teal-500/10 active:scale-95 transition-all text-center"
              >
                Dashboard {userRole === 'restaurant' ? 'Gestore' : 'Lavoratore'}
              </a>
            ) : (
              <>
                <a 
                  href="/login" 
                  className="px-4 py-2 text-sm font-semibold rounded-lg hover:bg-slate-900 border border-slate-800 transition-all text-center"
                >
                  Accedi
                </a>
                <a 
                  href="/register" 
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 shadow-md shadow-teal-500/10 active:scale-95 transition-all text-center"
                >
                  Registrati
                </a>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-12 md:py-24 space-y-24">
        <section className="text-center relative py-10">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-transparent to-indigo-500/5 blur-3xl rounded-full" />
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-none text-slate-50">
            La ristorazione corre veloce.<br />
            <span className="bg-gradient-to-r from-teal-400 via-emerald-300 to-cyan-400 bg-clip-text text-transparent">
              Copri i tuoi turni in un click.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-base md:text-lg text-slate-400 leading-relaxed">
            Pupillo mette in contatto istantaneo ristoratori che hanno bisogno di personale extra e lavoratori qualificati pronti per collaborazioni operative e turni a chiamata.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/browse" className="w-full sm:w-auto px-8 py-4 text-base font-bold rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 shadow-lg shadow-teal-500/20 active:scale-98 transition-all text-center">
              Trova un Turno
            </a>
            <a 
              href={sessionUser && userRole === 'restaurant' ? '/dashboard/restaurant' : '/register'}
              className="w-full sm:w-auto px-8 py-4 text-base font-bold rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition-all text-center"
            >
              Pubblica un Annuncio
            </a>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card Ristoratori */}
          <div className="group relative p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 hover:border-teal-500/50 transition-all duration-300 overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-teal-500/5 rounded-full blur-2xl group-hover:bg-teal-500/10 transition-all" />
            <h2 className="text-2xl font-black text-teal-400 flex items-center gap-2">
              <span>🍽️</span> Sei un Ristoratore?
            </h2>
            <p className="mt-4 text-sm text-slate-400 leading-relaxed">
              Pubblica turni extra per lavapiatti, camerieri, cuochi o barman. Visualizza le candidature all'istante, valuta l'affidabilità con il nostro rating e chiudi l'accordo in pochi minuti.
            </p>
            <ul className="mt-6 space-y-3 text-xs text-slate-300">
              <li className="flex items-center gap-2">✔️ Pubblicazione annunci veloce</li>
              <li className="flex items-center gap-2">✔️ Screening dei profili dei candidati</li>
              <li className="flex items-center gap-2">✔️ Sblocco immediato dei contatti telefonici ad accordo raggiunto</li>
            </ul>
          </div>

          {/* Card Lavoratori */}
          <div className="group relative p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800/80 hover:border-emerald-500/50 transition-all duration-300 overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all" />
            <h2 className="text-2xl font-black text-emerald-400 flex items-center gap-2">
              <span>🏃‍♂️</span> Cerchi Turni Extra?
            </h2>
            <p className="mt-4 text-sm text-slate-400 leading-relaxed">
              Visualizza gli annunci vicino a te, filtra per ruolo, data e compenso orario. Candidati all'istante e lavora in totale flessibilità, decidendo tu quando e quanto impegnarti.
            </p>
            <ul className="mt-6 space-y-3 text-xs text-slate-300">
              <li className="flex items-center gap-2">✔️ Ricerca geolocalizzata intuitiva</li>
              <li className="flex items-center gap-2">✔️ Candidature con un singolo tocco</li>
              <li className="flex items-center gap-2">✔️ Tariffe orarie e note operative chiare da subito</li>
            </ul>
          </div>
        </section>

        {/* Available Shifts Section */}
        <section id="shifts" className="space-y-8 scroll-mt-28">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black text-slate-50">
                Turni Extra Attivi
              </h2>
              <p className="text-slate-400 text-sm mt-2">
                Scopri le ultime opportunità disponibili sul territorio ed invia la tua candidatura.
              </p>
            </div>
            {errorMsg && (
              <span className="px-3 py-1.5 text-xs font-semibold rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Modalità Demo (Connessione Supabase: {errorMsg})
              </span>
            )}
          </div>

          {/* Grid di annunci */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {shifts.map((shift) => (
              <div 
                key={shift.id} 
                className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700/80 transition-all flex flex-col justify-between group hover:-translate-y-1 shadow-md shadow-slate-950"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-teal-500/10 text-teal-300 border border-teal-500/20">
                      {shift.role}
                    </span>
                    <span className="text-lg font-black text-emerald-400">
                      {shift.hourly_rate.toFixed(2)} €/h
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-100 group-hover:text-teal-400 transition-colors">
                      {shift.restaurant_profiles?.restaurant_name || 'Ristorante Extra'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">📍 {shift.location}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/40 text-xs text-slate-300">
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-500">Data:</span>
                      <span className="font-semibold">{shift.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Orario:</span>
                      <span className="font-semibold">{shift.start_time} - {shift.end_time}</span>
                    </div>
                  </div>
                  {shift.notes && (
                    <p className="text-[11px] text-slate-500 italic leading-snug">
                      Note: "{shift.notes}"
                    </p>
                  )}
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800/50">
                  <a 
                    href={sessionUser ? (userRole === 'restaurant' ? '/dashboard/restaurant' : '/dashboard/worker') : '/register'}
                    className="block w-full py-2.5 text-center text-xs font-bold text-slate-950 bg-teal-400 hover:bg-teal-300 rounded-xl transition-all shadow-md active:scale-95"
                  >
                    {sessionUser && userRole === 'restaurant' ? 'Visualizza Annunci' : 'Candidati Ora'}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-24 border-t border-slate-800 bg-slate-950 py-12 text-slate-500 text-center text-xs">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Pupillo Platform. Tutti i diritti riservati.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Termini di Servizio</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Contatti</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
