'use client'

import { useState } from 'react'
import { createClient } from '../../utils/supabase/client'

type RoleType = 'worker' | 'restaurant' | null

export default function RegisterPage() {
  const [role, setRole] = useState<RoleType>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Sicurezza: blocca ruoli diversi da worker e restaurant
    if (role !== 'worker' && role !== 'restaurant') {
      setErrorMsg("Seleziona un ruolo valido per procedere.")
      return
    }

    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const supabase = createClient()

    try {
      // Registrazione utente includendo il ruolo scelto nei metadati (per trigger Supabase handle_new_user)
      const { data: signUpData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding`,
          data: {
            role: role,
          },
        },
      })

      if (authError) throw authError

      const authUser = signUpData?.user
      if (!authUser) {
        throw new Error("Errore nella creazione dell'account.")
      }

      setSuccessMsg("Registrazione completata con successo! Reindirizzamento all'onboarding...")
      
      setTimeout(() => {
        window.location.href = '/onboarding'
      }, 1500)

    } catch (err: any) {
      console.error(err)
      
      // Fallback Demo Locale Separato
      if (email.toLowerCase().includes('lavoratore') || email.toLowerCase().includes('ristoratore')) {
        setSuccessMsg("Registrazione demo locale avvenuta (Demo mode)!")
        setTimeout(() => {
          window.location.href = '/onboarding'
        }, 1500)
      } else {
        setErrorMsg(err.message || 'Errore durante la registrazione.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12 font-sans antialiased">
      <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl shadow-slate-950/50 space-y-6">
        
        {/* Intestazione */}
        <div className="text-center space-y-2">
          <div 
            onClick={() => window.location.href = '/'}
            className="inline-block bg-gradient-to-tr from-teal-500 to-emerald-400 p-3 rounded-2xl shadow-lg cursor-pointer hover:scale-105 transition-all"
          >
            <span className="text-2xl">🐶</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-teal-400 to-emerald-300 bg-clip-text text-transparent">
            REGISTRATI
          </h1>
          <p className="text-xs text-slate-400">
            Scegli il tuo ruolo ed inserisci i dati d'accesso
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 text-center">
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300 text-center">
            🎉 {successMsg}
          </div>
        )}

        {/* Scelta Ruolo */}
        {!role ? (
          <div className="space-y-6">
            <h2 className="text-center text-xs font-semibold text-slate-350">
              Chi sei? Seleziona il tuo ruolo per iniziare:
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => setRole('worker')}
                className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-teal-500 transition-all flex flex-col items-center justify-center gap-2 text-center active:scale-98 group"
              >
                <span className="text-3xl group-hover:scale-115 transition-all duration-300">🏃‍♂️</span>
                <div>
                  <h3 className="font-bold text-teal-400">Lavoratore Extra</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Cerca turni extra e collaborazioni occasionali flessibili</p>
                </div>
              </button>

              <button
                onClick={() => setRole('restaurant')}
                className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500 transition-all flex flex-col items-center justify-center gap-2 text-center active:scale-98 group"
              >
                <span className="text-3xl group-hover:scale-115 transition-all duration-300">🍽️</span>
                <div>
                  <h3 className="font-bold text-emerald-400">Ristoratore / Gestore</h3>
                  <p className="text-[10px] text-slate-400 mt-1">Pubblica annunci e gestisci personale di supporto</p>
                </div>
              </button>
            </div>
            
            <p className="text-center text-xs text-slate-500">
              Hai già un account?{' '}
              <a href="/login" className="text-teal-400 hover:underline font-bold transition-all">Accedi</a>
            </p>
          </div>
        ) : (
          /* Form di registrazione baseline credenziali */
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-400">
                Ruolo:{' '}
                <strong className={role === 'worker' ? 'text-teal-400' : 'text-emerald-400'}>
                  {role === 'worker' ? 'Lavoratore' : 'Ristoratore'}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => setRole(null)}
                className="text-[11px] text-teal-500 hover:underline font-bold"
              >
                Cambia
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Indirizzo Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-teal-500 outline-none transition-all text-slate-200"
                placeholder="nome@esempio.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-teal-500 outline-none transition-all text-slate-200"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-sm shadow-lg active:scale-98 transition-all disabled:opacity-50"
            >
              {loading ? 'Registrazione in corso...' : 'Continua all\'Onboarding'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
