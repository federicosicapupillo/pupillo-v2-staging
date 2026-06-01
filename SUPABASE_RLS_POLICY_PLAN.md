# SUPABASE_RLS_POLICY_PLAN.md - Piano delle Politiche di Sicurezza RLS Proposte

Questo documento descrive la pianificazione delle politiche di **Row Level Security (RLS)** per il database di **Supabase Staging** di Pupillo V2. L'obiettivo è garantire una sicurezza di livello enterprise, prevenire i problemi di **ricorsione infinita** riscontrati in precedenza, e tutelare la privacy degli utenti in conformità con il GDPR.

---

## 1. Linee Guida di Sicurezza e Architettura RLS

Per evitare i blocchi di "ricorsione infinita" (Infinite Recursion) — che si verificano quando una policy per la tabella A interroga la tabella B, la quale a sua volta interroga la tabella A per convalidare i ruoli — adottiamo queste regole:
1. **Evitare subquery circolari**: Non usare query nidificate che richiamano tabelle con policy a loro volta dipendenti.
2. **Utilizzare controlli diretti di `auth.uid()`**: Laddove possibile, legare l'accesso direttamente all'ID utente registrato nella sessione di autenticazione (`auth.uid()`).
3. **Delegare il controllo dei ruoli tramite funzioni non ricorsive o metadati JWT**: Se necessario verificare se un utente è un ristoratore o un lavoratore, utilizzare i metadati di autenticazione (`auth.jwt() ->> 'role'`) o tabelle di appoggio statiche con sicurezza definer accurata.

---

## 2. Dettaglio delle Politiche RLS per Tabella

Di seguito viene descritta ciascuna tabella, le autorizzazioni di lettura/scrittura, i rischi di privacy e le relative istruzioni DDL per creare le policy.

---

### A. Tabella `public.profiles`
*   **Chi può leggere**:
    *   L'utente proprietario del profilo.
    *   Gli altri utenti autenticati possono leggere unicamente dati di base non sensibili (es. id, rating_avg, completed_shifts) se esposti pubblicamente.
*   **Chi può scrivere**: Solo l'utente proprietario (`auth.uid() = id`).
*   **Rischi Privacy**: Fuga di email personali e saldo crediti (`credits`).
*   **Policy SQL Proposta**:
    ```sql
    -- Abilita RLS
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

    -- Lettura del proprio profilo completo
    CREATE POLICY "Consentito l'accesso in lettura al proprio profilo"
      ON public.profiles FOR SELECT
      USING (auth.uid() = id);

    -- Modifica del proprio profilo
    CREATE POLICY "Consentito l'aggiornamento del proprio profilo"
      ON public.profiles FOR UPDATE
      USING (auth.uid() = id);
    ```

---

### B. Tabella `public.worker_profiles`
*   **Chi può leggere**: Tutti gli utenti autenticati (in particolare i ristoratori che devono valutare i candidati extra).
*   **Chi può scrivere**: Solo il lavoratore proprietario per la creazione (INSERT) e modifica (UPDATE) del proprio profilo professionale.
*   **Rischi Privacy**: Esposizione dei contatti telefonici (`phone`) prima dell'accettazione del turno. *Nota: Il frontend nasconderà il telefono finché lo stato del turno/candidatura non sarà 'accepted'.*
*   **Policy SQL Proposta**:
    ```sql
    -- Abilita RLS
    ALTER TABLE public.worker_profiles ENABLE ROW LEVEL SECURITY;

    -- Lettura pubblica del profilo professionale da parte di utenti autenticati
    CREATE POLICY "Consentito l'accesso in lettura a tutti gli utenti registrati"
      ON public.worker_profiles FOR SELECT
      TO authenticated
      USING (true);

    -- Inserimento del proprio profilo durante l'onboarding
    CREATE POLICY "Consentito l'inserimento del proprio profilo lavoratore"
      ON public.worker_profiles FOR INSERT
      WITH CHECK (auth.uid() = id);

    -- Aggiornamento del proprio profilo professionale
    CREATE POLICY "Consentito l'aggiornamento del proprio profilo lavoratore"
      ON public.worker_profiles FOR UPDATE
      USING (auth.uid() = id);
    ```

---

### C. Tabella `public.restaurant_profiles`
*   **Chi può leggere**: Tutti gli utenti autenticati (per consentire ai lavoratori extra di vedere i dettagli dei locali per cui si candidano).
*   **Chi può scrivere**: Solo il ristoratore proprietario per la creazione (INSERT) e modifica (UPDATE) del proprio profilo aziendale.
*   **Rischi Privacy**: Dati sensibili aziendali e Partita IVA (`vat_number`).
*   **Policy SQL Proposta**:
    ```sql
    -- Abilita RLS
    ALTER TABLE public.restaurant_profiles ENABLE ROW LEVEL SECURITY;

    -- Lettura dei profili ristorante da parte di utenti autenticati
    CREATE POLICY "Consentito l'accesso in lettura ai ristoranti per utenti registrati"
      ON public.restaurant_profiles FOR SELECT
      TO authenticated
      USING (true);

    -- Inserimento del profilo durante l'onboarding
    CREATE POLICY "Consentito l'inserimento del proprio profilo ristorante"
      ON public.restaurant_profiles FOR INSERT
      WITH CHECK (auth.uid() = id);

    -- Aggiornamento del proprio profilo aziendale
    CREATE POLICY "Consentito l'aggiornamento del proprio profilo ristorante"
      ON public.restaurant_profiles FOR UPDATE
      USING (auth.uid() = id);
    ```

---

### D. Tabella `public.shifts`
*   **Chi può leggere**:
    *   Il lavoratore a cui è stato assegnato il turno (`worker_id = auth.uid()`).
    *   Il ristoratore che ha commissionato il turno (`restaurant_id = auth.uid()`).
*   **Chi può scrivere**:
    *   **INSERT**: Solo il ristoratore o il sistema in automatico all'accettazione della candidatura.
    *   **UPDATE**: Entrambi i partecipanti (es. il lavoratore per fare check-in/out, il ristoratore per confermare o annullare il turno).
*   **Rischi Privacy**: Fuga di dati operativi, compensi economici e indirizzi dei turni.
*   **Policy SQL Proposta**:
    ```sql
    -- Abilita RLS
    ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

    -- I partecipanti possono leggere i propri turni
    CREATE POLICY "Consentita la lettura dei turni ai partecipanti"
      ON public.shifts FOR SELECT
      USING (auth.uid() = worker_id OR auth.uid() = restaurant_id);

    -- Solo il ristoratore associato può inserire un turno manuale o tramite trigger
    CREATE POLICY "Consentito l'inserimento del turno al ristoratore"
      ON public.shifts FOR INSERT
      WITH CHECK (auth.uid() = restaurant_id);

    -- I partecipanti possono aggiornare lo stato del proprio turno
    CREATE POLICY "Consentito l'aggiornamento del turno ai partecipanti"
      ON public.shifts FOR UPDATE
      USING (auth.uid() = worker_id OR auth.uid() = restaurant_id);
    ```

---

### E. Tabella `public.messages`
*   **Chi può leggere**: Il mittente (`sender_id = auth.uid()`) o il destinatario (`receiver_id = auth.uid()`). In alternativa, utenti collegati all'`application_id` per evitare scavalchi.
*   **Chi può scrivere**: Solo l'autore del messaggio (`sender_id = auth.uid()`).
*   **Rischi Privacy**: Intercettazione o lettura non autorizzata di chat private tra ristoratori e lavoratori.
*   **Policy SQL Proposta**:
    ```sql
    -- Abilita RLS
    ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

    -- Lettura consentita solo a mittente e destinatario
    CREATE POLICY "Consentita la lettura dei messaggi ai partecipanti alla chat"
      ON public.messages FOR SELECT
      USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

    -- Invio consentito solo come mittente autenticato
    CREATE POLICY "Consentito l'invio di messaggi se mittente"
      ON public.messages FOR INSERT
      WITH CHECK (auth.uid() = sender_id);
    ```

---

### F. Tabella `public.notifications`
*   **Chi può leggere**: Solo l'utente destinatario della notifica (`user_id = auth.uid()`).
*   **Chi può scrivere**:
    *   **INSERT**: Solo il sistema (tramite `service_role` o funzioni di sistema).
    *   **UPDATE**: L'utente destinatario, esclusivamente per marcare la notifica come letta (`read_at`).
*   **Rischi Privacy**: Lettura di notifiche di sistema private ed eventi di sicurezza.
*   **Policy SQL Proposta**:
    ```sql
    -- Abilita RLS
    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

    -- Lettura delle proprie notifiche
    CREATE POLICY "Consentita la visualizzazione delle proprie notifiche"
      ON public.notifications FOR SELECT
      USING (auth.uid() = user_id);

    -- Marcare come letta la propria notifica
    CREATE POLICY "Consentito l'aggiornamento delle proprie notifiche"
      ON public.notifications FOR UPDATE
      USING (auth.uid() = user_id);
    ```

---

### G. Tabella `public.reviews`
*   **Chi può leggere**: Chiunque sia autenticato (per permettere di vedere il punteggio e il commento di feedback dei profili).
*   **Chi può scrivere**: Solo l'autore effettivo della recensione (`reviewer_id = auth.uid()`).
*   **Rischi Privacy**: Diffamazione o alterazione delle recensioni altrui.
*   **Policy SQL Proposta**:
    ```sql
    -- Abilita RLS
    ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

    -- Lettura dei feedback per utenti autenticati
    CREATE POLICY "Consentita la lettura dei feedback a tutti gli autenticati"
      ON public.reviews FOR SELECT
      TO authenticated
      USING (true);

    -- Creazione del feedback da parte dell'autore del turno
    CREATE POLICY "Consentito l'inserimento del feedback se autore"
      ON public.reviews FOR INSERT
      WITH CHECK (auth.uid() = reviewer_id);
    ```

---

### H. Tabella `public.credit_transactions`
*   **Chi può leggere**: Solo l'utente proprietario della transazione (`user_id = auth.uid()`).
*   **Chi può scrivere**: Nessun utente (SOLO il sistema tramite backend/Stripe webhook). La tabella deve essere in **sola lettura** per gli utenti finali.
*   **Rischi Privacy**: Lettura delle transazioni di credito ed esposizione del saldo finanziario del ristoratore.
*   **Policy SQL Proposta**:
    ```sql
    -- Abilita RLS
    ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

    -- Lettura dello storico crediti personale
    CREATE POLICY "Consentita la lettura del proprio storico crediti"
      ON public.credit_transactions FOR SELECT
      USING (auth.uid() = user_id);
    ```

---

### I. Tabella `public.subscriptions`
*   **Chi può leggere**: Solo l'utente intestatario dell'abbonamento (`user_id = auth.uid()`).
*   **Chi può scrivere**: Nessun utente (SOLO il backend/Stripe webhook tramite chiavi amministrative).
*   **Rischi Privacy**: Leak di stato dell'abbonamento ed estremi di pagamento collegati.
*   **Policy SQL Proposta**:
    ```sql
    -- Abilita RLS
    ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

    -- Lettura del proprio stato di abbonamento
    CREATE POLICY "Consentita la lettura del proprio abbonamento"
      ON public.subscriptions FOR SELECT
      USING (auth.uid() = user_id);
    ```

---

## 3. Strategia di Applicazione Sicura

Per evitare di bloccare il frontend o rompere le funzionalità esistenti in Staging:
1. **Fase di test (Senza RLS rigido)**: Durante la migrazione di allineamento delle tabelle (Fase 2 attuale), RLS non viene forzato con policy attive per non interrompere lo sviluppo dei flussi.
2. **Fase di messa in sicurezza**: Le policy qui descritte verranno inserite in una migrazione dedicata al termine del riallineamento delle tabelle operative, dopo aver verificato che Next.js effettui correttamente le query di base.
