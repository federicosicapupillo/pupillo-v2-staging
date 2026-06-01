# DATABASE_RECONCILIATION_PLAN.md - Piano di Riallineamento Database

Questo documento dettaglia la strategia tecnica per riconciliare il database PostgreSQL di **Supabase Staging** attuale con i requisiti estratti dal vecchio database legacy, risolvendo i conflitti architetturali ed implementando i trigger SQL di integrità di business.

---

## 1. Stato Attuale delle Tabelle Usate dal Codice

Il DDL di Staging attuale (`directives/database_schema.sql`) definisce 5 tabelle:
1. `public.profiles`: Tabella centrale per l'utente auth. (`id`, `email`, `role`, `created_at`, `updated_at`).
2. `public.worker_profiles`: Dettagli specifici per il lavoratore. (`id`, `first_name`, `last_name`, `phone`, `bio`, `skills`, `experience_years`, `rating`, `created_at`, `updated_at`).
3. `public.restaurant_profiles`: Dettagli specifici per il ristorante. (`id`, `restaurant_name`, `company_name`, `vat_number`, `phone`, `address`, `city`, `description`, `logo_url`, `created_at`, `updated_at`).
4. `public.jobs`: Tabella annunci/turni inseriti dai ristoratori. (`id`, `restaurant_id`, `role`, `date`, `start_time`, `end_time`, `hourly_rate`, `location`, `status`, `notes`, `created_at`, `updated_at`).
5. `public.applications`: Candidature dei lavoratori. (`id`, `job_id`, `worker_id`, `status`, `applied_at`).

---

## 2. Tabelle Mancanti (Urgente)

Le seguenti tabelle sono **interrogate direttamente dal codice del frontend attuale** o descritte come indispensabili nelle specifiche, ma **sono totalmente assenti** nel DDL di Staging attuale:

| Tabella | Colonne Richieste | Utilizzo nel Frontend / Business Logic |
| :--- | :--- | :--- |
| `public.shifts` | `id` (uuid), `announcement_id` (uuid), `restaurant_id` (uuid), `worker_id` (uuid), `shift_date` (date), `hours` (numeric), `amount` (numeric), `status` (enum/text), `created_at` (timestamptz), `completed_at` (timestamptz) | Tracciamento dei turni programmati ed effettuati. Richiesto dalla dashboard lavoratore/ristoratore per visualizzare la cronologia turni. |
| `public.messages` | `id` (uuid), `application_id` (uuid), `sender_id` (uuid), `receiver_id` (uuid), `body` (text), `created_at` (timestamptz), `read_at` (timestamptz) | Chat interna pre-match tra lavoratore e ristoratore. Utilizzato in `/messages` e `/messages/[id]`. |
| `public.notifications` | `id` (uuid), `user_id` (uuid), `title` (text), `body` (text), `link` (text), `read` (boolean), `created_at` (timestamptz), `read_at` (timestamptz) | Notifiche in tempo reale e in-app per modifiche di stato. Utilizzato in `/notifications`. |
| `public.credit_transactions` | `id` (uuid), `user_id` (uuid), `delta` (integer), `balance_after` (integer), `kind` (enum/text), `reason` (text), `created_at` (timestamptz) | Tracciamento storico acquisto/consumo crediti. Utilizzato in `/billing`. |
| `public.user_roles` | `id` (uuid), `user_id` (uuid), `role` (enum/text) | Tabella di supporto per mappare i permessi utente. Interrogata durante il login e onboarding per verificare il ruolo dell'utente. |
| `public.reviews` | `id` (uuid), `author_id` (uuid), `target_id` (uuid), `shift_id` (uuid), `rating` (integer), `comment` (text), `punctuality` (integer), `professionalism` (integer), `competence` (integer), `reliability` (integer), `teamwork` (integer), `created_at` (timestamptz) | Sistema di feedback multidimensionale per il calcolo della reputazione. |

---

## 3. Discrepanze di Nomenclatura e Colonne

* **`announcements` vs `jobs`**:
  * Il vecchio database utilizzava la tabella `announcements` relazionata a `announcement_id`.
  * Il nuovo database utilizza la tabella `jobs` relazionata a `job_id`.
  * *Azione*: Mantenere `jobs` (più moderna ed integrata nel nuovo frontend), ma allineare le relazioni esterne in tutte le tabelle dipendenti (es. `applications` e `shifts`).
* **Campi Mancanti in `profiles`**:
  * Il frontend attuale tenta di leggere il campo `credits` e `plan` direttamente da `profiles` (per la pagina `/billing`).
  * *Azione*: Aggiungere `credits` (default 0) e `plan` (default 'free') alla tabella `profiles` centrale di Staging.

---

## 4. Trigger & Funzioni SQL Legacy da Recuperare

Per garantire l'integrità del business senza dipendere esclusivamente da codice client-side instabile, dobbiamo integrare nel DDL di Staging le seguenti funzioni PL/pgSQL:

### A. Creazione Turno e Rifiuto Concorrenti
```sql
CREATE OR REPLACE FUNCTION public.create_shift_on_accept()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status <> 'accepted' THEN
    -- 1. Crea il turno programmato
    INSERT INTO public.shifts (announcement_id, restaurant_id, worker_id, shift_date, hours, amount, status)
    SELECT 
      j.id, j.restaurant_id, NEW.worker_id, j.date, 
      (EXTRACT(EPOCH FROM (j.end_time - j.start_time))/3600), 
      (j.hourly_rate * (EXTRACT(EPOCH FROM (j.end_time - j.start_time))/3600)),
      'scheduled'
    FROM public.jobs j WHERE j.id = NEW.job_id;

    -- 2. Aggiorna lo stato del job a matched
    UPDATE public.jobs SET status = 'matched' WHERE id = NEW.job_id;

    -- 3. Rifiuta automaticamente gli altri candidati concorrenti
    UPDATE public.applications SET status = 'rejected' 
     WHERE job_id = NEW.job_id AND id <> NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### B. Calcolo Reputazione per Recensioni o No-Shows
```sql
CREATE OR REPLACE FUNCTION public.recompute_worker_reputation()
RETURNS TRIGGER AS $$
DECLARE
  v_worker_id uuid;
  v_avg_rating numeric(3,2);
  v_reviews_count integer;
  v_completed_shifts integer;
  v_no_shows integer;
  v_reliability integer;
BEGIN
  -- Identifica il lavoratore
  IF TG_OP = 'DELETE' THEN
    v_worker_id := OLD.target_id;
  ELSE
    v_worker_id := NEW.target_id;
  END IF;

  -- 1. Calcola media recensioni
  SELECT COALESCE(AVG(rating), 5.00), COUNT(*) INTO v_avg_rating, v_reviews_count
    FROM public.reviews WHERE target_id = v_worker_id;

  -- 2. Conteggia turni completati e no-shows
  SELECT COUNT(*) FILTER (WHERE status = 'completed'), COUNT(*) FILTER (WHERE status = 'no_show')
    INTO v_completed_shifts, v_no_shows
    FROM public.shifts WHERE worker_id = v_worker_id;

  -- 3. Calcola percentuale di affidabilità
  IF (v_completed_shifts + v_no_shows) > 0 THEN
    v_reliability := (v_completed_shifts * 100) / (v_completed_shifts + v_no_shows);
  ELSE
    v_reliability := 100;
  END IF;

  -- 4. Aggiorna la tabella worker_profiles
  UPDATE public.worker_profiles
     SET rating = v_avg_rating,
         experience_years = COALESCE(experience_years, 0) -- Mantiene anni esistenti
   WHERE id = v_worker_id;

  -- 5. Aggiorna campi aggregati di reputazione su profiles centrale
  UPDATE public.profiles
     SET rating_avg = v_avg_rating,
         reviews_count = v_reviews_count,
         completed_shifts = v_completed_shifts,
         no_shows = v_no_shows,
         reliability_pct = v_reliability
   WHERE id = v_worker_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 5. Sicurezza dei Dati (GDPR & Compliance)

> [!CAUTION]
> ### Divieto Assoluto di Importare Dati PII (Dati Personali Reali)
> Durante la migrazione e la riconciliazione del database in Staging, **è severamente vietato ripristinare o importare i file `auth_users.json` o `data_public.sql` reali**. Questi file contengono dati reali, email, IBAN e conversazioni di utenti di produzione. 
> Per popolare l'ambiente di staging ed effettuare test QA, dovranno essere utilizzati esclusivamente dati simulati ("mock data") e indirizzi email fittizi di test, come `test.worker.001@pupillo.it` o `test.restaurant.001@pupillo.it`.

---

## 6. Roadmap Sicura di Migrazione

1. **Step 1: Backup dello Staging Attuale**:
   * Eseguire un dump dello schema di Staging attuale per prevenire rollback complessi.
2. **Step 2: Esecuzione dello Script di Riallineamento**:
   * Eseguire nel SQL Editor di Supabase la DDL aggiornata per creare le tabelle mancanti (`shifts`, `messages`, `notifications`, `credit_transactions`, `user_roles`, `reviews`).
3. **Step 3: Aggiunta delle Colonne di Billing e Reputazione**:
   * Integrare i campi `credits` e `plan` all'interno della tabella `profiles`.
4. **Step 4: Caricamento delle Funzioni e Trigger SQL**:
   * Registrare le funzioni PL/pgSQL ed associare i trigger alle tabelle `applications`, `reviews`, `shifts` e `profiles` per rendere l'ambiente transazionale automatico ed impermeabile agli errori client-side.
5. **Step 5: Test di Coerenza**:
   * Verificare la connettività del frontend Next.js sulle nuove tabelle, simulando un match completo e controllando che le righe in `shifts` vengano inserite correttamente senza errori.
