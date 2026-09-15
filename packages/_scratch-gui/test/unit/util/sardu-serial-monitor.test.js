/* eslint-env jest */
import SarduSerialMonitor from '../../../src/lib/sardu-serial-monitor';

test('opens the selected Offline serial speed and forwards received text', async () => {
    const chunks = [];
    const diagnostics = [];
    const reader = {
        cancel: jest.fn(() => Promise.resolve()),
        read: jest.fn()
            .mockResolvedValueOnce({done: false, value: new TextEncoder().encode('hello\n')})
            .mockResolvedValueOnce({done: true}),
        releaseLock: jest.fn()
    };
    const port = {
        close: jest.fn(() => Promise.resolve()),
        open: jest.fn(() => Promise.resolve()),
        readable: {getReader: () => reader}
    };
    const monitor = new SarduSerialMonitor(
        {requestPort: jest.fn(() => Promise.resolve(port))},
        text => chunks.push(text),
        diagnostic => diagnostics.push(diagnostic)
    );

    await monitor.connect(9600);
    await monitor.readTask;

    expect(port.open).toHaveBeenCalledWith({baudRate: 9600});
    expect(chunks).toEqual(['hello\n']);
    expect(diagnostics).toContainEqual({stage: 'serial-monitor-opened', detail: 'baud=9600'});
});

test('rejects an invalid Offline serial speed', async () => {
    const monitor = new SarduSerialMonitor({});
    await expect(monitor.connect(0)).rejects.toThrow('Invalid serial monitor baud rate');
});
