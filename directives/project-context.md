# Project Context: Pupillo V2

Questo documento rappresenta il contesto centrale di business, branding e architettura tecnica per **Pupillo V2**, al quale tutti gli agenti operativi devono attenersi come unica fonte di verità.

---

## 1. Visione & Posizionamento
**Pupillo V2** è l'ecosistema digitale bilaterale di nuova generazione (monorepo MVP) che connette istantaneamente gestori di attività ristorative (**Ristoratori**) con personale operativo di supporto (**Lavoratori Extra**) per turni occasionali o extra.

* **La Nostra Missione**: Spostare il baricentro del reclutamento HoReCa dalla rigidità delle agenzie tradizionali all'autonomia diretta.
* **Tagline**: *"Lavora alle tue condizioni. Trova personale extra in un lampo."*
* **Tono di Voce**: Forte, giovanile, aggressivo, motivante e rapido. Parla sia ai lavoratori HoReCa che ai gestori dinamici, valorizzando il merito professionale.

---

## 2. Target Utenti
1. **Lavoratore Extra (`worker`)**: Camerieri, bartender, cuochi, lavapiatti e runner di giovane età (Gen Z e Millennials) stanchi di orari insostenibili e tariffe non trasparenti.
2. **Ristoratore / Gestore (`restaurant`)**: Titolari di bistrot, cocktail bar, pub, e catene che necessitano di coprire velocemente l'emergenza di un turno stasera o un picco eventi.

---

## 3. Stack Tecnologico di Riferimento
* **Frontend**: Next.js App Router (React 19 + TypeScript + Tailwind CSS V4).
* **Backend, Auth & DB**: Supabase (PostgreSQL) con RLS (Row Level Security) nativa, trigger SQL automatizzati e integrazione pagamenti Stripe.
* **Design & UX**: "Cyber-Hospitality Esthetics" (Dark Mode scura profonda `bg-slate-950`, micro-interazioni neon Teal/Emerald, e pannelli mobili bottom-sheets).
