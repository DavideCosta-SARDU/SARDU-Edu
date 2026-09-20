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
