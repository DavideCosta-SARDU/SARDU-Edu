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
