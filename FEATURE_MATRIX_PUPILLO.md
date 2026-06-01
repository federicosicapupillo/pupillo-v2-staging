# FEATURE_MATRIX_PUPILLO.md - Matrice delle Funzionalità

Questo documento presenta un confronto analitico e tabellare tra le funzionalità del vecchio Pupillo (Lovable Backup) e quelle del nuovo progetto di Staging (V2), identificando il livello di copertura attuale, le criticità e le azioni correttive consigliate per ciascun modulo.

---

## Matrice Comparativa delle Funzionalità

| Funzionalità / Modulo | Vecchio Pupillo (Legacy) | Nuovo Pupillo (Staging) | Stato Attuale nel Codice V2 | Livello di Criticità | Priorità | Azione Consigliata |
| :--- | :---: | :---: | :--- | :---: | :---: | :--- |
| **Autenticazione & Ruoli** | Sì | Sì | Funzionante su `/login` e `/register`. Manca tabella `user_roles`. | **Media** | Alta | Creare tabella `user_roles` nel database per mappare i privilegi ed evitare errori al login. |
| **Onboarding Lavoratore** | Sì | Sì | Presente a step in `/onboarding`. Tenta di salvare dati su colonne inesistenti di `profiles`. | **Alta** | Alta | Modificare il payload dell'onboarding Next.js per scrivere i dati professionali solo su `worker_profiles`. |
| **Onboarding Ristoratore** | Sì | Sì | Presente in `/onboarding`. Tenta di scrivere dati aziendali in `profiles`. | **Alta** | Alta | Modificare il payload dell'onboarding Next.js per scrivere i dati aziendali solo su `restaurant_profiles`. |
| **Verifica OTP Cellulare** | Sì | Sì (Demo) | Simulata client-side (accetta sempre il codice `1234`). | **Bassa** | Media | Mantenere la modalità Demo (`1234`) per lo Staging/QA, ma pianificare l'integrazione di Twilio o Supabase SMS per la produzione. |
| **Upload Documenti & IBA** | Sì | Parziale | Interfaccia presente, ma il caricamento effettivo su Storage Supabase non è cablato. | **Media** | Alta | Configurare i bucket privati `avatars` e `worker-documents` su Supabase Staging e collegare le API di upload. |
| **Bacheca Annunci (`browse`)** | Sì | Sì | Funzionante su `/browse` con filtri. Legge correttamente dalla tabella `jobs`. | **Nessuna** | Alta | Ottimo stato. Mantenere l'implementazione attuale. |
| **Mappa Geolocalizzata** | Sì | Sì | Integrazione Leaflet su `/mappa` funzionante per geo-referenziare i turni aperti. | **Bassa** | Media | Ottimizzare il caricamento SSR di Next.js per evitare flash o ritardi di rendering della mappa. |
| **Candidature ai Turni** | Sì | Sì | I lavoratori possono candidarsi. Lo stato viene salvato in `applications`. | **Nessuna** | Alta | Funzionalità solida. Mantenere l'implementazione attuale. |
| **Accettazione Candidato** | Sì | Sì (Client) | Gestita manualmente tramite tripla chiamata client-side in JS (senza integrità transazionale). | **Alta** | Alta | Migrare la logica di accettazione, auto-rifiuto e matching a trigger nativi di database (`PL/pgSQL`). |
| **Turni Programmati (`shifts`)** | Sì | No | Totalmente assente. Manca la tabella `shifts` e la dashboard per monitorare i turni confermati. | **Bloccante** | Alta | Aggiungere la tabella `shifts` al DDL ed implementare la creazione automatica ad accettazione avvenuta. |
| **Chat pre-match** | Sì | Sì (Parziale) | Interfaccia in `/messages` e `/messages/[id]`. Query falliscono a causa della tabella `messages` mancante. | **Bloccante** | Alta | Creare la tabella `messages` nel database ed applicare le policy RLS per consentire la lettura solo ai partecipanti. |
| **Notifiche In-App** | Sì | Sì (Parziale) | Interfaccia in `/notifications`. Query falliscono a causa della tabella `notifications` mancante. | **Bloccante** | Media | Creare la tabella `notifications` nel database e configurare i trigger di notifica automatici. |
| **Billing & Crediti** | Sì | No | Pagina `/billing` presente ma in crash costante a causa della tabella `credit_transactions` mancante. | **Bloccante** | Alta | Creare la tabella `credit_transactions`, aggiungere `credits` e `plan` a `profiles` ed integrare Stripe Sandbox. |
| **Codici Sconto & Promo** | Sì | No | Totalmente assenti. Tabelle `discount_codes` e redemptions mancano dal DDL. | **Bassa** | Bassa | Integrare in una fase successiva (Fase 6) recuperando le tabelle ed i trigger promozionali legacy. |
| **Sistema Recensioni** | Sì | No | Totalmente assente. Manca tabella `reviews` e visualizzazione dei feedback ricevuti. | **Alta** | Alta | Creare tabella `reviews` a 5 dimensioni ed implementare il trigger SQL per il calcolo automatico della reputazione. |
| **Gestione Incidenti (No-Show)** | Sì | No | Assente. Manca tabella `worker_incidents` e la logica di sanzione reputazionale. | **Media** | Media | Creare tabella `worker_incidents` ed associare la sanzione automatica per mancata presentazione al turno. |
| **Pannello Amministratore** | Sì | Sì (Parziale) | Presente in `/admin`, ma le query su `profiles` e `user_roles` falliscono o sono parziali. | **Alta** | Media | Allineare le query del pannello `/admin` alla struttura splittata ed alle tabelle mancanti. |
