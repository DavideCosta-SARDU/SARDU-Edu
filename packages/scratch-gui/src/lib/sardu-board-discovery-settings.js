import {
    ARDUINO_PORT_DISCOVERY_TIMEOUTS,
    DEFAULT_ARDUINO_PORT_DISCOVERY_TIMEOUT
} from '@sardu-edu/hardware';

export const BOARD_DISCOVERY_TIMEOUTS = ARDUINO_PORT_DISCOVERY_TIMEOUTS;
export const DEFAULT_BOARD_DISCOVERY_TIMEOUT = DEFAULT_ARDUINO_PORT_DISCOVERY_TIMEOUT;

const STORAGE_KEY = 'sarduEdu.boardDiscoveryTimeoutMs';

export const normalizeBoardDiscoveryTimeout = value => {
    const timeout = Number(value);
    return BOARD_DISCOVERY_TIMEOUTS.includes(timeout) ? timeout : DEFAULT_BOARD_DISCOVERY_TIMEOUT;
};

export const getBoardDiscoveryTimeout = () => {
    if (typeof window === 'undefined') return DEFAULT_BOARD_DISCOVERY_TIMEOUT;
    try {
        return normalizeBoardDiscoveryTimeout(window.localStorage.getItem(STORAGE_KEY));
    } catch (error) {
        return DEFAULT_BOARD_DISCOVERY_TIMEOUT;
    }
};

export const setBoardDiscoveryTimeout = value => {
    const timeout = normalizeBoardDiscoveryTimeout(value);
    window.localStorage.setItem(STORAGE_KEY, String(timeout));
    return timeout;
};
