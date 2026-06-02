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

      setSuccessMsg("Registrazione completata con successo! Reindirizzamento...")
      
      setTimeout(() => {
        window.location.href = '/onboarding'
      }, 1500)

    } catch (err: any) {
      console.error(err)
      
      // Fallback Demo Locale
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
    <>
      <style>{`
        /* Self-contained styling for register page */
        html, body {
          background-color: #000000 !important;
          color: #ffffff !important;
          margin: 0;
          padding: 0;
          font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          box-sizing: border-box;
        }

        *, *::before, *::after {
          box-sizing: inherit;
        }

        .register-wrapper {
          min-height: 100vh;
          background-color: #000000;
          color: #ffffff;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 3rem 1rem;
          position: relative;
          overflow: hidden;
        }

        .rotate-star {
          position: absolute;
          font-weight: 900;
          font-size: 8rem;
          color: rgba(234, 179, 8, 0.05);
          user-select: none;
          pointer-events: none;
        }

        .star-left {
          top: 10%;
          left: 5%;
          transform: rotate(15deg);
        }

        .star-right {
          bottom: 10%;
          right: 5%;
          transform: rotate(-15deg);
        }

        .pupillo-card-purple {
          background-color: #09090b;
          border: 6px solid #ffffff;
          box-shadow: 8px 8px 0px #7c3aed;
          border-radius: 32px;
          padding: 2.5rem;
          max-width: 26rem;
          width: 100%;
          box-sizing: border-box;
          text-align: center;
          position: relative;
          z-index: 10;
        }

        .text-logo-brand {
          font-size: 2.5rem;
          font-weight: 900;
          letter-spacing: -0.05em;
          text-transform: uppercase;
          color: #eab308;
          background-color: #000000;
          border: 4px solid #ffffff;
          padding: 0.25rem 1.25rem;
          border-radius: 16px;
          box-shadow: 4px 4px 0px #7c3aed;
          display: inline-block;
          margin-bottom: 0.5rem;
          user-select: none;
          cursor: pointer;
        }

        .logo-subtitle {
          font-size: 0.65rem;
          color: #94a3b8;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-top: 0.5rem;
          margin-bottom: 2rem;
        }

        .role-title {
          font-size: 0.75rem;
          font-weight: 900;
          color: #eab308;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 1.5rem;
        }

        /* Role Buttons */
        .role-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
        }

        .role-btn {
          background-color: #000000;
          border: 4px solid #1f2937;
          border-radius: 18px;
          padding: 1.5rem;
          color: #ffffff;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          text-align: center;
        }

        .role-btn:hover {
          border-color: #eab308;
          transform: scale(1.02);
        }

        .role-emoji {
          font-size: 2.5rem;
        }

        .role-name-worker {
          font-weight: 900;
          font-size: 0.875rem;
          text-transform: uppercase;
          color: #eab308;
        }

        .role-name-rest {
          font-weight: 900;
          font-size: 0.875rem;
          text-transform: uppercase;
          color: #a78bfa;
        }

        .role-desc {
          font-size: 0.65rem;
          color: #64748b;
          margin: 0;
          font-weight: bold;
          line-height: 1.4;
        }

        /* Forms inputs */
        .form-group {
          margin-bottom: 1.25rem;
          text-align: left;
        }

        .pupillo-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.7rem;
          font-weight: 900;
          text-transform: uppercase;
          color: #eab308;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }

        .pupillo-input {
          width: 100%;
          padding: 0.85rem 1.25rem;
          border-radius: 16px;
          background-color: #000000;
          border: 4px solid #1f2937;
          color: #ffffff;
          font-size: 0.875rem;
          font-weight: bold;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }

        .pupillo-input:focus {
          border-color: #eab308;
        }

        .pupillo-btn-yellow {
          width: 100%;
          background-color: #eab308;
          color: #000000;
          border: 4px solid #ffffff;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-radius: 16px;
          padding: 1rem 2rem;
          font-size: 0.875rem;
          text-align: center;
          box-shadow: 4px 4px 0px #7c3aed;
          transition: all 0.1s ease;
          cursor: pointer;
          margin-top: 1.5rem;
          box-sizing: border-box;
        }

        .pupillo-btn-yellow:hover {
          background-color: #facc15;
          transform: translate(-2px, -2px);
          box-shadow: 6px 6px 0px #7c3aed;
        }

        .pupillo-btn-yellow:active {
          transform: translate(2px, 2px);
          box-shadow: 2px 2px 0px #7c3aed;
        }

        /* Switch text styling */
        .switch-prompt {
          margin-top: 1.5rem;
          padding-top: 1.25rem;
          border-top: 4px solid #1f2937;
          font-size: 0.75rem;
          color: #94a3b8;
          font-weight: bold;
        }

        .switch-link {
          color: #eab308;
          text-decoration: underline;
          font-weight: 900;
          transition: color 0.2s;
        }

        .switch-link:hover {
          color: #facc15;
        }

        /* Notifications card styling */
        .alert-card {
          padding: 1rem;
          border-radius: 16px;
          border: 4px solid #ffffff;
          font-size: 0.75rem;
          font-weight: 900;
          text-transform: uppercase;
          text-align: center;
          margin-bottom: 1.5rem;
        }

        .alert-error {
          background-color: #e11d48;
          color: #ffffff;
          box-shadow: 4px 4px 0px #be123c;
        }

        .alert-success {
          background-color: #7c3aed;
          color: #ffffff;
          box-shadow: 4px 4px 0px #6d28d9;
        }

        .form-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 0.75rem;
          border-bottom: 4px solid #1f2937;
          margin-bottom: 1.25rem;
          font-size: 0.7rem;
          font-weight: bold;
          text-transform: uppercase;
          color: #cbd5e1;
        }

        .change-role-btn {
          background: none;
          border: none;
          color: #eab308;
          text-decoration: underline;
          font-weight: 900;
          cursor: pointer;
          font-size: 0.7rem;
        }

        .role-highlight-worker {
          color: #eab308;
          font-weight: 900;
        }

        .role-highlight-rest {
          color: #a78bfa;
          font-weight: 900;
        }

      `}</style>

      <div className="register-wrapper">
        <div className="rotate-star star-left">★</div>
        <div className="rotate-star star-right">★</div>

        <div className="pupillo-card-purple">
          
          <div onClick={() => window.location.href = '/'}>
            <span className="text-logo-brand">PUPILLO</span>
          </div>
          <div className="logo-subtitle">Extra Staff & Food Jobs</div>

          {errorMsg && (
            <div className="alert-card alert-error">
              <span>⚠️</span> {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="alert-card alert-success">
              <span>🎉</span> {successMsg}
            </div>
          )}

          {/* Scelta Ruolo */}
          {!role ? (
            <div className="space-y-6">
              <h2 className="role-title">
                Seleziona il tuo ruolo per iniziare
              </h2>
              <div className="role-grid">
                <button
                  onClick={() => setRole('worker')}
                  className="role-btn"
                >
                  <span className="role-emoji">🏃‍♂️</span>
                  <div>
                    <h3 className="role-name-worker">Lavoratore Extra</h3>
                    <p className="role-desc">Cerca turni extra e collaborazioni occasionali flessibili</p>
                  </div>
                </button>

                <button
                  onClick={() => setRole('restaurant')}
                  className="role-btn"
                >
                  <span className="role-emoji">🍽️</span>
                  <div>
                    <h3 className="role-name-rest">Ristoratore / Gestore</h3>
                    <p className="role-desc">Pubblica annunci e gestisci personale di supporto</p>
                  </div>
                </button>
              </div>
              
              <p className="switch-prompt">
                Hai già un account?{' '}
                <a href="/login" className="switch-link">Accedi</a>
              </p>
            </div>
          ) : (
            /* Form di registrazione baseline credenziali */
            <form onSubmit={handleRegister}>
              <div className="form-header-row">
                <span>
                  Ruolo choise:{' '}
                  <span className={role === 'worker' ? 'role-highlight-worker' : 'role-highlight-rest'}>
                    {role === 'worker' ? 'Lavoratore' : 'Ristoratore'}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setRole(null)}
                  className="change-role-btn"
                >
                  Cambia
                </button>
              </div>

              <div className="form-group">
                <label className="pupillo-label">
                  <span>📧</span> Indirizzo Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pupillo-input"
                  placeholder="nome@esempio.com"
                />
              </div>

              <div className="form-group">
                <label className="pupillo-label">
                  <span>🔑</span> Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pupillo-input"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="pupillo-btn-yellow"
              >
                {loading ? 'Registrazione...' : "Registrati Ora!"}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  )
}
