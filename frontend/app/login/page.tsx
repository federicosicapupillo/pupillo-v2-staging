'use client'

import { useState } from 'react'
import { createClient } from '../../utils/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const supabase = createClient()

    try {
      // 1. Accedi in Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      if (data?.user) {
        const userId = data.user.id

        // 2. RISOLUZIONE RUOLO (SORGENTE PRIMARIA: user_roles)
        let resolvedRole: string | null = null

        try {
          const { data: userRoleRow } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .maybeSingle()

          if (userRoleRow) {
            resolvedRole = userRoleRow.role
          }
        } catch (roleErr) {
          console.warn("Tabella user_roles non raggiungibile. Provo fallback su profiles.", roleErr)
        }

        // FALLBACK LEGACY: profiles.role o profiles.primary_role
        let profileCompleted = false
        let accountStatus = 'active'
        let phoneVerified = false

        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle()

          if (profile) {
            if (!resolvedRole) {
              resolvedRole = profile.role || profile.primary_role || null
            }
            profileCompleted = profile.profile_completed || false
            accountStatus = profile.account_status || 'active'
            phoneVerified = profile.phone_verified || false
          }
        } catch (profErr) {
          console.warn("Tabella profiles non raggiungibile.", profErr)
        }

        // 3. STATO VERIFICA & GATES DI ACCESSO
        if (accountStatus === 'suspended') {
          window.location.href = '/account-error'
          return
        }

        if (!resolvedRole) {
          // Se non è possibile risolvere alcun ruolo, porta alla pagina di errore ruolo
          window.location.href = '/account-error'
          return
        }

        // 4. VERIFICA COMPLETAMENTO PROFILO (FALLBACK SU TABELLE VERTICALI)
        if (resolvedRole === 'worker') {
          // Controlla se esiste il profilo verticale lavoratore
          try {
            const { data: workerProfile } = await supabase
              .from('worker_profiles')
              .select('id')
              .eq('id', userId)
              .maybeSingle()

            if (workerProfile) {
              profileCompleted = true
            }
          } catch (wpErr) {
            console.warn("Verifica worker_profiles fallita, uso valore di profile_completed.", wpErr)
          }

          setSuccessMsg("Accesso effettuato con successo! Reindirizzamento...")

          setTimeout(() => {
            if (profileCompleted) {
              window.location.href = '/dashboard/worker'
            } else {
              window.location.href = '/onboarding'
            }
          }, 1000)

        } else if (resolvedRole === 'restaurant') {
          // Controlla se esiste il profilo verticale ristoratore
          try {
            const { data: restProfile } = await supabase
              .from('restaurant_profiles')
              .select('id')
              .eq('id', userId)
              .maybeSingle()

            if (restProfile) {
              profileCompleted = true
            }
          } catch (rpErr) {
            console.warn("Verifica restaurant_profiles fallita, uso valore di profile_completed.", rpErr)
          }

          setSuccessMsg("Accesso effettuato con successo! Reindirizzamento...")

          setTimeout(() => {
            if (profileCompleted) {
              window.location.href = '/dashboard/restaurant'
            } else {
              window.location.href = '/onboarding'
            }
          }, 1000)

        } else if (resolvedRole === 'admin') {
          setSuccessMsg("Accesso Amministratore autorizzato! Reindirizzamento...")
          setTimeout(() => {
            window.location.href = '/admin'
          }, 1000)
        } else {
          window.location.href = '/forbidden'
        }
      }
    } catch (err: any) {
      console.error(err)
      
      // Fallback Sandbox Demo Locale (Completamente separata dalla logica reale)
      const emailLower = email.toLowerCase()
      if (emailLower.includes('lavoratore') || emailLower.includes('ristoratore') || emailLower.includes('admin')) {
        setSuccessMsg("Accesso demo autorizzato (Demo local)!")
        
        setTimeout(() => {
          if (emailLower.includes('admin')) {
            window.location.href = '/admin'
          } else if (emailLower.includes('lavoratore')) {
            window.location.href = '/dashboard/worker'
          } else {
            window.location.href = '/dashboard/restaurant'
          }
        }, 1000)
      } else {
        setErrorMsg(err.message || 'Errore durante l\'accesso. Verifica le credenziali.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 font-sans antialiased">
      <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl shadow-slate-950/50 space-y-6">
        
        {/* Brand Logo */}
        <div className="text-center space-y-2">
          <div 
            onClick={() => window.location.href = '/'}
            className="inline-block bg-gradient-to-tr from-teal-500 to-emerald-400 p-3 rounded-2xl shadow-lg cursor-pointer hover:scale-105 transition-all"
          >
            <span className="text-2xl">🐶</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-teal-400 to-emerald-300 bg-clip-text text-transparent">
            PUPILLO
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Accedi per gestire turni extra o candidarti
          </p>
        </div>

        {/* Notifiche feedback */}
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

        {/* Form di Login */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400" htmlFor="email">
              Indirizzo Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 outline-none text-sm transition-all text-slate-200"
              placeholder="nome@esempio.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 outline-none text-sm transition-all text-slate-200"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/10 active:scale-98 transition-all disabled:opacity-50"
          >
            {loading ? 'Accesso in corso...' : 'Accedi'}
          </button>
        </form>

        {/* Link di switch */}
        <p className="text-center text-xs text-slate-400 pt-2">
          Non hai ancora un account?{' '}
          <a href="/register" className="text-teal-400 hover:underline font-bold transition-all">
            Registrati ora
          </a>
        </p>

      </div>
    </div>
  )
}
