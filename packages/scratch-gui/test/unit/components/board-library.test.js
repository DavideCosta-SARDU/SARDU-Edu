import {canSelectBoard, removeSelectedBoard} from '../../../src/components/board-library/board-library.jsx';
import {HARDWARE_REMOVE_LABEL} from '../../../src/components/library/library.jsx';
import sarduEduMessages from '../../../src/lib/sardu-edu-messages';

describe('SARDU Edu board library', () => {
    test('requires removing the selected board before choosing another one', () => {
        expect(canSelectBoard(null, 'arduino-uno')).toBe(true);
        expect(canSelectBoard('arduino-uno', 'arduino-uno')).toBe(true);
        expect(canSelectBoard('arduino-uno', 'esp32-dev-module')).toBe(false);
    });

    test('does not remove the board or its code when confirmation is cancelled', () => {
        const vm = {clearSarduEduHardwareSelection: jest.fn(() => false)};
        const confirmRemoval = jest.fn(() => false);

        expect(removeSelectedBoard(vm, confirmRemoval)).toBe(false);
        expect(vm.clearSarduEduHardwareSelection).toHaveBeenCalledTimes(1);
        expect(vm.clearSarduEduHardwareSelection).not.toHaveBeenCalledWith(true);
    });

    test('uses a readable removal marker for selected hardware', () => {
        expect(HARDWARE_REMOVE_LABEL).toBe('X');
    });

    test('provides Italian translations for every hardware block message', () => {
        const hardwarePrefixes = ['sarduBoard.', 'sarduSensors.', 'sarduActuators.'];
        const hardwareKeys = Object.keys(sarduEduMessages.en)
            .filter(key => hardwarePrefixes.some(prefix => key.startsWith(prefix)));

        hardwareKeys.forEach(key => expect(sarduEduMessages.it[key]).toBeDefined());
        expect(sarduEduMessages.it['sarduWifi.category']).toBe('ESP32 - Wi-Fi');
    });
});
