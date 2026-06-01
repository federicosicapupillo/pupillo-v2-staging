# SUPABASE_SCHEMA_REALITY_CHECK.md - Verifica Reale dello Schema Staging

Questo documento fornisce un'analisi oggettiva, in **sola lettura**, dello stato reale delle tabelle e delle colonne all'interno del database **Supabase Staging** ufficiale (`fbstuzqkdnysojjpxmej.supabase.co`). La verifica è stata effettuata tramite sonde REST PostgREST utilizzando la chiave anonima del progetto, analizzando l'esistenza degli endpoint e la validazione dei campi tramite eccezioni strutturali PostgreSQL.

---

## 1. Stato di Esistenza delle Tabelle

Delle 12 tabelle fondamentali per il funzionamento di Pupillo V2, i risultati del probe mostrano uno stato di frammentazione critico:

| Tabella | Esiste in Staging? | Stato PostgREST / RLS | Rilevanza |
| :--- | :---: | :--- | :--- |
| `public.profiles` | **SÌ** | HTTP 200 (OK) | Centrale (Auth & Dati comuni) |
| `public.worker_profiles` | **NO** | **HTTP 404 (Missing Table - PGRST205)** | **Critico (Profili Lavoratori)** |
| `public.restaurant_profiles` | **SÌ** | HTTP 200 (OK) | Profili Ristoranti |
| `public.user_roles` | **SÌ** | HTTP 200 (OK) | Mapping dei ruoli utente |
| `public.jobs` | **SÌ** | **HTTP 500 (Infinite Recursion Policy)** | **Bloccante (Annunci)** |
| `public.applications` | **SÌ** | **HTTP 500 (Infinite Recursion Policy)** | **Bloccante (Candidature)** |
| `public.shifts` | **NO** | **HTTP 404 (Missing Table - PGRST205)** | **Critico (Turni Programmati)** |
| `public.messages` | **SÌ** | **HTTP 500 (Infinite Recursion Policy)** | Chat e messaggi |
| `public.notifications` | **SÌ** | HTTP 200 (OK) | Notifiche in-app |
| `public.reviews` | **SÌ** | HTTP 200 (OK) | Feedback e recensioni |
| `public.credit_transactions` | **SÌ** | HTTP 200 (OK) | Billing e crediti |
| `public.subscriptions` | **SÌ** | HTTP 200 (OK) | Abbonamenti Stripe |

---

## 2. Dettaglio delle Colonne Rilevate (Reali vs Mancanti)

### A. Tabella `public.profiles` (Parziale)
*   **Colonne PRESENTI**:
    *   `id` (uuid)
    *   `email` (text)
    *   `credits` (integer)
*   **Colonne MANCANTI**:
    *   `role` (text) — **CRITICO**: Provoca crash immediato nel login del frontend!
    *   `plan` (text)
    *   `rating_avg` / `reviews_count` / `completed_shifts` / `no_shows` / `reliability_pct` (Reputazione)
    *   `vat_number` / `business_name` (Dati ristoratore rimasti orfani)
    *   `experience_years` / `hourly_rate` / `avatar_url` (Dati lavoratore rimasti orfani)

### B. Tabella `public.restaurant_profiles` (Molto Incompleta)
*   **Colonne PRESENTI**:
    *   `id` (uuid)
    *   `restaurant_name` (text)
    *   `city` (text)
*   **Colonne MANCANTI**:
    *   `company_name` (text)
    *   `vat_number` (text)
    *   `phone` (text)
    *   `address` (text)
    *   `description` (text)
    *   `logo_url` (text)

### C. Tabella `public.user_roles` (Completa)
*   **Colonne PRESENTI**:
    *   `id` (uuid), `user_id` (uuid), `role` (text).

### D. Tabella `public.messages` (Corrotta / Outdated)
*   **Colonne PRESENTI**:
    *   `id` (uuid), `sender_id` (uuid), `created_at` (timestamptz)
*   **Colonne MANCANTI**:
    *   `application_id` (uuid) — **CRITICO**: Rompe l'aggancio della chat alla candidatura!
    *   `body` (text) — **CRITICO**: Manca il corpo del messaggio!

---

## 3. Differenze Rispetto a `DATABASE_RECONCILIATION_PLAN.md`

Il nostro report precedente ipotizzava che le tabelle `messages`, `notifications`, `credit_transactions`, `user_roles` e `reviews` fossero completamente mancanti dal database.
La sonda reale ha rivelato una situazione diversa: **queste tabelle esistono fisicamente in Staging, ma sono in uno stato gravemente obsoleto o incompleto** (es. `messages` non ha le colonne `body` e `application_id`, e `restaurant_profiles` è priva di quasi tutti i campi). Inoltre, le tabelle `jobs` e `applications` sono affette da **ricorsione infinita** nelle policy RLS, rendendole inaccessibili via API.

---

## 4. Rischi Immediati per l'Onboarding e l'Autenticazione

1.  **Crash e Loop di Reindirizzamento al Login**:
    *   Il frontend in `/app/login/page.tsx` tenta di caricare il ruolo dell'utente facendo: `supabase.from('profiles').select('role')`.
    *   Poiché la colonna `role` **manca** in `profiles`, la query fallisce immediatamente con un errore del database, impedendo all'utente loggato di essere indirizzato alla dashboard e bloccandolo nella pagina di login.
2.  **Crash all'Onboarding del Lavoratore**:
    *   La tabella `worker_profiles` **non esiste**. Qualsiasi tentativo di completare l'onboarding come lavoratore si interrompe con un errore irreversibile di tabella mancante durante l'upsert su `worker_profiles`.
3.  **Crash all'Onboarding del Ristoratore**:
    *   Il ristoratore tenta di inserire p.iva, telefono, indirizzo e descrizione aziendale. Poiché queste colonne **mancano** in `restaurant_profiles`, il salvataggio fallisce bloccando l'onboarding del locale.

---

## 5. Piano delle Correzioni Urgenti

### A. Cosa correggere subito nel Codice (Frontend)
1.  **Fallback del Ruolo nel Login**:
    *   Modificare la logica di rilevamento del ruolo in `/app/login/page.tsx` ed `/app/onboarding/page.tsx` affinché interroghi **prima** la tabella `user_roles` (che esiste ed ha la colonna `role` valida) invece di fare affidamento sulla colonna `role` mancante in `profiles`.
2.  **Sanificazione del Payload di Onboarding**:
    *   Rimuovere le scritture ridondanti su `profiles` per i campi specifici delle tabelle split (`vat_number`, `experience_years`, ecc.) per evitare che fallisca l'intera transazione.

### B. Cosa creare/correggere dopo nel Database (Supabase)
1.  **Creazione della Tabella `worker_profiles`** (Urgente):
    *   Inserire la DDL per creare `worker_profiles` con le colonne `first_name`, `last_name`, `phone`, `bio`, `skills`, `experience_years`, `rating`.
2.  **Creazione della Tabella `shifts`** (Urgente):
    *   Creare la tabella dei turni reali per allineare il flusso post-match.
3.  **Aggiornamento delle Colonne di `profiles` e `restaurant_profiles`**:
    *   Aggiungere `role` e `plan` a `profiles`.
    *   Aggiungere i campi aziendali mancanti a `restaurant_profiles`.
4.  **Ricostruzione di `messages`**:
    *   Rilasciare e ricreare `messages` includendo le colonne fondamentali `application_id` e `body`.
5.  **Risoluzione Ricorsione RLS su `jobs` ed `applications`**:
    *   Revisionare ed eliminare le policy RLS ricorsive che controllano il ruolo dell'utente facendo query incrociate infinite.
