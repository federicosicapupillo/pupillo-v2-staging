'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../utils/supabase/client'

interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  type: 'charge' | 'credit'
}

export default function BillingPage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // States Locali
  const [credits, setCredits] = useState<number>(0)
  const [tier, setTier] = useState<string>('Free')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  // Sandbox Alert
  const [demoAlert, setDemoAlert] = useState<string | null>(null)

  useEffect(() => {
    loadBillingData()
  }, [])

  const loadBillingData = async () => {
    setLoading(true)
    setErrorMsg(null)
    const supabase = createClient()

    try {
      const { data: { user: sessionUser } } = await supabase.auth.getUser()
      if (!sessionUser) {
        window.location.href = '/login'
        return
      }
      setUser(sessionUser)

      // Query (Sola Lettura) su profili per estrarre eventuali campi crediti/tier (se supportati dallo schema corrente)
      const { data, error } = await supabase
        .from('profiles')
        .select('primary_role')
        .eq('id', sessionUser.id)
        .single()

      if (error) throw error

      if (data.primary_role === 'worker') {
        window.location.href = '/forbidden' // Billing in Pupillo legacy è solitamente per Ristoranti
        return
      }

      // Se le colonne non esistono nel database locale MVP, provocheremo il catch per mostrare il fallback.
      // Eseguiamo query test su credit_transactions per vedere se esiste.
      const { error: txErr } = await supabase.from('credit_transactions').select('id').limit(1)
      if (txErr) throw new Error("Tabelle billing reali non implementate localmente.")

    } catch (err: any) {
      console.warn("Dati billing reali inaccessibili. Attivazione Sandbox Fallback.", err)
      setErrorMsg("Dati fatturazione in modalità Demo/Sandbox locale.")
      
      // Fallback Locali Demo
      setCredits(14)
      setTier('Basic')
      setTransactions([
        { id: 'tx-1', date: '2026-06-01', description: 'Acquisto Pacchetto Small', amount: 30, type: 'credit' },
        { id: 'tx-2', date: '2026-06-05', description: 'Conferma Turno (Mario R.)', amount: -7, type: 'charge' },
        { id: 'tx-3', date: '2026-06-08', description: 'Conferma Turno (Giulia B.)', amount: -7, type: 'charge' }
      ])
    } finally {
      setLoading(false)
    }
  }

  // --- AZIONI SANDBOX ---
  const handlePurchase = (amount: number, description: string) => {
    setDemoAlert("Funzione demo: nessuna modifica reale eseguita, nessun pagamento reale effettuato.")
    
    // Simula solo nella UI locale senza contattare Stripe o Supabase
    setCredits(prev => prev + amount)
    setTransactions(prev => [
      {
        id: `demo-tx-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        description: `(DEMO) ${description}`,
        amount: amount,
        type: 'credit'
      },
      ...prev
    ])

    setTimeout(() => setDemoAlert(null), 5000)
  }

  const handleUpgrade = (newTier: string) => {
    setDemoAlert("Funzione demo: nessuna modifica reale eseguita, nessun pagamento reale effettuato.")
    setTier(newTier)
    setTimeout(() => setDemoAlert(null), 5000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-t-amber-400 border-slate-800 rounded-full animate-spin mb-4" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased relative">
      
      {/* Toast Alert Demo (Globale e fluttuante) */}
      {demoAlert && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] animate-fade-in-down">
          <div className="bg-amber-500 text-slate-900 text-xs font-bold px-6 py-3 rounded-2xl shadow-2xl border-2 border-amber-400 flex items-center gap-2">
            <span>🛡️</span> {demoAlert}
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💳</span>
            <span className="text-xl font-black bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent tracking-tight">
              PUPILLO BILLING
            </span>
          </div>
          <button 
            onClick={() => window.location.href = '/dashboard/restaurant'}
            className="px-4 py-2 rounded-xl border border-slate-800 text-xs font-bold hover:bg-slate-900 transition-colors"
          >
            Torna alla Dashboard
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-6 py-10 space-y-12">
        {errorMsg && (
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 text-xs text-slate-400 text-center font-mono">
            ℹ️ {errorMsg}
          </div>
        )}

        {/* Dashboard Superiori */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card Saldo Crediti */}
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Saldo Crediti</h3>
              <div className="flex items-baseline gap-3 mt-4">
                <span className="text-6xl font-black text-amber-400">{credits}</span>
                <span className="text-sm font-bold text-slate-500">Crediti residui</span>
              </div>
            </div>
            
            <div className="mt-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
              <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest">Regole Pupillo</h4>
              <ul className="text-xs text-amber-500/80 space-y-1.5 list-disc list-inside">
                <li><strong className="text-amber-400">Conferma turno = 7 crediti.</strong></li>
                <li>Non scaliamo MAI crediti su: candidatura ricevuta, messaggi in chat, proposte, notifiche o semplici visualizzazioni profilo.</li>
                <li>Paghi solo quando c'è un match confermato!</li>
              </ul>
            </div>
          </div>

          {/* Card Piano Attivo */}
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Piano in uso</h3>
              <div className="mt-4">
                <span className={`px-4 py-1.5 rounded-full text-sm font-black tracking-widest uppercase border ${
                  tier === 'Premium' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' :
                  tier === 'Basic' ? 'bg-teal-500/10 border-teal-500/30 text-teal-400' :
                  'bg-slate-800 border-slate-700 text-slate-300'
                }`}>
                  PIANO {tier}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-6 leading-relaxed">
                Il tuo abbonamento corrente regola funzionalità aggiuntive di piattaforma e visibilità degli annunci.
              </p>
            </div>
            
            <div className="mt-8 flex gap-3">
              <button 
                onClick={() => handleUpgrade('Basic')}
                disabled={tier === 'Basic'}
                className="flex-1 py-3 rounded-xl border border-teal-500/30 hover:bg-teal-500/10 text-teal-400 text-xs font-bold transition-all disabled:opacity-30"
              >
                Attiva Basic
              </button>
              <button 
                onClick={() => handleUpgrade('Premium')}
                disabled={tier === 'Premium'}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white text-xs font-bold transition-all disabled:opacity-30 shadow-lg shadow-indigo-500/20"
              >
                Vedi tutti i piani (Premium)
              </button>
            </div>
          </div>

        </section>

        {/* Acquisto Pacchetti Crediti */}
        <section className="space-y-6">
          <div className="flex justify-between items-end">
            <h2 className="text-xl font-black text-slate-50">Ricarica Crediti</h2>
            <p className="text-xs text-slate-400">Modalità Sandbox sicura</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3">
                <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded-md">1 match</span>
              </div>
              <h3 className="text-2xl font-black text-slate-100 mb-1">Small</h3>
              <p className="text-4xl font-black text-amber-400 mb-6">7 <span className="text-sm text-slate-500 font-bold">crediti</span></p>
              <p className="text-sm text-slate-400 flex-1 mb-8">Ideale per testare un singolo turno di emergenza.</p>
              <button 
                onClick={() => handlePurchase(7, 'Pacchetto Small (7 crediti)')}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
              >
                Acquista per 9,90 €
              </button>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.05)] hover:border-amber-500/50 transition-colors flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3">
                <span className="text-[10px] font-mono text-amber-800 bg-amber-400 px-2 py-1 rounded-md font-bold">CONSIGLIATO / ~7 match</span>
              </div>
              <h3 className="text-2xl font-black text-slate-100 mb-1">Medium</h3>
              <p className="text-4xl font-black text-amber-400 mb-6">50 <span className="text-sm text-slate-500 font-bold">crediti</span></p>
              <p className="text-sm text-slate-400 flex-1 mb-8">Il formato più scelto per gestire i turni del weekend.</p>
              <button 
                onClick={() => handlePurchase(50, 'Pacchetto Medium (50 crediti)')}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/20"
              >
                Acquista per 59,90 €
              </button>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors flex flex-col relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3">
                <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-1 rounded-md">~14 match</span>
              </div>
              <h3 className="text-2xl font-black text-slate-100 mb-1">Large</h3>
              <p className="text-4xl font-black text-amber-400 mb-6">100 <span className="text-sm text-slate-500 font-bold">crediti</span></p>
              <p className="text-sm text-slate-400 flex-1 mb-8">Scorta mensile per strutture ad alta operatività.</p>
              <button 
                onClick={() => handlePurchase(100, 'Pacchetto Large (100 crediti)')}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all"
              >
                Acquista per 99,90 €
              </button>
            </div>

          </div>
        </section>

        {/* Tabella Storico Transazioni */}
        <section className="space-y-6">
          <h2 className="text-xl font-black text-slate-50">Storico Transazioni</h2>
          
          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-900 shadow-xl">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs uppercase text-slate-500 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-bold">ID / Data</th>
                  <th className="px-6 py-4 font-bold">Descrizione</th>
                  <th className="px-6 py-4 font-bold text-right">Importo Crediti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-500 text-sm">
                      Nessuna transazione effettuata.
                    </td>
                  </tr>
                ) : (
                  transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-mono text-slate-500 block mb-1">{tx.id}</span>
                        <span className="font-semibold text-slate-300">{tx.date}</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-100">
                        {tx.description}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-black ${
                          tx.type === 'credit' 
                            ? 'bg-emerald-500/10 text-emerald-400' 
                            : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  )
}
