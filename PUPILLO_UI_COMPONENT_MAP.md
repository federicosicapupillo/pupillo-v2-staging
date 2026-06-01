# PUPILLO_UI_COMPONENT_MAP.md - Mappa dei Componenti Grafici da Standardizzare

Questo documento definisce la libreria dei componenti grafici di **Pupillo V2** da standardizzare nel frontend per garantire coerenza estetica assoluta e semplificare le future modifiche. Ciascun componente elenca la sua struttura Tailwind consigliata, gli stati visivi e il comportamento responsive.

---

## Elenco dei Componenti Standardizzati

### 1. Button (Pulsante Polimorfico)
*   **Utilizzo**: Inviare form, candidarsi, confermare turni.
*   **Tailwind Classi Consigliate**:
    *   *Base*: `h-11 px-6 rounded-xl text-sm font-bold transition-all active:scale-95 duration-200 select-none flex items-center justify-center gap-2`
    *   *Worker Primary*: `bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 hover:from-teal-400 hover:to-emerald-400 shadow-md shadow-teal-500/10`
    *   *Restaurant Primary*: `bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:from-emerald-400 hover:to-teal-400 shadow-md shadow-emerald-500/10`
    *   *Secondary Outline*: `bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700`
    *   *Destructive*: `bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-slate-950`

---

### 2. Card (Contenitore Base)
*   **Utilizzo**: Contenere sezioni informative, dettagli account, turni extra.
*   **Tailwind Classi Consigliate**:
    *   *Base*: `bg-slate-900 border border-slate-800/80 rounded-3xl p-6 shadow-xl shadow-slate-950/40 relative overflow-hidden transition-all duration-300`
    *   *Hover State*: `hover:-translate-y-1 hover:border-slate-700/80 hover:shadow-2xl`

---

### 3. Badge (Pillola Informativa Generica)
*   **Utilizzo**: Mostrare tag operativi, mansioni, lingue.
*   **Tailwind Classi Consigliate**:
    *   *Base*: `px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider border select-none inline-flex items-center gap-1.5`
    *   *Teal Accent*: `bg-teal-500/10 text-teal-300 border-teal-500/20`
    *   *Emerald Accent*: `bg-emerald-500/10 text-emerald-300 border-emerald-500/20`
    *   *Indigo Accent*: `bg-indigo-500/10 text-indigo-300 border-indigo-500/20`

---

### 4. StatusPill (Pillola di Stato)
*   **Utilizzo**: Identificare lo stato di un turno o di una candidatura.
*   **Tailwind Classi Consigliate**:
    *   *Open*: `bg-slate-950 text-slate-400 border border-slate-850`
    *   *Matched / Accepted*: `bg-emerald-500/10 text-emerald-300 border border-emerald-500/20`
    *   *Rejected / Cancelled*: `bg-rose-500/10 text-rose-300 border border-rose-500/20`
    *   *Completed*: `bg-indigo-500/10 text-indigo-300 border border-indigo-500/20`

---

### 5. ReputationBadge (Grado di Affidabilità)
*   **Utilizzo**: Valutazione visiva immediata della reputazione del lavoratore.
*   **Classi e Varianti**:
    *   *Basic (default)*: `bg-slate-950 text-slate-500 border border-slate-850 px-2 py-0.5 rounded text-[9px] font-bold`
    *   *Pro (rating >= 4.5)*: `bg-teal-500/10 text-teal-300 border border-teal-500/20 px-2 py-0.5 rounded text-[9px] font-bold shadow-sm`
    *   *Elite (rating >= 4.8 e 100% affidabilità)*: `bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-amber-500/40 px-2 py-0.5 rounded text-[9px] font-bold animate-pulse shadow-md`

---

### 6. WorkerCard (Scheda Lavoratore per Ristoratori)
*   **Utilizzo**: Visualizzare i dati del candidato lavoratore nella dashboard ristoratore.
*   **Composizione**: Card base con in alto nome mascherato e rating medio, al centro biografia racchiusa in un sotto-pannello scuro, tag delle competenze, e in basso bottoni di azione ("Accetta", "Rifiuta") o pulsante di sblocco contatti.

---

### 7. JobCard (Scheda Annuncio di Lavoro)
*   **Utilizzo**: Mostrare i dettagli di un annuncio di lavoro attivo nella bacheca.
*   **Composizione**: Card base con in alto a sinistra il ruolo e a destra la tariffa oraria orizzontale in evidenza, al centro nome del ristorante e location con icona mappa, data ed orario racchiusi in un pannello `bg-slate-950/60`, e in fondo bottone di candidatura.

---

### 8. ShiftCard (Scheda Turno Programmato)
*   **Utilizzo**: Visualizzare i turni futuri confermati o conclusi.
*   **Composizione**: Card base con pillola di stato (`scheduled`, `completed`), riepilogo orario e importo monetario complessivo (tariffa * ore). Visualizza il recapito telefonico diretto e il pulsante per attivare la chat.

---

### 9. NotificationCard (Pannello Notifica)
*   **Utilizzo**: Mostrare eventi e messaggi nel Centro Notifiche.
*   **Composizione**: Sfondo alternato in base allo stato di lettura (opaco `opacity-75 bg-slate-900/50` se letta, nitido e con punto neon verde `teal-400` se non letta). Contiene badge tipologia notifica e bottoni minimali sulla destra per lettura/eliminazione.

---

### 10. ChatBubble (Bolla Messaggio)
*   **Utilizzo**: Visualizzare i messaggi della conversazione.
*   **Composizione**:
    *   *Messaggio Inviato*: `max-w-[70%] ml-auto p-4 rounded-3xl rounded-tr-none bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 text-sm font-medium leading-relaxed`
    *   *Messaggio Ricevuto*: `max-w-[70%] mr-auto p-4 rounded-3xl rounded-tl-none bg-slate-900 border border-slate-800 text-slate-200 text-sm leading-relaxed`

---

### 11. EmptyState (Nessun Dato Presente)
*   **Utilizzo**: Mostrare banner informativi quando tabelle o ricerche sono vuote.
*   **Composizione**: `py-16 px-8 rounded-3xl bg-slate-900/40 border border-slate-800 border-dashed text-center text-xs text-slate-500 flex flex-col items-center gap-3 select-none` con icona emoji in grandi dimensioni.

---

### 12. Modal (Finestra in Overlay)
*   **Utilizzo**: Creazione turni, dettagli complessi, filtri avanzati.
*   **Composizione**: Sfondo oscurato `bg-slate-950/75 backdrop-blur-sm`, corpo del popup `w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200`.

---

### 13. FormField (Campo Input standard)
*   **Utilizzo**: Registrazione, login, compilazione dati.
*   **Composizione**: Etichetta in caratteri minuscoli `text-xs font-semibold text-slate-400 mb-1.5 block`, input `w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-teal-500 outline-none text-sm text-slate-200 transition-all placeholder:text-slate-700`.

---

### 14. LoadingState (Caricamento in corso)
*   **Utilizzo**: Feedback visivo durante caricamenti o chiamate API.
*   **Composizione**: `flex flex-col items-center justify-center gap-3 py-12` con spinner animato `w-8 h-8 border-4 border-slate-800 border-t-teal-400 rounded-full animate-spin`.

---

### 15. ErrorState (Notifica Errore)
*   **Utilizzo**: Segnalare eccezioni del database o credenziali errate.
*   **Composizione**: Banner orizzontale `p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-400 text-center animate-pulse flex items-center justify-center gap-2`.

---

### 16. Sidebar / Navigation (Barra di Navigazione)
*   **Utilizzo**: Navigazione tra le rotte del pannello.
*   **Composizione**: Header sticky sfocato `sticky top-0 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/60` con pulsanti elastici ad hover state reattivo. Su mobile, si trasforma in barra inferiore o menu collassabile.
