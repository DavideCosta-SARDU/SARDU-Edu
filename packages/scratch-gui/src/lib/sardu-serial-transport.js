const LIVE_BAUD_RATE = 115200;
const STARTUP_DELAY = 1500;
const HANDSHAKE_TIMEOUT = 2000;
const LIVE_FIRMWARE_SIGNATURES = ['SARDU-BLOCK-LIVE 10', 'SARDU-LIVE 9'];

const delay = milliseconds => new Promise(resolve => window.setTimeout(resolve, milliseconds));
const protocolPin = pin => {
    const analogMatch = /^A([0-7])$/.exec(pin);
    return analogMatch ? 14 + Number(analogMatch[1]) : pin;
};

class SarduBlockSerialTransport {
    constructor (serial = (typeof navigator === 'undefined' ? null : navigator.serial), onDiagnostic = null) {
        this.serial = serial;
        this.onDiagnostic = onDiagnostic;
        this.port = null;
        this.portOpen = false;
        this.writer = null;
        this.requestQueue = Promise.resolve();
    }

    get supported () {
        return Boolean(this.serial);
    }

    get connected () {
        return Boolean(this.port && this.writer);
    }

    async connect () {
        this._diagnose('connect-start');
        if (!this.supported) {
            const error = new Error('Web Serial is not available in this browser');
            this._diagnose('connect-error', error.message);
            throw error;
        }
        if (this.connected) {
            this._diagnose('already-connected');
            return;
        }

        try {
            this.port = await this.serial.requestPort();
            this._diagnose('port-selected');
            await this.port.open({baudRate: LIVE_BAUD_RATE});
            this.portOpen = true;
            this.writer = this.port.writable.getWriter();
            this._diagnose('port-opened', `baud=${LIVE_BAUD_RATE}`);
            await delay(STARTUP_DELAY);
            this._diagnose('startup-wait-complete', `milliseconds=${STARTUP_DELAY}`);
            await this._write('P\n');
            this._diagnose('handshake-sent');
            const response = await this._readLine(HANDSHAKE_TIMEOUT);
            this._diagnose('handshake-response', response || '(empty)');
            if (!LIVE_FIRMWARE_SIGNATURES.includes(response)) {
                throw new Error('The connected board is not running SARDU-Block Live firmware');
            }
            this._diagnose('connected');
        } catch (error) {
            this._diagnose(error.message.includes('timed out') ? 'handshake-timeout' : 'connect-error', error.message);
            await this.disconnect();
            throw error;
        }
    }

    async disconnect () {
        if (this.writer) {
            this.writer.releaseLock();
            this.writer = null;
        }
        const port = this.port;
        const portOpen = this.portOpen;
        this.portOpen = false;
        this.port = null;
        if (port && portOpen) await port.close();
        if (port) this._diagnose('disconnected');
    }

    async writeDigital (pin, level) {
        if (!this.connected) throw new Error('No Arduino board is connected');
        const command = `W ${protocolPin(pin)} ${level === 'HIGH' ? 1 : 0}`;
        await this._write(`${command}\n`);
        this._diagnose('command-complete', `command=${command}`);
    }

    async writeServo (pin, angle) {
        if (!this.connected) throw new Error('No Arduino board is connected');
        const command = `S ${protocolPin(pin)} ${angle}`;
        await this._write(`${command}\n`);
        this._diagnose('command-complete', `command=${command}`);
    }

    readServo (pin) {
        return this._readNumber(`R ${protocolPin(pin)}`);
    }

    readDht (model, pin, measurement) {
        const modelNumber = model === 'DHT22' ? 22 : 11;
        return this._readNumber(`D ${modelNumber} ${protocolPin(pin)} ${measurement === 'humidity' ? 'H' : 'T'}`);
    }

    readUltrasonic (trigger, echo, unit) {
        return this._readNumber(`H ${protocolPin(trigger)} ${protocolPin(echo)} ${unit === 'inch' ? 'I' : 'C'}`);
    }

    readLaserDistance (unit) {
        return this._readNumber(`L ${unit === 'cm' ? 'C' : 'M'}`);
    }

    runNeoPixel (action, pin, ...values) {
        return this._readNumber(`N ${action} ${protocolPin(pin)} ${values.join(' ')}`.trim());
    }

    runDisplay (action, ...values) {
        const encodedValues = action === 'T' ?
            [Array.from(new TextEncoder().encode(String(values[0])))
                .map(value => value.toString(16).padStart(2, '0')).join('').toUpperCase()] :
            values.map(value => protocolPin(String(value)));
        return this._readNumber(`Q ${action} ${encodedValues.join(' ')}`.trim());
    }

    runOled (action, ...values) {
        const encodedValues = action === 'T' ? [
            Array.from(new TextEncoder().encode(String(values[0])))
                .map(value => value.toString(16).padStart(2, '0')).join('').toUpperCase() || '-',
            values[1]
        ] : values.map(value => String(value).startsWith('0x') ? Number(value) : value);
        return this._readNumber(`E ${action} ${encodedValues.join(' ')}`.trim());
    }

    runSh1106 (action, ...values) {
        const encodedValues = action === 'T' ? [
            Array.from(new TextEncoder().encode(String(values[0])))
                .map(value => value.toString(16).padStart(2, '0')).join('').toUpperCase() || '-',
            values[1]
        ] : values.map(value => String(value).startsWith('0x') ? Number(value) : value);
        return this._readNumber(`X ${action} ${encodedValues.join(' ')}`.trim());
    }

    readDigital (pin) { return this._readNumber(`V ${protocolPin(pin)}`); }
    readButton (pin, pullup) { return this._readNumber(`K ${protocolPin(pin)} ${pullup ? 1 : 0}`); }
    readAnalog (pin) { return this._readNumber(`A ${protocolPin(pin)}`); }
    playTone (pin, frequency, milliseconds) { return this._readNumber(`T ${protocolPin(pin)} ${frequency} ${milliseconds}`); }
    runOtto (action, ...values) { return this._readNumber(`O ${action} ${values.join(' ')}`); }
    runRfid (reader, bus, sda, scl, mosi, miso, sck, ss, irq, reset, action, ...values) {
        const pins = [sda, scl, mosi, miso, sck, ss, irq, reset].map(pin => protocolPin(String(pin))).join(' ');
        return this._readResponse(`F ${reader} ${bus} ${pins} ${action} ${values.join(' ')}`.trim());
    }

    readMillis () {
        return this._readCounter('M');
    }

    readMicros () {
        return this._readCounter('U');
    }

    _readCounter (command) {
        return this._readNumber(command);
    }

    _readNumber (command) {
        return this._readResponse(command).then(response => {
            const value = Number(response);
            if (!Number.isFinite(value)) throw new Error(`Invalid SARDU-Block Live response for ${command}`);
            return value;
        });
    }

    _readResponse (command) {
        const request = this.requestQueue.then(async () => {
            if (!this.connected) throw new Error('No Arduino board is connected');
            await this._write(`${command}\n`);
            const response = await this._readLine(HANDSHAKE_TIMEOUT);
            this._diagnose('command-response', `command=${command} response=${response}`);
            return response;
        });
        this.requestQueue = request.catch(() => {});
        return request;
    }

    async _write (command) {
        this._diagnose('serial-write', `command=${command.trimEnd()}`);
        await this.writer.write(new TextEncoder().encode(command));
    }

    async _readLine (timeoutMilliseconds) {
        const reader = this.port.readable.getReader();
        const decoder = new TextDecoder();
        let timeout;
        let received = '';
        let completed = false;
        const read = async () => {
            while (!received.includes('\n')) {
                const {done, value} = await reader.read();
                if (done) break;
                this._diagnose('serial-data', `bytes=${value.byteLength}`);
                received += decoder.decode(value, {stream: true});
            }
            return received.split(/\r?\n/, 1)[0];
        };

        try {
            const line = await Promise.race([
                read(),
                new Promise((_, reject) => {
                    timeout = window.setTimeout(() => reject(new Error('SARDU-Block Live handshake timed out')),
                        timeoutMilliseconds);
                })
            ]);
            completed = true;
            return line;
        } finally {
            window.clearTimeout(timeout);
            if (!completed) {
                await reader.cancel().catch(() => {
                    // A closed serial stream does not need further cancellation.
                });
            }
            reader.releaseLock();
        }
    }

    _diagnose (stage, detail) {
        if (!this.onDiagnostic) return;
        try {
            this.onDiagnostic({stage, ...(detail ? {detail} : {})});
        } catch (error) {
            console.warn('SarduBlockSerialTransport diagnostic callback failed', error);
        }
    }
}

export {
    HANDSHAKE_TIMEOUT,
    LIVE_BAUD_RATE,
    LIVE_FIRMWARE_SIGNATURES,
    STARTUP_DELAY
};
export default SarduBlockSerialTransport;
