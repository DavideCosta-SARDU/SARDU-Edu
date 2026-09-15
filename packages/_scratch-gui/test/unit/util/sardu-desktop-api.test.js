/* eslint-env jest */
import getSarduDesktopHardware from '../../../src/lib/sardu-desktop-api';

test('returns the narrow hardware API exposed by the Electron preload', () => {
    const hardware = {compile: jest.fn()};
    window.sarduEduDesktop = {hardware};

    expect(getSarduDesktopHardware()).toBe(hardware);

    delete window.sarduEduDesktop;
});

test('returns null in the browser build', () => {
    delete window.sarduEduDesktop;
    expect(getSarduDesktopHardware()).toBeNull();
});
