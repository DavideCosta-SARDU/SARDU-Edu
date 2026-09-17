/* eslint-env jest */
import {
    appendHardwareOutput,
    getArduinoPanelWidth,
    getCompatiblePorts,
    getDisplayedSource,
    getInitialDesktopState,
    getPreselectedPort,
    getSerialBaudRate
} from '../../../src/components/arduino-code-panel/arduino-code-panel.jsx';

test('accepts an unidentified serial adapter for the board selected by the user', () => {
    const ch340Port = {address: 'COM5', matchingBoardFqbns: []};
    expect(getCompatiblePorts([ch340Port], {fqbn: 'arduino:avr:uno'})).toEqual([
        {...ch340Port, identification: 'ambiguous'}
    ]);
});

test('rejects a serial port identified as another classic Arduino board', () => {
    const port = {address: 'COM5', matchingBoardFqbns: ['arduino:avr:uno']};
    expect(getCompatiblePorts([port], {fqbn: 'arduino:avr:nano'})).toEqual([]);
});

test('rejects a recognized micro:bit while searching for Arduino', () => {
    const microbitPort = {address: 'COM6', matchingBoardFqbns: [], vid: '0x0d28', pid: '0x0204'};
    expect(getCompatiblePorts([microbitPort], {fqbn: 'arduino:avr:uno'})).toEqual([]);
});

test('marks an exact Arduino CLI board match as verified', () => {
    const port = {address: 'COM4', matchingBoardFqbns: ['arduino:avr:uno']};
    expect(getCompatiblePorts([port], {fqbn: 'arduino:avr:uno'})).toEqual([
        {...port, identification: 'verified'}
    ]);
});

test('does not preselect a port when multiple candidates are detected', () => {
    const ports = [{address: 'COM4'}, {address: 'COM5'}];
    expect(getPreselectedPort(ports, '')).toBe('');
    expect(getPreselectedPort(ports, 'COM5')).toBe('COM5');
});

test('preselects the only candidate so the user can confirm it', () => {
    expect(getPreselectedPort([{address: 'COM4'}], '')).toBe('COM4');
});

test('matches the Arduino panel width to the selected Stage size', () => {
    expect(getArduinoPanelWidth('small')).toBe(256);
    expect(getArduinoPanelWidth('largeConstrained')).toBe(424);
    expect(getArduinoPanelWidth('large')).toBe(496);
});

test('appends progressive Arduino CLI output', () => {
    expect(appendHardwareOutput('Compilazione…\n', {text: '\u001b[92mSketch uses 924 bytes\u001b[0m\n'})).toBe(
        'Compilazione…\nSketch uses 924 bytes\n'
    );
});

test('does not report hardware failures before the first desktop check completes', () => {
    expect(getInitialDesktopState()).toMatchObject({
        checked: false,
        error: null,
        status: 'idle'
    });
});

test('uses generated Arduino source until the user starts a manual edit', () => {
    expect(getDisplayedSource('generated source', null)).toBe('generated source');
});

test('preserves the manually edited Arduino source, including an empty sketch', () => {
    expect(getDisplayedSource('generated source', 'manual source')).toBe('manual source');
    expect(getDisplayedSource('generated source', '')).toBe('');
});

test('uses the explicit Offline Serial.begin speed for the serial monitor', () => {
    expect(getSerialBaudRate('void setup() {\n  Serial.begin(115200);\n}')).toBe(115200);
    expect(getSerialBaudRate('void setup() {}')).toBeNull();
});
