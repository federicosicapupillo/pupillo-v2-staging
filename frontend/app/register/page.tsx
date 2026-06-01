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
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center px-4 py-12 font-sans antialiased relative overflow-hidden">
      
      {/* Cartoon Graphic Element: Decorative Background Elements */}
      <div className="absolute top-10 left-10 text-yellow-400/10 text-9xl font-black select-none pointer-events-none select-none rotate-12">★</div>
      <div className="absolute bottom-10 right-10 text-violet-600/10 text-9xl font-black select-none pointer-events-none select-none -rotate-12">★</div>

      {/* Main Playful Card */}
      <div className="w-full max-w-md p-8 md:p-10 rounded-[38px] bg-zinc-950 border-[6px] border-white shadow-[12px_12px_0px_#7c3aed] space-y-8 relative z-10 transition-transform duration-300 hover:scale-[1.01]">
        
        {/* Brand Logo in HTML/Tailwind */}
        <div className="text-center">
          <div className="relative inline-block cursor-pointer select-none group" onClick={() => window.location.href = '/'}>
            {/* Mascot Chef Hat bouncing on top */}
            <div className="absolute -top-7 left-[72px] text-3xl transform -rotate-12 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
              👩‍🍳
            </div>
            {/* Impact Lines / Slashes next to O */}
            <div className="absolute -top-1 -right-6 text-yellow-400 text-3xl font-black select-none leading-none rotate-12 opacity-80 group-hover:scale-110 group-hover:rotate-45 transition-all duration-300">
              ⚡
            </div>

            <div className="flex items-end tracking-tight">
              {/* Big Yellow Rounded Cartoon P */}
              <span className="text-6xl font-black text-yellow-400 rotate-[-8deg] inline-block filter drop-shadow-[3px_3px_0px_#7c3aed] transition-transform group-hover:scale-110 duration-200">
                P
              </span>
              {/* Bold White Cartoon upillo */}
              <span className="text-5xl font-black text-white ml-1 tracking-tighter uppercase relative">
                upillo
              </span>
            </div>
            {/* Saturated Purple Arc Underline */}
            <div className="h-2.5 w-full bg-violet-600 rounded-full mt-1.5 filter drop-shadow-[0_2px_4px_rgba(124,58,237,0.4)] rotate-[-1.5deg]" />
          </div>
          
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-4">
            Extra Staff & Food Jobs
          </p>
        </div>

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-600 border-4 border-white text-xs font-black text-white text-center shadow-[4px_4px_0px_#f43f5e] flex items-center justify-center gap-2">
            <span>⚠️</span> {errorMsg.toUpperCase()}
          </div>
        )}
        {successMsg && (
          <div className="p-4 rounded-2xl bg-violet-600 border-4 border-white text-xs font-black text-white text-center shadow-[4px_4px_0px_#7c3aed] flex items-center justify-center gap-2">
            <span>🎉</span> {successMsg.toUpperCase()}
          </div>
        )}

        {/* Scelta Ruolo */}
        {!role ? (
          <div className="space-y-6">
            <h2 className="text-center text-xs font-black text-yellow-400 tracking-wider uppercase">
              SELEZIONA IL TUO RUOLO PER INIZIARE:
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => setRole('worker')}
                className="p-5 rounded-2xl bg-black border-4 border-slate-800 hover:border-yellow-400 focus:border-yellow-400 hover:scale-[1.02] focus:scale-[0.98] transition-all duration-200 flex flex-col items-center justify-center gap-2 text-center group shadow-inner"
              >
                <span className="text-4xl group-hover:scale-115 group-hover:rotate-6 transition-all duration-300">🏃‍♂️</span>
                <div>
                  <h3 className="font-black text-yellow-400 text-sm">Lavoratore Extra</h3>
                  <p className="text-[10px] text-slate-500 mt-1 leading-snug">Cerca turni extra e collaborazioni occasionali flessibili</p>
                </div>
              </button>

              <button
                onClick={() => setRole('restaurant')}
                className="p-5 rounded-2xl bg-black border-4 border-slate-800 hover:border-violet-600 focus:border-violet-600 hover:scale-[1.02] focus:scale-[0.98] transition-all duration-200 flex flex-col items-center justify-center gap-2 text-center group shadow-inner"
              >
                <span className="text-4xl group-hover:scale-115 group-hover:-rotate-6 transition-all duration-300">🍽️</span>
                <div>
                  <h3 className="font-black text-violet-400 text-sm">Ristoratore / Gestore</h3>
                  <p className="text-[10px] text-slate-500 mt-1 leading-snug">Pubblica annunci e gestisci personale di supporto</p>
                </div>
              </button>
            </div>
            
            <p className="text-center text-xs text-slate-500 pt-4 border-t-4 border-slate-800/60">
              Hai già un account?{' '}
              <a href="/login" className="text-yellow-400 hover:text-yellow-355 underline font-black transition-all duration-200">Accedi</a>
            </p>
          </div>
        ) : (
          /* Form di registrazione baseline credenziali */
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="flex justify-between items-center pb-2 border-b-4 border-slate-850">
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                Ruolo:{' '}
                <strong className={role === 'worker' ? 'text-yellow-400' : 'text-violet-400'}>
                  {role === 'worker' ? 'Lavoratore' : 'Ristoratore'}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => setRole(null)}
                className="text-[11px] text-yellow-400 hover:text-yellow-300 underline font-black transition-all duration-200"
              >
                Cambia
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-yellow-400 tracking-wider uppercase flex items-center gap-1.5">
                <span>📧</span> Indirizzo Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-black border-4 border-slate-800 text-sm font-bold focus:border-yellow-400 outline-none transition-all duration-200 text-slate-200 placeholder:text-slate-700"
                placeholder="nome@esempio.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-yellow-400 tracking-wider uppercase flex items-center gap-1.5">
                <span>🔑</span> Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-black border-4 border-slate-800 text-sm font-bold focus:border-yellow-400 outline-none transition-all duration-200 text-slate-200 placeholder:text-slate-700"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 mt-4 rounded-2xl bg-yellow-400 hover:bg-yellow-300 border-4 border-white text-black font-black text-base shadow-[4px_4px_0px_#7c3aed] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#7c3aed] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_#7c3aed] transition-all duration-100 disabled:opacity-50 disabled:pointer-events-none select-none`}
            >
              {loading ? 'REGISTRAZIONE IN CORSO...' : "CONTINUA ALL'ONBOARDING!"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}


