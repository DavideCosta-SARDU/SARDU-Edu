const formatMessage = require('format-message');
const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');

class Scratch3SarduBoard {
    constructor (runtime) {
        this.runtime = runtime;
    }

    getInfo () {
        const selection = this.runtime?.sarduEdu?.hardwareSelection;
        const boardName = selection?.boardName || selection?.boardId?.split('-')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ') || 'Board';
        const message = (id, defaultMessage, description) => formatMessage({id, default: defaultMessage, description}, {
            board: boardName
        });
        const digitalOutputPins = selection?.digitalOutputPins?.length ? selection.digitalOutputPins :
            ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'];
        const analogInputPins = selection?.analogInputPins?.length ? selection.analogInputPins :
            ['A0', 'A1', 'A2', 'A3', 'A4', 'A5'];
        const pwmPins = selection?.pwmPins?.length ? selection.pwmPins : ['3', '5', '6', '9', '10', '11'];
        const offlineOnly = selection?.mode !== 'standalone';
        return {
            id: 'sarduBoard',
            name: boardName,
            color1: '#003366',
            color2: '#00284F',
            color3: '#001A33',
            blocks: [
                {
                    opcode: 'program',
                    text: [
                        message('sarduBoard.program.start', 'when {board} starts',
                            'First label of the standalone board program'),
                        message('sarduBoard.program.loop', 'forever',
                            'Second label of the standalone board program')
                    ],
                    tooltip: message('sarduBoard.program.tooltip',
                        'Runs the first section once, then repeats the second section.',
                        'Tooltip for the standalone board program'),
                    blockType: BlockType.HAT,
                    branchCount: 2,
                    isEdgeActivated: false,
                    isTerminal: true,
                    hideFromPalette: selection?.mode !== 'standalone'
                },
                {
                    opcode: 'setDigitalPin',
                    text: formatMessage({
                        id: 'sarduBoard.setDigitalPin',
                        default: 'set digital pin [PIN] to [LEVEL]',
                        description: 'Set a board digital output pin high or low'
                    }),
                    blockType: BlockType.COMMAND,
                    tooltip: message('sarduBoard.setDigitalPin.tooltip', 'Sets a digital output to HIGH or LOW.',
                        'Tooltip for digital output block'),
                    arguments: {
                        PIN: {type: ArgumentType.STRING, menu: 'DIGITAL_PIN', defaultValue: '13'},
                        LEVEL: {type: ArgumentType.STRING, menu: 'DIGITAL_LEVEL', defaultValue: 'HIGH'}
                    }
                },
                {
                    opcode: 'readAnalogPin',
                    text: formatMessage({id: 'sarduBoard.readAnalogPin', default: 'read analog pin [PIN]',
                        description: 'Read an Arduino analog input'}),
                    blockType: BlockType.REPORTER,
                    disableMonitor: true,
                    hideFromPalette: offlineOnly,
                    tooltip: message('sarduBoard.readAnalogPin.tooltip', 'Reads a value from 0 to 1023.',
                        'Tooltip for analog input reporter'),
                    arguments: {PIN: {type: ArgumentType.STRING, menu: 'ANALOG_PIN', defaultValue: 'A0'}}
                },
                {
                    opcode: 'readDigitalPin',
                    text: formatMessage({id: 'sarduBoard.readDigitalPin', default: 'read digital pin [PIN]',
                        description: 'Read an Arduino digital input'}),
                    blockType: BlockType.REPORTER,
                    disableMonitor: true,
                    hideFromPalette: offlineOnly,
                    tooltip: message('sarduBoard.readDigitalPin.tooltip', 'Reads HIGH or LOW from a digital pin.',
                        'Tooltip for digital input reporter'),
                    arguments: {PIN: {type: ArgumentType.STRING, menu: 'DIGITAL_PIN', defaultValue: '2'}}
                },
                {
                    opcode: 'setPwmPin',
                    text: formatMessage({id: 'sarduBoard.setPwmPin', default: 'set PWM pin [PIN] to [VALUE]',
                        description: 'Write an Arduino PWM output'}),
                    blockType: BlockType.COMMAND,
                    hideFromPalette: offlineOnly,
                    tooltip: message('sarduBoard.setPwmPin.tooltip', 'Writes a PWM value from 0 to 255.',
                        'Tooltip for PWM output block'),
                    arguments: {
                        PIN: {type: ArgumentType.STRING, menu: 'PWM_PIN', defaultValue: '3'},
                        VALUE: {type: ArgumentType.NUMBER, defaultValue: 128}
                    }
                },
                {
                    opcode: 'interrupt',
                    text: formatMessage({id: 'sarduBoard.interrupt', default: 'when pin [PIN] detects [MODE]',
                        description: 'Arduino external interrupt handler'}),
                    blockType: BlockType.HAT,
                    branchCount: 1,
                    isEdgeActivated: false,
                    isTerminal: true,
                    hideFromPalette: offlineOnly,
                    tooltip: message('sarduBoard.interrupt.tooltip', 'Runs when the selected external interrupt occurs.',
                        'Tooltip for Arduino interrupt block'),
                    arguments: {
                        PIN: {type: ArgumentType.STRING, menu: 'INTERRUPT_PIN', defaultValue: '2'},
                        MODE: {type: ArgumentType.STRING, menu: 'INTERRUPT_MODE', defaultValue: 'CHANGE'}
                    }
                },
                {
                    opcode: 'shortComment',
                    text: formatMessage({id: 'sarduBoard.shortComment', default: 'add note [TEXT]',
                        description: 'Add a one-line Arduino comment'}),
                    blockType: BlockType.COMMAND,
                    hideFromPalette: offlineOnly,
                    tooltip: message('sarduBoard.shortComment.tooltip', 'Adds a // comment to the generated code.',
                        'Tooltip for one-line Arduino comment'),
                    arguments: {TEXT: {type: ArgumentType.STRING, defaultValue: 'note'}}
                },
                {
                    opcode: 'longComment',
                    text: formatMessage({id: 'sarduBoard.longComment', default: 'add long note [TEXT]',
                        description: 'Add a multiline Arduino comment'}),
                    blockType: BlockType.COMMAND,
                    hideFromPalette: offlineOnly,
                    tooltip: message('sarduBoard.longComment.tooltip', 'Adds a multiline /* */ comment.',
                        'Tooltip for multiline Arduino comment'),
                    arguments: {TEXT: {type: 'multiline', defaultValue: 'long note'}}
                },
                {
                    opcode: 'declareArduinoVariable',
                    text: formatMessage({id: 'sarduBoard.declareArduinoVariable',
                        default: 'create Arduino variable [TYPE] [NAME] as [VALUE]',
                        description: 'Declare a typed Arduino variable'}),
                    blockType: BlockType.COMMAND,
                    hideFromPalette: true,
                    tooltip: message('sarduBoard.declareArduinoVariable.tooltip',
                        'Creates a typed variable in the generated Arduino code.', 'Tooltip for Arduino variable declaration'),
                    arguments: {
                        TYPE: {type: ArgumentType.STRING, menu: 'VARIABLE_TYPE', defaultValue: 'int'},
                        NAME: {type: ArgumentType.STRING, defaultValue: 'value'},
                        VALUE: {type: ArgumentType.STRING, defaultValue: '0'}
                    }
                },
                {
                    opcode: 'setArduinoVariable',
                    text: formatMessage({id: 'sarduBoard.setArduinoVariable', default: 'set Arduino variable [NAME] to [VALUE]',
                        description: 'Assign a typed Arduino variable'}),
                    blockType: BlockType.COMMAND,
                    hideFromPalette: true,
                    tooltip: message('sarduBoard.setArduinoVariable.tooltip', 'Assigns a value to an Arduino variable.',
                        'Tooltip for Arduino variable assignment'),
                    arguments: {
                        NAME: {type: ArgumentType.STRING, defaultValue: 'value'},
                        VALUE: {type: ArgumentType.STRING, defaultValue: '0'}
                    }
                },
                {
                    opcode: 'arduinoVariable',
                    text: formatMessage({id: 'sarduBoard.arduinoVariable', default: 'Arduino variable [NAME]',
                        description: 'Use a typed Arduino variable'}),
                    blockType: BlockType.REPORTER,
                    disableMonitor: true,
                    hideFromPalette: true,
                    tooltip: message('sarduBoard.arduinoVariable.tooltip', 'Uses the named Arduino variable.',
                        'Tooltip for Arduino variable reporter'),
                    arguments: {NAME: {type: ArgumentType.STRING, defaultValue: 'value'}}
                },
                {
                    opcode: 'convertValue',
                    text: formatMessage({id: 'sarduBoard.convertValue', default: 'convert [VALUE] to [TYPE]',
                        description: 'Convert an Arduino value to another type'}),
                    blockType: BlockType.REPORTER,
                    disableMonitor: true,
                    hideFromPalette: true,
                    tooltip: message('sarduBoard.convertValue.tooltip', 'Converts a value to the selected Arduino type.',
                        'Tooltip for Arduino type conversion'),
                    arguments: {
                        VALUE: {type: ArgumentType.STRING, defaultValue: '0'},
                        TYPE: {type: ArgumentType.STRING, menu: 'VARIABLE_TYPE', defaultValue: 'String'}
                    }
                },
                {
                    opcode: 'waitMilliseconds',
                    text: formatMessage({
                        id: 'sarduBoard.waitMilliseconds',
                        default: 'wait [MILLIS] milliseconds',
                        description: 'Wait in the generated board program'
                    }),
                    blockType: BlockType.COMMAND,
                    tooltip: message('sarduBoard.waitMilliseconds.tooltip', 'Pauses the program for the specified time.',
                        'Tooltip for millisecond wait block'),
                    arguments: {
                        MILLIS: {type: ArgumentType.NUMBER, defaultValue: 1000}
                    }
                },
                {
                    opcode: 'customCode',
                    text: formatMessage({
                        id: 'sarduBoard.customCode',
                        default: 'custom Arduino code [CODE]',
                        description: 'Insert multiline custom Arduino C++ at this exact stack position'
                    }),
                    blockType: BlockType.COMMAND,
                    hideFromPalette: false,
                    tooltip: message('sarduBoard.customCode.tooltip',
                        'Inserts these C/C++ lines exactly at this position.',
                        'Tooltip for the multiline custom Arduino code block'),
                    arguments: {
                        CODE: {type: 'multiline', defaultValue: '// C/C++'}
                    }
                },
                {
                    opcode: 'serialBegin',
                    text: formatMessage({
                        id: 'sarduBoard.serialBegin',
                        default: 'start serial at [BAUD] baud',
                        description: 'Initialize Arduino serial communication'
                    }),
                    blockType: BlockType.COMMAND,
                    hideFromPalette: offlineOnly,
                    tooltip: message('sarduBoard.serialBegin.tooltip',
                        'Starts serial communication at the selected baud rate.',
                        'Tooltip for Arduino serial initialization'),
                    arguments: {
                        BAUD: {type: ArgumentType.NUMBER, defaultValue: 9600}
                    }
                },
                {
                    opcode: 'serialPrint',
                    text: formatMessage({
                        id: 'sarduBoard.serialPrint',
                        default: 'serial print [VALUE]',
                        description: 'Write a value to Arduino serial output'
                    }),
                    blockType: BlockType.COMMAND,
                    hideFromPalette: offlineOnly,
                    tooltip: message('sarduBoard.serialPrint.tooltip',
                        'Writes a value to the serial port without starting a new line.',
                        'Tooltip for Arduino Serial.print'),
                    arguments: {
                        VALUE: {type: ArgumentType.STRING, defaultValue: 'hello'}
                    }
                },
                {
                    opcode: 'serialPrintln',
                    text: formatMessage({
                        id: 'sarduBoard.serialPrintln',
                        default: 'serial println [VALUE]',
                        description: 'Write a value and newline to Arduino serial output'
                    }),
                    blockType: BlockType.COMMAND,
                    hideFromPalette: offlineOnly,
                    tooltip: message('sarduBoard.serialPrintln.tooltip',
                        'Writes a value to the serial port and starts a new line.',
                        'Tooltip for Arduino Serial.println'),
                    arguments: {
                        VALUE: {type: ArgumentType.STRING, defaultValue: 'hello'}
                    }
                },
                {
                    opcode: 'dhtTemperature',
                    text: formatMessage({
                        id: 'sarduBoard.dhtTemperature',
                        default: 'DHT21 temperature on pin [PIN]',
                        description: 'Read integer temperature from a DHT21 sensor'
                    }),
                    blockType: BlockType.REPORTER,
                    disableMonitor: true,
                    hideFromPalette: true,
                    tooltip: message('sarduBoard.dhtTemperature.tooltip',
                        'Reads the DHT21 temperature as an integer.', 'Tooltip for DHT21 temperature reporter'),
                    arguments: {
                        PIN: {type: ArgumentType.STRING, menu: 'DIGITAL_PIN', defaultValue: '2'}
                    }
                },
                {
                    opcode: 'dhtHumidity',
                    text: formatMessage({
                        id: 'sarduBoard.dhtHumidity',
                        default: 'DHT21 humidity on pin [PIN]',
                        description: 'Read integer humidity from a DHT21 sensor'
                    }),
                    blockType: BlockType.REPORTER,
                    disableMonitor: true,
                    hideFromPalette: true,
                    tooltip: message('sarduBoard.dhtHumidity.tooltip',
                        'Reads the DHT21 humidity as an integer.', 'Tooltip for DHT21 humidity reporter'),
                    arguments: {
                        PIN: {type: ArgumentType.STRING, menu: 'DIGITAL_PIN', defaultValue: '2'}
                    }
                },
                {
                    opcode: 'millis',
                    text: message('sarduBoard.millis', 'millis', 'Elapsed milliseconds reporter'),
                    tooltip: message('sarduBoard.millis.tooltip', 'Milliseconds elapsed since the board started.',
                        'Tooltip for elapsed milliseconds reporter'),
                    blockType: BlockType.REPORTER,
                    disableMonitor: true
                },
                {
                    opcode: 'micros',
                    text: message('sarduBoard.micros', 'micros', 'Elapsed microseconds reporter'),
                    tooltip: message('sarduBoard.micros.tooltip', 'Microseconds elapsed since the board started.',
                        'Tooltip for elapsed microseconds reporter'),
                    blockType: BlockType.REPORTER,
                    disableMonitor: true
                }
            ],
            customFieldTypes: {
                multiline: {
                    output: 'String',
                    outputShape: 2,
                    implementation: {sarduMultiline: true}
                }
            },
            menus: {
                ANALOG_PIN: {acceptReporters: false, items: analogInputPins},
                DIGITAL_PIN: {
                    acceptReporters: false,
                    items: digitalOutputPins
                },
                DIGITAL_LEVEL: {acceptReporters: false, items: ['HIGH', 'LOW']},
                INTERRUPT_MODE: {acceptReporters: false, items: ['RISING', 'FALLING', 'CHANGE', 'LOW']},
                INTERRUPT_PIN: {acceptReporters: false, items: ['2', '3']},
                PWM_PIN: {acceptReporters: false, items: pwmPins},
                VARIABLE_TYPE: {acceptReporters: false, items: [
                    'bool', 'byte', 'int', 'unsigned int', 'long', 'unsigned long', 'float', 'double', 'char', 'String'
                ]}
            }
        };
    }

    program () {
        return false;
    }

    setDigitalPin (args) {
        if (this.runtime?.sarduEdu?.hardwareSelection?.mode !== 'realtime') return;
        const transport = this.runtime.sarduEduLiveTransport;
        if (!transport?.connected) {
            return Promise.reject(new Error('SARDU Edu live transport is not connected in setDigitalPin'));
        }
        return transport.writeDigital(String(args.PIN), String(args.LEVEL));
    }

    waitMilliseconds (args) {
        if (this.runtime?.sarduEdu?.hardwareSelection?.mode !== 'realtime') return;
        const milliseconds = Math.max(0, Number(args.MILLIS));
        return new Promise(resolve => setTimeout(resolve, milliseconds));
    }

    readAnalogPin () {
        return 0;
    }

    readDigitalPin () {
        return 0;
    }

    setPwmPin () {}

    interrupt () {
        return false;
    }

    shortComment () {}

    longComment () {}

    declareArduinoVariable () {}

    setArduinoVariable () {}

    arduinoVariable () {
        return 0;
    }

    convertValue () {
        return 0;
    }

    customCode () {}

    serialBegin () {}

    serialPrint () {}

    serialPrintln () {}

    dhtTemperature () {
        return 0;
    }

    dhtHumidity () {
        return 0;
    }

    millis () {
        if (this.runtime?.sarduEdu?.hardwareSelection?.mode !== 'realtime') return 0;
        const transport = this.runtime.sarduEduLiveTransport;
        if (!transport?.connected) return Promise.reject(new Error('SARDU Edu live transport is not connected in millis'));
        return transport.readMillis();
    }

    micros () {
        if (this.runtime?.sarduEdu?.hardwareSelection?.mode !== 'realtime') return 0;
        const transport = this.runtime.sarduEduLiveTransport;
        if (!transport?.connected) return Promise.reject(new Error('SARDU Edu live transport is not connected in micros'));
        return transport.readMicros();
    }
}

module.exports = Scratch3SarduBoard;
