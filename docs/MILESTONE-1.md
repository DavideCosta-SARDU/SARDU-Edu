# Milestone 1 — Base SARDU Edu

## Obiettivo

Creare una base SARDU Edu riconoscibile e distribuibile, mantenendo il più possibile invariati interfaccia,
comportamento e architettura dell'editor Scratch ufficiale.

## Perimetro

- Conservare il monorepo e i package upstream.
- Applicare soltanto il branding essenziale SARDU Edu.
- Documentare installazione, avvio, build statica, offline e provenienza upstream.
- Preparare un workflow GitHub Pages separato dai workflow di anteprima upstream.
- Conservare licenza, attribuzioni e avvisi sui marchi.
- Mantenere le personalizzazioni concentrate e facilmente identificabili.

## Esclusioni

Questa milestone non implementa:

- Arduino o altre schede;
- compilazione o caricamento di firmware;
- un'applicazione locale di collegamento;
- nuovi blocchi;
- installazione di estensioni di terze parti;
- gestione delle librerie Arduino;
- un nuovo personaggio SARDU Edu;
- refactoring generale dell'editor.

Queste esclusioni delimitano soltanto la Milestone 1. L'integrazione hardware modulare, il codice compatibile con
Arduino IDE, il codice personale preservato, le librerie offline e le estensioni installabili restano obiettivi centrali
del progetto.

## Verifica di completamento

- [x] Installazione riproducibile con la versione Node indicata da `.nvmrc`.
- [x] Avvio locale dell'editor.
- [x] Build statica completata.
- [x] Nome, logo, favicon, titolo pagina e titolo progetto identificano SARDU Edu.
- [x] Nessun nuovo supporto hardware o refactoring non richiesto.
- [x] Workflow pronto a pubblicare `packages/scratch-gui/build/` su GitHub Pages tramite GitHub Actions.
- [x] I limiti dell'utilizzo offline sono dichiarati senza promesse non verificate.
- [x] Licenza e attribuzioni upstream sono conservate.
- [x] La cartella locale degli appunti privati non è tracciata da Git.
