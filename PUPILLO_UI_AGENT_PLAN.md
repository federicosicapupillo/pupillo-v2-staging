# PUPILLO_UI_AGENT_PLAN.md - Piano d'Identità Visiva & UI/UX Design V2

Questo documento definisce la direzione artistica, l'identità visiva e le linee guida UI/UX per **Pupillo V2**. L'obiettivo è trasformare Pupillo in una piattaforma dal look **giovane, urbano, premium, elegante e professionale**, mantenendo al contempo una semplicità d'uso estrema sia per i Ristoratori (clientela B2B) che per i Lavoratori Extra (utenza B2C).

---

## 1. Identità Visiva Proposta

L'identità di Pupillo V2 si basa sul concetto di **"Urban Hospitality Nightlife"**. 
*   **Giovane & Dinamico**: Il layout si ispira alle applicazioni consumer di maggior successo, con forme morbide, microinterazioni intelligenti ed accenti cromatici brillanti.
*   **Premium & Notturno**: Trattandosi di un servizio focalizzato sul settore HoReCa, dove il lavoro si svolge prevalentemente nelle fasce serali e notturne, il tema dark profondo rappresenta la base naturale di design.
*   **Affidabile & Professionale**: Le interfacce B2B (area ristoratore, fatturazione e storico turni) trasmettono stabilità, sicurezza e precisione amministrativa attraverso allineamenti perfetti e spaziature generose.

---

## 2. Palette Colori

Utilizzeremo una palette scura con accenti al neon calibrati ad alto contrasto per comunicare lo stato e i flussi d'azione:

| Token Colore | Codice HEX / HSL | Utilizzo nella UI | Significato psicologico |
| :--- | :--- | :--- | :--- |
| **Deep Slate (Base)** | `#020617` (slate-950) | Sfondo globale dell'applicazione. | Solidità, notte, premium. |
| **Card Gray** | `#0f172a` (slate-900) | Sfondo di card, pannelli, modal e sidebar. | Gerarchia visiva tridimensionale. |
| **Border Gray** | `#1e293b` (slate-800) | Bordi e divisori leggeri. | Separazione pulita senza rumore visivo. |
| **Electric Teal** | `#2dd4bf` (teal-400) | Accento primario per i Lavoratori extra. | Velocità, energia, dinamismo. |
| **Urban Emerald** | `#34d399` (emerald-400) | Accento primario per i Ristoratori. | Successo, professionalità, crescita. |
| **Electric Indigo** | `#6366f1` (indigo-500) | Elementi premium, abbonamenti e Stripe. | Esclusività, valore aggiunto. |
| **Amber Gold** | `#f59e0b` (amber-500) | Demo state, crediti ed avvisi di sistema. | Attenzione, moneta virtuale. |
| **Sunset Coral** | `#f43f5e` (rose-500) | Errori, cancellazioni e azioni distruttive. | Urgenza, attenzione critica. |

---

## 3. Tipografia

Adottiamo una scala tipografica moderna e leggibile in tema scuro, importata da Google Fonts:
*   **Font Primario**: `Inter` o `Outfit` (sans-serif) per l'interfaccia utente, i form e le descrizioni. Garantisce leggibilità anche a piccole dimensioni su dispositivi mobili.
*   **Titoli principali**: `Outfit` o `Inter Black` (`font-black tracking-tight`) per un impatto urbano e deciso nella Hero e nei banner delle dashboard.
*   **Dati e ID**: `JetBrains Mono` o `Fira Code` (`font-mono`) per identificativi dei turni, orari, tariffe orarie e storico fatturazione.

---

## 4. Stile Bottoni (Buttons)

I bottoni devono essere consistenti e favorire il tocco su mobile (minimo 44px di altezza):
*   **Primary Lavoratore**: Gradiente da `teal-500` a `emerald-500`. Hover state: scala `1.02` con aumento di saturazione. Active state: scala `0.98`.
*   **Primary Ristoratore**: Gradiente da `emerald-500` a `teal-500`. Hover state: scala `1.02` con aumento di saturazione.
*   **Secondary / Outline**: Sfondo `slate-900`, bordo `slate-800` con accento teal/emerald visibile solo all'hover.
*   **Destructive**: Sfondo `rose-500/10`, bordo `rose-500/20`, testo `rose-400`. Hover: sfondo `rose-500` con testo scuro.

---

## 5. Stile Card (Cards)

Le card devono dare un senso di profondità e galleggiamento:
*   **Layout**: Angoli arrotondati pronunciati (`rounded-3xl` o `24px`), bordo sottile ad alto contrasto (`border-slate-800/80`).
*   **Shadows**: Ombra profonda e sfocata (`shadow-2xl shadow-slate-950/50`).
*   **Hover state**: Leggera traslazione verso l'alto (`hover:-translate-y-1`) e bagliore soffuso sul bordo del colore del ruolo.

---

## 6. Stile Dashboard

Le dashboard devono essere pulite, evitando il sovraffollamento visivo ("clutter"):
*   **Banner Superiore**: Un pannello informativo ad angoli morbidi che dà il benvenuto all'utente con un gradiente soffuso sul background, riducendo l'ansia da prestazione e mostrando le statistiche salienti.
*   **Griglia dei Turni**: Organizzazione asimmetrica che separa i turni attivi o pubblicati dalle candidature ricevute.
*   **Side Panels**: Pannelli laterali collassabili su schermi grandi per massimizzare l'area di lavoro centrale.

---

## 7. Stile Chat

La chat deve sembrare un'applicazione di messaggistica nativa:
*   **Bolle di testo (Chat Bubbles)**:
    *   *Proprio messaggio*: Arrotondato sul lato sinistro, sfondo `teal-500` per lavoratore o `emerald-500` per ristoratore, testo scuro.
    *   *Messaggio partner*: Arrotondato sul lato destro, sfondo `slate-850`, bordo `slate-800`.
*   **Input Bar**: Sticky in fondo alla pagina, ad angoli arrotondati, con pulsante di invio iconico ed immediato.

---

## 8. Stile Notifiche

Ogni notifica deve essere facilmente scansionabile:
*   **Badge del Tipo**: Una pillola colorata con icona emoji (`💬 Chat`, `🍽️ Turno`, `👋 Candidatura`).
*   **Stato Lettura**: Un punto neon `teal-400` pulsante per le notifiche non lette.
*   **Azioni Rapide**: Pulsanti minimali per eliminare o segnare come letto direttamente dalla lista.

---

## 9. Stile Badge Reputazione

La reputazione è l'elemento meritocratico di Pupillo:
*   **Punteggio medio**: Visualizzato in grande con icone a stella animate.
*   **Badge Lavoratore**:
    *   *Basic*: Badge `slate-800` con scritte grigie (affidabilità di base).
    *   *Pro*: Badge `teal-500/10` con scritte teal brillante.
    *   *Elite*: Gradiente cangiante `from-indigo-500/20 to-purple-500/20` con bordo dorato (riservato ai top player senza no-show).

---

## 10. Stile Modali / Popup

I modal devono interrompere l'attenzione dell'utente senza isolarlo completamente:
*   **Sfondo**: Overlay scuro e sfocato (`bg-slate-950/75 backdrop-blur-sm`).
*   **Animazione**: Ingresso a comparsa morbida (`animate-in fade-in zoom-in-95 duration-200`).
*   **Design**: Angoli arrotondati da 32px (`rounded-3xl`), intestazione chiara e pulsante di chiusura iconico ben visibile nell'angolo in alto a destra.

---

## 11. Stile Mobile

L'applicazione deve essere progettata **Mobile-First**:
*   **Target di tocco**: Almeno 44x44 pixel per tutti gli elementi interattivi.
*   **Layout ad una colonna**: Su schermi inferiori a 768px, sidebar e side-panel si posizionano in fondo o vengono racchiusi in fogli a scorrimento dal basso (bottom-sheets).
*   **Sticky Actions**: I bottoni di conversione primari (es. "Candidati ora" o "Invia Messaggio") rimangono ancorati in basso sullo schermo mobile.

---

## 12. Pagine da Rifare in Ordine di Priorità (Priorità UI/UX)

1.  **Login / Register**: È il biglietto da visita della piattaforma, deve stupire ed accogliere l'utente.
2.  **Home / Landing Page**: Vetrina pubblica del brand, deve ispirare professionalità HoReCa.
3.  **Onboarding guidato**: Passaggio a step critico per ridurre l'abbandono dell'iscrizione.
4.  **Dashboard Ristoratore & Lavoratore**: Centri operativi di controllo quotidiano.
5.  **Bacheca Turni / Trova Offerte**: Interfaccia di ricerca e applicazione filtri.
6.  **Chat & Notifiche**: Flussi di messaggistica in tempo reale.
7.  **Billing & Admin**: Gestione crediti e arbitro di piattaforma.

---

## 13. Componenti Riutilizzabili da Creare

Creeremo una libreria di componenti grafici atomici (standardizzati all'interno del progetto frontend) per garantire coerenza assoluta in ogni pagina:
*   `Button.tsx`: Bottone polimorfico con varianti (primary, secondary, destructive, ghost) e animazioni scale incorporate.
*   `Card.tsx`: Contenitore standard con bordi ad alto contrasto e shadow.
*   `ReputationBadge.tsx`: Badge reputazionale in base alla percentuale di affidabilità e rating.
*   `StatusPill.tsx`: Indicatore di stato per turni o candidature (`open`, `matched`, `completed`, `cancelled`).

---

## 14. Regole da Rispettare per Non Rompere la Logica Applicativa

> [!IMPORTANT]
> Per garantire la stabilità e la sicurezza dell'MVP ed evitare regressioni funzionali:
> 1. **Mantenere intatti gli ID e le proprietà dei campi form**: Non modificare i nomi delle variabili state (`email`, `password`, `roleInput`, `dateInput`, ecc.) associate agli input.
> 2. **Non alterare le chiamate al Client Supabase**: I metodi di fetch (`supabase.from('jobs').select(...)`) e inserimento devono rimanere perfettamente coincidenti con le query stabilizzate nella Fase 1.
> 3. **Non rimuovere i meccanismi di Sandbox Bypass**: I controlli demo (es. intercettazione delle email contenenti `lavoratore` o `ristoratore` nel login) devono rimanere attivi e inalterati per permettere lo sviluppo e QA visivo locale.
> 4. **Preservare la gestione RLS e Auth**: Non introdurre chiamate di service role o configurazioni di autenticazione client-side insicure.
