# UI_DIRECTION.md - Linee Guida di Design & Visual Direction (Pupillo)

Questo documento definisce la direzione artistica e l'interfaccia utente (UI/UX) di **Pupillo**. Il design si allontana da schemi piatti ed asettici per abbracciare un'estetica premium, ad alto impatto energetico, giovanile ed estremamente dinamica ("Cyber-Hospitality Esthetics").

---

## 1. Il Concept Visivo: "Speed & Energy"

Il design deve comunicare visivamente **velocità**, **opportunità** e **professionalità innovativa**. L'utente, dal primo istante in cui atterra sul portale, deve percepire che sta utilizzando uno strumento premium, reattivo e vivo.

### Elementi Cardine:
* **Dark Mode di Default**: Sfondi scuri e profondi per ridurre l'affaticamento visivo durante i turni serali e far risaltare gli indicatori neon.
* **Glassmorphism & Profondità**: Card con sfondi semi-trasparenti, sfocature di sfondo (`backdrop-blur`) e bordi sottili e lucidi per dare un senso di modernità tridimensionale.
* **Gradients Neon**: Transizioni di colore vivaci (Teal $\to$ Emerald $\to$ Indigo) per pulsanti di azione primaria ed indicatori chiave.

---

## 2. Tavolozza Colori (HSL-Curated System)

Evitiamo colori piatti ed ordinari. Utilizziamo una palette cromatica armonica basata su tonalità scure arricchite da accenti neon polarizzanti.

| Nome Colore | Codice HEX / HSL | Utilizzo Principale | Impatto Visivo |
| :--- | :--- | :--- | :--- |
| **Slate Black (Sfondo)** | `#020617` / `hsl(222, 47%, 4%)` | Sfondo di pagina primario | Profondo, riposante, high-tech |
| **Deep Slate (Card)** | `#0f172a` / `hsl(222, 47%, 11%)` | Sfondi card, modal e header | Contrasto morbido ed elegante |
| **Cyber Teal (Accento 1)**| `#2dd4bf` / `hsl(172, 66%, 50%)` | Pulsanti primari, link attivi, worker | Energetico, fresco, giovanile |
| **Neon Emerald (Accento 2)**| `#10b981` / `hsl(162, 76%, 41%)` | Tariffe orarie, stati approvati, restaurant | Sicurezza, successo, crescita |
| **Hyper Indigo (Accento 3)**| `#6366f1` / `hsl(239, 84%, 67%)` | Badge premium, grafici transazioni, admin | Innovativo, misterioso, premium |
| **Rose Alert (Errore)** | `#f43f5e` / `hsl(350, 89%, 60%)` | Errori, cancellazioni, no-shows | Attenzione immediata, urgenza |

---

## 3. Tipografia & Gerarchia Visiva

Utilizziamo caratteri geometrici moderni da Google Fonts:
1. **Titoli e Hero Banner**: **Outfit** (Sans-Serif geometrico, taglio pulito, superlativo in pesi ExtraBold e Black).
2. **Testo e Form**: **Inter** (Libreria universale ad alta leggibilità anche a piccole dimensioni su dispositivi mobili).

```css
/* Gerarchia Tipografica */
h1 {
  font-family: 'Outfit', sans-serif;
  font-weight: 900;
  letter-spacing: -0.03em;
}
p, input, button {
  font-family: 'Inter', sans-serif;
}
```

---

## 4. Componenti UI & Micro-Animazioni

L'applicazione deve sentirsi viva sotto il puntatore dell'utente:
* **Pulsanti Primari**:
  * Stato di riposo: Sfumatura da Teal a Emerald con ombra leggera teal.
  * Hover: Incremento della scala (`scale-102`), aumento della luminosità della sfumatura ed espansione dell'ombra neon (`shadow-teal-500/25`).
  * Click: Leggera contrazione (`scale-98`) per un feedback tattile.
* **Bordi Neon / Sfocature**:
  * Le card dei turni extra hanno un bordo di `1px` grigio scuro (`border-slate-800/80`) che diventa teal o verde smeraldo in hover con una transizione fluida (`transition-all duration-300`).
* **Badge Reputazione**:
  * I badge dei lavoratori (`basic`, `pro`, `elite`) utilizzano riflessi metallici o gradienti sfumati con bordi luccicanti per motivare l'utente ad evolvere la propria classe reputazionale.

---

## 5. Layout & Spaziatura (Griglia Mobile-First)

Poiché il 90% dei lavoratori extra e molti ristoratori utilizzano Pupillo in movimento (in sala o prima di entrare in turno), la UI è pensata **rigorosamente mobile-first**:
* **Margini e Spaziatura**: Utilizzo del modulo `4px` (`gap-4`, `p-6`, `space-y-8`) per mantenere consistenza.
* **Bottom Sheets**: Per i dispositivi mobili, i dettagli dei turni e i moduli di candidatura si aprono come pannelli dal basso (utilizzando la libreria Radix `Vaul`), facilitando l'interazione con il pollice.
