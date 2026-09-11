/* eslint-env jest */
import SarduSerialTransport from '../../../src/lib/sardu-serial-transport';

test('reports unsupported browsers before requesting a port', async () => {
    const diagnostics = [];
    const transport = new SarduSerialTransport(null, diagnostic => diagnostics.push(diagnostic));
    expect(transport.supported).toBe(false);
    await expect(transport.connect()).rejects.toThrow('Web Serial is not available in this browser');
    expect(diagnostics).toEqual([
        {stage: 'connect-start'},
        {stage: 'connect-error', detail: 'Web Serial is not available in this browser'}
    ]);
});

test('reports each Live handshake stage', () => {
    const diagnostics = [];
    const transport = new SarduSerialTransport({}, diagnostic => diagnostics.push(diagnostic));

    transport._diagnose('handshake-sent');
    transport._diagnose('handshake-response', 'SARDU-LIVE 1');

    expect(diagnostics).toEqual([
        {stage: 'handshake-sent'},
        {stage: 'handshake-response', detail: 'SARDU-LIVE 1'}
    ]);
});

test('encodes digital writes for the SARDU Live firmware', async () => {
    const write = jest.fn(() => Promise.resolve());
    const diagnostics = [];
    const transport = new SarduSerialTransport({}, diagnostic => diagnostics.push(diagnostic));
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
    const transport = new SarduSerialTransport({});
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

test('clears a selected port even when opening it fails', async () => {
    const close = jest.fn();
    const port = {
        close,
        open: jest.fn(() => Promise.reject(new Error('open failed')))
    };
    const transport = new SarduSerialTransport({requestPort: jest.fn(() => Promise.resolve(port))});

    await expect(transport.connect()).rejects.toThrow('open failed');

    expect(close).not.toHaveBeenCalled();
    expect(transport.port).toBeNull();
    expect(transport.connected).toBe(false);
});
