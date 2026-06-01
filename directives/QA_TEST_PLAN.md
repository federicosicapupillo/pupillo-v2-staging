# QA_TEST_PLAN.md - Piano di Testing & Validazione Qualità (Pupillo)

Questo documento definisce il piano di testing completo per garantire l'affidabilità, la sicurezza e l'assenza di regressioni nel portale **Pupillo**. Il piano copre i flussi end-to-end critici di business, analizza i casi limite (edge cases) e verifica la tenuta dei permessi RLS e dei vincoli del database.

---

## 1. I Flussi Critici di Business (E2E)

### Flusso A: Onboarding & Validazioni Profili (Lavoratore)
* **Obiettivo**: Garantire che solo profili legalmente idonei ed anagraficamente completi possano proporsi per i turni.
* **Passi di Test**:
  1. Registrazione utente ed accesso.
  2. Caricamento dati anagrafici (Nome, Cognome, Data Nascita).
  3. Caricamento documenti d'identità e codice fiscale.
  4. Verifica telefonica (simulata o via SMS OTP).
* **Criteri di Successo**:
  * Gli utenti sotto i 18 anni vengono bloccati con un messaggio chiaro e non riescono a completare il profilo.
  * Il codice fiscale viene validato per formato ed esattezza.
  * L'utente non può accedere a `/browse` finché `profile_completed` non è impostato su `true` dal backend/trigger.

### Flusso B: Pubblicazione Annuncio & Consumo Crediti (Ristoratore)
* **Obiettivo**: Verificare che il caricamento dei turni extra funzioni e gestisca correttamente i crediti utente o i piani attivi.
* **Passi di Test**:
  1. Il ristoratore accede e apre il form di creazione annuncio.
  2. Compila i campi obbligatori (ruolo, data, compenso, orari, indirizzo).
  3. Sottomette l'annuncio.
* **Criteri di Successo**:
  * Se l'utente ha un piano `free` e zero crediti, l'inserimento viene bloccato.
  * Se l'utente ha crediti disponibili, l'annuncio viene creato ed il saldo crediti decurtato dell'importo previsto, con riga inserita in `credit_transactions`.
  * Se l'utente è abbonato `pro` o `business`, l'inserimento avviene con `delta = 0` (coperto da piano).

### Flusso C: Candidatura, Matching e Sblocco Contatti (Real-Time)
* **Obiettivo**: Validare la correttezza del flusso transazionale di matching e la comparsa delle informazioni di contatto post-match.
* **Passi di Test**:
  1. Il lavoratore si candida a un annuncio aperto.
  2. Il ristoratore visualizza la candidatura.
  3. Il ristoratore clicca su **"Accetta Candidato"**.
* **Criteri di Successo**:
  * Lo stato della candidatura cambia in `accepted`.
  * Lo stato di tutte le altre candidature per lo stesso annuncio viene impostato automaticamente su `rejected`.
  * Lo stato dell'annuncio (`announcement`) diventa `assigned` o `matched`.
  * Viene creata una riga corrispondente in `public.shifts` con stato `scheduled`.
  * Entrambi gli utenti visualizzano i numeri di telefono reciproci sbloccati nella bacheca.

---

## 2. Casi Limite (Edge Cases) & Vulnerabilità

| Caso Limite (Edge Case) | Rischio Tecnico | Strategia di Test / Mitigazione |
| :--- | :--- | :--- |
| **Tentativo di Bypass Limite Età** | Modifica del payload JSON in transito per inviare una data di nascita che rende l'utente maggiorenne, pur avendo caricato un documento da minorenne. | **Test**: Iniezione SQL/API. **Mitigazione**: Il trigger PostgreSQL `enforce_worker_date_fields_always` valida la data di nascita lato DB e lancia un'eccezione bloccante. |
| **Candidature Multiple dello stesso utente** | Invio multiplo di click sul pulsante "Candidati" in rapida successione. | **Test**: Invii concorrenti di API POST. **Mitigazione**: Vincolo di chiave univoca composto `unique(announcement_id, worker_id)` nella tabella `applications`. |
| **Bypass Consumo Crediti** | Invio di una richiesta HTTP diretta alla tabella `jobs` saltando la transazione di consumo dei crediti. | **Test**: Scrittura diretta via client Supabase anonimo. **Mitigazione**: Le policy RLS e i trigger database bloccano la transazione se la decurtazione crediti non è andata a buon fine. |
| **No-Show / Mancata Presentazione** | Il lavoratore non si presenta al turno concordato. | **Test**: Il ristoratore segnala un incidente. **Mitigazione**: Inserimento in `worker_incidents`, riduzione immediata del parametro `reliability_pct` nel profilo del lavoratore. |

---

## 3. Validazione Sicurezza RLS (Row Level Security)

Tutti i test di RLS devono essere validati tramite test suite automatizzata (o simulazioni Supabase) per verificare che:
1. Un utente di ruolo `worker` non possa mai leggere le tabelle di fatturazione o i dati sensibili di un altro utente.
2. Un utente di ruolo `restaurant` non possa modificare le recensioni ricevute per alterare il proprio punteggio.
3. Le chiavi primarie degli utenti collegate ad `auth.users` non possano essere alterate o forzate.
