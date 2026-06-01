# CODE_HEALTH_AUDIT.md - Audit dello Stato del Codice

Questo documento analizza lo stato di salute, l'integrità e la robustezza del codice sorgente di **Pupillo V2** (Frontend Next.js), individuando bug latenti, vulnerabilità, query a rischio e componenti fragili che necessitano di ottimizzazioni strutturali.

---

## 1. Analisi delle Pagine Frontend

### A. Pagine Pienamente Funzionanti (o quasi)
*   **Landing Page (`/app/page.tsx`)**: Ottimamente strutturata, presenta la proposta di valore del brand ed integra un selettore di ruoli fluido ed accattivante.
*   **Registrazione (`/app/register/page.tsx`)**: Un modulo solido che permette la creazione dell'account Supabase Auth e memorizza la scelta del ruolo iniziale.
*   **Bacheca Annunci (`/app/browse/page.tsx`)**: Ben strutturata, carica e filtra correttamente i turni attivi leggendo dalla tabella `jobs`.

### B. Pagine Incomplete o ad Alto Rischio di Rottura
*   **Onboarding (`/app/onboarding/page.tsx`)** (CRITICAL):
    *   *Problema*: Tenta di fare un update gigante su `profiles` includendo campi come `vat_number`, `experience_years`, `hourly_rate` e `bio` (Linee 137-164). Tuttavia, nella struttura reale split del database, questi campi vivono esclusivamente in `restaurant_profiles` o `worker_profiles`.
    *   *Impatto*: La query su `profiles` fallirà silenziosamente o restituirà errore da Supabase a causa di colonne inesistenti, bloccando l'onboarding.
*   **Dashboard Ristoratore (`/app/dashboard/restaurant/page.tsx`)**:
    *   *Problema*: La logica di accettazione del candidato (`handleUpdateAppStatus`) esegue manualmente tre query client-side successive per accettare la candidatura, contrassegnare il job come matched e rifiutare gli altri. Manca la creazione di qualsiasi record storico in `shifts`.
    *   *Impatto*: Rischio di incoerenza transazionale se l'utente perde la connessione a metà esecuzione.
*   **Messaggi & Chat (`/app/messages/page.tsx` & `/app/messages/[id]/page.tsx`)** (BROKEN):
    *   *Problema*: Le pagine provano ad interrogare ed inserire righe nella tabella `messages`. 
    *   *Impatto*: Crash immediato a causa della totale assenza della tabella `messages` nel DDL di Staging.
*   **Notifiche (`/app/notifications/page.tsx`)** (BROKEN):
    *   *Problema*: Interroga la tabella `notifications` per visualizzare gli avvisi.
    *   *Impatto*: Crash immediato all'apertura a causa dell'assenza della tabella `notifications`.
*   **Billing (`/app/billing/page.tsx`)** (BROKEN):
    *   *Problema*: Esegue una query di verifica preliminare su `credit_transactions` (Linea 60).
    *   *Impatto*: Crash immediato a causa dell'assenza della tabella `credit_transactions`.

---

## 2. Query Rischiose e Chiamate a Tabelle Assenti

Le query riportate di seguito falliranno sistematicamente all'avvio in ambiente collegato a Supabase per via delle discrepanze strutturali:

1.  **Tabella `messages` inesistente**:
    *   `supabase.from('messages').select(...)` in `/app/messages/[id]/page.tsx` (Linea 62).
    *   `supabase.from('messages').insert(...)` in `/app/messages/[id]/page.tsx` (Linea 150).
2.  **Tabella `notifications` inesistente**:
    *   `supabase.from('notifications').select(...)` in `/app/notifications/page.tsx` (Linea 88).
3.  **Tabella `credit_transactions` inesistente**:
    *   `supabase.from('credit_transactions').select(...)` in `/app/billing/page.tsx` (Linea 60).
4.  **Tabella `user_roles` inesistente**:
    *   `supabase.from('user_roles').select(...)` in `/app/onboarding/page.tsx` (Linea 72) e `/app/login/page.tsx` (Linea 38).

---

## 3. Punti Deboli della Sicurezza e Protezione Ruoli

*   **Verifiche Client-Side Aggirabili**:
    *   Il controllo e il routing tra la dashboard del ristoratore (`/dashboard/restaurant`) e quella del lavoratore (`/dashboard/worker`) dipendono principalmente da redirezioni in Javascript effettuate nel componente client-side via `useEffect` (dopo aver letto il ruolo dell'utente).
    *   Un utente malintenzionato potrebbe bloccare l'esecuzione di JavaScript nel browser o modificare lo stato locale per accedere visivamente a parti delle dashboard riservate all'altro ruolo (sebbene l'accesso ai dati reali rimanga protetto dalle policy RLS su Supabase).
*   **Mancanza di Middleware di Protezione per App Router**:
    *   Il file `frontend/middleware.ts` si occupa solo di aggiornare la sessione Supabase (necessario per SSR), ma non esegue controlli attivi basati sui ruoli per interdire l'accesso a livello server alle rotte protette (ad esempio, bloccando un lavoratore dal caricare le pagine `/admin` o `/dashboard/restaurant`).

---

## 4. Mancanza di Gestione Errori e Spinner di Caricamento

*   **Pagine di visualizzazione diretta (es. `/announcements/[id]`, `/browse`)**:
    *   Se Supabase è offline o restituisce un errore di rete, l'applicazione mostra schermate vuote o messaggi di errore generici, senza opzioni di retry o fallback chiari.
*   **Gestione Onboarding e Caricamento Media**:
    *   Il caricamento dei documenti e delle foto profilo in `/onboarding` manca di indicatori visivi di caricamento percentuale (progress bar). L'utente vede solo un pulsante statico e non ha feedback visivo sull'avanzamento dell'upload dei file pesanti.

---

## 5. Codice Fragile e Duplicazioni

*   **Duplicazione della Logica di Rilevamento Ruolo**:
    *   Il codice che determina il ruolo dell'utente loggato (`user_id` $\to$ `user_roles` $\to$ `profiles`) è duplicato e implementato ad hoc in quasi tutte le pagine principali: `/app/login/page.tsx`, `/app/onboarding/page.tsx`, `/app/forbidden/page.tsx`, `/app/account-error/page.tsx`.
    *   *Miglioramento*: Creare un hook React riutilizzabile (es. `useUserRole`) o inserire il ruolo direttamente nel contesto dell'applicazione per evitare letture ridondanti sul database.
