import {isRtl} from 'scratch-l10n';
import editorMessages from 'scratch-l10n/locales/editor-msgs';
import sarduEduMessages from '../lib/sardu-edu-messages';

const UPDATE_LOCALES = 'scratch-gui/locales/UPDATE_LOCALES';
const SELECT_LOCALE = 'scratch-gui/locales/SELECT_LOCALE';

const addSarduEduMessages = localesMessages => Object.keys(Object.assign({}, sarduEduMessages, localesMessages))
    .reduce((result, locale) => {
        result[locale] = Object.assign({}, sarduEduMessages.en, sarduEduMessages[locale], localesMessages[locale]);
        return result;
    }, {});

const messagesByLocale = addSarduEduMessages(editorMessages);

const initialState = {
    isRtl: false,
    locale: 'en',
    messagesByLocale,
    messages: messagesByLocale.en
};

const reducer = function (state, action) {
    if (typeof state === 'undefined') state = initialState;
    switch (action.type) {
    case SELECT_LOCALE:
        return Object.assign({}, state, {
            isRtl: isRtl(action.locale),
            locale: action.locale,
            messagesByLocale: state.messagesByLocale,
            messages: state.messagesByLocale[action.locale]
        });
    case UPDATE_LOCALES:
        return Object.assign({}, state, {
            isRtl: state.isRtl,
            locale: state.locale,
            messagesByLocale: action.messagesByLocale,
            messages: action.messagesByLocale[state.locale]
        });
    default:
        return state;
    }
};

const selectLocale = function (locale) {
    return {
        type: SELECT_LOCALE,
        locale: locale
    };
};

const setLocales = function (localesMessages) {
    return {
        type: UPDATE_LOCALES,
        messagesByLocale: addSarduEduMessages(localesMessages)
    };
};
const initLocale = function (currentState, locale) {
    if (Object.prototype.hasOwnProperty.call(currentState.messagesByLocale, locale)) {
        return Object.assign(
            {},
            currentState,
            {
                isRtl: isRtl(locale),
                locale: locale,
                messagesByLocale: currentState.messagesByLocale,
                messages: currentState.messagesByLocale[locale]
            }
        );
    }
    // don't change locale if it's not in the current messages
    return currentState;
};
export {
    reducer as default,
    initialState as localesInitialState,
    initLocale,
    selectLocale,
    setLocales
};
