/* eslint-env jest */
import makeToolboxXML from '../../../src/lib/make-toolbox-xml';

describe('SARDU-Block toolbox modes', () => {
    const originalScratchBlocks = global.ScratchBlocks;

    beforeAll(() => {
        global.ScratchBlocks = {
            ScratchMsgs: {
                translate: (id, fallback) => fallback
            }
        };
    });

    afterAll(() => {
        global.ScratchBlocks = originalScratchBlocks;
    });

    test('removes every hardware category when no board is selected', () => {
        const toolbox = makeToolboxXML(false, true, 'stage', [
            {id: 'sarduBoard', xml: '<category name="Scheda"/>'},
            {id: 'sarduSensors', xml: '<category name="Sensori"/>'},
            {id: 'sarduActuators', xml: '<category name="Attuatori"/>'},
            {id: 'sarduWifi', xml: '<category name="ESP32 - Wi-Fi"/>'}
        ]);
        expect(toolbox).not.toContain('name="Scheda"');
        expect(toolbox).not.toContain('name="Sensori"');
        expect(toolbox).not.toContain('name="Attuatori"');
        expect(toolbox).not.toContain('ESP32 - Wi-Fi');
    });

    test('keeps the unified Arduino program block available in Offline mode', () => {
        const toolbox = makeToolboxXML(
            false,
            true,
            'stage',
            [],
            '',
            '',
            '',
            undefined,
            {mode: 'standalone'}
        );

        expect(toolbox).toContain('<block type="sarduBoard_program"/>');
    });

    test('keeps the existing Offline program block visible but disables a second copy', () => {
        const toolbox = makeToolboxXML(
            false,
            true,
            'stage',
            [],
            '',
            '',
            '',
            undefined,
            {mode: 'standalone'},
            true
        );

        expect(toolbox).toContain('<block type="sarduBoard_program" disabled="true"/>');
    });

    test('does not expose the Offline program block in Live mode', () => {
        const toolbox = makeToolboxXML(
            false,
            true,
            'stage',
            [],
            '',
            '',
            '',
            undefined,
            {mode: 'realtime'}
        );

        expect(toolbox).not.toContain('<block type="sarduBoard_program"/>');
    });

    test('labels DHT blocks with their sensor model', () => {
        const toolbox = makeToolboxXML(
            false,
            true,
            'stage',
            [{id: 'sarduSensors', xml: '<category name="Sensori"><block type="sarduSensors_dhtTemperature"/></category>'}],
            '',
            '',
            '',
            undefined,
            {mode: 'standalone'}
        );

        expect(toolbox).toContain('<label text="DHT11/DHT22"/>');
    });

    test('uses the localized advanced RFID label', () => {
        const toolbox = makeToolboxXML(
            false,
            true,
            'stage',
            [{
                id: 'sarduSensors',
                xml: '<category name="Sensori"><block type="sarduSensors_pn532Authenticate"/></category>'
            }],
            '',
            '',
            '',
            undefined,
            {mode: 'standalone'},
            false,
            {'gui.sarduBlock.rfidAdvanced': 'Avanzate'}
        );

        expect(toolbox).toContain('<label text="Avanzate"/>');
    });

    test('labels the selected OLED actuator blocks', () => {
        const toolbox = makeToolboxXML(
            false,
            true,
            'stage',
            [{
                id: 'sarduActuators',
                xml: '<category name="Attuatori"><block type="sarduActuators_initializeOled"/></category>'
            }],
            '',
            '',
            '',
            undefined,
            {mode: 'standalone', componentIds: ['oled-ssd1306']}
        );

        expect(toolbox).toContain('<label text="OLED SSD1306 I2C"/>');
    });

    test('labels the selected push button blocks', () => {
        const toolbox = makeToolboxXML(false, true, 'stage', [{
            id: 'sarduSensors',
            xml: '<category name="Sensori"><block type="sarduSensors_configureButton"/></category>'
        }], '', '', '', undefined, {mode: 'standalone', componentIds: ['button']});

        expect(toolbox).toContain('<label text="Pulsante"/>');
    });

    test('labels the selected SH1106 actuator blocks', () => {
        const toolbox = makeToolboxXML(false, true, 'stage', [{
            id: 'sarduActuators',
            xml: '<category name="Attuatori"><block type="sarduActuators_initializeSh1106"/></category>'
        }], '', '', '', undefined, {mode: 'standalone', componentIds: ['oled-sh1106']});
        expect(toolbox).toContain('<label text="OLED SH1106 1.3&quot; I2C"/>');
    });

    test('places Arduino variables in a separate section of the Variables category', () => {
        const toolbox = makeToolboxXML(
            false,
            true,
            'stage',
            [{id: 'sarduBoard', xml: '<category name="Arduino Uno"></category>'}],
            '',
            '',
            '',
            undefined,
            {mode: 'standalone'}
        );

        expect(toolbox).toContain('<label text="Variabili Arduino"/>');
        expect(toolbox).toContain('<block type="sarduBoard_declareArduinoVariable">');
        expect(toolbox).toContain('<block type="sarduBoard_convertValue">');
    });
});
