const formatMessage = require('format-message');
const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');

class Scratch3SarduSensors {
    constructor (runtime) {
        this.runtime = runtime;
    }

    getInfo () {
        const selection = this.runtime?.sarduEdu?.hardwareSelection;
        const pins = selection?.digitalOutputPins?.length ? selection.digitalOutputPins :
            ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'];
        const unavailable = selection?.mode !== 'standalone' || !selection?.componentIds?.includes('dht11-dht22');
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
                    hideFromPalette: unavailable,
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
                    hideFromPalette: unavailable,
                    tooltip: formatMessage({
                        id: 'sarduSensors.dhtHumidity.tooltip',
                        default: 'Reads the DHT humidity as an integer.',
                        description: 'Tooltip for DHT humidity reporter'
                    }),
                    arguments: {
                        MODEL: {type: ArgumentType.STRING, menu: 'DHT_MODEL', defaultValue: 'DHT11'},
                        PIN: {type: ArgumentType.STRING, menu: 'DIGITAL_PIN', defaultValue: '2'}
                    }
                }
            ],
            menus: {
                DHT_MODEL: {acceptReporters: false, items: ['DHT11', 'DHT22']},
                DIGITAL_PIN: {acceptReporters: false, items: pins}
            }
        };
    }

    dhtTemperature () {
        return 0;
    }

    dhtHumidity () {
        return 0;
    }
}

module.exports = Scratch3SarduSensors;
