/* eslint-env jest */
import SarduBlockSerialTransport, {LIVE_FIRMWARE_SIGNATURES} from '../../../src/lib/sardu-serial-transport';

test('accepts current and historical Live firmware signatures', () => {
    expect(LIVE_FIRMWARE_SIGNATURES).toEqual(['SARDU-BLOCK-LIVE 10', 'SARDU-LIVE 9']);
});

test('reports unsupported browsers before requesting a port', async () => {
    const diagnostics = [];
    const transport = new SarduBlockSerialTransport(null, diagnostic => diagnostics.push(diagnostic));
    expect(transport.supported).toBe(false);
    await expect(transport.connect()).rejects.toThrow('Web Serial is not available in this browser');
    expect(diagnostics).toEqual([
        {stage: 'connect-start'},
        {stage: 'connect-error', detail: 'Web Serial is not available in this browser'}
    ]);
});

test('reports each Live handshake stage', () => {
    const diagnostics = [];
    const transport = new SarduBlockSerialTransport({}, diagnostic => diagnostics.push(diagnostic));

    transport._diagnose('handshake-sent');
    transport._diagnose('handshake-response', 'SARDU-BLOCK-LIVE 10');

    expect(diagnostics).toEqual([
        {stage: 'handshake-sent'},
        {stage: 'handshake-response', detail: 'SARDU-BLOCK-LIVE 10'}
    ]);
});

test('encodes digital writes for the SARDU-Block Live firmware', async () => {
    const write = jest.fn(() => Promise.resolve());
    const diagnostics = [];
    const transport = new SarduBlockSerialTransport({}, diagnostic => diagnostics.push(diagnostic));
    transport.port = {};
    transport.portOpen = true;
    transport.writer = {write};

    await transport.writeDigital('13', 'HIGH');
    await transport.writeDigital('7', 'LOW');
    await transport.writeDigital('A0', 'HIGH');

    const decoder = new TextDecoder();
    expect(write.mock.calls.map(call => decoder.decode(call[0]))).toEqual(['W 13 1\n', 'W 7 0\n', 'W 14 1\n']);
    expect(diagnostics).toEqual([
        {stage: 'serial-write', detail: 'command=W 13 1'},
        {stage: 'command-complete', detail: 'command=W 13 1'},
        {stage: 'serial-write', detail: 'command=W 7 0'},
        {stage: 'command-complete', detail: 'command=W 7 0'},
        {stage: 'serial-write', detail: 'command=W 14 1'},
        {stage: 'command-complete', detail: 'command=W 14 1'}
    ]);
});

test('reads millis and micros from the board protocol', async () => {
    const write = jest.fn(() => Promise.resolve());
    const transport = new SarduBlockSerialTransport({});
    transport.port = {};
    transport.portOpen = true;
    transport.writer = {write};
    transport._readLine = jest.fn()
        .mockResolvedValueOnce('1234')
        .mockResolvedValueOnce('5678');

    await expect(transport.readMillis()).resolves.toBe(1234);
    await expect(transport.readMicros()).resolves.toBe(5678);

    const decoder = new TextDecoder();
    expect(write.mock.calls.map(call => decoder.decode(call[0]))).toEqual(['M\n', 'U\n']);
});

test('encodes both push button input modes', async () => {
    const write = jest.fn(() => Promise.resolve());
    const transport = new SarduBlockSerialTransport({});
    transport.port = {};
    transport.portOpen = true;
    transport.writer = {write};
    transport._readLine = jest.fn().mockResolvedValueOnce('0').mockResolvedValueOnce('1');

    await expect(transport.readButton('2', true)).resolves.toBe(0);
    await expect(transport.readButton('3', false)).resolves.toBe(1);

    const decoder = new TextDecoder();
    expect(write.mock.calls.map(call => decoder.decode(call[0]))).toEqual(['K 2 1\n', 'K 3 0\n']);
});

test('encodes servo, DHT and HC-SR04 Live commands', async () => {
    const write = jest.fn(() => Promise.resolve());
    const transport = new SarduBlockSerialTransport({});
    transport.port = {};
    transport.portOpen = true;
    transport.writer = {write};
    transport._readLine = jest.fn()
        .mockResolvedValueOnce('90')
        .mockResolvedValueOnce('21.5')
        .mockResolvedValueOnce('10');

    await transport.writeServo('9', 90);
    await expect(transport.readServo('9')).resolves.toBe(90);
    await expect(transport.readDht('DHT22', '2', 'temperature')).resolves.toBe(21.5);
    await expect(transport.readUltrasonic('7', '8', 'inch')).resolves.toBe(10);

    const decoder = new TextDecoder();
    expect(write.mock.calls.map(call => decoder.decode(call[0]))).toEqual([
        'S 9 90\n', 'R 9\n', 'D 22 2 T\n', 'H 7 8 I\n'
    ]);
});

test('encodes RFID Live commands and preserves hexadecimal responses', async () => {
    const write = jest.fn(() => Promise.resolve());
    const transport = new SarduBlockSerialTransport({});
    transport.port = {};
    transport.portOpen = true;
    transport.writer = {write};
    transport._readLine = jest.fn().mockResolvedValueOnce('04A1B2C3').mockResolvedValueOnce('1');

    await expect(transport.runRfid('PN532', 'I2C', 'A4', 'A5', '11', '12', '13', '10', '2', '3', 'U'))
        .resolves.toBe('04A1B2C3');
    await expect(transport.runRfid('RC522', 'SPI', 'A4', 'A5', '11', '12', '13', '10', '2', '3',
        'A', 4, 'A', 'FFFFFFFFFFFF'))
        .resolves.toBe('1');

    const decoder = new TextDecoder();
    expect(write.mock.calls.map(call => decoder.decode(call[0]))).toEqual([
        'F PN532 I2C 18 19 11 12 13 10 2 3 U\n',
        'F RC522 SPI 18 19 11 12 13 10 2 3 A 4 A FFFFFFFFFFFF\n'
    ]);
});

test('encodes display Live commands and text without protocol separators', async () => {
    const write = jest.fn(() => Promise.resolve());
    const transport = new SarduBlockSerialTransport({});
    transport.port = {};
    transport.portOpen = true;
    transport.writer = {write};
    transport._readLine = jest.fn().mockResolvedValue('1');

    await transport.runDisplay('I', 39, 16, 4, '21', '22');
    await transport.runDisplay('C', 15, 3);
    await transport.runDisplay('T', 'Valore 42');

    const decoder = new TextDecoder();
    expect(write.mock.calls.map(call => decoder.decode(call[0]))).toEqual([
        'Q I 39 16 4 21 22\n',
        'Q C 15 3\n',
        'Q T 56616C6F7265203432\n'
    ]);
});

test('encodes OLED Live commands and text without protocol separators', async () => {
    const write = jest.fn(() => Promise.resolve());
    const transport = new SarduBlockSerialTransport({});
    transport.port = {};
    transport.portOpen = true;
    transport.writer = {write};
    transport._readLine = jest.fn().mockResolvedValue('1');

    await transport.runOled('I', 128, 64, '0x3C');
    await transport.runOled('T', 'Ciao OLED', 1);
    await transport.runOled('T', '', 0);

    const decoder = new TextDecoder();
    expect(write.mock.calls.map(call => decoder.decode(call[0]))).toEqual([
        'E I 128 64 60\n',
        'E T 4369616F204F4C4544 1\n',
        'E T - 0\n'
    ]);
});

test('encodes SH1106 Live commands and text', async () => {
    const write = jest.fn(() => Promise.resolve());
    const transport = new SarduBlockSerialTransport({});
    transport.port = {};
    transport.portOpen = true;
    transport.writer = {write};
    transport._readLine = jest.fn().mockResolvedValue('1');
    await transport.runSh1106('I', '0x3C');
    await transport.runSh1106('T', 'Ciao SH1106', 1);
    const decoder = new TextDecoder();
    expect(write.mock.calls.map(call => decoder.decode(call[0]))).toEqual([
        'X I 60\n',
        'X T 4369616F20534831313036 1\n'
    ]);
});

test('clears a selected port even when opening it fails', async () => {
    const close = jest.fn();
    const port = {
        close,
        open: jest.fn(() => Promise.reject(new Error('open failed')))
    };
    const transport = new SarduBlockSerialTransport({requestPort: jest.fn(() => Promise.resolve(port))});

    await expect(transport.connect()).rejects.toThrow('open failed');

    expect(close).not.toHaveBeenCalled();
    expect(transport.port).toBeNull();
    expect(transport.connected).toBe(false);
});
