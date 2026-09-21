const test = require('tap').test;
const SarduActuators = require('../../src/extensions/scratch3_sardu_actuators');

test('SARDU actuators exposes an independent servo block for a selected servo', t => {
    const extension = new SarduActuators({sarduEdu: {hardwareSelection: {
        componentIds: ['servo'],
        digitalOutputPins: ['2', '9', '13'],
        mode: 'standalone'
    }}});
    const info = extension.getInfo();
    const servo = info.blocks.find(block => block.opcode === 'setServoAngle');
    const servoAndWait = info.blocks.find(block => block.opcode === 'setServoAngleAndWait');
    const servoAngle = info.blocks.find(block => block.opcode === 'servoAngle');

    t.equal(info.id, 'sarduActuators');
    t.equal(servo.hideFromPalette, false);
    t.equal(servo.arguments.ANGLE.defaultValue, 90);
    t.equal(servoAndWait.arguments.MILLIS.defaultValue, 200);
    t.equal(servoAngle.disableMonitor, true);
    t.ok(servoAndWait.tooltip);
    t.ok(servoAngle.tooltip);
    t.same(info.menus.DIGITAL_PIN.items, ['2', '9', '13']);
    t.ok(servo.tooltip);
    t.end();
});

test('SARDU Edu actuators exposes the I2C display blocks and ESP32 custom pins', t => {
    const extension = new SarduActuators({sarduEdu: {hardwareSelection: {
        boardId: 'esp32-dev-module',
        componentIds: ['lcd-i2c'],
        digitalOutputPins: ['16', '17', '21', '22'],
        busPins: {i2c: {sda: '21', scl: '22'}},
        mode: 'standalone'
    }}});
    const info = extension.getInfo();
    const standard = info.blocks.find(block => block.opcode === 'initializeDisplay');
    const custom = info.blocks.find(block => block.opcode === 'initializeDisplayWithPins');

    t.equal(standard.hideFromPalette, false);
    t.equal(custom.hideFromPalette, false);
    t.equal(standard.arguments.MODEL.defaultValue, '1602');
    t.equal(standard.arguments.ADDRESS.defaultValue, '0x27');
    t.equal(custom.arguments.SDA.defaultValue, '21');
    t.equal(custom.arguments.SCL.defaultValue, '22');
    t.same(info.menus.DISPLAY_ADDRESS.items,
        ['0x20', '0x21', '0x22', '0x23', '0x24', '0x25', '0x26', '0x27']);
    t.end();
});

test('SARDU Edu actuators hides custom display pins on Arduino Uno', t => {
    const extension = new SarduActuators({sarduEdu: {hardwareSelection: {
        boardId: 'arduino-uno', componentIds: ['lcd-i2c'], mode: 'standalone'
    }}});
    const custom = extension.getInfo().blocks.find(block => block.opcode === 'initializeDisplayWithPins');
    t.equal(custom.hideFromPalette, true);
    t.end();
});

test('SARDU Edu actuators exposes all OLED blocks and address labels', t => {
    const extension = new SarduActuators({sarduEdu: {hardwareSelection: {
        boardId: 'arduino-uno', componentIds: ['oled-ssd1306'], mode: 'standalone'
    }}});
    const info = extension.getInfo();
    const oledOpcodes = [
        'initializeOled', 'initializeOledCustom', 'drawOledLine', 'drawOledRect', 'fillOledRect',
        'drawOledCircle', 'fillOledCircle', 'drawOledRoundRect', 'fillOledRoundRect',
        'drawOledTriangle', 'fillOledTriangle', 'setOledText', 'setOledCursor', 'printOled',
        'drawOledImage', 'clearOled', 'showOled'
    ];

    oledOpcodes.forEach(opcode => t.equal(info.blocks.find(block => block.opcode === opcode).hideFromPalette, false));
    t.same(info.menus.OLED_FORMAT.items, ['128x64', '128x32']);
    t.same(info.menus.OLED_ADDRESS.items.map(item => item.text), ['0x3C (0x78)', '0x3D (0x7A)']);
    const imageValues = info.menus.OLED_IMAGE.items.map(item => item.value);
    t.same(imageValues, ['HEART', 'STAR', 'CHECK', 'CROSS', 'HAPPY', 'SAD', 'WARNING', 'INFO', 'BULB',
        'THERMOMETER', 'BATTERY', 'WIFI']);
    t.notOk(imageValues.some(value => value.includes('ARDUINO')));
    t.same(info.menus.OLED_IMAGE_SCALE.items, [
        {text: '16x16', value: '16'}, {text: '32x32', value: '32'}, {text: '64x64', value: '64'}
    ]);
    const opcodes = info.blocks.map(block => block.opcode);
    t.ok(opcodes.indexOf('initializeOled') < opcodes.indexOf('setOledCursor'));
    t.ok(opcodes.indexOf('setOledCursor') < opcodes.indexOf('setOledText'));
    t.ok(opcodes.indexOf('setOledText') < opcodes.indexOf('printOled'));
    t.ok(opcodes.indexOf('printOled') < opcodes.indexOf('drawOledLine'));
    t.ok(opcodes.indexOf('drawOledImage') < opcodes.indexOf('showOled'));
    t.end();
});

test('SARDU Edu actuators exposes all SH1106 blocks only when selected', t => {
    const extension = new SarduActuators({sarduEdu: {hardwareSelection: {
        boardId: 'arduino-uno', componentIds: ['oled-sh1106'], mode: 'standalone'
    }}});
    const info = extension.getInfo();
    const opcodes = [
        'initializeSh1106', 'drawSh1106Line', 'drawSh1106Rect', 'fillSh1106Rect',
        'drawSh1106Circle', 'fillSh1106Circle', 'drawSh1106RoundRect', 'fillSh1106RoundRect',
        'drawSh1106Triangle', 'fillSh1106Triangle', 'setSh1106Text', 'setSh1106Cursor',
        'printSh1106', 'drawSh1106Image', 'clearSh1106', 'showSh1106'
    ];
    opcodes.forEach(opcode => t.equal(info.blocks.find(block => block.opcode === opcode).hideFromPalette, false));
    t.equal(info.blocks.find(block => block.opcode === 'initializeOled').hideFromPalette, true);
    const allOpcodes = info.blocks.map(block => block.opcode);
    t.ok(allOpcodes.indexOf('initializeSh1106') < allOpcodes.indexOf('setSh1106Cursor'));
    t.ok(allOpcodes.indexOf('setSh1106Cursor') < allOpcodes.indexOf('setSh1106Text'));
    t.ok(allOpcodes.indexOf('setSh1106Text') < allOpcodes.indexOf('printSh1106'));
    t.ok(allOpcodes.indexOf('printSh1106') < allOpcodes.indexOf('drawSh1106Line'));
    t.ok(allOpcodes.indexOf('drawSh1106Image') < allOpcodes.indexOf('showSh1106'));
    t.end();
});

test('SARDU Edu OLED image sizes map to compact and detailed Live bitmaps', t => {
    const calls = [];
    const transport = {
        connected: true,
        runOled: (...values) => calls.push(['oled', ...values]),
        runSh1106: (...values) => calls.push(['sh1106', ...values])
    };
    const extension = new SarduActuators({
        sarduEdu: {hardwareSelection: {mode: 'realtime'}},
        sarduEduLiveTransport: transport
    });

    extension.drawOledImage({IMAGE: 'HEART', SCALE: '16'});
    extension.drawOledImage({IMAGE: 'STAR', SCALE: '32'});
    extension.drawSh1106Image({IMAGE: 'WIFI', SCALE: '64'});
    t.same(calls, [
        ['oled', 'B', 'HEART_16', '1'],
        ['oled', 'B', 'STAR_32', '1'],
        ['sh1106', 'B', 'WIFI_32', '2']
    ]);
    t.end();
});
