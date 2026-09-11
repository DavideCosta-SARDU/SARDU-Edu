/* eslint-env jest */
import makeToolboxXML from '../../../src/lib/make-toolbox-xml';

describe('SARDU Edu toolbox modes', () => {
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
