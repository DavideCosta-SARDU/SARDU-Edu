const test = require('tap').test;
const SarduSensors = require('../../src/extensions/scratch3_sardu_sensors');

test('SARDU sensors exposes selected DHT and HC-SR04 blocks in Live mode', t => {
    const extension = new SarduSensors({sarduEdu: {hardwareSelection: {
        componentIds: ['dht11-dht22', 'hc-sr04'],
        digitalOutputPins: ['2', '13'],
        mode: 'realtime'
    }}});
    const info = extension.getInfo();
    const blocks = Object.fromEntries(info.blocks.map(block => [block.opcode, block]));

    t.equal(info.id, 'sarduSensors');
    t.equal(blocks.dhtTemperature.hideFromPalette, false);
    t.equal(blocks.dhtHumidity.hideFromPalette, false);
    t.equal(blocks.ultrasonicDistance.hideFromPalette, false);
    t.equal(blocks.ultrasonicDistance.arguments.UNIT.defaultValue, 'cm');
    t.same(info.menus.DHT_MODEL.items, ['DHT11', 'DHT22']);
    t.ok(info.blocks.every(block => block.tooltip));
    t.end();
});

test('SARDU sensors exposes both button wiring modes and reads them in Live mode', async t => {
    const calls = [];
    const extension = new SarduSensors({
        sarduEdu: {hardwareSelection: {componentIds: ['button'], digitalOutputPins: ['2', '3'], mode: 'realtime'}},
        sarduEduLiveTransport: {
            connected: true,
            readButton: (pin, pullup) => {
                calls.push([pin, pullup]);
                return Promise.resolve(pin === '3' ? 1 : 0);
            }
        }
    });
    const blocks = Object.fromEntries(extension.getInfo().blocks.map(block => [block.opcode, block]));

    t.equal(blocks.configureButton.hideFromPalette, false);
    t.equal(blocks.buttonPressedLow.blockType, 'Boolean');
    t.equal(blocks.buttonPressedHigh.blockType, 'Boolean');
    t.equal(await extension.buttonPressedLow({PIN: '2'}), true);
    t.equal(await extension.buttonPressedHigh({PIN: '3'}), true);
    t.same(calls, [['2', true], ['3', false]]);
});

test('SARDU sensors exposes RFID standard and advanced blocks with hexadecimal defaults', t => {
    const extension = new SarduSensors({sarduEdu: {hardwareSelection: {
        componentIds: ['pn532', 'rc522'], digitalOutputPins: ['2', '3', '10', '11', '12', '13'],
        busPins: {i2c: {sda: '2', scl: '3'}, spi: {ss: '10', mosi: '11', miso: '12', sck: '13'}},
        mode: 'realtime'
    }}});
    const info = extension.getInfo();
    const blocks = Object.fromEntries(info.blocks.map(item => [item.opcode, item]));

    t.equal(blocks.pn532ReadBlock.hideFromPalette, false);
    t.equal(blocks.pn532Authenticate.arguments.KEY.defaultValue, 'FFFFFFFFFFFF');
    t.equal(blocks.rc522WriteBlock.arguments.DATA.defaultValue, '00000000000000000000000000000000');
    t.equal(blocks.rfidConfigurePn532I2c.arguments.SDA.defaultValue, '2');
    t.equal(blocks.rfidConfigurePn532I2c.arguments.SCL.defaultValue, '3');
    t.notOk(blocks.rfidConfigurePn532I2c.arguments.IRQ);
    t.equal(blocks.rfidConfigurePn532I2cAdvanced.arguments.IRQ.defaultValue, '2');
    t.equal(blocks.rfidConfigurePn532Spi.arguments.SCK.defaultValue, '13');
    t.notOk(blocks.pn532ReadBlock.arguments.SDA);
    t.end();
});

test('SARDU sensors sends only the pins belonging to the selected RFID configuration', async t => {
    const calls = [];
    const extension = new SarduSensors({
        sarduEdu: {hardwareSelection: {mode: 'realtime'}},
        sarduEduLiveTransport: {
            connected: true,
            runRfid: (...args) => {
                calls.push(args);
                return Promise.resolve('1');
            }
        }
    });

    extension.rfidConfigurePn532I2c({SDA: 'A4', SCL: 'A5'});
    t.equal(await extension.pn532TagPresent({}), true);
    t.same(calls[0], ['PN532', 'I2C', 'A4', 'A5', -1, -1, -1, -1, -1, -1, 'P']);

    extension.rfidConfigureRc522Spi({MOSI: '11', MISO: '12', SCK: '13', SS: '10', RESET: '9'});
    t.equal(await extension.rc522TagPresent({}), true);
    t.same(calls[1], ['RC522', 'SPI', -1, -1, '11', '12', '13', '10', -1, '9', 'P']);

    t.equal(await extension.pn532Uid({}), '1');
    t.same(calls[2], ['PN532', 'I2C', 'A4', 'A5', -1, -1, -1, -1, -1, -1, 'U']);
});
