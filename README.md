# SARDU Edu

SARDU Edu è un ambiente educativo di programmazione a blocchi basato sul repository open source ufficiale
[Scratch Editor](https://github.com/scratchfoundation/scratch-editor).

Il progetto conserva inizialmente l'interfaccia e il comportamento dell'editor originale. La sua evoluzione è orientata
all'integrazione hardware modulare, iniziando da Arduino Uno e Arduino Nano, senza sostituire o ricostruire l'editor a
blocchi.

SARDU Edu è un progetto indipendente e non è affiliato né approvato dalla Scratch Foundation.

## Stato del progetto

La Milestone 1 prepara la base SARDU Edu:

- codice derivato dall'attuale monorepo ufficiale `scratch-editor`;
- branding essenziale SARDU Edu;
- esecuzione locale;
- build web statica;
- pubblicazione stable su GitHub Pages tramite workflow controllato;
- documentazione dei limiti offline attuali.

Il supporto hardware, la generazione di codice Arduino e l'installazione di estensioni non fanno parte di questa
milestone. Sono obiettivi fondamentali delle milestone successive e l'architettura esistente viene preservata per non
ostacolarli.

## Requisiti

- Node.js `24.20.0`, come indicato in `.nvmrc`;
- npm incluso nella distribuzione Node;
- Git.

Con un gestore di versioni Node:

```sh
nvm use
```

## Installazione ed esecuzione locale

```sh
npm ci
npm start
```

L'editor viene servito normalmente all'indirizzo <http://localhost:8601/>.

## Build statica

```sh
npm run build
```

L'applicazione web viene generata in `packages/scratch-gui/build/`. Il file principale è `index.html` e gli asset usano
percorsi relativi, compatibili con un sito GitHub Pages pubblicato nel sottopercorso `/SARDU-Edu/`.

Il workflow `.github/workflows/deploy-pages.yml` compila e distribuisce questa directory quando viene avviato
manualmente. GitHub Pages deve usare **GitHub Actions** come sorgente di pubblicazione.

La versione pubblicata è disponibile all'indirizzo <https://davidecosta-sardu.github.io/SARDU-Edu/>.

## Utilizzo offline

La build è composta da file statici e può essere conservata localmente o servita da un server HTTP locale. Le funzioni
principali dell'editor e il caricamento/salvataggio locale dei progetti `.sb3` non richiedono un account.

L'upstream utilizza tuttavia servizi remoti per alcune risorse e funzioni, incluse parti delle librerie multimediali,
tutorial e determinate estensioni. La Milestone 1 non dichiara quindi una parità offline completa. Il supporto offline
esteso richiederà una milestone dedicata, senza eliminare le funzioni esistenti.

## Provenienza upstream

Il punto di partenza della Milestone 1 è il ramo `develop` di `scratchfoundation/scratch-editor`, commit
`82c5fea6d3e60c781f25c09b375045f9b46a43f7`.

La procedura prevista per mantenere separati upstream e personalizzazioni SARDU è documentata in
[`docs/UPSTREAM.md`](docs/UPSTREAM.md).

## Licenza e attribuzioni

SARDU Edu è distribuito secondo la GNU Affero General Public License v3.0 (`AGPL-3.0-only`). Consultare
[`LICENSE`](LICENSE), [`NOTICE`](NOTICE) e [`TRADEMARK`](TRADEMARK).

Modifiche SARDU Edu: Davide Costa <davide@sardu.pro>.
