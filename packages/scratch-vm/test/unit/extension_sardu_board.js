const test = require('tap').test;
const BlockType = require('../../src/extension-support/block-type');
const SarduBoard = require('../../src/extensions/scratch3_sardu_board');

test('SARDU board extension exposes named blocks, aliases, timers and tooltips', t => {
    const extension = new SarduBoard({sarduEdu: {hardwareSelection: {
        boardName: 'Arduino Uno',
        analogInputPins: ['A0'],
        componentIds: ['dht11-dht22'],
        digitalOutputPins: ['2', '13'],
        mode: 'standalone',
        pwmPins: ['3']
    }}});
    const info = extension.getInfo();
    const blocks = Object.fromEntries(info.blocks.map(block => [block.opcode, block]));

    t.equal(info.id, 'sarduBoard');
    t.equal(info.name, 'Arduino Uno');
    t.same(info.menus.DIGITAL_PIN.items, ['2', '13']);
    t.equal(blocks.program.blockType, BlockType.HAT);
    t.equal(blocks.program.branchCount, 2);
    t.equal(blocks.program.isTerminal, true);
    t.equal(blocks.program.hideFromPalette, false);
    t.equal(blocks.setDigitalPin.blockType, BlockType.COMMAND);
    t.equal(blocks.waitMilliseconds.blockType, BlockType.COMMAND);
    t.equal(blocks.customCode.hideFromPalette, false);
    t.equal(blocks.customCode.arguments.CODE.type, 'multiline');
    t.equal(blocks.serialBegin.hideFromPalette, false);
    t.equal(blocks.serialPrint.hideFromPalette, false);
    t.equal(blocks.serialPrintln.hideFromPalette, false);
    t.equal(blocks.dhtTemperature.hideFromPalette, true);
    t.equal(blocks.dhtHumidity.hideFromPalette, true);
    t.same(info.menus.ANALOG_PIN.items, ['A0']);
    t.same(info.menus.PWM_PIN.items, ['3']);
    t.equal(blocks.readAnalogPin.blockType, BlockType.REPORTER);
    t.equal(blocks.interrupt.blockType, BlockType.HAT);
    t.equal(blocks.longComment.arguments.TEXT.type, 'multiline');
    t.equal(blocks.millis.blockType, BlockType.REPORTER);
    t.equal(blocks.micros.blockType, BlockType.REPORTER);
    t.ok(info.blocks.every(block => block.tooltip));
    t.end();
});

test('SARDU custom code remains available while Offline-only serial blocks are hidden in Live mode', t => {
    const extension = new SarduBoard({sarduEdu: {hardwareSelection: {mode: 'realtime'}}});
    const blocks = Object.fromEntries(extension.getInfo().blocks.map(block => [block.opcode, block]));

    t.equal(blocks.program.hideFromPalette, true);
    t.equal(blocks.customCode.hideFromPalette, false);
    t.equal(blocks.serialBegin.hideFromPalette, true);
    t.equal(blocks.serialPrint.hideFromPalette, true);
    t.equal(blocks.serialPrintln.hideFromPalette, true);
    t.end();
});

test('SARDU board program is not executed by the Scratch runtime', t => {
    const extension = new SarduBoard();

    t.equal(extension.program(), false);
    t.end();
});

test('SARDU board commands use the shared live transport inside normal Scratch stacks', async t => {
    const writes = [];
    const runtime = {
        sarduEdu: {hardwareSelection: {mode: 'realtime'}},
        sarduEduLiveTransport: {
            connected: true,
            readMillis: () => Promise.resolve(123),
            readMicros: () => Promise.resolve(456),
            writeDigital: (...args) => {
                writes.push(args);
                return Promise.resolve();
            }
        }
    };
    const extension = new SarduBoard(runtime);

    await extension.setDigitalPin({PIN: '13', LEVEL: 'HIGH'});
    t.equal(await extension.millis(), 123);
    t.equal(await extension.micros(), 456);

    t.same(writes, [['13', 'HIGH']]);
});

test('SARDU board commands fail clearly when live mode is not connected', async t => {
    const extension = new SarduBoard({
        sarduEdu: {hardwareSelection: {mode: 'realtime'}},
        sarduEduLiveTransport: null
    });

    await t.rejects(extension.setDigitalPin({PIN: '13', LEVEL: 'HIGH'}), /live transport is not connected/);
});
