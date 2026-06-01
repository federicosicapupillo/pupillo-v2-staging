# Pupillo V2 - Ecosistema per il Lavoro Extra HoReCa

Pupillo è la piattaforma leader progettata per connettere gestori di locali ristorativi (**Ristoratori**) con risorse operative a chiamata (**Lavoratori Extra**) per la copertura di turni saltuari in tempo reale in modo meritocratico, trasparente e autonomo.

---

## 📂 Struttura del Repository

Questo repository contiene il backup completo e pulito del progetto:

*   **`frontend/`**: L'applicazione web client-side basata su Next.js, React, Tailwind CSS e Supabase client SDK.
*   **`backend/`**: Servizi ausiliari scritti in Python (FastAPI).
*   **`directives/`**: Le procedure standard operative (SOP), le specifiche tecniche e il modello dati PostgreSQL (DDL).
    *   [database_schema.sql](file:///Users/panigaccio2.0/Desktop/Pupillo_antigravity/directives/database_schema.sql): Script DDL ufficiale per la creazione di tabelle, trigger e policy RLS su Supabase.
    *   [SPEC_DEV.md](file:///Users/panigaccio2.0/Desktop/Pupillo_antigravity/directives/SPEC_DEV.md): Le specifiche di prodotto e sviluppo complete.
    *   [operating-model.md](file:///Users/panigaccio2.0/Desktop/Pupillo_antigravity/directives/operating-model.md): Il modello operativo e le linee guida per gli agenti AI.
*   **`docs/`**: Documentazione aggiuntiva del progetto.
*   **`execution/`**: Script di automazione, script di migrazione deterministici ed esecuzione di utility.
*   **`PROJECT_RULES_PUPILLO.md`**: Riepilogo completo delle regole globali di business, privacy, notifiche e sicurezza.

---

## 🛠️ Tecnologie Principali

1.  **Frontend**: Next.js 14, React, Tailwind CSS, Leaflet (Mappe), Radix UI.
2.  **Backend/Database**: Supabase (PostgreSQL, GoTrue Auth, Realtime, Storage).
3.  **Sicurezza**: Row Level Security (RLS) applicata capillarmente a livello di database.

---

## 📌 Regole Importanti di Sicurezza

*   **Nessuna Chiave Sensibile nel Versionamento**: I file `.env.local` e `.env` contenenti credenziali reali sono esclusi via `.gitignore`.
*   **Placeholder Ambientali**: Utilizzare `.env.example` come schema di riferimento per la configurazione dell'ambiente.
*   **Divieto di chiavi amministrative nel Frontend**: Non usare mai chiavi `service_role` o bypassare le policy RLS dal client.
