# CODEBASE_AUDIT.md - Audit Tecnico Completo (Pupillo V2)

Questo documento presenta l'audit tecnico della codebase originale di **Pupillo** individuata all'interno del backup (`my-pupillo-app-main 2`) ed analizzata sotto la direzione dell'agente **Code & Database Analyst**. L'obiettivo è tracciare lo stato attuale, i debiti tecnici e le raccomandazioni per lo sviluppo di V2.

---

## 1. Panoramica del Progetto

Pupillo è un'applicazione web full-stack moderna costruita su un'architettura **Serverless / SSR** ad alte prestazioni:
* **Core Framework**: **React 19.2.0** e **TanStack Start** (sotto-progetto nativo di TanStack che unisce React Router a Vite per supportare Server-Side Rendering ed idratazione idonea).
* **Styling**: **Tailwind CSS v4.2.1** compilato nativamente via CSS tramite `@tailwindcss/vite` (garantisce zero tempi di overhead e nessun file di configurazione pesante).
* **Database & Auth**: **Supabase (PostgreSQL)** gestito via client SDK, sfruttando Row Level Security (RLS) e trigger SQL per l'automazione dei ruoli e delle validazioni.
* **Integrazioni Esterne**: **Stripe SDK** (per pagamenti e abbonamenti) e **Leaflet** (mappatura geografica interattiva dei turni).

---

## 2. Struttura del Frontend

Il frontend adotta la struttura a rotte file-based tipica di **TanStack Router**:
* **Entrypoint & Configurazione**:
  * `src/router.tsx`: Inizializzazione del router type-safe globale.
  * `src/routeTree.gen.ts`: Albero delle rotte generato automaticamente a compile-time da Vite.
  * `src/__root.tsx`: Definisce il layout principale e i providers (QueryClient, Auth, Stripe).
* **Pagine Chiave (`src/routes/`)**:
  * `index.tsx`: Landing page interattiva con bacheca dimostrativa.
  * `auth.tsx`: Form unificato di login e registrazione.
  * `onboarding.tsx` (86KB!): Flusso gigante multi-step per lavoratori e ristoranti.
  * `announcements.new.tsx` (35KB): Form di pubblicazione turni con parametri avanzati (dress-code, requisiti tatuaggi/barba).
  * `messages.$id.tsx` (78KB!): Componente chat in tempo reale basato su Supabase Realtime.
  * `mappa.tsx` (41KB): Bacheca mappa geografica basata su Leaflet.
  * `billing.tsx`: Integrazione Stripe billing portal e contatore crediti.

---

## 3. Struttura del Backend

Il progetto originario adotta un approccio **Serverless / Database-First**:
* Non esiste un backend API custom centralizzato (es. in Node.js o Python). La logica di business è delegata interamente a:
  * **Supabase Client SDK** (interrogazioni dirette dal frontend).
  * **PostgreSQL Functions & Triggers** (validazioni dati di sicurezza, calcoli crediti, e relazioni transazionali eseguiti direttamente sul motore DB).
* **Stripe Webhooks & Edge Functions**: Gestiscono la sincronizzazione asincrona dei pagamenti e l'assegnazione dei piani Stripe sulla tabella `profiles`.

---

## 4. Integrazione Supabase

L'integrazione risiede in `src/integrations/supabase/`:
* **Client Centralizzato**: Espone l'istanza `supabase` configurata con variabili d'ambiente (`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
* **Type-Safety**: I tipi delle tabelle, degli ENUM e delle funzioni Postgres sono esportati in file dedicati e consumati da React Query per garantire il completamento automatico delle chiavi e dei campi in TypeScript.

---

## 5. Punti di Forza della Codebase Attuale

1. **Type-Safety Estrema**: Grazie a TanStack Router e Zod, ogni transizione di pagina, parametro query nell'URL ed input dei form è validato a compile-time e runtime.
2. **Prestazioni Elevate (Tailwind V4 + SSR)**: Il caricamento iniziale è fulmineo grazie alla pre-compilazione lato server (SSR) e al foglio di stile CSS ultra-leggero.
3. **Database-First & Realtime**: L'uso di Supabase Realtime per i messaggi ed i trigger PostgreSQL velocizza lo sviluppo eliminando la necessità di scrivere e manutenere API routes intermedie per le operazioni base CRUD.

---

## 6. Debolezze, Debiti Tecnici & Rischi

1. **Monoliti nel Frontend (Tech Debt Critico)**:
   * File come `onboarding.tsx` (86KB) e `messages.$id.tsx` (78KB) sono monolitici. Mischiano logica di fetch, validazione Zod, caricamento file Storage e render UI in un singolo file. Questo rende il codice quasi impossibile da manutenere o testare in modo isolato.
2. **Logica di Business Accoppiata al Client**:
   * Sotto l'aspetto della sicurezza, molte query sensibili (come l'inserimento in `applications` o la scrittura dei profili) risiedono all'interno dei componenti React. Se le policy RLS sul database presentano una singola falla, l'utente potrebbe bypassare i controlli via API client.
3. **Mancanza di Test Suite Automatizzati**:
   * Non ci sono test di integrazione o unit test robusti per i flussi critici (es. acquisto crediti, no-show incident reporting), esponendo il sistema a bug di regressione ad ogni rilascio.

---

## 7. Raccomandazioni per Pupillo V2

1. **Rifattorizzazione a Componenti Atomici**:
   * Spezzare `onboarding.tsx` in sub-componenti isolati (es. `WorkerStep1.tsx`, `RestaurantStep2.tsx`) coordinati da un manager di stato leggero (React Context o url query state).
2. **Isolamento delle Logiche in Custom Hooks**:
   * Spostare tutte le chiamate Supabase dirette fuori dai componenti visivi ed incapsularle in custom hooks (es. `useOnboardingSubmit`, `useAnnouncementsQuery`) sfruttando TanStack Query.
3. **Blindatura RLS lato Database**:
   * Assicurare che nessuna scrittura su tabelle critiche (`credit_transactions`, `shifts`) avvenga via client Supabase senza il vincolo bloccante di trigger SQL di controllo (`security definer`).
