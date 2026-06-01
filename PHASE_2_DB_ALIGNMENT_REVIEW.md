# PHASE_2_DB_ALIGNMENT_REVIEW.md - Revisione del Riallineamento Database

Questo documento fornisce la revisione tecnica completa e la guida operativa per l'applicazione della migrazione SQL `supabase/migrations/phase_2_database_alignment.sql` sul database di **Supabase Staging** (`fbstuzqkdnysojjpxmej.supabase.co`).

---

## 1. Analisi d'Impatto delle Modifiche DDL

La migrazione è progettata per essere **sicura al 100%**, totalmente **idempotente** e non distruttiva (nessun `DROP`, `DELETE` o `TRUNCATE`).

### A. Cosa Verrà Creato
Verranno introdotte nel database le seguenti tabelle e i relativi indici di performance (attualmente mancanti in Staging):
1.  **`public.worker_profiles`**: Tabella per allineare l'anagrafica professionale dei lavoratori extra (relazione 1:1 con `auth.users`).
2.  **`public.shifts`**: Tabella centrale per la gestione post-match dei turni confermati e svolti.
3.  **`public.notifications`**: Tabella per lo storico delle notifiche in-app.
4.  **`public.reviews`**: Tabella per i feedback multidimensionali (professionalità, puntualità, ecc.) post-turno.
5.  **`public.credit_transactions`**: Tabella di logging delle transazioni di ricarica/acquisto crediti.
6.  **`public.subscriptions`**: Tabella per il tracciamento dei piani Stripe attivi.
7.  **Indici query**: 10 indici dedicati a ottimizzare le ricerche relazionali (es. `worker_id`, `restaurant_id`, `user_id`, `job_id`, `application_id`).

### B. Cosa Verrà Alterato
Le tabelle esistenti in Staging verranno arricchite con le colonne richieste dal frontend Next.js 14, **solo se mancanti**:
1.  **`public.profiles`**: Aggiunta delle colonne `profile_completed`, `phone_verified`, `plan`, `updated_at`.
2.  **`public.restaurant_profiles`**: Aggiunta delle colonne `company_name`, `vat_number`, `phone`, `address`, `description`, `logo_url`, `updated_at` (senza toccare `restaurant_name` o `city` esistenti).
3.  **`public.messages`**: Aggiunta delle colonne `application_id`, `body`, `read_at`, `created_at` (per consentire il funzionamento corretto della chat candidati).

### C. Cosa NON Verrà Toccato
*   **Nessun dato utente o credenziale esistente**: I dati degli utenti registrati non subiranno variazioni.
*   **Nessuna tabella esistente verrà eliminata**: Non viene eseguito nessun `DROP TABLE`.
*   **Nessuna colonna esistente verrà eliminata o rinominata**: I campi già esistenti (come `restaurant_name` in `restaurant_profiles`) rimarranno intatti.
*   **Nessuna configurazione Auth / RLS attiva**: Le regole di Row Level Security esistenti non verranno alterate in questa fase per non provocare disservizi.

---

## 2. Valutazione e Mitigazione dei Rischi

*   **Rischio 1: Lock delle Tabelle durante l'Alter**:
    *   *Analisi*: Le tabelle esistenti in Staging hanno pochissimi record di test, per cui l'esecuzione di `ALTER TABLE ... ADD COLUMN` sarà istantanea e non causerà blocchi di locking.
    *   *Mitigazione*: Operazione sicura in qualsiasi momento.
*   **Rischio 2: Incoerenze nelle FK su `auth.users`**:
    *   *Analisi*: I vincoli `FOREIGN KEY REFERENCES auth.users(id) ON DELETE CASCADE` richiedono che gli ID associati esistano. Se creiamo profili senza un utente auth corrispondente, fallirebbe l'inserimento.
    *   *Mitigazione*: Comportamento corretto di integrità referenziale previsto da Supabase.
*   **Rischio 3: Mancanza di Triggers automatici**:
    *   *Analisi*: In questa fase non registriamo trigger automatici (es. creazione turno automatica ad accettazione candidatura) per evitare comportamenti inattesi nel database.
    *   *Mitigazione*: Tali logiche verranno attivate nella successiva fase di integrità di business, consentendo prima un debug dei flussi base.

---

## 3. Istruzioni per il Backup di Staging Prima dell'Esecuzione

Prima di procedere con l'esecuzione dello script SQL DDL, si consiglia vivamente di effettuare un backup di sicurezza dello schema e dei dati attuali di Supabase Staging:

### Opzione A: Via CLI di Supabase (Raccomandata)
Se la CLI di Supabase è configurata localmente, eseguire il comando di dump dello schema:
```bash
supabase db dump --db-url "postgresql://postgres:[password]@db.fbstuzqkdnysojjpxmej.supabase.co:5432/postgres" -f backup_staging_schema.sql
```

### Opzione B: Via Dashboard Supabase (Interfaccia Web)
1.  Accedere al portale Supabase Staging (`fbstuzqkdnysojjpxmej`).
2.  Andare in **Database** -> **Backups**.
3.  Controllare l'ultimo backup giornaliero disponibile o attivare un'istantanea di ripristino ("Point-in-Time Recovery") prima del lancio della migrazione.

---

## 4. Ordine di Esecuzione Consigliato

L'esecuzione deve avvenire all'interno del **SQL Editor** della dashboard di Supabase seguendo questo ordine strutturale (tutto racchiuso e ordinato correttamente nel file della migrazione):
1.  Arricchimento della tabella centrale `profiles` (per evitare violazioni di vincoli sulle foreign key).
2.  Creazione della tabella `worker_profiles` e arricchimento di `restaurant_profiles`.
3.  Creazione delle tabelle relazionali e di log (`shifts`, `notifications`, `reviews`, `credit_transactions`, `subscriptions`).
4.  Arricchimento della tabella `messages` con le FK agganciate alle tabelle create.
5.  Creazione degli indici query per l'ottimizzazione del piano di esecuzione di PostgreSQL.

---

## 5. Query di Verifica Post-Migration

Al termine del lancio del file SQL, eseguire queste query diagnostiche all'interno del SQL Editor di Supabase per verificare il successo dell'allineamento:

### A. Verifica Esistenza delle Tabelle Alleviate
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'worker_profiles', 'restaurant_profiles', 'shifts', 'messages', 'notifications', 'reviews', 'credit_transactions', 'subscriptions');
```
*Risultato atteso*: Tutte e 9 le tabelle devono figurare nell'elenco.

### B. Verifica delle Nuove Colonne in `profiles`
```sql
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('profile_completed', 'phone_verified', 'plan');
```
*Risultato atteso*: `profile_completed` (boolean, false), `phone_verified` (boolean, false), `plan` (text, 'free').

### C. Verifica delle Nuove Colonne in `restaurant_profiles`
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'restaurant_profiles' 
  AND column_name IN ('company_name', 'vat_number', 'phone', 'address', 'description', 'logo_url');
```
*Risultato atteso*: 6 righe corrispondenti alle nuove colonne aggiunte.

### D. Verifica delle Nuove Colonne in `messages`
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'messages' 
  AND column_name IN ('application_id', 'body', 'read_at');
```
*Risultato atteso*: 3 righe corrispondenti alle nuove colonne aggiunte.
