const formatMessage = require('format-message');
const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');

class Scratch3SarduActuators {
    constructor (runtime) {
        this.runtime = runtime;
    }

    getInfo () {
        const selection = this.runtime?.sarduEdu?.hardwareSelection;
        const pins = selection?.digitalOutputPins?.length ? selection.digitalOutputPins :
            ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'];
        const neoPixelUnavailable = !selection?.componentIds?.includes('neopixel');
        const displayUnavailable = !selection?.componentIds?.includes('lcd-i2c');
        const oledUnavailable = !selection?.componentIds?.includes('oled-ssd1306');
        const sh1106Unavailable = !selection?.componentIds?.includes('oled-sh1106');
        const customI2cUnavailable = displayUnavailable || !selection?.boardId?.startsWith('esp32-');
        const ledUnavailable = !selection?.componentIds?.includes('led');
        const pwmPins = selection?.pwmPins?.length ? selection.pwmPins : ['3', '5', '6', '9', '10', '11'];
        const neoBlock = (opcode, text, args) => ({
            opcode, text: formatMessage({id: `sarduActuators.${opcode}`, default: text, description: `NeoPixel ${opcode} block`}),
            blockType: BlockType.COMMAND, hideFromPalette: neoPixelUnavailable,
            tooltip: formatMessage({id: `sarduActuators.${opcode}.tooltip`, default: text, description: `NeoPixel ${opcode} tooltip`}),
            arguments: args
        });
        const pinArg = {type: ArgumentType.STRING, menu: 'DIGITAL_PIN', defaultValue: '6'};
        const numberArg = defaultValue => ({type: ArgumentType.NUMBER, defaultValue});
        const oledBlock = (opcode, defaultText, args = {}) => {
            const text = formatMessage({
                id: `sarduActuators.${opcode}`,
                default: defaultText,
                description: `OLED ${opcode} block and tooltip`
            });
            return {opcode, text, blockType: BlockType.COMMAND, hideFromPalette: oledUnavailable, tooltip: text,
                arguments: args};
        };
        const sh1106Block = (opcode, defaultText, args = {}) => {
            const text = formatMessage({
                id: `sarduActuators.${opcode}`,
                default: defaultText,
                description: `SH1106 ${opcode} block and tooltip`
            });
            return {opcode, text, blockType: BlockType.COMMAND, hideFromPalette: sh1106Unavailable, tooltip: text,
                arguments: args};
        };
        const oledImageMenu = [
            ['HEART', 'Heart'], ['STAR', 'Star'], ['CHECK', 'Check'], ['CROSS', 'Cross'],
            ['HAPPY', 'Happy face'], ['SAD', 'Sad face'], ['WARNING', 'Warning'],
            ['INFO', 'Information'], ['BULB', 'Light bulb'], ['THERMOMETER', 'Thermometer'],
            ['BATTERY', 'Battery'], ['WIFI', 'Wi-Fi']
        ].map(([value, defaultName]) => ({
            text: formatMessage({
                id: `sarduActuators.image.${value.toLowerCase()}`,
                default: defaultName,
                description: `OLED ${defaultName} image name`
            }),
            value
        }));
        return {
            id: 'sarduActuators',
            name: formatMessage({
                id: 'sarduActuators.name',
                default: 'Actuators',
                description: 'SARDU-Block actuators block category'
            }),
            color1: '#7B1FA2',
            color2: '#62177F',
            color3: '#451059',
            blocks: [{
                opcode: 'setLed',
                text: formatMessage({id: 'sarduActuators.setLed', default: 'set LED on pin [PIN] to [STATE]', description: 'Set a standard LED on or off'}),
                blockType: BlockType.COMMAND,
                hideFromPalette: ledUnavailable,
                tooltip: formatMessage({id: 'sarduActuators.setLed.tooltip', default: 'Turns a standard LED connected to the selected digital pin on or off.', description: 'Standard LED digital tooltip'}),
                arguments: {PIN: {type: ArgumentType.STRING, menu: 'DIGITAL_PIN', defaultValue: '13'}, STATE: {type: ArgumentType.STRING, menu: 'LED_STATE', defaultValue: 'HIGH'}}
            }, {
                opcode: 'setLedBrightness',
                text: formatMessage({id: 'sarduActuators.setLedBrightness', default: 'set LED brightness on PWM pin [PIN] to [BRIGHTNESS] percent', description: 'Set the PWM brightness of a standard LED'}),
                blockType: BlockType.COMMAND,
                hideFromPalette: ledUnavailable,
                tooltip: formatMessage({id: 'sarduActuators.setLedBrightness.tooltip', default: 'Sets LED brightness from 0 to 100 percent on a PWM-capable pin.', description: 'Standard LED PWM tooltip'}),
                arguments: {PIN: {type: ArgumentType.STRING, menu: 'PWM_PIN', defaultValue: '3'}, BRIGHTNESS: {type: ArgumentType.NUMBER, defaultValue: 100}}
            }, {
                opcode: 'setServoAngle',
                text: formatMessage({
                    id: 'sarduActuators.setServoAngle',
                    default: 'set servo on pin [PIN] to [ANGLE] degrees',
                    description: 'Set a servomotor angle'
                }),
                blockType: BlockType.COMMAND,
                hideFromPalette: !selection?.componentIds?.includes('servo'),
                tooltip: formatMessage({
                    id: 'sarduActuators.setServoAngle.tooltip',
                    default: 'Moves the independent servo instance for this pin to an angle from 0 to 180 degrees.',
                    description: 'Tooltip for servomotor angle block'
                }),
                arguments: {
                    PIN: {type: ArgumentType.STRING, menu: 'DIGITAL_PIN', defaultValue: '9'},
                    ANGLE: {type: ArgumentType.NUMBER, defaultValue: 90}
                }
            }, {
                opcode: 'setServoAngleAndWait',
                text: formatMessage({
                    id: 'sarduActuators.setServoAngleAndWait',
                    default: 'set servo on pin [PIN] to [ANGLE] degrees and wait [MILLIS] milliseconds',
                    description: 'Set a servomotor angle and wait'
                }),
                blockType: BlockType.COMMAND,
                hideFromPalette: !selection?.componentIds?.includes('servo'),
                tooltip: formatMessage({
                    id: 'sarduActuators.setServoAngleAndWait.tooltip',
                    default: 'Moves this pin servo, then waits for the selected time.',
                    description: 'Tooltip for servomotor angle and wait block'
                }),
                arguments: {
                    PIN: {type: ArgumentType.STRING, menu: 'DIGITAL_PIN', defaultValue: '9'},
                    ANGLE: {type: ArgumentType.NUMBER, defaultValue: 90},
                    MILLIS: {type: ArgumentType.NUMBER, defaultValue: 200}
                }
            }, {
                opcode: 'servoAngle',
                text: formatMessage({
                    id: 'sarduActuators.servoAngle',
                    default: 'servo angle on pin [PIN]',
                    description: 'Read the last servomotor angle'
                }),
                blockType: BlockType.REPORTER,
                disableMonitor: true,
                hideFromPalette: !selection?.componentIds?.includes('servo'),
                tooltip: formatMessage({
                    id: 'sarduActuators.servoAngle.tooltip',
                    default: 'Returns the integer angle stored by the servo instance for this pin.',
                    description: 'Tooltip for servomotor angle reporter'
                }),
                arguments: {PIN: {type: ArgumentType.STRING, menu: 'DIGITAL_PIN', defaultValue: '9'}}
            }, {
                opcode: 'playTone', text: formatMessage({id: 'sarduActuators.playTone', default: 'play buzzer pin [PIN] frequency [FREQUENCY] Hz for [MILLIS] ms', description: 'Play buzzer tone'}),
                blockType: BlockType.COMMAND, hideFromPalette: !selection?.componentIds?.includes('buzzer'),
                tooltip: formatMessage({id: 'sarduActuators.playTone.tooltip', default: 'Plays a tone on the selected buzzer pin for the specified duration.', description: 'Buzzer tone tooltip'}),
                arguments: {PIN: {type: ArgumentType.STRING, menu: 'DIGITAL_PIN', defaultValue: '13'}, FREQUENCY: {type: ArgumentType.NUMBER, defaultValue: 440}, MILLIS: {type: ArgumentType.NUMBER, defaultValue: 200}}
            },
            neoBlock('configureNeoPixel', 'configure NeoPixel pin [PIN] with [COUNT] pixels', {PIN: pinArg, COUNT: numberArg(8)}),
            neoBlock('setNeoPixelRgb', 'NeoPixel pin [PIN] pixel [PIXEL] RGB [RED] [GREEN] [BLUE]', {PIN: pinArg, PIXEL: numberArg(0), RED: numberArg(255), GREEN: numberArg(0), BLUE: numberArg(0)}),
            neoBlock('setNeoPixelHsv', 'NeoPixel pin [PIN] pixel [PIXEL] hue [HUE] saturation [SATURATION] brightness [BRIGHTNESS]', {PIN: pinArg, PIXEL: numberArg(0), HUE: numberArg(0), SATURATION: numberArg(100), BRIGHTNESS: numberArg(100)}),
            neoBlock('fillNeoPixelRgb', 'NeoPixel pin [PIN] from [FIRST] to [LAST] RGB [RED] [GREEN] [BLUE]', {PIN: pinArg, FIRST: numberArg(0), LAST: numberArg(7), RED: numberArg(255), GREEN: numberArg(0), BLUE: numberArg(0)}),
            neoBlock('fillNeoPixelHsv', 'NeoPixel pin [PIN] from [FIRST] to [LAST] hue [HUE] saturation [SATURATION] brightness [BRIGHTNESS]', {PIN: pinArg, FIRST: numberArg(0), LAST: numberArg(7), HUE: numberArg(0), SATURATION: numberArg(100), BRIGHTNESS: numberArg(100)}),
            neoBlock('setNeoPixelBrightness', 'NeoPixel pin [PIN] global brightness [BRIGHTNESS] percent', {PIN: pinArg, BRIGHTNESS: numberArg(100)}),
            neoBlock('clearNeoPixels', 'clear NeoPixel pin [PIN]', {PIN: pinArg}),
            neoBlock('showNeoPixels', 'show NeoPixel pin [PIN]', {PIN: pinArg}),
            neoBlock('rotateNeoPixels', 'rotate NeoPixel pin [PIN] by [POSITIONS]', {PIN: pinArg, POSITIONS: numberArg(1)}),
            neoBlock('shiftNeoPixels', 'shift NeoPixel pin [PIN] by [POSITIONS]', {PIN: pinArg, POSITIONS: numberArg(1)}),
            neoBlock('rainbowNeoPixels', 'NeoPixel pin [PIN] rainbow from hue [HUE] repetitions [REPETITIONS]', {PIN: pinArg, HUE: numberArg(0), REPETITIONS: numberArg(1)}),
            oledBlock('initializeOled', 'initialize OLED format [FORMAT] I2C address [ADDRESS]', {
                FORMAT: {type: ArgumentType.STRING, menu: 'OLED_FORMAT', defaultValue: '128x64'},
                ADDRESS: {type: ArgumentType.STRING, menu: 'OLED_ADDRESS', defaultValue: '0x3C'}
            }),
            oledBlock('initializeOledCustom', 'initialize OLED width [WIDTH] height [HEIGHT] I2C address [ADDRESS]', {
                WIDTH: numberArg(128), HEIGHT: numberArg(64),
                ADDRESS: {type: ArgumentType.STRING, menu: 'OLED_ADDRESS', defaultValue: '0x3C'}
            }),
            oledBlock('setOledCursor', 'OLED set cursor x [X] y [Y]', {X: numberArg(0), Y: numberArg(0)}),
            oledBlock('setOledText', 'OLED set text size [SIZE] color [COLOR] background [BACKGROUND]', {
                SIZE: {type: ArgumentType.STRING, menu: 'OLED_TEXT_SIZE', defaultValue: '1'},
                COLOR: {type: ArgumentType.STRING, menu: 'OLED_COLOR', defaultValue: 'WHITE'},
                BACKGROUND: {type: ArgumentType.STRING, menu: 'OLED_COLOR', defaultValue: 'BLACK'}
            }),
            oledBlock('printOled', 'OLED print [TEXT] [ENDING]', {
                TEXT: {type: ArgumentType.STRING, defaultValue: 'Hello SARDU-Block'},
                ENDING: {type: ArgumentType.STRING, menu: 'OLED_PRINT_ENDING', defaultValue: 'NEWLINE'}
            }),
            oledBlock('clearOled', 'clear OLED'),
            oledBlock('drawOledLine', 'OLED draw line x0 [X0] y0 [Y0] x1 [X1] y1 [Y1] color [COLOR]',
                {X0: numberArg(0), Y0: numberArg(0), X1: numberArg(32), Y1: numberArg(16), COLOR: {type: ArgumentType.STRING, menu: 'OLED_COLOR', defaultValue: 'WHITE'}}),
            oledBlock('drawOledRect', 'OLED draw rectangle x [X] y [Y] width [WIDTH] height [HEIGHT] color [COLOR]',
                {X: numberArg(0), Y: numberArg(0), WIDTH: numberArg(32), HEIGHT: numberArg(16), COLOR: {type: ArgumentType.STRING, menu: 'OLED_COLOR', defaultValue: 'WHITE'}}),
            oledBlock('fillOledRect', 'OLED fill rectangle x [X] y [Y] width [WIDTH] height [HEIGHT] color [COLOR]',
                {X: numberArg(0), Y: numberArg(0), WIDTH: numberArg(32), HEIGHT: numberArg(16), COLOR: {type: ArgumentType.STRING, menu: 'OLED_COLOR', defaultValue: 'WHITE'}}),
            oledBlock('drawOledCircle', 'OLED draw circle x [X] y [Y] radius [RADIUS] color [COLOR]',
                {X: numberArg(16), Y: numberArg(16), RADIUS: numberArg(8), COLOR: {type: ArgumentType.STRING, menu: 'OLED_COLOR', defaultValue: 'WHITE'}}),
            oledBlock('fillOledCircle', 'OLED fill circle x [X] y [Y] radius [RADIUS] color [COLOR]',
                {X: numberArg(16), Y: numberArg(16), RADIUS: numberArg(8), COLOR: {type: ArgumentType.STRING, menu: 'OLED_COLOR', defaultValue: 'WHITE'}}),
            oledBlock('drawOledRoundRect', 'OLED draw rounded rectangle x [X] y [Y] width [WIDTH] height [HEIGHT] radius [RADIUS] color [COLOR]',
                {X: numberArg(0), Y: numberArg(0), WIDTH: numberArg(32), HEIGHT: numberArg(16), RADIUS: numberArg(4), COLOR: {type: ArgumentType.STRING, menu: 'OLED_COLOR', defaultValue: 'WHITE'}}),
            oledBlock('fillOledRoundRect', 'OLED fill rounded rectangle x [X] y [Y] width [WIDTH] height [HEIGHT] radius [RADIUS] color [COLOR]',
                {X: numberArg(0), Y: numberArg(0), WIDTH: numberArg(32), HEIGHT: numberArg(16), RADIUS: numberArg(4), COLOR: {type: ArgumentType.STRING, menu: 'OLED_COLOR', defaultValue: 'WHITE'}}),
            oledBlock('drawOledTriangle', 'OLED draw triangle x0 [X0] y0 [Y0] x1 [X1] y1 [Y1] x2 [X2] y2 [Y2] color [COLOR]',
                {X0: numberArg(0), Y0: numberArg(0), X1: numberArg(16), Y1: numberArg(0), X2: numberArg(8), Y2: numberArg(16), COLOR: {type: ArgumentType.STRING, menu: 'OLED_COLOR', defaultValue: 'WHITE'}}),
            oledBlock('fillOledTriangle', 'OLED fill triangle x0 [X0] y0 [Y0] x1 [X1] y1 [Y1] x2 [X2] y2 [Y2] color [COLOR]',
                {X0: numberArg(0), Y0: numberArg(0), X1: numberArg(16), Y1: numberArg(0), X2: numberArg(8), Y2: numberArg(16), COLOR: {type: ArgumentType.STRING, menu: 'OLED_COLOR', defaultValue: 'WHITE'}}),
            oledBlock('drawOledImage', 'OLED show image [IMAGE] size [SCALE]', {
                IMAGE: {type: ArgumentType.STRING, menu: 'OLED_IMAGE', defaultValue: 'HEART'},
                SCALE: {type: ArgumentType.STRING, menu: 'OLED_IMAGE_SCALE', defaultValue: '16'}
            }),
            oledBlock('showOled', 'update OLED'),
            sh1106Block('initializeSh1106', 'initialize SH1106 OLED 128x64 I2C address [ADDRESS]', {
                ADDRESS: {type: ArgumentType.STRING, menu: 'OLED_ADDRESS', defaultValue: '0x3C'}
            }),
            sh1106Block('setSh1106Cursor', 'SH1106 set cursor x [X] y [Y]', {X: numberArg(0), Y: numberArg(0)}),
            sh1106Block('setSh1106Text', 'SH1106 set text size [SIZE] color [COLOR] background [BACKGROUND]', {
                SIZE: {type: ArgumentType.STRING, menu: 'OLED_TEXT_SIZE', defaultValue: '1'},
                COLOR: {type: ArgumentType.STRING, menu: 'OLED_COLOR', defaultValue: 'WHITE'},
                BACKGROUND: {type: ArgumentType.STRING, menu: 'OLED_COLOR', defaultValue: 'BLACK'}
            }),
            sh1106Block('printSh1106', 'SH1106 print [TEXT] [ENDING]', {
                TEXT: {type: ArgumentType.STRING, defaultValue: 'Hello SARDU-Block'},
                ENDING: {type: ArgumentType.STRING, menu: 'OLED_PRINT_ENDING', defaultValue: 'NEWLINE'}
            }),
            sh1106Block('clearSh1106', 'clear SH1106 OLED'),
            sh1106Block('drawSh1106Line', 'SH1106 draw line x0 [X0] y0 [Y0] x1 [X1] y1 [Y1] color [COLOR]',
                {X0: numberArg(0), Y0: numberArg(0), X1: numberArg(32), Y1: numberArg(16), COLOR: {type: ArgumentType.STRING, menu: 'OLED_COLOR', defaultValue: 'WHITE'}}),
            sh1106Block('drawSh1106Rect', 'SH1106 draw rectangle x [X] y [Y] width [WIDTH] height [HEIGHT] color [COLOR]',
                {X: numberArg(0), Y: numberArg(0), WIDTH: numberArg(32), HEIGHT: numberArg(16), COLOR: {type: ArgumentType.STRING, menu: 'OLED_COLOR', defaultValue: 'WHITE'}}),
            sh1106Block('fillSh1106Rect', 'SH1106 fill rectangle x [X] y [Y] width [WIDTH] height [HEIGHT] color [COLOR]',
                {X: numberArg(0), Y: numberArg(0), WIDTH: numberArg(32), HEIGHT: numberArg(16), COLOR: {type: ArgumentType.STRING, menu: 'OLED_COLOR', defaultValue: 'WHITE'}}),
            sh1106Block('drawSh1106Circle', 'SH1106 draw circle x [X] y [Y] radius [RADIUS] color [COLOR]',
                {X: numberArg(16), Y: numberArg(16), RADIUS: numberArg(8), COLOR: {type: ArgumentType.STRING, menu: 'OLED_COLOR', defaultValue: 'WHITE'}}),
            sh1106Block('fillSh1106Circle', 'SH1106 fill circle x [X] y [Y] radius [RADIUS] color [COLOR]',
                {X: numberArg(16), Y: numberArg(16), RADIUS: numberArg(8), COLOR: {type: ArgumentType.STRING, menu: 'OLED_COLOR', defaultValue: 'WHITE'}}),
            sh1106Block('drawSh1106RoundRect', 'SH1106 draw rounded rectangle x [X] y [Y] width [WIDTH] height [HEIGHT] radius [RADIUS] color [COLOR]',
                {X: numberArg(0), Y: numberArg(0), WIDTH: numberArg(32), HEIGHT: numberArg(16), RADIUS: numberArg(4), COLOR: {type: ArgumentType.STRING, menu: 'OLED_COLOR', defaultValue: 'WHITE'}}),
            sh1106Block('fillSh1106RoundRect', 'SH1106 fill rounded rectangle x [X] y [Y] width [WIDTH] height [HEIGHT] radius [RADIUS] color [COLOR]',
                {X: numberArg(0), Y: numberArg(0), WIDTH: numberArg(32), HEIGHT: numberArg(16), RADIUS: numberArg(4), COLOR: {type: ArgumentType.STRING, menu: 'OLED_COLOR', defaultValue: 'WHITE'}}),
            sh1106Block('drawSh1106Triangle', 'SH1106 draw triangle x0 [X0] y0 [Y0] x1 [X1] y1 [Y1] x2 [X2] y2 [Y2] color [COLOR]',
                {X0: numberArg(0), Y0: numberArg(0), X1: numberArg(16), Y1: numberArg(0), X2: numberArg(8), Y2: numberArg(16), COLOR: {type: ArgumentType.STRING, menu: 'OLED_COLOR', defaultValue: 'WHITE'}}),
            sh1106Block('fillSh1106Triangle', 'SH1106 fill triangle x0 [X0] y0 [Y0] x1 [X1] y1 [Y1] x2 [X2] y2 [Y2] color [COLOR]',
                {X0: numberArg(0), Y0: numberArg(0), X1: numberArg(16), Y1: numberArg(0), X2: numberArg(8), Y2: numberArg(16), COLOR: {type: ArgumentType.STRING, menu: 'OLED_COLOR', defaultValue: 'WHITE'}}),
            sh1106Block('drawSh1106Image', 'SH1106 show image [IMAGE] size [SCALE]', {
                IMAGE: {type: ArgumentType.STRING, menu: 'OLED_IMAGE', defaultValue: 'HEART'},
                SCALE: {type: ArgumentType.STRING, menu: 'OLED_IMAGE_SCALE', defaultValue: '16'}
            }),
            sh1106Block('showSh1106', 'update SH1106 OLED'),
            {
                opcode: 'initializeDisplay',
                text: formatMessage({id: 'sarduActuators.initializeDisplay', default: 'initialize [MODEL] I2C display at address [ADDRESS]', description: 'Initialize an I2C LCD using the board default pins'}),
                blockType: BlockType.COMMAND,
                hideFromPalette: displayUnavailable,
                tooltip: formatMessage({id: 'sarduActuators.initializeDisplay.tooltip', default: 'Initializes the selected 16-column display using the board default I2C pins.', description: 'Default-pin I2C LCD initialization tooltip'}),
                arguments: {
                    MODEL: {type: ArgumentType.STRING, menu: 'DISPLAY_MODEL', defaultValue: '1602'},
                    ADDRESS: {type: ArgumentType.STRING, menu: 'DISPLAY_ADDRESS', defaultValue: '0x27'}
                }
            }, {
                opcode: 'initializeDisplayWithPins',
                text: formatMessage({id: 'sarduActuators.initializeDisplayWithPins', default: 'initialize [MODEL] I2C display at address [ADDRESS] with SDA [SDA] and SCL [SCL]', description: 'Initialize an I2C LCD using custom ESP32 pins'}),
                blockType: BlockType.COMMAND,
                hideFromPalette: customI2cUnavailable,
                tooltip: formatMessage({id: 'sarduActuators.initializeDisplayWithPins.tooltip', default: 'Initializes the display using selectable SDA and SCL pins on an ESP32 board.', description: 'Custom-pin I2C LCD initialization tooltip'}),
                arguments: {
                    MODEL: {type: ArgumentType.STRING, menu: 'DISPLAY_MODEL', defaultValue: '1602'},
                    ADDRESS: {type: ArgumentType.STRING, menu: 'DISPLAY_ADDRESS', defaultValue: '0x27'},
                    SDA: {type: ArgumentType.STRING, menu: 'DIGITAL_PIN', defaultValue: selection?.busPins?.i2c?.sda || pins[0]},
                    SCL: {type: ArgumentType.STRING, menu: 'DIGITAL_PIN', defaultValue: selection?.busPins?.i2c?.scl || pins[1] || pins[0]}
                }
            }, {
                opcode: 'setDisplayCursor',
                text: formatMessage({id: 'sarduActuators.setDisplayCursor', default: 'set display cursor position X [X] Y [Y]', description: 'Set the I2C LCD cursor position'}),
                blockType: BlockType.COMMAND,
                hideFromPalette: displayUnavailable,
                tooltip: formatMessage({id: 'sarduActuators.setDisplayCursor.tooltip', default: 'Sets the cursor using zero-based coordinates limited to the initialized display.', description: 'I2C LCD cursor tooltip'}),
                arguments: {X: numberArg(0), Y: numberArg(0)}
            }, {
                opcode: 'printDisplay',
                text: formatMessage({id: 'sarduActuators.printDisplay', default: 'print on display [TEXT]', description: 'Print text on the I2C LCD'}),
                blockType: BlockType.COMMAND,
                hideFromPalette: displayUnavailable,
                tooltip: formatMessage({id: 'sarduActuators.printDisplay.tooltip', default: 'Prints text or a value at the current display cursor position.', description: 'I2C LCD print tooltip'}),
                arguments: {TEXT: {type: ArgumentType.STRING, defaultValue: 'Hello!'}}
            }, {
                opcode: 'clearDisplay',
                text: formatMessage({id: 'sarduActuators.clearDisplay', default: 'clear display', description: 'Clear the I2C LCD'}),
                blockType: BlockType.COMMAND,
                hideFromPalette: displayUnavailable,
                tooltip: formatMessage({id: 'sarduActuators.clearDisplay.tooltip', default: 'Clears all text from the display.', description: 'I2C LCD clear tooltip'})
            }, {
                opcode: 'setDisplayBacklight',
                text: formatMessage({id: 'sarduActuators.setDisplayBacklight', default: 'set display backlight to [STATE]', description: 'Set the I2C LCD backlight'}),
                blockType: BlockType.COMMAND,
                hideFromPalette: displayUnavailable,
                tooltip: formatMessage({id: 'sarduActuators.setDisplayBacklight.tooltip', default: 'Turns the display backlight on or off.', description: 'I2C LCD backlight tooltip'}),
                arguments: {STATE: {type: ArgumentType.STRING, menu: 'ON_OFF', defaultValue: 'ON'}}
            }, {
                opcode: 'setDisplayCursorStyle',
                text: formatMessage({id: 'sarduActuators.setDisplayCursorStyle', default: 'set display cursor [VISIBILITY] style [BLINK]', description: 'Set the I2C LCD cursor visibility and blink style'}),
                blockType: BlockType.COMMAND,
                hideFromPalette: displayUnavailable,
                tooltip: formatMessage({id: 'sarduActuators.setDisplayCursorStyle.tooltip', default: 'Shows or hides the cursor and enables or disables blinking.', description: 'I2C LCD cursor style tooltip'}),
                arguments: {
                    VISIBILITY: {type: ArgumentType.STRING, menu: 'SHOW_HIDE', defaultValue: 'SHOW'},
                    BLINK: {type: ArgumentType.STRING, menu: 'BLINK_STYLE', defaultValue: 'BLINK'}
                }
            }],
            menus: {
                DIGITAL_PIN: {acceptReporters: false, items: pins},
                PWM_PIN: {acceptReporters: false, items: pwmPins},
                LED_STATE: {acceptReporters: false, items: ['HIGH', 'LOW']},
                DISPLAY_MODEL: {acceptReporters: false, items: ['1602', '1604']},
                DISPLAY_ADDRESS: {acceptReporters: false, items: [
                    '0x20', '0x21', '0x22', '0x23', '0x24', '0x25', '0x26', '0x27'
                ]},
                OLED_FORMAT: {acceptReporters: false, items: ['128x64', '128x32']},
                OLED_ADDRESS: {acceptReporters: false, items: [{text: '0x3C (0x78)', value: '0x3C'}, {
                    text: '0x3D (0x7A)', value: '0x3D'
                }]},
                OLED_COLOR: {acceptReporters: false, items: [{
                    text: formatMessage({id: 'sarduActuators.menu.white', default: 'White', description: 'OLED white color'}),
                    value: 'WHITE'
                }, {
                    text: formatMessage({id: 'sarduActuators.menu.black', default: 'Black', description: 'OLED black color'}),
                    value: 'BLACK'
                }]},
                OLED_TEXT_SIZE: {acceptReporters: false, items: [{text: '6x8', value: '1'}, {text: '12x16', value: '2'}, {text: '18x24', value: '3'}, {text: '24x32', value: '4'}]},
                OLED_PRINT_ENDING: {acceptReporters: false, items: [{
                    text: formatMessage({id: 'sarduActuators.menu.newLine', default: 'New line', description: 'OLED print newline'}), value: 'NEWLINE'
                }, {text: formatMessage({id: 'sarduActuators.menu.sameLine', default: 'Same line', description: 'OLED print same line'}), value: 'SAME_LINE'}]},
                OLED_IMAGE: {acceptReporters: false, items: oledImageMenu},
                OLED_IMAGE_SCALE: {acceptReporters: false, items: [
                    {text: '16x16', value: '16'}, {text: '32x32', value: '32'}, {text: '64x64', value: '64'}
                ]},
                ON_OFF: {acceptReporters: false, items: [{
                    text: formatMessage({id: 'sarduActuators.menu.on', default: 'On', description: 'On menu item'}),
                    value: 'ON'
                }, {
                    text: formatMessage({id: 'sarduActuators.menu.off', default: 'Off', description: 'Off menu item'}),
                    value: 'OFF'
                }]},
                SHOW_HIDE: {acceptReporters: false, items: [{
                    text: formatMessage({id: 'sarduActuators.menu.show', default: 'Show', description: 'Show menu item'}),
                    value: 'SHOW'
                }, {
                    text: formatMessage({id: 'sarduActuators.menu.hide', default: 'Hide', description: 'Hide menu item'}),
                    value: 'HIDE'
                }]},
                BLINK_STYLE: {acceptReporters: false, items: [{
                    text: formatMessage({id: 'sarduActuators.menu.blink', default: 'Blinking', description: 'Blinking cursor menu item'}),
                    value: 'BLINK'
                }, {
                    text: formatMessage({id: 'sarduActuators.menu.noBlink', default: 'Not blinking', description: 'Non-blinking cursor menu item'}),
                    value: 'NO_BLINK'
                }]}
            }
        };
    }

    setLed (args) {
        if (this.runtime?.sarduEdu?.hardwareSelection?.mode !== 'realtime') return;
        const transport = this.runtime.sarduEduLiveTransport;
        if (!transport?.connected) return Promise.reject(new Error('SARDU-Block live transport is not connected in setLed'));
        return transport.writeDigital(String(args.PIN), String(args.STATE));
    }

    setLedBrightness (args) {
        if (this.runtime?.sarduEdu?.hardwareSelection?.mode !== 'realtime') return;
        const transport = this.runtime.sarduEduLiveTransport;
        if (!transport?.connected || typeof transport.writePwm !== 'function') {
            return Promise.reject(new Error('SARDU-Block live transport does not support PWM in setLedBrightness'));
        }
        return transport.writePwm(String(args.PIN), Math.max(0, Math.min(100, Number(args.BRIGHTNESS))));
    }

    setServoAngle (args) {
        if (this.runtime?.sarduEdu?.hardwareSelection?.mode !== 'realtime') return;
        const transport = this.runtime.sarduEduLiveTransport;
        if (!transport?.connected) return Promise.reject(new Error('SARDU-Block live transport is not connected in setServoAngle'));
        return transport.writeServo(String(args.PIN), Math.max(0, Math.min(180, Number(args.ANGLE))));
    }

    setServoAngleAndWait (args) {
        const angleResult = this.setServoAngle(args);
        if (this.runtime?.sarduEdu?.hardwareSelection?.mode !== 'realtime') return;
        const milliseconds = Math.max(0, Number(args.MILLIS));
        return Promise.resolve(angleResult).then(() => new Promise(resolve => setTimeout(resolve, milliseconds)));
    }

    servoAngle (args) {
        if (this.runtime?.sarduEdu?.hardwareSelection?.mode !== 'realtime') return 0;
        const transport = this.runtime.sarduEduLiveTransport;
        if (!transport?.connected) return Promise.reject(new Error('SARDU-Block live transport is not connected in servoAngle'));
        return transport.readServo(String(args.PIN)).then(value => Math.trunc(value));
    }

    playTone (args) {
        if (this.runtime?.sarduEdu?.hardwareSelection?.mode !== 'realtime') return;
        const transport = this.runtime.sarduEduLiveTransport;
        if (!transport?.connected) return Promise.reject(new Error('SARDU-Block live transport is not connected in playTone'));
        return transport.playTone(String(args.PIN), Number(args.FREQUENCY), Number(args.MILLIS));
    }

    _neoPixel (action, args, ...names) {
        if (this.runtime?.sarduEdu?.hardwareSelection?.mode !== 'realtime') return;
        const transport = this.runtime.sarduEduLiveTransport;
        if (!transport?.connected) return Promise.reject(new Error(`SARDU-Block live transport is not connected in ${action}`));
        return transport.runNeoPixel(action, String(args.PIN), ...names.map(name => Number(args[name])));
    }

    configureNeoPixel (args) { return this._neoPixel('C', args, 'COUNT'); }
    setNeoPixelRgb (args) { return this._neoPixel('R', args, 'PIXEL', 'RED', 'GREEN', 'BLUE'); }
    setNeoPixelHsv (args) { return this._neoPixel('H', args, 'PIXEL', 'HUE', 'SATURATION', 'BRIGHTNESS'); }
    fillNeoPixelRgb (args) { return this._neoPixel('F', args, 'FIRST', 'LAST', 'RED', 'GREEN', 'BLUE'); }
    fillNeoPixelHsv (args) { return this._neoPixel('G', args, 'FIRST', 'LAST', 'HUE', 'SATURATION', 'BRIGHTNESS'); }
    setNeoPixelBrightness (args) { return this._neoPixel('B', args, 'BRIGHTNESS'); }
    clearNeoPixels (args) { return this._neoPixel('X', args); }
    showNeoPixels (args) { return this._neoPixel('S', args); }
    rotateNeoPixels (args) { return this._neoPixel('O', args, 'POSITIONS'); }
    shiftNeoPixels (args) { return this._neoPixel('T', args, 'POSITIONS'); }
    rainbowNeoPixels (args) { return this._neoPixel('W', args, 'HUE', 'REPETITIONS'); }

    _oled (action, args, ...names) {
        if (this.runtime?.sarduEdu?.hardwareSelection?.mode !== 'realtime') return;
        const transport = this.runtime.sarduEduLiveTransport;
        if (!transport?.connected) return Promise.reject(new Error(`SARDU-Block live transport is not connected in OLED ${action}`));
        return transport.runOled(action, ...names.map(name => {
            if (name === 'COLOR' || name === 'BACKGROUND') return String(args[name]) === 'WHITE' ? 1 : 0;
            if (name === 'ENDING') return String(args[name]) === 'NEWLINE' ? 1 : 0;
            return args[name];
        }));
    }

    initializeOled (args) {
        const [width, height] = String(args.FORMAT).split('x');
        return this._oled('I', {...args, WIDTH: width, HEIGHT: height}, 'WIDTH', 'HEIGHT', 'ADDRESS');
    }
    initializeOledCustom (args) { return this._oled('I', args, 'WIDTH', 'HEIGHT', 'ADDRESS'); }
    drawOledLine (args) { return this._oled('L', args, 'X0', 'Y0', 'X1', 'Y1', 'COLOR'); }
    drawOledRect (args) { return this._oled('R', args, 'X', 'Y', 'WIDTH', 'HEIGHT', 'COLOR'); }
    fillOledRect (args) { return this._oled('F', args, 'X', 'Y', 'WIDTH', 'HEIGHT', 'COLOR'); }
    drawOledCircle (args) { return this._oled('C', args, 'X', 'Y', 'RADIUS', 'COLOR'); }
    fillOledCircle (args) { return this._oled('D', args, 'X', 'Y', 'RADIUS', 'COLOR'); }
    drawOledRoundRect (args) { return this._oled('J', args, 'X', 'Y', 'WIDTH', 'HEIGHT', 'RADIUS', 'COLOR'); }
    fillOledRoundRect (args) { return this._oled('K', args, 'X', 'Y', 'WIDTH', 'HEIGHT', 'RADIUS', 'COLOR'); }
    drawOledTriangle (args) { return this._oled('G', args, 'X0', 'Y0', 'X1', 'Y1', 'X2', 'Y2', 'COLOR'); }
    fillOledTriangle (args) { return this._oled('H', args, 'X0', 'Y0', 'X1', 'Y1', 'X2', 'Y2', 'COLOR'); }
    setOledText (args) { return this._oled('S', args, 'SIZE', 'COLOR', 'BACKGROUND'); }
    setOledCursor (args) { return this._oled('P', args, 'X', 'Y'); }
    printOled (args) { return this._oled('T', args, 'TEXT', 'ENDING'); }
    _oledImageArguments (args) {
        const image = String(args.IMAGE);
        const size = String(args.SCALE);
        if (image.endsWith('_16') || image.endsWith('_32')) return {IMAGE: image, SCALE: size};
        if (size === '1' || size === '2') return {IMAGE: `${image}_16`, SCALE: size};
        if (size === '16') return {IMAGE: `${image}_16`, SCALE: '1'};
        if (size === '32') return {IMAGE: `${image}_32`, SCALE: '1'};
        if (size === '64') return {IMAGE: `${image}_32`, SCALE: '2'};
        return {IMAGE: `${image}_16`, SCALE: '1'};
    }
    drawOledImage (args) { return this._oled('B', this._oledImageArguments(args), 'IMAGE', 'SCALE'); }
    clearOled (args) { return this._oled('X', args); }
    showOled (args) { return this._oled('U', args); }

    _sh1106 (action, args, ...names) {
        if (this.runtime?.sarduEdu?.hardwareSelection?.mode !== 'realtime') return;
        const transport = this.runtime.sarduEduLiveTransport;
        if (!transport?.connected) return Promise.reject(new Error(`SARDU-Block live transport is not connected in SH1106 ${action}`));
        return transport.runSh1106(action, ...names.map(name => {
            if (name === 'COLOR') return String(args[name]) === 'WHITE' ? 1 : 0;
            if (name === 'ENDING') return String(args[name]) === 'NEWLINE' ? 1 : 0;
            return args[name];
        }));
    }

    initializeSh1106 (args) { return this._sh1106('I', args, 'ADDRESS'); }
    drawSh1106Line (args) { return this._sh1106('L', args, 'X0', 'Y0', 'X1', 'Y1', 'COLOR'); }
    drawSh1106Rect (args) { return this._sh1106('R', args, 'X', 'Y', 'WIDTH', 'HEIGHT', 'COLOR'); }
    fillSh1106Rect (args) { return this._sh1106('F', args, 'X', 'Y', 'WIDTH', 'HEIGHT', 'COLOR'); }
    drawSh1106Circle (args) { return this._sh1106('C', args, 'X', 'Y', 'RADIUS', 'COLOR'); }
    fillSh1106Circle (args) { return this._sh1106('D', args, 'X', 'Y', 'RADIUS', 'COLOR'); }
    drawSh1106RoundRect (args) { return this._sh1106('J', args, 'X', 'Y', 'WIDTH', 'HEIGHT', 'RADIUS', 'COLOR'); }
    fillSh1106RoundRect (args) { return this._sh1106('K', args, 'X', 'Y', 'WIDTH', 'HEIGHT', 'RADIUS', 'COLOR'); }
    drawSh1106Triangle (args) { return this._sh1106('G', args, 'X0', 'Y0', 'X1', 'Y1', 'X2', 'Y2', 'COLOR'); }
    fillSh1106Triangle (args) { return this._sh1106('H', args, 'X0', 'Y0', 'X1', 'Y1', 'X2', 'Y2', 'COLOR'); }
    setSh1106Text (args) { return this._sh1106('S', args, 'SIZE', 'COLOR', 'BACKGROUND'); }
    setSh1106Cursor (args) { return this._sh1106('P', args, 'X', 'Y'); }
    printSh1106 (args) { return this._sh1106('T', args, 'TEXT', 'ENDING'); }
    drawSh1106Image (args) { return this._sh1106('B', this._oledImageArguments(args), 'IMAGE', 'SCALE'); }
    clearSh1106 (args) { return this._sh1106('X', args); }
    showSh1106 (args) { return this._sh1106('U', args); }

    _display (action, ...values) {
        if (this.runtime?.sarduEdu?.hardwareSelection?.mode !== 'realtime') return;
        const transport = this.runtime.sarduEduLiveTransport;
        if (!transport?.connected) {
            return Promise.reject(new Error(`SARDU-Block live transport is not connected in display ${action}`));
        }
        return transport.runDisplay(action, ...values);
    }

    initializeDisplay (args) {
        const rows = String(args.MODEL) === '1604' ? 4 : 2;
        this.displayRows = rows;
        return this._display('I', Number(args.ADDRESS), 16, rows, -1, -1);
    }

    initializeDisplayWithPins (args) {
        const rows = String(args.MODEL) === '1604' ? 4 : 2;
        this.displayRows = rows;
        return this._display('I', Number(args.ADDRESS), 16, rows, String(args.SDA), String(args.SCL));
    }

    setDisplayCursor (args) {
        const x = Math.max(0, Math.min(15, Math.trunc(Number(args.X)) || 0));
        const y = Math.max(0, Math.min((this.displayRows || 2) - 1, Math.trunc(Number(args.Y)) || 0));
        return this._display('C', x, y);
    }

    printDisplay (args) { return this._display('T', String(args.TEXT)); }
    clearDisplay () { return this._display('X'); }
    setDisplayBacklight (args) { return this._display('B', String(args.STATE) === 'ON' ? 1 : 0); }
    setDisplayCursorStyle (args) {
        return this._display('U', String(args.VISIBILITY) === 'SHOW' ? 1 : 0,
            String(args.BLINK) === 'BLINK' ? 1 : 0);
    }
}

module.exports = Scratch3SarduActuators;
