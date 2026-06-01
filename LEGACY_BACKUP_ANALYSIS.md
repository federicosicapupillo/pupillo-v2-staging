# Analisi del Backup Legacy vs Progetto Pupillo V2 Staging

Questo documento fornisce un'analisi tecnica e strutturale approfondita confrontando il **backup completo del vecchio Pupillo (Lovable Cloud)**, situato in `legacy_reference/`, con il **progetto di Staging attuale (V2)**, inclusi la cartella `frontend/`, il DDL `directives/database_schema.sql` e le specifiche `directives/SPEC_DEV.md`.

---

## 1. Stato Attuale & Regole Già Presenti nel Progetto

Il progetto V2 ha già implementato e allineato diverse buone pratiche e logiche derivanti dall'esperienza del vecchio Pupillo:
* **Tema Dark Consistente**: L'uso globale del tema profondo basato su `bg-slate-950` con accenti Teal ed Emerald è pienamente adottato sia a livello di codice frontend che di specifiche.
* **Separazione dei Ruoli**: La differenziazione dei flussi tra `worker` (lavoratore) e `restaurant` (ristoratore) è integrata ed orchestrata tramite l'onboarding `/onboarding` e le rispettive dashboard `/dashboard/worker` e `/dashboard/restaurant`.
* **Onboarding a Fasi**: La logica a step per l'onboarding (dati personali, verifica OTP simulata su cellulare con codice demo `1234`, e dichiarazione delle competenze) è riprodotta nella pagina frontend `/onboarding`.
* **Middlewares e RLS**: È presente un'impostazione iniziale per la Row Level Security (RLS) e politiche di base per la protezione delle tabelle.

---

## 2. Incoerenze Strutturali & Possibili Conflitti (CRITICAL)

Dall'analisi incrociata del database DDL, delle specifiche e dei sorgenti dell'applicazione, sono emerse alcune discrepanze fondamentali che potrebbero causare anomalie operative o crash in Staging:

### A. La Discrepanza dei Profili: Combined vs Split
* **Vecchio Progetto & SPEC_DEV.md**: Il vecchio database (`schema_public.sql`) adotta una tabella `profiles` **unificata (Combined)** contenente oltre 100 colonne, unendo dati anagrafici dei lavoratori, tariffe orarie, reputazioni, dettagli aziendali dei ristoranti, dati di fatturazione e stato di caricamento documenti. Questa è la stessa struttura descritta nel capitolo 4 di `SPEC_DEV.md`.
* **Progetto Attuale (Frontend & database_schema.sql)**: Il database attuale adotta una struttura **splittata (Split)** basata su tre tabelle collegate in relazione 1:1:
  * `public.profiles` (contiene solo `id`, `email`, `role`, `created_at`, `updated_at`).
  * `public.worker_profiles` (dati anagrafici e professionali del lavoratore).
  * `public.restaurant_profiles` (dati del locale e del ristoratore).
* **Conflitto**: Chi legge le specifiche (`SPEC_DEV.md`) si aspetta una tabella unica, mentre il codice e il DDL reale usano le tabelle splittate. Inoltre, l'onboarding attuale (`frontend/app/onboarding/page.tsx`) tenta di scrivere **sia** sulla tabella unificata `profiles` (aggiornando campi come `vat_number`, `experience_years`, `hourly_rate` che in realtà non esistono nel DDL attuale di `profiles`!), **sia** sulle tabelle splittate `worker_profiles` e `restaurant_profiles`. 
> [!WARNING]
> Questo doppio salvataggio genera errori silenti nel frontend durante il salvataggio in modalità non-demo se le colonne non sono presenti nella tabella `profiles` reale.

### B. La Tabella `shifts` (Turni Confermati) è Mancante nel DDL
* **Vecchio Progetto & SPEC_DEV.md**: La tabella `public.shifts` è considerata la colonna portante della logica post-match. Serve a tracciare la pianificazione, lo svolgimento effettivo, le ore totali lavorate, il pagamento finale, e lo stato del turno (`scheduled`, `completed`, `no_show`, `cancelled`).
* **Progetto Attuale (database_schema.sql)**: La tabella `shifts` **non esiste** nel database di Staging corrente.
* **Conflitto**: Il frontend attuale gestisce la candidatura e il match aggiornando semplicemente lo stato della candidatura in `applications` e lo stato del turno a `matched` in `jobs`. Questo rende impossibile storicizzare i turni passati separatamente dagli annunci originali o gestire più persone sullo stesso annuncio.

### C. Crash Potenziale nella Pagina di Billing (Crediti)
* **Progetto Attuale (Frontend)**: La pagina `/billing` (`frontend/app/billing/page.tsx`) esegue una query esplorativa sulla tabella `credit_transactions` per verificare il saldo crediti e lo storico delle transazioni.
* **Progetto Attuale (DDL)**: La tabella `credit_transactions` **non è presente** nel DDL di Staging (`database_schema.sql`).
> [!CAUTION]
> L'apertura della pagina `/billing` in ambiente collegato a Supabase causerà un crash immediato (errore 404 Table Not Found di PostgREST) impedendo la consultazione dei crediti e dei piani tariffari.

---

## 3. Logiche & Funzionalità Mancanti (da Recuperare)

Il vecchio progetto gestiva la complessità e l'integrità del business direttamente nel database tramite **trigger SQL e funzioni PL/pgSQL dedicati**. L'attuale progetto di Staging tenta di replicare alcune di queste logiche interamente via codice Javascript (lato client), il che compromette l'integrità del database. 

Le seguenti automazioni critiche devono essere recuperate e integrate nel DDL:

1. **Auto-Creazione Turno ad Accettazione (`trg_create_shift_on_accept`)**:
   * *Logica Legacy*: Appena il ristoratore aggiorna lo stato di una candidatura in `applications` a `'accepted'`, un trigger SQL crea in automatico la riga corrispondente in `shifts` inserendo data, ore e importo.
   * *Logica Attuale*: Assente. Non viene creato alcun record storico del turno.
2. **Auto-Rifiuto Candidati Concorrenti (`trg_reject_other_apps`)**:
   * *Logica Legacy*: Quando un candidato viene accettato per un annuncio, il database rifiuta automaticamente tutte le altre candidature pendenti per lo stesso annuncio, aggiornando anche lo stato dell'annuncio a `'assigned'`.
   * *Logica Attuale*: Gestita interamente lato client tramite chiamate multiple in `restaurant/page.tsx` (chiamata 1 per accettare, chiamata 2 per aggiornare il job, chiamata 3 per rifiutare gli altri). Se l'utente chiude la pagina o la connessione si interrompe a metà, il database rimane incoerente.
3. **Calcolo Automatico Reputazione & Affidabilità**:
   * *Logica Legacy*: I trigger `recompute_reputation_on_review` e `recompute_reputation_on_shift` ricalcolano ad ogni recensione o mancata presentazione (`no_show`) la media ponderata del lavoratore (`rating_avg`), la percentuale di affidabilità (`reliability_pct`), il tasso di completamento dei turni (`completion_pct`), aggiornando automaticamente la scheda del lavoratore.
   * *Logica Attuale*: Mancante. Le medie rimangono statiche o devono essere ricalcolate manualmente.
4. **Verifica OTP Reale & Protezione Telefono (`profiles_enforce_phone_immutable`)**:
   * *Logica Legacy*: Una volta verificato il telefono tramite il flusso OTP di Supabase (`phone_verifications`), il numero di telefono viene reso immutabile per motivi di sicurezza antiraggiro.
   * *Logica Attuale*: Simulata interamente lato client senza alcuna restrizione o autenticazione SMS reale.
5. **Incidenti & Sanzioni (`worker_incidents`)**:
   * *Logica Legacy*: Tabella e flussi dedicati a tracciare no-show o abbandono del posto di lavoro, che attivavano sanzioni e penalità sulla reputazione o la sospensione dell'account.
   * *Logica Attuale*: Assente.

---

## 4. Elenco File Sensibili da NON committare (Security Audit)

Il backup legacy contiene dati personali reali estratti dall'applicazione di produzione Lovable Cloud. È estremamente critico assicurarsi che questi file **rimangano sempre all'interno della cartella `legacy_reference/` (protetta dal nostro `.gitignore`) e non vengano mai committati su GitHub**.

| File / Percorso | Tipo di Rischio | Contenuto Sensibile da Proteggere |
| :--- | :--- | :--- |
| `legacy_reference/pupillo-backup-data-2026-05-18/auth_users.json` | **Molto Alto (GDPR)** | Contiene le credenziali, gli ID reali, i numeri di telefono e le email personali di **703 utenti reali** di Pupillo. |
| `legacy_reference/pupillo-backup-data-2026-05-18/data_public.sql` | **Molto Alto (GDPR)** | Contiene il dump completo di tutti i dati inseriti dagli utenti nel database: bio, indirizzi di casa, IBAN dei lavoratori, dettagli aziendali completi, storico delle chat private, messaggi e recensioni reali. |
| `legacy_reference/my-pupillo-app-main 2/.env` | **Alto** | Contiene le chiavi d'ambiente di sviluppo e le stringhe di connessione del vecchio progetto Supabase. |
| `legacy_reference/my-pupillo-app-main 2/.env.development` | **Alto** | Contiene configurazioni sensibili e credenziali temporanee di sviluppo. |
| `frontend/.env.local` | **Alto** | Contiene l'URL e l'Anon Key reale del nostro database di staging ufficiale. |

---

## 5. Suggerimenti per la Roadmap di Allineamento

1. **Riconciliazione Profilo (Split Schema)**:
   * Aggiornare `SPEC_DEV.md` per chiarire che la struttura split (`profiles`, `worker_profiles`, `restaurant_profiles`) è lo standard di sviluppo ufficiale V2.
   * Rimuovere i campi ridondanti dal payload di update su `profiles` in `frontend/app/onboarding/page.tsx` (linee 137-164) affinché scriva solo i dati comuni su `profiles` e deleghi i dati specifici rispettivamente a `worker_profiles` e `restaurant_profiles`.
2. **Ripristino Tabelle Mancanti**:
   * Aggiungere la definizione di `public.shifts` e `public.credit_transactions` nel DDL `directives/database_schema.sql` per sbloccare le funzionalità di billing e match turni.
3. **Migrazione dei Trigger di Integrità**:
   * Spostare la logica di accettazione del candidato, rifiuto di massa dei concorrenti e creazione automatica del turno dal codice client-side Javascript del frontend a trigger nativi PostgreSQL (PL/pgSQL) sicuri e atomici.
