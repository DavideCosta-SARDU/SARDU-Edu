import {defineMessages} from 'react-intl';

export default defineMessages({
    browserNotRecommended: {
        defaultMessage: 'We are very sorry, but it looks like you are using a browser version that SARDU Edu ' +
            'does not support. We recommend updating to the latest version of a supported browser such as ' +
            'Google Chrome, Mozilla Firefox, Microsoft Edge, or Apple Safari.',
        description: 'Error message when the browser does not meet the minimum requirements',
        id: 'sarduEdu.gui.unsupportedBrowser.notRecommended'
    },
    browserUnsupported: {
        defaultMessage: 'We are very sorry, but SARDU Edu does not support this browser. We recommend updating ' +
            'to the latest version of a supported browser such as Google Chrome, Mozilla Firefox, Microsoft ' +
            'Edge, or Apple Safari.',
        description: 'Error message when the browser does not work at all',
        id: 'sarduEdu.gui.unsupportedBrowser.description'
    },
    crash: {
        defaultMessage: 'We are sorry, but it looks like SARDU Edu has crashed. Please refresh the page to try again.',
        description: 'Message to inform the user that the page has crashed',
        id: 'sarduEdu.gui.crashMessage.description'
    },
    lostPeripheralConnection: {
        defaultMessage: 'SARDU Edu lost connection to {extensionName}.',
        description: 'Message indicating that an extension peripheral has been disconnected',
        id: 'sarduEdu.gui.alerts.lostPeripheralConnection'
    },
    webGlRequired: {
        defaultMessage: 'Unfortunately it looks like your browser or computer <a>{webGlLink}</a>. This ' +
            'technology is needed for SARDU Edu to run.',
        description: 'WebGL missing message',
        id: 'sarduEdu.gui.webglModal.description'
    }
});
