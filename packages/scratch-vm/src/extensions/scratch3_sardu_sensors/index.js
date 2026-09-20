const formatMessage = require('format-message');
const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');

class Scratch3SarduSensors {
    constructor (runtime) {
        this.runtime = runtime;
        this.rfidConfigurations = {PN532: null, RC522: null};
    }

    getInfo () {
        const selection = this.runtime?.sarduEdu?.hardwareSelection;
        const pins = selection?.digitalOutputPins?.length ? selection.digitalOutputPins :
            ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'];
        const dhtUnavailable = !selection?.componentIds?.includes('dht11-dht22');
        const ultrasonicUnavailable = !selection?.componentIds?.includes('hc-sr04');
        const touchUnavailable = !selection?.componentIds?.includes('touch');
        const soundUnavailable = !selection?.componentIds?.includes('sound-sensor');
        const lightUnavailable = !selection?.componentIds?.includes('photoresistor');
        const laserUnavailable = !selection?.componentIds?.includes('vl53l0x');
        const i2cPins = selection?.busPins?.i2c || {};
        const spiPins = selection?.busPins?.spi || {};
        const rfidArguments = {
            SDA: {type: ArgumentType.STRING, menu: 'DIGITAL_PIN', defaultValue: i2cPins.sda || pins[0]},
            SCL: {type: ArgumentType.STRING, menu: 'DIGITAL_PIN', defaultValue: i2cPins.scl || pins[1] || pins[0]},
            MOSI: {type: ArgumentType.STRING, menu: 'DIGITAL_PIN', defaultValue: spiPins.mosi || pins[0]},
            MISO: {type: ArgumentType.STRING, menu: 'DIGITAL_PIN', defaultValue: spiPins.miso || pins[1] || pins[0]},
            SCK: {type: ArgumentType.STRING, menu: 'DIGITAL_PIN', defaultValue: spiPins.sck || pins[2] || pins[0]},
            SS: {type: ArgumentType.STRING, menu: 'DIGITAL_PIN', defaultValue: spiPins.ss || pins[3] || pins[0]},
            IRQ: {type: ArgumentType.STRING, menu: 'DIGITAL_PIN', defaultValue: '2'},
            RESET: {type: ArgumentType.STRING, menu: 'DIGITAL_PIN', defaultValue: '3'}
        };
        return {
            id: 'sarduSensors',
            name: formatMessage({
                id: 'sarduSensors.name',
                default: 'Sensors',
                description: 'SARDU Edu sensors block category'
            }),
            color1: '#2E7D32',
            color2: '#256428',
            color3: '#19461C',
            blocks: [
                {
                    opcode: 'dhtTemperature',
                    text: formatMessage({
                        id: 'sarduSensors.dhtTemperature',
                        default: '[MODEL] temperature on pin [PIN]',
                        description: 'Read integer temperature from a DHT sensor'
                    }),
                    blockType: BlockType.REPORTER,
                    disableMonitor: true,
                    hideFromPalette: dhtUnavailable,
                    tooltip: formatMessage({
                        id: 'sarduSensors.dhtTemperature.tooltip',
                        default: 'Reads the DHT temperature as an integer.',
                        description: 'Tooltip for DHT temperature reporter'
                    }),
                    arguments: {
                        MODEL: {type: ArgumentType.STRING, menu: 'DHT_MODEL', defaultValue: 'DHT11'},
                        PIN: {type: ArgumentType.STRING, menu: 'DIGITAL_PIN', defaultValue: '2'}
                    }
                },
                {
                    opcode: 'dhtHumidity',
                    text: formatMessage({
                        id: 'sarduSensors.dhtHumidity',
                        default: '[MODEL] humidity on pin [PIN]',
                        description: 'Read integer humidity from a DHT sensor'
                    }),
                    blockType: BlockType.REPORTER,
                    disableMonitor: true,
                    hideFromPalette: dhtUnavailable,
                    tooltip: formatMessage({
                        id: 'sarduSensors.dhtHumidity.tooltip',
                        default: 'Reads the DHT humidity as an integer.',
                        description: 'Tooltip for DHT humidity reporter'
                    }),
                    arguments: {
                        MODEL: {type: ArgumentType.STRING, menu: 'DHT_MODEL', defaultValue: 'DHT11'},
                        PIN: {type: ArgumentType.STRING, menu: 'DIGITAL_PIN', defaultValue: '2'}
                    }
                },
                {
                    opcode: 'ultrasonicDistance',
                    text: formatMessage({
                        id: 'sarduSensors.ultrasonicDistance',
                        default: 'HC-SR04 distance trigger [TRIGGER] echo [ECHO] in [UNIT]',
                        description: 'Read distance from an HC-SR04 ultrasonic sensor'
                    }),
                    blockType: BlockType.REPORTER,
                    disableMonitor: true,
                    hideFromPalette: ultrasonicUnavailable,
                    tooltip: formatMessage({
                        id: 'sarduSensors.ultrasonicDistance.tooltip',
                        default: 'Measures distance with an HC-SR04 in centimetres or inches.',
                        description: 'Tooltip for HC-SR04 distance reporter'
                    }),
                    arguments: {
                        TRIGGER: {type: ArgumentType.STRING, menu: 'DIGITAL_PIN', defaultValue: '7'},
                        ECHO: {type: ArgumentType.STRING, menu: 'DIGITAL_PIN', defaultValue: '8'},
                        UNIT: {type: ArgumentType.STRING, menu: 'DISTANCE_UNIT', defaultValue: 'cm'}
                    }
                }, {
                    opcode: 'laserDistance',
                    text: formatMessage({id: 'sarduSensors.laserDistance', default: 'VL53L0X distance in [UNIT]', description: 'VL53L0X distance reporter'}),
                    blockType: BlockType.REPORTER, disableMonitor: true, hideFromPalette: laserUnavailable,
                    tooltip: formatMessage({id: 'sarduSensors.laserDistance.tooltip', default: 'Reads the laser time-of-flight distance over I2C.', description: 'VL53L0X distance tooltip'}),
                    arguments: {UNIT: {type: ArgumentType.STRING, menu: 'LASER_UNIT', defaultValue: 'mm'}}
                }, {
                    opcode: 'touch', text: formatMessage({id: 'sarduSensors.touch', default: 'touch [PIN]', description: 'Touch sensor Boolean reporter'}),
                    blockType: BlockType.BOOLEAN, disableMonitor: true, hideFromPalette: touchUnavailable,
                    tooltip: formatMessage({id: 'sarduSensors.touch.tooltip', default: 'Returns true when the digital touch sensor is active.', description: 'Touch Boolean reporter tooltip'}),
                    arguments: {PIN: {type: ArgumentType.STRING, menu: 'TOUCH_PIN', defaultValue: 'A0'}}
                }, {
                    opcode: 'soundLevel', text: formatMessage({id: 'sarduSensors.soundLevel', default: 'sound level on [PIN] as [FORMAT]', description: 'Sound level reporter'}),
                    blockType: BlockType.REPORTER, disableMonitor: true, hideFromPalette: soundUnavailable,
                    tooltip: formatMessage({id: 'sarduSensors.soundLevel.tooltip', default: 'Reads the microphone input as 0–1023 or 0–100 percent.', description: 'Sound level tooltip'}),
                    arguments: {PIN: {type: ArgumentType.STRING, menu: 'ANALOG_PIN', defaultValue: 'A1'}, FORMAT: {type: ArgumentType.STRING, menu: 'VALUE_FORMAT', defaultValue: 'raw'}}
                }, {
                    opcode: 'lightLevel', text: formatMessage({id: 'sarduSensors.lightLevel', default: 'light level on [PIN] as [FORMAT]', description: 'Light level reporter'}),
                    blockType: BlockType.REPORTER, disableMonitor: true, hideFromPalette: lightUnavailable,
                    tooltip: formatMessage({id: 'sarduSensors.lightLevel.tooltip', default: 'Reads the light input; in percent mode 100 means maximum brightness.', description: 'Light level tooltip'}),
                    arguments: {PIN: {type: ArgumentType.STRING, menu: 'ANALOG_PIN', defaultValue: 'A6'}, FORMAT: {type: ArgumentType.STRING, menu: 'VALUE_FORMAT', defaultValue: 'percent'}}
                }, {
                    opcode: 'rfidConfigurePn532I2c', text: formatMessage({id: 'sarduSensors.rfidConfigurePn532I2c', default: 'configure PN532 I2C SDA [SDA] SCL [SCL]', description: 'Configure PN532 using simple I2C wiring'}),
                    blockType: BlockType.COMMAND, hideFromPalette: !selection?.componentIds?.includes('pn532'),
                    tooltip: formatMessage({id: 'sarduSensors.rfidConfigurePn532I2c.tooltip', default: 'Uses the Adafruit PN532 library over I2C; IRQ and reset may remain disconnected.', description: 'Simple PN532 I2C configuration tooltip'}),
                    arguments: {SDA: rfidArguments.SDA, SCL: rfidArguments.SCL}
                }, {
                    opcode: 'rfidConfigurePn532I2cAdvanced', text: formatMessage({id: 'sarduSensors.rfidConfigurePn532I2cAdvanced', default: 'configure PN532 I2C advanced SDA [SDA] SCL [SCL] IRQ [IRQ] reset [RESET]', description: 'Configure PN532 using I2C with IRQ and reset'}),
                    blockType: BlockType.COMMAND, hideFromPalette: !selection?.componentIds?.includes('pn532'),
                    tooltip: formatMessage({id: 'sarduSensors.rfidConfigurePn532I2cAdvanced.tooltip', default: 'Uses PN532 I2C with explicit IRQ and reset pins.', description: 'Advanced PN532 I2C configuration tooltip'}),
                    arguments: {SDA: rfidArguments.SDA, SCL: rfidArguments.SCL, IRQ: rfidArguments.IRQ, RESET: rfidArguments.RESET}
                }, {
                    opcode: 'rfidConfigurePn532Spi', text: formatMessage({id: 'sarduSensors.rfidConfigurePn532Spi', default: 'configure PN532 SPI MOSI [MOSI] MISO [MISO] SCK [SCK] SS [SS]', description: 'Configure PN532 using SPI'}),
                    blockType: BlockType.COMMAND, hideFromPalette: !selection?.componentIds?.includes('pn532'),
                    tooltip: formatMessage({id: 'sarduSensors.rfidConfigurePn532Spi.tooltip', default: 'Uses PN532 over SPI with configurable bus pins.', description: 'PN532 SPI configuration tooltip'}),
                    arguments: {MOSI: rfidArguments.MOSI, MISO: rfidArguments.MISO, SCK: rfidArguments.SCK, SS: rfidArguments.SS}
                }, {
                    opcode: 'rfidConfigureRc522Spi', text: formatMessage({id: 'sarduSensors.rfidConfigureRc522Spi', default: 'configure RC522 SPI MOSI [MOSI] MISO [MISO] SCK [SCK] SS [SS] reset [RESET]', description: 'Configure RC522 using SPI'}),
                    blockType: BlockType.COMMAND, hideFromPalette: !selection?.componentIds?.includes('rc522'),
                    tooltip: formatMessage({id: 'sarduSensors.rfidConfigureRc522Spi.tooltip', default: 'Uses RC522 over SPI with configurable bus and reset pins.', description: 'RC522 SPI configuration tooltip'}),
                    arguments: {MOSI: rfidArguments.MOSI, MISO: rfidArguments.MISO, SCK: rfidArguments.SCK, SS: rfidArguments.SS, RESET: rfidArguments.RESET}
                }, ...this._rfidBlocks(formatMessage, 'pn532', !selection?.componentIds?.includes('pn532'), false),
                ...this._rfidBlocks(formatMessage, 'rc522', !selection?.componentIds?.includes('rc522'), false),
                ...this._rfidBlocks(formatMessage, 'pn532', !selection?.componentIds?.includes('pn532'), true),
                ...this._rfidBlocks(formatMessage, 'rc522', !selection?.componentIds?.includes('rc522'), true)
            ],
            menus: {
                DHT_MODEL: {acceptReporters: false, items: ['DHT11', 'DHT22']},
                DIGITAL_PIN: {acceptReporters: false, items: pins},
                DISTANCE_UNIT: {acceptReporters: false, items: ['cm', 'inch']},
                LASER_UNIT: {acceptReporters: false, items: ['mm', 'cm']},
                TOUCH_PIN: {acceptReporters: false, items: ['A0', 'A2', 'A3']},
                ANALOG_PIN: {acceptReporters: false, items: selection?.analogInputPins || ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6']},
                VALUE_FORMAT: {acceptReporters: false, items: [{text: '0–1023', value: 'raw'}, {text: '0–100%', value: 'percent'}]},
                RFID_KEY_TYPE: {acceptReporters: false, items: ['A', 'B']}
            }
        };
    }

    dhtTemperature (args) {
        if (this.runtime?.sarduEdu?.hardwareSelection?.mode !== 'realtime') return 0;
        const transport = this.runtime.sarduEduLiveTransport;
        if (!transport?.connected) return Promise.reject(new Error('SARDU Edu live transport is not connected in dhtTemperature'));
        return transport.readDht(String(args.MODEL), String(args.PIN), 'temperature').then(value => Math.trunc(value));
    }

    dhtHumidity (args) {
        if (this.runtime?.sarduEdu?.hardwareSelection?.mode !== 'realtime') return 0;
        const transport = this.runtime.sarduEduLiveTransport;
        if (!transport?.connected) return Promise.reject(new Error('SARDU Edu live transport is not connected in dhtHumidity'));
        return transport.readDht(String(args.MODEL), String(args.PIN), 'humidity').then(value => Math.trunc(value));
    }

    ultrasonicDistance (args) {
        if (this.runtime?.sarduEdu?.hardwareSelection?.mode !== 'realtime') return 0;
        const transport = this.runtime.sarduEduLiveTransport;
        if (!transport?.connected) return Promise.reject(new Error('SARDU Edu live transport is not connected in ultrasonicDistance'));
        return transport.readUltrasonic(String(args.TRIGGER), String(args.ECHO), String(args.UNIT));
    }

    laserDistance (args) {
        if (this.runtime?.sarduEdu?.hardwareSelection?.mode !== 'realtime') return 0;
        const transport = this.runtime.sarduEduLiveTransport;
        if (!transport?.connected) return Promise.reject(new Error('SARDU Edu live transport is not connected in laserDistance'));
        return transport.readLaserDistance(String(args.UNIT));
    }

    touch (args) {
        if (this.runtime?.sarduEdu?.hardwareSelection?.mode !== 'realtime') return false;
        const transport = this.runtime.sarduEduLiveTransport;
        if (!transport?.connected) return false;
        return transport.readDigital(String(args.PIN)).then(value => value === 1);
    }

    soundLevel (args) {
        return this._analogLevel(args, false);
    }

    lightLevel (args) {
        return this._analogLevel(args, true);
    }

    rfidConfigurePn532I2c (args) { this._configureRfid('PN532', 'I2C', args); }
    rfidConfigurePn532I2cAdvanced (args) { this._configureRfid('PN532', 'I2C_IRQ', args); }
    rfidConfigurePn532Spi (args) { this._configureRfid('PN532', 'SPI', args); }
    rfidConfigureRc522Spi (args) { this._configureRfid('RC522', 'SPI', args); }

    pn532TagPresent () { return this._rfid('PN532', 'P').then(value => value === '1'); }
    pn532Uid () { return this._rfid('PN532', 'U'); }
    pn532TagType () { return this._rfid('PN532', 'T'); }
    pn532ReadBlock (args) { return this._rfid('PN532', 'R', args.BLOCK); }
    pn532Authenticate (args) { return this._rfid('PN532', 'A', args.BLOCK, args.KEY_TYPE, args.KEY).then(value => value === '1'); }
    pn532WriteBlock (args) { return this._rfid('PN532', 'W', args.BLOCK, args.DATA).then(value => value === '1'); }
    rc522TagPresent () { return this._rfid('RC522', 'P').then(value => value === '1'); }
    rc522Uid () { return this._rfid('RC522', 'U'); }
    rc522TagType () { return this._rfid('RC522', 'T'); }
    rc522ReadBlock (args) { return this._rfid('RC522', 'R', args.BLOCK); }
    rc522Authenticate (args) { return this._rfid('RC522', 'A', args.BLOCK, args.KEY_TYPE, args.KEY).then(value => value === '1'); }
    rc522WriteBlock (args) { return this._rfid('RC522', 'W', args.BLOCK, args.DATA).then(value => value === '1'); }

    // Common RFID opcodes resolve to PN532 so saved projects have deterministic behavior.
    rfidTagPresent () { return this.pn532TagPresent(); }
    rfidUid () { return this.pn532Uid(); }
    rfidTagType () { return this.pn532TagType(); }
    rfidReadBlock (args) { return this.pn532ReadBlock(args); }
    rfidAuthenticate (args) { return this.pn532Authenticate(args); }
    rfidWriteBlock (args) { return this.pn532WriteBlock(args); }

    _rfid (reader, action, ...values) {
        if (this.runtime?.sarduEdu?.hardwareSelection?.mode !== 'realtime') return Promise.resolve('');
        const configuration = this.rfidConfigurations[reader];
        if (!configuration) return Promise.reject(new Error(`Configure the ${reader} reader before using it`));
        const bus = String(configuration.BUS).toUpperCase();
        if (reader === 'RC522' && bus !== 'SPI') return Promise.reject(new Error('RC522 supports SPI only'));
        const transport = this.runtime.sarduEduLiveTransport;
        if (!transport?.connected) return Promise.reject(new Error('SARDU Edu live transport is not connected in RFID operation'));
        return transport.runRfid(reader, bus, configuration.SDA, configuration.SCL, configuration.MOSI,
            configuration.MISO, configuration.SCK, configuration.SS, configuration.IRQ, configuration.RESET,
            action, ...values);
    }

    _configureRfid (reader, bus, args) {
        this.rfidConfigurations[reader] = {
            READER: reader, BUS: bus,
            SDA: args.SDA ?? -1, SCL: args.SCL ?? -1, MOSI: args.MOSI ?? -1, MISO: args.MISO ?? -1,
            SCK: args.SCK ?? -1, SS: args.SS ?? -1, IRQ: args.IRQ ?? -1, RESET: args.RESET ?? -1
        };
    }

    _rfidBlocks (formatMessage, prefix, hidden, advanced) {
        const common = (suffix, blockType, text, tooltip, blockArguments) => ({
            opcode: `${prefix}${suffix}`, text,
            blockType, disableMonitor: blockType !== BlockType.COMMAND, hideFromPalette: hidden,
            tooltip,
            ...(blockArguments ? {arguments: blockArguments} : {})
        });
        const messages = prefix === 'pn532' ? {
            tagPresent: formatMessage({id: 'sarduSensors.pn532TagPresent', default: 'PN532 tag present?', description: 'PN532 RFID tag presence block'}),
            tagPresentTooltip: formatMessage({id: 'sarduSensors.pn532TagPresent.tooltip', default: 'Checks whether the PN532 detects a tag.', description: 'PN532 RFID tag presence tooltip'}),
            uid: formatMessage({id: 'sarduSensors.pn532Uid', default: 'PN532 tag UID', description: 'PN532 RFID UID block'}),
            uidTooltip: formatMessage({id: 'sarduSensors.pn532Uid.tooltip', default: 'Returns the PN532 tag UID.', description: 'PN532 RFID UID tooltip'}),
            type: formatMessage({id: 'sarduSensors.pn532TagType', default: 'PN532 tag type', description: 'PN532 RFID tag type block'}),
            typeTooltip: formatMessage({id: 'sarduSensors.pn532TagType.tooltip', default: 'Returns the PN532 tag type.', description: 'PN532 RFID tag type tooltip'}),
            authenticate: formatMessage({id: 'sarduSensors.pn532Authenticate', default: 'PN532 authenticate block [BLOCK] key [KEY_TYPE] [KEY]', description: 'PN532 RFID authentication block'}),
            authenticateTooltip: formatMessage({id: 'sarduSensors.pn532Authenticate.tooltip', default: 'Authenticates a PN532 block.', description: 'PN532 RFID authentication tooltip'}),
            read: formatMessage({id: 'sarduSensors.pn532ReadBlock', default: 'PN532 read block [BLOCK]', description: 'PN532 RFID read block'}),
            readTooltip: formatMessage({id: 'sarduSensors.pn532ReadBlock.tooltip', default: 'Reads 16 bytes from the PN532.', description: 'PN532 RFID read tooltip'}),
            write: formatMessage({id: 'sarduSensors.pn532WriteBlock', default: 'PN532 write block [BLOCK] data [DATA]', description: 'PN532 RFID write block'}),
            writeTooltip: formatMessage({id: 'sarduSensors.pn532WriteBlock.tooltip', default: 'Writes 16 bytes with the PN532.', description: 'PN532 RFID write tooltip'})
        } : {
            tagPresent: formatMessage({id: 'sarduSensors.rc522TagPresent', default: 'RC522 tag present?', description: 'RC522 RFID tag presence block'}),
            tagPresentTooltip: formatMessage({id: 'sarduSensors.rc522TagPresent.tooltip', default: 'Checks whether the RC522 detects a tag.', description: 'RC522 RFID tag presence tooltip'}),
            uid: formatMessage({id: 'sarduSensors.rc522Uid', default: 'RC522 tag UID', description: 'RC522 RFID UID block'}),
            uidTooltip: formatMessage({id: 'sarduSensors.rc522Uid.tooltip', default: 'Returns the RC522 tag UID.', description: 'RC522 RFID UID tooltip'}),
            type: formatMessage({id: 'sarduSensors.rc522TagType', default: 'RC522 tag type', description: 'RC522 RFID tag type block'}),
            typeTooltip: formatMessage({id: 'sarduSensors.rc522TagType.tooltip', default: 'Returns the RC522 tag type.', description: 'RC522 RFID tag type tooltip'}),
            authenticate: formatMessage({id: 'sarduSensors.rc522Authenticate', default: 'RC522 authenticate block [BLOCK] key [KEY_TYPE] [KEY]', description: 'RC522 RFID authentication block'}),
            authenticateTooltip: formatMessage({id: 'sarduSensors.rc522Authenticate.tooltip', default: 'Authenticates an RC522 block.', description: 'RC522 RFID authentication tooltip'}),
            read: formatMessage({id: 'sarduSensors.rc522ReadBlock', default: 'RC522 read block [BLOCK]', description: 'RC522 RFID read block'}),
            readTooltip: formatMessage({id: 'sarduSensors.rc522ReadBlock.tooltip', default: 'Reads 16 bytes from the RC522.', description: 'RC522 RFID read tooltip'}),
            write: formatMessage({id: 'sarduSensors.rc522WriteBlock', default: 'RC522 write block [BLOCK] data [DATA]', description: 'RC522 RFID write block'}),
            writeTooltip: formatMessage({id: 'sarduSensors.rc522WriteBlock.tooltip', default: 'Writes 16 bytes with the RC522.', description: 'RC522 RFID write tooltip'})
        };
        const commonBlocks = [
            common('TagPresent', BlockType.BOOLEAN, messages.tagPresent, messages.tagPresentTooltip),
            common('Uid', BlockType.REPORTER, messages.uid, messages.uidTooltip),
            common('TagType', BlockType.REPORTER, messages.type, messages.typeTooltip)
        ];
        const advancedBlocks = [
            common('Authenticate', BlockType.BOOLEAN, messages.authenticate, messages.authenticateTooltip, {BLOCK: {type: ArgumentType.NUMBER, defaultValue: 4}, KEY_TYPE: {type: ArgumentType.STRING, menu: 'RFID_KEY_TYPE', defaultValue: 'A'}, KEY: {type: ArgumentType.STRING, defaultValue: 'FFFFFFFFFFFF'}}),
            common('ReadBlock', BlockType.REPORTER, messages.read, messages.readTooltip, {BLOCK: {type: ArgumentType.NUMBER, defaultValue: 4}}),
            common('WriteBlock', BlockType.COMMAND, messages.write, messages.writeTooltip, {BLOCK: {type: ArgumentType.NUMBER, defaultValue: 4}, DATA: {type: ArgumentType.STRING, defaultValue: '00000000000000000000000000000000'}})
        ];
        return advanced ? advancedBlocks : commonBlocks;
    }

    _analogLevel (args, invert) {
        if (this.runtime?.sarduEdu?.hardwareSelection?.mode !== 'realtime') return 0;
        const transport = this.runtime.sarduEduLiveTransport;
        if (!transport?.connected) return Promise.reject(new Error('SARDU Edu live transport is not connected'));
        return transport.readAnalog(String(args.PIN)).then(raw => args.FORMAT === 'percent' ?
            Math.round((invert ? 1023 - raw : raw) * 100 / 1023) : raw);
    }
}

module.exports = Scratch3SarduSensors;
