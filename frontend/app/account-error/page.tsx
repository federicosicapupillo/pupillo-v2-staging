'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../utils/supabase/client'

export default function AccountErrorPage() {
  const [role, setRole] = useState<string | null>(null)
  const [errorDetail, setErrorDetail] = useState<string | null>(null)

  useEffect(() => {
    const fetchRoleAndStatus = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Query user_roles
        const { data: userRoleRow } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle()

        let userRole = userRoleRow?.role || null

        // Query profile status
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (profile) {
          if (!userRole) userRole = profile.role
          
          if (profile.account_status === 'suspended') {
            setErrorDetail("Il tuo account è stato sospeso dall'amministrazione per violazione dei termini d'uso o incidenti di no-show.")
          }
        }

        setRole(userRole)
      }
    }
    fetchRoleAndStatus()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const retry = () => {
    if (role === 'admin') {
      window.location.href = '/admin'
    } else if (role === 'restaurant') {
      window.location.href = '/dashboard/restaurant'
    } else if (role === 'worker') {
      window.location.href = '/dashboard/worker'
    } else {
      window.location.href = '/'
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 font-sans antialiased">
      <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl shadow-slate-950/50 space-y-6 text-center">
        
        {/* Warning Icon Badge */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-3xl animate-pulse">
          ⚠️
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">
            Stato Account Non Configurato
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            {errorDetail || "Il tuo account non ha ancora un ruolo valido configurato o è in attesa di autorizzazione da parte del gestore di sistema."}
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={retry}
            className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all active:scale-95 shadow-md"
          >
            Riprova Accesso
          </button>

          <a
            href="mailto:assistenza@pupillo.life?subject=Anomalia%20Account%20Pupillo"
            className="text-xs text-teal-400 hover:underline font-semibold"
          >
            Contatta l'assistenza clienti
          </a>
          
          <button
            onClick={handleLogout}
            className="w-full py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 transition-all active:scale-95"
          >
            Disconnetti
          </button>
        </div>

      </div>
    </div>
  )
}
