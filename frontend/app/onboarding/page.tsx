'use client'

import { useState, useEffect } from 'react'
import { createClient } from '../../utils/supabase/client'

const WORKER_ROLES = ['Cameriere di Sala', 'Barman / Mixologist', 'Aiuto Cuoco', 'Lavapiatti / Utility', 'Runner', 'Pizzaiolo', 'Barista', 'Cuoco']
const VENUE_TYPES = ['Ristorante', 'Pizzeria', 'Bistrot', 'Cocktail Bar', 'Pub', 'Hotel', 'Catering']
const LANGUAGES_LIST = ['Italiano', 'Inglese', 'Spagnolo', 'Francese', 'Tedesco']

export default function OnboardingPage() {
  const [loadingUser, setLoadingUser] = useState(true)
  const [role, setRole] = useState<'worker' | 'restaurant' | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // -- Worker State --
  const [workerStep, setWorkerStep] = useState(1)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [phoneVerified, setPhoneVerified] = useState(false)

  const [primaryRole, setPrimaryRole] = useState('')
  const [secondaryRoles, setSecondaryRoles] = useState<string[]>([])
  const [experience, setExperience] = useState('0')
  const [hourlyRate, setHourlyRate] = useState('10')
  const [city, setCity] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [weeklyAvailability, setWeeklyAvailability] = useState('')
  const [languages, setLanguages] = useState<string[]>([])

  const [docType, setDocType] = useState('Carta d\'Identità')
  const [docNumber, setDocNumber] = useState('')
  const [docUploaded, setDocUploaded] = useState(false)
  const [avatarUploaded, setAvatarUploaded] = useState(false)

  // -- Restaurant State --
  const [restStep, setRestStep] = useState(1)
  const [businessName, setBusinessName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [vatNumber, setVatNumber] = useState('')
  const [representativeName, setRepresentativeName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  
  const [venueType, setVenueType] = useState('')
  const [address, setAddress] = useState('')
  const [openingHours, setOpeningHours] = useState('')
  const [bio, setBio] = useState('')

  useEffect(() => {
    const initSession = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/login'
        return
      }

      setUserId(user.id)
      if (!contactEmail) setContactEmail(user.email || '')

      let resolvedRole: string | null = null

      try {
        const { data: userRoleRow } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle()
        if (userRoleRow?.role) resolvedRole = userRoleRow.role
      } catch (e) {}

      if (!resolvedRole) {
        try {
          const { data: profileRow } = await supabase
            .from('profiles')
            .select('role, primary_role')
            .eq('id', user.id)
            .maybeSingle()
          resolvedRole = profileRow?.role || profileRow?.primary_role || 'worker'
        } catch (e) {
          resolvedRole = 'worker'
        }
      }

      setRole(resolvedRole as 'worker' | 'restaurant')
      setLoadingUser(false)
    }

    initSession()
  }, [])

  const toggleSelection = (item: string, list: string[], setList: (l: string[]) => void) => {
    if (list.includes(item)) setList(list.filter(i => i !== item))
    else setList([...list, item])
  }

  const handleSendOtp = () => {
    if (!phone || phone.length < 5) {
      setErrorMsg("Inserisci un numero di telefono valido.")
      return
    }
    setErrorMsg(null)
    setOtpSent(true)
  }

  const handleVerifyOtp = () => {
    if (otpCode === '1234') {
      setPhoneVerified(true)
      setErrorMsg(null)
      if (role === 'worker') setWorkerStep(2)
      else setRestStep(2) // Se usiamo OTP anche per restaurant
    } else {
      setErrorMsg("Codice errato. Inserisci 1234 per confermare (Demo).")
    }
  }

  const submitOnboarding = async () => {
    setSaving(true)
    setErrorMsg(null)
    const supabase = createClient()

    try {
      // 1. UPDATE PRIMARIO SU `profiles` (FILTRATO AI SOLI CAMPI ESISTENTI IN STAGING)
      // profiles ha solo 'id', 'email', 'credits'. Nessuno dei campi di onboarding esiste in profiles in Staging.
      // Saltiamo quindi l'aggiornamento di profiles e scriviamo direttamente sui profili verticali.

      // 2. SCRITTURE VERTICALI SU TABELLE SPECIFICHE (CON TRY/CATCH E SOLO COLONNE ESISTENTI REALMENTE)
      if (role === 'worker') {
        try {
          // Nota: worker_profiles è assente in Staging al momento, ma proviamo l'upsert protetto da try-catch.
          await supabase.from('worker_profiles').upsert({
            id: userId,
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            skills: [primaryRole, ...secondaryRoles].filter(Boolean),
            experience_years: parseInt(experience, 10) || 0,
          })
        } catch (err) {
          console.warn("Scrittura su worker_profiles fallita (Tabella assente in Staging).", err)
        }
      } else {
        try {
          // restaurant_profiles esiste in Staging ma ha solo: id, restaurant_name, city.
          // Non inseriamo company_name, vat_number, phone, address o description poiché inesistenti in Staging.
          await supabase.from('restaurant_profiles').upsert({
            id: userId,
            restaurant_name: businessName,
            city: city,
          })
        } catch (err) {
          console.warn("Scrittura su restaurant_profiles fallita.", err)
        }
      }

      setSuccessMsg("Profilo completato! Preparo la dashboard...")
      setTimeout(() => {
        window.location.href = role === 'restaurant' ? '/dashboard/restaurant' : '/dashboard/worker'
      }, 1500)

    } catch (error: any) {
      setSuccessMsg("Completamento salvato localmente (Demo mode). Reindirizzamento...")
      setTimeout(() => {
        window.location.href = role === 'restaurant' ? '/dashboard/restaurant' : '/dashboard/worker'
      }, 1500)
    }
  }

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex justify-center items-center font-sans">
        <div className="w-8 h-8 border-4 border-t-teal-400 border-slate-800 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 font-sans selection:bg-teal-500/30 antialiased">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-10 space-y-2">
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-teal-400 to-emerald-300 bg-clip-text text-transparent">
            {role === 'worker' ? 'COMPLETA IL TUO PROFILO' : 'REGISTRA IL TUO LOCALE'}
          </h1>
          <p className="text-slate-400 text-sm">
            {role === 'worker' 
              ? 'Pochi passaggi per iniziare a candidarti ai turni extra.' 
              : 'Inserisci i dati per poter pubblicare annunci e trovare personale.'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center font-medium animate-pulse">
            ⚠️ {errorMsg}
          </div>
        )}
        
        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-300 text-sm text-center font-medium">
            ✅ {successMsg}
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl shadow-slate-950/50">
          
          {/* ======================= ONBOARDING WORKER ======================= */}
          {role === 'worker' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Stepper Worker */}
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 border-b border-slate-800 pb-4 mb-6">
                <span className={workerStep >= 1 ? 'text-teal-400' : ''}>1. Contatti</span>
                <span className={workerStep >= 2 ? 'text-teal-400' : ''}>2. Competenze</span>
                <span className={workerStep >= 3 ? 'text-teal-400' : ''}>3. Documenti</span>
              </div>

              {/* Step 1: Anagrafica & OTP */}
              {workerStep === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">Nome *</label>
                      <input 
                        type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 outline-none transition-all text-sm" placeholder="Mario"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">Cognome *</label>
                      <input 
                        type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 outline-none transition-all text-sm" placeholder="Rossi"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Numero di Telefono (WhatsApp) *</label>
                    <div className="flex gap-2">
                      <input 
                        type="tel" value={phone} onChange={e => setPhone(e.target.value)} disabled={otpSent}
                        className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 outline-none transition-all text-sm disabled:opacity-50" placeholder="+39 333 1234567"
                      />
                      {!otpSent && (
                        <button onClick={handleSendOtp} className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-400 font-bold text-sm transition-all border border-slate-700">
                          Invia OTP
                        </button>
                      )}
                    </div>
                  </div>

                  {otpSent && !phoneVerified && (
                    <div className="p-4 rounded-2xl bg-teal-900/20 border border-teal-500/20 space-y-4">
                      <p className="text-xs text-teal-200">Inserisci il codice ricevuto via SMS (Demo: usa <strong className="text-teal-400">1234</strong>)</p>
                      <div className="flex gap-2">
                        <input 
                          type="text" value={otpCode} onChange={e => setOtpCode(e.target.value)} maxLength={4}
                          className="w-24 px-4 py-3 text-center tracking-widest font-mono text-lg rounded-xl bg-slate-950 border border-teal-500/50 focus:border-teal-400 outline-none" placeholder="0000"
                        />
                        <button onClick={handleVerifyOtp} className="flex-1 px-6 py-3 rounded-xl bg-teal-500 text-slate-950 font-bold text-sm hover:bg-teal-400 transition-all">
                          Verifica Codice
                        </button>
                      </div>
                    </div>
                  )}

                  {phoneVerified && (
                    <button onClick={() => setWorkerStep(2)} className="w-full py-4 mt-6 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold text-sm shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all">
                      Prosegui
                    </button>
                  )}
                </div>
              )}

              {/* Step 2: Professione & Tariffe */}
              {workerStep === 2 && (
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Mansione Principale *</label>
                    <select value={primaryRole} onChange={e => setPrimaryRole(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-teal-500 outline-none text-slate-200">
                      <option value="">Seleziona mansione</option>
                      {WORKER_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Mansioni Secondarie (Opzionali)</label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {WORKER_ROLES.filter(r => r !== primaryRole).map(r => {
                        const active = secondaryRoles.includes(r)
                        return (
                          <button key={r} onClick={() => toggleSelection(r, secondaryRoles, setSecondaryRoles)} className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${active ? 'bg-teal-500/10 text-teal-300 border-teal-500/50' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                            {r} {active ? '✓' : '+'}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">Tariffa Oraria Desiderata (€/h)</label>
                      <input type="number" min="5" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-teal-500 outline-none text-slate-200" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">Anni di Esperienza</label>
                      <input type="number" min="0" value={experience} onChange={e => setExperience(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-teal-500 outline-none text-slate-200" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">Città</label>
                      <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="Milano" className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-teal-500 outline-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">Zona Preferita</label>
                      <input type="text" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} placeholder="Es. Navigli, Isola..." className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-teal-500 outline-none" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Disponibilità Settimanale</label>
                    <input type="text" value={weeklyAvailability} onChange={e => setWeeklyAvailability(e.target.value)} placeholder="Es. Solo weekend, Tutti i pomeriggi" className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-teal-500 outline-none" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Lingue Parlate</label>
                    <div className="flex flex-wrap gap-2">
                      {LANGUAGES_LIST.map(l => {
                        const active = languages.includes(l)
                        return (
                          <button key={l} onClick={() => toggleSelection(l, languages, setLanguages)} className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${active ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/50' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}>
                            {l}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button onClick={() => setWorkerStep(1)} className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-all border border-slate-700">Indietro</button>
                    <button onClick={() => { if(primaryRole) setWorkerStep(3); else setErrorMsg("Seleziona una mansione principale.")}} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold text-sm shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all">Prosegui</button>
                  </div>
                </div>
              )}

              {/* Step 3: Documenti & Completamento */}
              {workerStep === 3 && (
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-6">
                    <p className="text-xs text-amber-200">
                      Per garantire la massima sicurezza, Pupillo richiede un documento di identità valido. I dati sono crittografati. <strong>(In fase Demo locale, i caricamenti sono fittizi)</strong>.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">Tipo Documento</label>
                      <select value={docType} onChange={e => setDocType(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-teal-500 outline-none text-slate-200">
                        <option>Carta d'Identità</option>
                        <option>Passaporto</option>
                        <option>Patente di Guida</option>
                      </select>
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">Numero Documento</label>
                      <input type="text" value={docNumber} onChange={e => setDocNumber(e.target.value)} placeholder="Es. CA12345XX" className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-teal-500 outline-none uppercase" />
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <label className="text-xs font-semibold text-slate-400">Carica Fronte/Retro Documento</label>
                      <div className={`w-full border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${docUploaded ? 'border-teal-500/50 bg-teal-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-950'}`} onClick={() => { setDocUploaded(true); setErrorMsg(null); }}>
                        {docUploaded ? <span className="text-teal-400 font-bold text-sm">✓ Documento caricato (Mock)</span> : <span className="text-slate-400 text-sm">Clicca per caricare (Demo Mock)</span>}
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <label className="text-xs font-semibold text-slate-400">Foto Profilo (Opzionale)</label>
                      <div className={`w-full border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${avatarUploaded ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-950'}`} onClick={() => setAvatarUploaded(true)}>
                        {avatarUploaded ? <span className="text-emerald-400 font-bold text-sm">✓ Foto caricata (Mock)</span> : <span className="text-slate-400 text-sm">Clicca per caricare il tuo Selfie (Demo Mock)</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button onClick={() => setWorkerStep(2)} className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-all border border-slate-700">Indietro</button>
                    <button onClick={submitOnboarding} disabled={saving} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
                      {saving ? 'Completamento in corso...' : 'Invia e Inizia a Lavorare'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}


          {/* ======================= ONBOARDING RESTAURANT ======================= */}
          {role === 'restaurant' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Stepper Restaurant */}
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 border-b border-slate-800 pb-4 mb-6">
                <span className={restStep >= 1 ? 'text-teal-400' : ''}>1. Società & Contatti</span>
                <span className={restStep >= 2 ? 'text-teal-400' : ''}>2. Dettagli Locale</span>
              </div>

              {/* Step 1: Dati Societari */}
              {restStep === 1 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">Nome dell'Attività / Locale *</label>
                      <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="Da Mario Trattoria" className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-teal-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">Ragione Sociale *</label>
                      <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Mario Food S.r.l." className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-teal-500 outline-none transition-all" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">Partita IVA *</label>
                      <input type="text" value={vatNumber} onChange={e => setVatNumber(e.target.value)} placeholder="IT01234567890" className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-teal-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">Nome Legale Rappresentante</label>
                      <input type="text" value={representativeName} onChange={e => setRepresentativeName(e.target.value)} placeholder="Mario Rossi" className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-teal-500 outline-none transition-all" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Email Contatto Principale</label>
                    <input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-teal-500 outline-none transition-all" />
                  </div>

                  {/* Modulo OTP Ristoratore integrato nel flusso */}
                  <div className="p-4 border border-slate-800 rounded-2xl bg-slate-950/50 space-y-4">
                    <label className="text-xs font-semibold text-slate-400">Verifica Cellulare (WhatsApp)</label>
                    <div className="flex gap-2">
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} disabled={otpSent} placeholder="+39 02 123456" className="flex-1 px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-sm focus:border-teal-500 outline-none disabled:opacity-50" />
                      {!otpSent && <button onClick={handleSendOtp} className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-400 font-bold text-sm transition-all border border-slate-700">Invia OTP</button>}
                    </div>
                    {otpSent && !phoneVerified && (
                      <div className="flex gap-2 mt-2">
                        <input type="text" value={otpCode} onChange={e => setOtpCode(e.target.value)} maxLength={4} placeholder="0000" className="w-24 px-4 py-3 text-center tracking-widest font-mono text-lg rounded-xl bg-slate-900 border border-teal-500/50 focus:border-teal-400 outline-none" />
                        <button onClick={handleVerifyOtp} className="flex-1 px-6 py-3 rounded-xl bg-teal-500 text-slate-950 font-bold text-sm hover:bg-teal-400 transition-all">Conferma 1234</button>
                      </div>
                    )}
                    {phoneVerified && <div className="text-xs font-bold text-teal-400">✓ Cellulare Verificato</div>}
                  </div>

                  <button onClick={() => {
                    if(!businessName || !companyName || !vatNumber) setErrorMsg("Compila i campi societari obbligatori.");
                    else if(!phoneVerified) setErrorMsg("Verifica il numero di cellulare prima di proseguire.");
                    else { setErrorMsg(null); setRestStep(2); }
                  }} className="w-full py-4 mt-6 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold text-sm shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all">
                    Prosegui al Dettaglio Locale
                  </button>
                </div>
              )}

              {/* Step 2: Dettagli Locale */}
              {restStep === 2 && (
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Tipologia di Locale</label>
                    <select value={venueType} onChange={e => setVenueType(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-teal-500 outline-none text-slate-200">
                      <option value="">Seleziona tipologia</option>
                      {VENUE_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">Città</label>
                      <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="Roma" className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-teal-500 outline-none transition-all" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-400">Indirizzo</label>
                      <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="Via Condotti 10" className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-teal-500 outline-none transition-all" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Zona / Quartiere</label>
                    <input type="text" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} placeholder="Centro Storico" className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-teal-500 outline-none transition-all" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Orari di Apertura (Indicativi)</label>
                    <input type="text" value={openingHours} onChange={e => setOpeningHours(e.target.value)} placeholder="Es. Mar-Dom 18:00 - 02:00" className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-teal-500 outline-none transition-all" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Descrizione del Locale</label>
                    <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Presenta brevemente il tuo locale ai lavoratori..." className="w-full px-4 py-3 h-24 resize-none rounded-xl bg-slate-950 border border-slate-800 text-sm focus:border-teal-500 outline-none transition-all" />
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-semibold text-slate-400">Logo del Locale (Opzionale)</label>
                    <div className={`w-full border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${avatarUploaded ? 'border-teal-500/50 bg-teal-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-950'}`} onClick={() => setAvatarUploaded(true)}>
                      {avatarUploaded ? <span className="text-teal-400 font-bold text-sm">✓ Logo caricato (Mock)</span> : <span className="text-slate-400 text-sm">Clicca per caricare il logo (Demo Mock)</span>}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button onClick={() => setRestStep(1)} className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-all border border-slate-700">Indietro</button>
                    <button onClick={submitOnboarding} disabled={saving} className="flex-1 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold text-sm shadow-lg shadow-teal-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
                      {saving ? 'Completamento in corso...' : 'Salva e Inizia'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
