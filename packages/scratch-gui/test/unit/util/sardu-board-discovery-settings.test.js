/* eslint-env jest */
import {
    DEFAULT_BOARD_DISCOVERY_TIMEOUT,
    getBoardDiscoveryTimeout,
    normalizeBoardDiscoveryTimeout,
    setBoardDiscoveryTimeout
} from '../../../src/lib/sardu-board-discovery-settings';

describe('board discovery settings', () => {
    beforeEach(() => window.localStorage.clear());

    test('uses and persists only supported timeout values', () => {
        expect(getBoardDiscoveryTimeout()).toBe(DEFAULT_BOARD_DISCOVERY_TIMEOUT);
        expect(setBoardDiscoveryTimeout(100)).toBe(100);
        expect(getBoardDiscoveryTimeout()).toBe(100);
        expect(normalizeBoardDiscoveryTimeout(101)).toBe(DEFAULT_BOARD_DISCOVERY_TIMEOUT);
    });
});
