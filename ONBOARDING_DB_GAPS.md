# ONBOARDING_DB_GAPS.md - Divario Database Onboarding & Migrazione Proposta

Questo documento traccia in modo analitico le colonne richieste dal codice frontend di **Pupillo V2** per l'autenticazione e l'onboarding, confrontandole con le gravissime carenze strutturali rilevate sul database **Supabase Staging** reale, e propone la migrazione SQL correttiva (da non eseguire ancora).

---

## 1. Discrepanze e Colonne Richieste dal Frontend

Sulla base del nostro audit del codice e del reality check sul database reale, ecco la mappa dei campi necessari al frontend per completare la Fase 1:

### A. Tabella `public.profiles`
Il frontend e le logiche di controllo si aspettano colonne di base per monitorare lo stato dell'account e dell'onboarding, le quali sono **mancanti** in Staging:

| Colonna Richiesta | Tipo SQL | Tabella Reale Staging | Stato in Staging | Soluzione Proposta |
| :--- | :--- | :--- | :--- | :--- |
| `profile_completed` | `boolean` | `profiles` | **MANCANTE** | Aggiungere a `profiles` con default `false`. |
| `phone_verified` | `boolean` | `profiles` | **MANCANTE** | Aggiungere a `profiles` con default `false`. |
| `plan` | `text` | `profiles` | **MANCANTE** | Aggiungere a `profiles` con default `'free'`. |

---

### B. Tabella `public.worker_profiles` (Lavoratore)
Questa tabella **non esiste affatto** in Staging. Qualsiasi scrittura da parte del modulo onboarding del lavoratore genera un errore irreversibile.

| Colonna Richiesta | Tipo SQL | Stato in Staging | Ruolo nel Frontend |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | **MANCANTE** | Primary key (FK su `profiles.id`) |
| `first_name` | `text` | **MANCANTE** | Nome del lavoratore |
| `last_name` | `text` | **MANCANTE** | Cognome del lavoratore |
| `phone` | `text` | **MANCANTE** | Telefono cellulare (WhatsApp) |
| `skills` | `text[]` | **MANCANTE** | Lista delle mansioni/competenze selezionate |
| `experience_years` | `integer` | **MANCANTE** | Anni di esperienza lavorativa |
| `bio` | `text` | **MANCANTE** | Breve biografia inserita dall'utente |
| `rating` | `numeric(3,2)` | **MANCANTE** | Valutazione media delle recensioni (default 5.00) |

---

### C. Tabella `public.restaurant_profiles` (Ristoratore)
La tabella esiste in Staging, ma è **priva della quasi totalità delle colonne** richieste per salvare il profilo del ristorante:

| Colonna Richiesta | Tipo SQL | Stato in Staging | Ruolo nel Frontend |
| :--- | :--- | :--- | :--- |
| `company_name` | `text` | **MANCANTE** | Ragione sociale della società |
| `vat_number` | `text` | **MANCANTE** | Partita IVA del ristorante |
| `phone` | `text` | **MANCANTE** | Telefono di contatto del ristorante |
| `address` | `text` | **MANCANTE** | Indirizzo del locale ristorativo |
| `description` | `text` | **MANCANTE** | Biografia / Descrizione del ristorante |
| `logo_url` | `text` | **MANCANTE** | Icona / Logo del locale |

---

## 2. Proposta di Migrazione SQL (NON ESEGUITA)

Di seguito è riportato lo script SQL DDL correttivo da lanciare nel SQL Editor di Supabase in una fase successiva per riconciliare completamente il database con il codice applicativo.

```sql
-- =========================================================================
-- 1. STABILIZZAZIONE E ARRICCHIMENTO DELLA TABELLA PROFILES CENTRALE
-- =========================================================================
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free'::text NOT NULL;

-- =========================================================================
-- 2. CREAZIONE DELLA TABELLA WORKER_PROFILES MANCANTE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.worker_profiles (
  id uuid REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text NOT NULL,
  bio text,
  skills text[] DEFAULT '{}'::text[] NOT NULL,
  experience_years integer DEFAULT 0 CHECK (experience_years >= 0) NOT NULL,
  rating numeric(3,2) DEFAULT 5.00 CHECK (rating BETWEEN 1.00 AND 5.00) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Attivazione RLS su worker_profiles
ALTER TABLE public.worker_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Visualizzazione pubblica worker profiles"
  ON public.worker_profiles FOR SELECT
  USING (true);

CREATE POLICY "Modifica del proprio profilo worker"
  ON public.worker_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Inserimento del proprio profilo worker"
  ON public.worker_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =========================================================================
-- 3. INTEGRAZIONE COLONNE MANCANTI IN RESTAURANT_PROFILES
-- =========================================================================
ALTER TABLE public.restaurant_profiles
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS vat_number text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS logo_url text;

-- Semplice pulizia e check dei vincoli (in caso di righe vuote ereditate da test)
ALTER TABLE public.restaurant_profiles 
  ALTER COLUMN company_name SET DEFAULT '';
```
