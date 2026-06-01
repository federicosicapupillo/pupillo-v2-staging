'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../utils/supabase/client'

export default function ForbiddenPage() {
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    const fetchRole = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Query user_roles
        const { data: userRoleRow } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle()

        if (userRoleRow) {
          setRole(userRoleRow.role)
        }
      }
    }
    fetchRole()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const goHome = () => {
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
        
        {/* Shield Icon Badge */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-3xl">
          🛡️
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-rose-400 to-amber-300 bg-clip-text text-transparent">
            Accesso Negato
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Non disponi dei permessi necessari per accedere a questa sezione con il tuo ruolo attuale
            {role ? ` (${role === 'worker' ? 'Lavoratore' : role === 'restaurant' ? 'Ristoratore' : role})` : ''}.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={goHome}
            className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all active:scale-95 shadow-md"
          >
            Vai alla mia Home
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full py-3 bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 transition-all active:scale-95"
          >
            Disconnetti Account
          </button>
        </div>

      </div>
    </div>
  )
}
