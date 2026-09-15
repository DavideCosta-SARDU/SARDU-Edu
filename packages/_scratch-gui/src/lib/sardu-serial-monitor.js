class SarduSerialMonitor {
    constructor (
        serial = (typeof navigator === 'undefined' ? null : navigator.serial),
        onData = null,
        onDiagnostic = null
    ) {
        this.serial = serial;
        this.onData = onData;
        this.onDiagnostic = onDiagnostic;
        this.port = null;
        this.reader = null;
        this.readTask = null;
        this.active = false;
    }

    get supported () {
        return Boolean(this.serial);
    }

    get connected () {
        return Boolean(this.port);
    }

    async connect (baudRate) {
        if (!Number.isInteger(baudRate) || baudRate <= 0 || baudRate > 2_000_000) {
            throw new Error(`Invalid serial monitor baud rate: ${baudRate}`);
        }
        if (!this.supported) throw new Error('Web Serial is not available in this browser');
        if (this.connected) return;

        this._diagnose('serial-monitor-opening', `baud=${baudRate}`);
        try {
            this.port = await this.serial.requestPort();
            await this.port.open({baudRate});
            this.reader = this.port.readable.getReader();
            this.active = true;
            this._diagnose('serial-monitor-opened', `baud=${baudRate}`);
            this.readTask = this._readLoop();
        } catch (error) {
            this._diagnose('serial-monitor-error', error.message);
            await this.disconnect();
            throw error;
        }
    }

    async disconnect () {
        const reader = this.reader;
        const port = this.port;
        this.active = false;
        if (reader) await reader.cancel().catch(() => {});
        if (this.readTask) await this.readTask.catch(() => {});
        this.reader = null;
        this.readTask = null;
        this.port = null;
        if (port) await port.close();
        if (port) this._diagnose('serial-monitor-closed');
    }

    async _readLoop () {
        const decoder = new TextDecoder();
        try {
            while (this.active && this.reader) {
                const {done, value} = await this.reader.read();
                if (done) break;
                const text = decoder.decode(value, {stream: true});
                if (text && this.onData) this.onData(text);
                this._diagnose('serial-monitor-data', `bytes=${value.byteLength}`);
            }
            const tail = decoder.decode();
            if (tail && this.onData) this.onData(tail);
        } catch (error) {
            if (this.active) {
                this._diagnose('serial-monitor-error', error.message);
            }
        } finally {
            if (this.reader) this.reader.releaseLock();
            this.active = false;
        }
    }

    _diagnose (stage, detail) {
        if (!this.onDiagnostic) return;
        this.onDiagnostic({stage, ...(detail ? {detail} : {})});
    }
}

export default SarduSerialMonitor;
