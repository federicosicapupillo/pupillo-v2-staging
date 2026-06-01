# PROJECT_RULES_PUPILLO.md - Regole Globali del Progetto Pupillo

Questo documento definisce le regole globali, i ruoli utente, la logica di business, le politiche di sicurezza e le linee guida architetturali per **Pupillo V2**. La piattaforma è dedicata a connettere Ristoratori e Lavoratori Extra per la copertura immediata e meritocratica di turni a chiamata nel settore HoReCa.

---

## 1. Ruoli Utente & Privilegi

Pupillo prevede tre macro-ruoli, ciascuno con permessi e finalità distinte nel sistema:

### A. Lavoratore Extra (`worker`)
* **Profilo**: Camerieri, bartender, cuochi, lavapiatti, runner e baristi.
* **Caratteristiche di Business**:
  * Autonomia nel decidere le proprie tariffe (orarie o flat), disponibilità orarie e geografiche.
  * Accumula reputazione certificata e badge di competenza/affidabilità (**Basic**, **Pro**, **Elite**).
  * Riceve notifiche in tempo reale per nuovi turni compatibili con il suo profilo.
  * Può candidarsi ad annunci pubblicati dai ristoratori.

### B. Ristoratore / Gestore (`restaurant`)
* **Profilo**: Proprietari o direttori di bistrot, cocktail bar, pub, ristoranti, hotel e servizi di catering.
* **Caratteristiche di Business**:
  * Risolve problemi legati a no-show e assenze improvvise di personale a chiamata.
  * Acquista crediti o sottoscrive abbonamenti (gestione Stripe) per pubblicare turni o sbloccare candidati.
  * Può valutare i candidati che si propongono e decidere chi contrattare.
  * Inserisce annunci di lavoro specificando mansione, tariffa, orario, note e dress code.

### C. Amministratore (`admin`)
* **Profilo**: Operatori del supporto clienti di Pupillo.
* **Caratteristiche di Controllo**:
  * Verifica e approvazione manuale dei documenti di identità inseriti dai lavoratori.
  * Gestione e arbitraggio in caso di controversie o segnalazioni di "no-show" (mancata presentazione al turno).
  * Erogazione di rimborsi, sanzioni reputazionali e gestione crediti.

---

## 2. Funnel di Registrazione & Onboarding

Il flusso di onboarding è un passaggio critico per garantire la conformità e la sicurezza della piattaforma:

1. **Registrazione iniziale (`/register`)**:
   * L'utente inserisce email, password e seleziona il proprio ruolo (`worker` o `restaurant`).
   * Viene invocato il metodo `signUp()` di Supabase Auth passando il ruolo nei metadati.
   * Il trigger SQL `on_auth_user_created` rileva l'inserimento in `auth.users` e sincronizza automaticamente i record di base in `public.profiles`.
2. **Onboarding guidato (`/onboarding`)**:
   * L'utente viene reindirizzato alla pagina di onboarding e non può accedere alle dashboard finché non completa il flusso (`completed = false`).
   * **Dati base**: Inserimento di nome, cognome, indirizzo e numero di cellulare.
   * **Verifica OTP**: Invio e verifica di un codice OTP a 4 cifre per validare il numero di cellulare.
   * **Dati Finanziari & Documenti**: Upload dell'IBAN e dei documenti di identità in un bucket sicuro (Storage privato Supabase).
3. **Completamento**:
   * Una volta inseriti i dati richiesti, lo stato del profilo viene aggiornato a `completed = true`, sbloccando l'accesso completo alla Dashboard di riferimento.

---

## 3. Regole di Privacy & Gestione Contatti

* **Visibilità dei Dati Sensibili**:
  * I dati di contatto personali (numero di telefono, cognome e dettagli specifici) sono **nascosti** di default durante la fase di consultazione.
  * Ristoratori e lavoratori possono scambiarsi chiarimenti preliminari tramite la chat interna senza condividere recapiti personali.
* **Sblocco dei Contatti**:
  * I contatti telefonici vengono sbloccati ed evidenziati nella UI **esclusivamente quando il Ristoratore accetta la candidatura del Lavoratore** per uno specifico turno (Stato Match = `accepted`).
  * Questo previene bypass commerciali della piattaforma e protegge la privacy degli utenti.

---

## 4. Regole di Notifica & Comunicazione

* **Notifiche in Tempo Reale**:
  * Il sistema invia notifiche istantanee (tramite Supabase Broadcast / Realtime o canali dedicati) quando:
    * Un nuovo turno viene pubblicato ed è compatibile con le competenze di un lavoratore.
    * Un lavoratore invia una candidatura per un turno.
    * Una candidatura viene accettata o rifiutata dal ristoratore.
    * Viene ricevuto un messaggio in chat.
* **Reattività**:
  * La UI deve segnalare visivamente nuovi messaggi o aggiornamenti di stato in tempo reale con badge rossi e micro-animazioni.

---

## 5. Regole della Chat Interna

* **Chat Pre-Match**:
  * Attiva subito dopo che un lavoratore invia una candidatura. Consente al ristoratore e al candidato di accordarsi su mansioni, orari o dettagli organizzativi specifici.
* **Conservazione e Sicurezza**:
  * Tutti i messaggi passano attraverso policy RLS severe: un utente può leggere o inviare messaggi solo se fa parte di quella specifica conversazione o candidatura.

---

## 6. Regole per Annunci & Turni (`jobs` / `announcements`)

* **Inserimento Annuncio**:
  * La creazione di un annuncio consuma **1 Credito** dal portafoglio del Ristoratore (controllato da trigger/check a livello database).
  * L'annuncio deve specificare obbligatoriamente: data del servizio, orari di inizio e fine, tariffa (oraria o flat), indirizzo e requisiti di base.
* **Stati dell'Annuncio**:
  * `open` / `active`: Turno visibile e aperto a candidature.
  * `matched` / `assigned`: Candidato selezionato e abbinato.
  * `completed`: Turno svolto con successo.
  * `cancelled`: Turno annullato (soggetto a politiche di rimborso crediti o penali).
* **Stati del Turno Reale (`public.shifts`)**:
  * `scheduled`: Match avvenuto, turno pianificato.
  * `completed`: Servizio concluso con successo.
  * `no_show`: Il lavoratore non si è presentato (impatta pesantemente sulla reputazione).
  * `cancelled`: Turno cancellato.

---

## 7. Reputazione, Recensioni & Affidabilità

* **Reputazione del Lavoratore**:
  * La reputazione è determinata da:
    * `rating_avg`: Media delle recensioni ricevute dai ristoratori (da 1.00 a 5.00, default 5.00).
    * `reviews_count`: Numero totale di recensioni ricevute.
    * `completed_shifts`: Conteggio dei turni portati a termine con successo.
    * `reliability_pct`: Percentuale di affidabilità, calcolata come:
      $$\text{reliability\_pct} = \left( 1 - \frac{\text{no\_shows}}{\text{completed\_shifts} + \text{no\_shows}} \right) \times 100$$
* **Impatto del No-Show**:
  * La mancata presentazione ad un turno programmato senza valido preavviso azzera la reputazione e può portare alla sospensione dell'account (`suspended`).

---

## 8. Regole dell'Ambiente Supabase Staging

* **Configurazione e Raggiungibilità**:
  * L'unico database di staging abilitato e ufficiale risponde al dominio:
    `https://fbstuzqkdnysojjpxmej.supabase.co`
  * Tutte le chiamate API di autenticazione e interrogazione dati devono puntare a questo endpoint.
* **Bacheca Credenziali Staging Ufficiali**:
  * URL: `https://fbstuzqkdnysojjpxmej.supabase.co`
  * Anon Key: `sb_publishable_svakWwlCfm9oc1J1D-xdyg_IiFEj-U_`

---

## 9. Linee Guida per lo Sviluppo & Sicurezza (CRITICAL)

> [!CAUTION]
> ### Divieto di usare `service_role` nel Frontend
> Non includere MAI la chiave `service_role` o qualsiasi credenziale con privilegi amministrativi all'interno del codice frontend (React/Next.js) o in variabili d'ambiente caricate dal client. L'uso di chiavi amministrative nel browser espone l'intero database ad accessi non autorizzati e bypassa tutte le policy RLS. Utilizzare esclusivamente la chiave pubblica `anon`.

> [!WARNING]
> ### Divieto Assoluto di Committare `.env.local`
> Il file `.env.local` contenente le chiavi di sviluppo e le credenziali reali locali **NON deve mai essere inserito nei commit Git** o caricato su repository pubblici/privati. Tutte le credenziali sensibili devono essere gestite localmente o tramite segreti d'ambiente configurati sulle piattaforme di hosting in fase di esecuzione.

* **Allineamento Ambientale**:
  * Utilizzare sempre `.env.example` popolato con soli placeholder per documentare le variabili d'ambiente necessarie all'applicazione.
