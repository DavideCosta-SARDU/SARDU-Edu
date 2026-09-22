/* eslint-env jest */
import localesReducer, {localesInitialState, selectLocale, setLocales} from '../../../src/reducers/locales';

test('adds SARDU-Block messages to built-in locales', () => {
    expect(localesInitialState.messagesByLocale.en['gui.sardu.boardButton']).toBe('Boards');
    expect(localesInitialState.messagesByLocale.it['gui.sardu.boardButton']).toBe('Schede');
});

test('keeps SARDU-Block messages when a host replaces locale data', () => {
    const updated = localesReducer(undefined, setLocales({en: {hostMessage: 'Host'}}));
    expect(updated.messagesByLocale.en.hostMessage).toBe('Host');
    expect(updated.messagesByLocale.en['gui.sardu.robotButton']).toBe('Robots');
});

test('selects translated SARDU-Block messages', () => {
    const state = localesReducer(localesInitialState, selectLocale('it'));
    expect(state.messages['gui.sardu.boardLibraryTitle']).toBe('Scegli una scheda');
    expect(state.messages['gui.about.sarduBlock']).toBe('Informazioni su SARDU-Block');
    expect(state.messages['gui.about.thirdParty']).toBe('Licenze di terze parti');
    expect(state.messages['gui.about.fullLicense']).toBe('Apri la licenza AGPL-3.0 completa');
});
