# Gestione dell'upstream Scratch Editor

SARDU Edu deriva dal repository ufficiale <https://github.com/scratchfoundation/scratch-editor>.

## Remote configurati

Il repository locale usa due remote distinti:

```sh
origin    https://github.com/DavideCosta-SARDU/SARDU-Edu.git
upstream  https://github.com/scratchfoundation/scratch-editor.git
```

`origin` riceve le modifiche SARDU Edu. `upstream` serve esclusivamente a recuperare gli aggiornamenti ufficiali.

## Aggiornamento

1. Verificare che il worktree sia pulito.
2. Recuperare il ramo upstream senza modificare automaticamente file locali.
3. Creare un ramo dedicato all'aggiornamento.
4. Integrare il nuovo upstream e risolvere soltanto i conflitti reali.
5. Eseguire lint, test e build prima di unire l'aggiornamento.
6. Annotare il nuovo commit upstream di riferimento.

Esempio, da adattare al ramo effettivamente usato:

```sh
git fetch upstream
git switch -c chore/update-upstream-YYYY-MM-DD
git merge upstream/develop
```

Le personalizzazioni di prodotto devono restare concentrate nella configurazione e nelle risorse SARDU Edu. I nomi
tecnici dei package `@scratch/*` non vengono rinominati nella Milestone 1, perché identificano i componenti upstream e
rinominarli renderebbe gli aggiornamenti inutilmente complessi.
