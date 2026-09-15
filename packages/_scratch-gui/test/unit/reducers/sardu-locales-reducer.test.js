/* eslint-env jest */
import localesReducer, {localesInitialState, selectLocale, setLocales} from '../../../src/reducers/locales';

test('adds SARDU Edu messages to built-in locales', () => {
    expect(localesInitialState.messagesByLocale.en['gui.sardu.boardButton']).toBe('Boards');
    expect(localesInitialState.messagesByLocale.it['gui.sardu.boardButton']).toBe('Schede');
});

test('keeps SARDU Edu messages when a host replaces locale data', () => {
    const updated = localesReducer(undefined, setLocales({en: {hostMessage: 'Host'}}));
    expect(updated.messagesByLocale.en.hostMessage).toBe('Host');
    expect(updated.messagesByLocale.en['gui.sardu.robotButton']).toBe('Robots');
});

test('selects translated SARDU Edu messages', () => {
    const state = localesReducer(localesInitialState, selectLocale('it'));
    expect(state.messages['gui.sardu.boardLibraryTitle']).toBe('Scegli una scheda');
});
