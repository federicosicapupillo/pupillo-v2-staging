# Piano di Integrazione Grafica Globale (Global Brand Skin) — Pupillo V2

Questo documento delinea il piano tecnico per propagare lo stile neobrutalista-cartoon convalidato ed approvato della route `/brand-preview` su tutto il frontend reale dell'applicazione Pupillo.

---

## 🎨 Linee Guida Visive e Componenti Standard

Tutte le interfacce reali adotteranno la stessa grammatica visiva introdotta nella preview:

1. **Sfondo e Root:**
   - Sfondo nero assoluto (`bg-black` o `#000000`) e testo bianco/chiaro (`text-white` o `#ffffff`).
   - Nessun flash bianco o sfondo predefinito non voluto.
2. **Wordmark / Logo Testuale ("PUPILLO"):**
   - Wordmark cartoon testuale in giallo acceso, con bordo bianco e ombra piatta viola saturo in sostituzione di loghi fragili o fuori scala.
3. **Card Neobrutaliste:**
   - Sfondo nero/grigio scuro (`bg-zinc-950`), spessi bordi bianchi (`border-4` o `border-[6px] border-white`) e ombre piatte rigide (`shadow-[4px_4px_0px_#7c3aed]` per viola, `#eab308` per giallo, `#ffffff` per bianco).
   - Angoli molto arrotondati (`rounded-2xl` o `rounded-[32px]`).
4. **Pulsanti Cartoonish:**
   - Bottoni grandi, con testo in maiuscolo extra-bold, bordatura marcata ed effetto "tactile" alla pressione attiva (`active:translate-x-[2px] active:translate-y-[2px]`).
5. **Form & Input:**
   - Campi di testo neri con spessa bordatura scura (`border-4 border-slate-800`) e focus giallo Pupillo.
6. **Badge & Chip:**
   - Piccoli cartelli informativi con bordo bianco e micro-ombra.

---

## 📁 Censimento Pagine e Piano di Conservazione delle Logiche

Per ciascuna delle 17 pagine operative reali del progetto Next.js, viene definita la scheda tecnica di conservazione:

| Percorso Rotta | File Relativo | Presenza Logiche / Supabase / Links / Handlers | Strategia di Conservazione Assoluta (Cosa NON Cambia) |
| :--- | :--- | :--- | :--- |
| **Root Layout** | `frontend/app/layout.tsx` | - Nessuna query o state.<br>- Solo metadata di Next.js. | **SOLO GRAFICA:** Viene mantenuto intatto l'export del layout ed i metadati. Si aggiungono solo le classi globali `bg-black text-white` su `html` e `body` e l'importazione di `globals.css` (se presente, altrimenti si gestisce in-page). |
| **Home `/`** | `frontend/app/page.tsx` | - Query Supabase `jobs`.<br>- Controllo sessione Auth.<br>- Dati di fallback (demo locale).<br>- Link di navigazione e CTA. | **SOLO GRAFICA:** La struttura del rendering viene uniformata alla landing page di `/brand-preview`. I blocchi `try-catch`, le letture dei cookies e del client Supabase rimangono rigorosamente identici e intatti. |
| **Login `/login`** | `frontend/app/login/page.tsx` | - Chiamata `signInWithPassword`.<br>- Risoluzione ruolo utente.<br>- Fallback demo locale.<br>- Stati di caricamento ed errore. | **SOLO GRAFICA:** Ristrutturazione visuale del modulo in una card neobrutalista. L'intero handler `handleLogin`, gli stati `email`/`password`, ed i redirect condizionali rimangono invariati. |
| **Register `/register`** | `frontend/app/register/page.tsx` | - Chiamata `signUp` con metadati.<br>- Selezione ruolo (worker/restaurant).<br>- Fallback demo locale. | **SOLO GRAFICA:** Uniformazione visuale del selettore ruolo e del form. Gli stati `role`, `email`, `password` e l'handler `handleRegister` non vengono modificati. |
| **Onboarding `/onboarding`** | `frontend/app/onboarding/page.tsx` | - Upsert Supabase su `worker_profiles`/`restaurant_profiles`.<br>- Wizard multi-step (worker/restaurant).<br>- Invio/Verifica OTP fittizia. | **SOLO GRAFICA:** Ristrutturazione dei selettori di mansione, campi input e stepper in chiave cartoon-bold. Le logiche dello stepper, le validazioni del cellulare e le chiamate di upsert rimangono intatte. |
| **Bacheca `/browse`** | `frontend/app/browse/page.tsx` | - Query `jobs` con filtro open.<br>- Chiamata candidature `applications`.<br>- Filtri locali (ruolo, tariffa, città).<br>- Dati di fallback demo. | **SOLO GRAFICA:** Riorganizzazione della barra filtri e della griglia dei turni in card neobrutaliste. Il caricamento iniziale `loadJobs`, l'handler `handleApply`, e la logica di filtraggio locale rimangono inalterati. |
| **Mappa `/mappa`** | `frontend/app/mappa/page.tsx` | - Import dinamico di Leaflet `MapComponent`.<br>- Query Supabase `jobs` aperti.<br>- Dati di fallback demo. | **SOLO GRAFICA:** La mappa e il relativo contenitore vengono integrati in un telaio a contrasto neobrutalista. Nessuna logica di importazione o passaggio di props viene modificata. |
| **Dettaglio Annuncio `/announcements/[id]`** | `frontend/app/announcements/[id]/page.tsx` | - Query Supabase dettagli turno.<br>- Inserimento candidatura.<br>- Controllo sblocco contatti telefonici. | **SOLO GRAFICA:** Card dettagli, note del locale, e box di sblocco contatti telefonici uniformati allo stile cartoon-bold. Gli handler di candidatura e le logiche di visualizzazione condizionale rimangono intatti. |
| **Worker Dashboard `/dashboard/worker`** | `frontend/app/dashboard/worker/page.tsx` | - Query Supabase turni candidati/abbinati.<br>- Gestione sessione e crediti residui. | **SOLO GRAFICA:** Liste di turni, sidebar e intestazioni ridisegnate in stile bacheca cartoon. Nessun hook o query Supabase viene toccato. |
| **Restaurant Dashboard `/dashboard/restaurant`** | `frontend/app/dashboard/restaurant/page.tsx` | - Query turni pubblicati e candidati.<br>- Modal form "Nuovo Turno Extra".<br>- Gestione approvazione / rifiuto. | **SOLO GRAFICA:** Griglia turni pubblicati, lista candidati, e popup di inserimento turno ridisegnati in chiave neobrutalista. Gli handler di pubblicazione, approvazione e rifiuto candidati rimangono inalterati. |
| **Lista Chat `/messages`** | `frontend/app/messages/page.tsx` | - Query Supabase canali di chat attivi.<br>- Gestione stato realtime ed unread. | **SOLO GRAFICA:** Elenco canali con avatar quadrati cartoonish e badge. Le logiche di abbinamento e recupero realtime rimangono immutate. |
| **Stanza Chat `/messages/[id]`** | `frontend/app/messages/[id]/page.tsx` | - Integrazione realtime messaggi.<br>- Invio messaggi in database.<br>- Banner tutela privacy e masking contatti. | **SOLO GRAFICA:** Bolle di chat e moduli di input neobrutalisti ad alto contrasto. I blocchi di invio messaggio e le sottoscrizioni Supabase realtime non vengono toccati. |
| **Notifiche `/notifications`** | `frontend/app/notifications/page.tsx` | - Query notifiche utente.<br>- Azioni di lettura / eliminazione. | **SOLO GRAFICA:** Lista notifiche con badge colorati in base al tipo. Le funzioni di aggiornamento stato notifica rimangono intatte. |
| **Billing `/billing`** | `frontend/app/billing/page.tsx` | - Visualizzazione crediti.<br>- Griglia pacchetti ed acquisti. | **SOLO GRAFICA:** Pacchetti crediti neobrutalisti tridimensionali e tabelle storiche transazioni con spessi bordi bianchi. Nessun handler di ricarica viene alterato. |
| **Console Admin `/admin`** | `frontend/app/admin/page.tsx` | - Tab utenti, turni, log, diagnostica.<br>- Danger Zone e controlli amministrativi. | **SOLO GRAFICA:** Tabelle gestionali ad altissimo contrasto e tab switcher in stile pulsanti cartoon. Nessuna query o azione amministrativa viene toccata. |
| **Errori `/account-error` & `/forbidden`** | `frontend/app/account-error/page.tsx`<br>`frontend/app/forbidden/page.tsx` | - Messaggi di errore basati sullo stato.<br>- CTA di redirect o disconnessione. | **SOLO GRAFICA:** Pannelli di avviso cartoonish ad alto contrasto con icone animate bounce. I link di disconnessione e redirect rimangono inalterati. |

---

## 🔒 Strategia di Mitigazione dei Rischi

1. **Preservazione dei Link (`href` e `Link`):**
   - Tutti i tag `<a>` e `<Link>` manterranno invariato l'attributo `href` o `to`. Non verrà modificata alcuna stringa di destinazione.
2. **Preservazione delle Funzioni React e Supabase:**
   - La parte logica superiore dei componenti (definizione di `const`, `useState`, `useEffect`, `useParams`, `useRouter`, funzioni asincrone) **non verrà minimamente modificata o riscritta**. Cambierà unicamente il markup all'interno della direttiva `return(...)`.
3. **Validazione Continua tramite Build:**
   - Dopo l'aggiornamento grafico di ogni blocco di pagine, verrà eseguito `npm run build` per intercettare all'istante eventuali errori sintattici o TypeScript.
